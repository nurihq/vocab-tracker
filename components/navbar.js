import { LANGUAGES, detectBrowserLanguage } from '../languages.js';
import { t, setI18nBaseLang, getI18nBaseLang } from '../i18n.js';
import { Auth, Api } from '../api.js';

export class Navbar {
  constructor(onBaseLangChange, onThemeChange, onSignOut) {
    this.onBaseLangChange = onBaseLangChange;
    this.onThemeChange = onThemeChange;
    this.onSignOut = onSignOut;
    this.theme = localStorage.getItem('vocab_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  render(container, currentRoute) {
    const isHome = currentRoute === '' || currentRoute === '/' || currentRoute === '#/';
    const isAuthed = Auth.isAuthenticated();
    const currentBase = getI18nBaseLang();

    container.innerHTML = `
      <header class="navbar">
        <div class="nav-left">
          ${!isHome ? `
            <button class="nav-back-btn" id="nav-back-btn" title="${t('back')}">
              ← <span>${t('back')}</span>
            </button>
          ` : ''}
          <a href="#/" class="nav-brand">
            <span class="nav-brand-logo">🗂️</span>
            <span>${t('appTitle')}</span>
          </a>
        </div>
        <div class="nav-right">
          <div class="base-lang-wrapper" title="${t('baseLanguage')}">
            <select class="base-lang-select" id="base-lang-select">
              ${LANGUAGES.map(l => `
                <option value="${l.code}" ${l.code === currentBase ? 'selected' : ''}>
                  ${l.flag} ${l.name} (${l.nativeName})
                </option>
              `).join('')}
            </select>
          </div>

          <button class="icon-btn" id="theme-toggle-btn" title="${this.theme === 'dark' ? t('lightMode') : t('darkMode')}">
            ${this.theme === 'dark' ? '☀️' : '🌙'}
          </button>

          ${isAuthed ? `
            <button class="btn-signout" id="nav-signout-btn">
              ${t('signOut')}
            </button>
          ` : ''}
        </div>
      </header>
    `;

    // Bind event listeners
    const backBtn = container.querySelector('#nav-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    const baseLangSelect = container.querySelector('#base-lang-select');
    if (baseLangSelect) {
      baseLangSelect.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        setI18nBaseLang(newLang);
        localStorage.setItem('vocab_base_lang', newLang);
        if (Auth.isAuthenticated()) {
          Api.updateProfile({ baseLang: newLang }).catch(() => {});
        }
        if (this.onBaseLangChange) this.onBaseLangChange(newLang);
      });
    }

    const themeBtn = container.querySelector('#theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('vocab_theme', this.theme);
        themeBtn.textContent = this.theme === 'dark' ? '☀️' : '🌙';
        if (this.onThemeChange) this.onThemeChange(this.theme);
      });
    }

    const signOutBtn = container.querySelector('#nav-signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        Auth.signOut();
        if (this.onSignOut) this.onSignOut();
        window.location.hash = '#/';
      });
    }
  }
}
