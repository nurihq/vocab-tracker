import { CONFIG } from '../config.js?v=20261104_scripts3';
import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js?v=20261104_scripts3';
import { Auth, Api } from '../api.js?v=20261104_scripts3';
import { trackEvent } from '../analytics.js?v=20261104_scripts3';
import { navigate } from '../app.js?v=20261104_scripts3';

export function renderSignInScreen(container) {
  const currentBase = getI18nBaseLang();

  container.innerHTML = `
    <div class="signin-wrapper">
      <div class="signin-card">
        <div class="signin-logo">✨</div>
        <h2 class="signin-title">monogenesis</h2>
        <p class="signin-subtitle" data-i18n="signInSubtitle">${t('signInSubtitle')}</p>

        <div class="signin-btn-container">
          <!-- Render Google One Tap / Button Container -->
          <div id="google-signin-btn"></div>
        </div>

        <div class="signin-unauth-section">
          <div class="signin-divider"><span>or</span></div>
          <button type="button" class="btn btn-secondary signin-unauth-btn" id="continue-unauth-btn">
            Continue Unauthenticated →
          </button>
          <p class="signin-unauth-warning">
            ⚠️ <strong>Warning:</strong> All progress and vocabulary you add will be lost if you do not sign in.
          </p>
        </div>
      </div>
    </div>
  `;

  autoTranslateUi(container);

  const unauthBtn = container.querySelector('#continue-unauth-btn');
  if (unauthBtn) {
    unauthBtn.addEventListener('click', () => {
      trackEvent('continue_unauthenticated');
      navigate('#/languages');
    });
  }

  // Initialize Google Sign-In button
  function initGoogleBtn() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-signin-btn');
      if (btnContainer) {
        google.accounts.id.renderButton(btnContainer, {
          theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 280,
          locale: currentBase || 'en'
        });
      }
    } else {
      setTimeout(initGoogleBtn, 100);
    }
  }

  async function handleCredentialResponse(response) {
    if (response && response.credential) {
      const idToken = response.credential;
      Auth.setToken(idToken);

      try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const userObj = {
          sub: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture
        };
        Auth.setUser(userObj);
        Auth.setSessionExpiry();
        window.dispatchEvent(new CustomEvent('vocab-auth-changed'));
        trackEvent('sign_in', { method: 'google', sub: payload.sub });

        // Instantly exchange Google ID token for 24-hour session token
        try {
          await Api.getProfile();
        } catch (e) {}

        // Trigger two-way sync
        Api.syncLocalToCloud().catch(() => {});

        // Clean redirect to languages
        navigate('#/languages');
      } catch (err) {
        console.error('Failed to parse JWT payload:', err);
        navigate('#/languages');
      }
    }
  }

  initGoogleBtn();
}
