import { t } from '../i18n.js';
import { Auth, Api } from '../api.js';
import { CONFIG } from '../config.js';
import { Modal } from '../components/modal.js';

export function renderSignInScreen(container) {
  container.innerHTML = `
    <div style="max-width: 460px; margin: 3rem auto; padding: 2.5rem 2rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-card); text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🗂️</div>
      <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.02em;">${t('signInTitle')}</h2>
      <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5;">${t('signInSubtitle')}</p>

      <!-- Google Identity Services Container -->
      <div id="g_id_signin_container" style="display: flex; justify-content: center; margin-bottom: 1.5rem; min-height: 44px;"></div>

      <div style="display: flex; align-items: center; gap: 0.75rem; margin: 1.5rem 0; color: var(--text-muted); font-size: 0.85rem;">
        <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
        <span>or</span>
        <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
      </div>

      <button class="btn btn-secondary" id="demo-signin-btn" style="width: 100%; margin-bottom: 1.25rem;">
        <span>🚀 Instant Demo / Guest Mode</span>
      </button>

      <button class="btn btn-ghost btn-sm" id="oauth-instructions-btn" style="color: var(--primary); font-size: 0.85rem;">
        ℹ️ How to configure Google OAuth credentials
      </button>
    </div>
  `;

  // Initialize Google Identity Services
  function initGoogleSignIn() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (response && response.credential) {
              Auth.setToken(response.credential);
              // Decode basic payload for display
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const decoded = JSON.parse(jsonPayload);
                Auth.setUser({
                  sub: decoded.sub,
                  name: decoded.name,
                  email: decoded.email,
                  picture: decoded.picture
                });
              } catch (e) {}

              // Upsert profile in cloud
              await Api.getProfile().catch(() => {});
              window.location.hash = '#/languages';
            }
          }
        });

        const target = container.querySelector('#g_id_signin_container');
        if (target) {
          window.google.accounts.id.renderButton(target, {
            theme: document.documentElement.getAttribute('data-theme') === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            width: 280
          });
        }
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    }
  }

  initGoogleSignIn();
  // Retry once in case script was still loading
  setTimeout(initGoogleSignIn, 500);

  // Demo Sign-in
  container.querySelector('#demo-signin-btn').addEventListener('click', () => {
    Auth.setUser({
      sub: 'demo-user-123',
      name: 'Polyglot Learner',
      email: 'demo@vocabtracker.app'
    });
    window.location.hash = '#/languages';
  });

  // OAuth Instructions Modal
  container.querySelector('#oauth-instructions-btn').addEventListener('click', () => {
    Modal.open({
      title: 'Google OAuth App Setup Steps',
      contentHtml: `
        <div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">
          <p style="margin-bottom: 0.75rem;">Follow these manual steps in Google Cloud Console to set up your own OAuth client:</p>
          <ol style="padding-left: 1.25rem; margin-bottom: 1rem;">
            <li>Visit <strong>Google Cloud Console → APIs & Credentials</strong>.</li>
            <li>Select your project and click <strong>Create Credentials → OAuth client ID</strong>.</li>
            <li>Select application type: <strong>Web application</strong>.</li>
            <li>Set Name: <strong>Vocab Tracker</strong>.</li>
            <li>Add to <strong>Authorized JavaScript origins</strong>:
              <ul style="padding-left: 1.25rem; margin: 0.25rem 0;">
                <li><code>https://nurihq.github.io</code></li>
                <li><code>http://localhost:8080</code> (for local testing)</li>
                <li>Your custom domain (e.g. <code>https://vocab.nuri.software</code>)</li>
              </ul>
            </li>
            <li>Copy your generated <strong>Client ID</strong> and paste it into <code>config.js</code> under <code>GOOGLE_CLIENT_ID</code>.</li>
          </ol>
        </div>
      `,
      confirmText: 'Got It',
      confirmClass: 'btn-primary'
    });
  });
}
