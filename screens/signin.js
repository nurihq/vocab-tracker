import { t } from '../i18n.js';
import { Auth, Api } from '../api.js';
import { CONFIG } from '../config.js';
import { trackEvent } from '../analytics.js';

export function renderSignInScreen(container) {
  const leafLogoSvg = `
    <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 1.25rem;">
      <g transform="translate(50, 48)">
        <!-- Top central leaf -->
        <path d="M0 -42 C8 -30 10 -15 0 0 C-10 -15 -8 -30 0 -42 Z" 
              fill="#c8bcd9" fill-opacity="0.28" stroke="#a793c2" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <!-- Top Right leaf -->
        <path d="M0 0 C12 -20 28 -28 38 -20 C38 -8 20 4 0 0 Z" 
              fill="#c8bcd9" fill-opacity="0.28" stroke="#a793c2" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <!-- Bottom Right leaf -->
        <path d="M0 0 C18 0 35 12 30 24 C18 28 6 12 0 0 Z" 
              fill="#c8bcd9" fill-opacity="0.28" stroke="#a793c2" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <!-- Bottom Left leaf -->
        <path d="M0 0 C-6 12 -18 28 -30 24 C-35 12 -18 0 0 0 Z" 
              fill="#c8bcd9" fill-opacity="0.28" stroke="#a793c2" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <!-- Top Left leaf -->
        <path d="M0 0 C-20 4 -38 -8 -38 -20 C-28 -28 -12 -20 0 0 Z" 
              fill="#c8bcd9" fill-opacity="0.28" stroke="#a793c2" stroke-width="2.2" stroke-dasharray="4 3" stroke-linejoin="round"/>
        <!-- Center point & stem -->
        <circle cx="0" cy="0" r="2.5" fill="#a793c2"/>
        <path d="M0 0 Q1 12 0 18" stroke="#a793c2" stroke-width="2" stroke-linecap="round"/>
      </g>
    </svg>
  `;

  container.innerHTML = `
    <div style="max-width: 440px; margin: 3.5rem auto; padding: 2.75rem 2rem; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-xl); box-shadow: var(--shadow-md); text-align: center;">
      ${leafLogoSvg}
      <h2 style="font-family: var(--font-serif); font-size: 1.85rem; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: -0.01em; color: var(--text-primary);">Monogenesis</h2>
      <p style="color: var(--text-secondary); font-size: 0.92rem; margin-bottom: 2rem; line-height: 1.55;">${t('signInSubtitle')}</p>

      <!-- Google Identity Services Container -->
      <div id="g_id_signin_container" style="display: flex; justify-content: center; min-height: 44px;"></div>
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

              trackEvent('sign_in', { method: 'google' });
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
  setTimeout(initGoogleSignIn, 500);
}
