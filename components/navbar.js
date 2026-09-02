import { LANGUAGES } from '../languages.js';
import { t, setI18nBaseLang, getI18nBaseLang } from '../i18n.js';
import { Auth, Api } from '../api.js';
import { trackEvent } from '../analytics.js';

export class Navbar {
  constructor(onBaseLangChange, onThemeChange, onSignOut) {
    this.onBaseLangChange = onBaseLangChange;
    this.onThemeChange = onThemeChange;
    this.onSignOut = onSignOut;
    this.theme = localStorage.getItem('vocab_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  getNavBackInfo(route) {
    const cleanRoute = (route || '').replace(/^#/, '');

    const studyMatch = cleanRoute.match(/^\/languages\/([^/]+)\/decks\/([^/]+)\/study$/);
    if (studyMatch) {
      return {
        label: t('deck'),
        target: `#/languages/${studyMatch[1]}/decks/${studyMatch[2]}`
      };
    }

    const deckWordsMatch = cleanRoute.match(/^\/languages\/([^/]+)\/decks\/([^/]+)$/);
    if (deckWordsMatch) {
      return {
        label: t('decks'),
        target: `#/languages/${deckWordsMatch[1]}/decks`
      };
    }

    const decksMatch = cleanRoute.match(/^\/languages\/([^/]+)\/decks$/);
    if (decksMatch) {
      return {
        label: t('languages'),
        target: '#/languages'
      };
    }

    if (cleanRoute === '/signin') {
      return {
        label: t('home'),
        target: '#/'
      };
    }

    return null;
  }

  render(container, currentRoute) {
    const isAuthed = Auth.isAuthenticated();
    const currentBase = getI18nBaseLang();
    const backInfo = this.getNavBackInfo(currentRoute);

    container.innerHTML = `
      <header class="navbar">
        <div class="nav-left">
          ${backInfo ? `
            <button class="nav-back-btn" id="nav-back-btn" data-target="${backInfo.target}">
              ← <span>${backInfo.label}</span>
            </button>
          ` : ''}
          
          <a href="#/" class="nav-brand" title="monogenesis">
            <svg class="nav-home-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span class="nav-brand-text">monogenesis</span>
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
        const target = backBtn.getAttribute('data-target');
        trackEvent('nav_back_click', { target: target || 'history' });
        if (target) {
          window.location.hash = target;
        } else {
          window.history.back();
        }
      });
    }

    const baseLangSelect = container.querySelector('#base-lang-select');
    if (baseLangSelect) {
      baseLangSelect.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        setI18nBaseLang(newLang);
        localStorage.setItem('vocab_base_lang', newLang);
        trackEvent('base_language_change', { baseLang: newLang });
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
        trackEvent('theme_change', { theme: this.theme });
        if (this.onThemeChange) this.onThemeChange(this.theme);
      });
    }

    const signOutBtn = container.querySelector('#nav-signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        trackEvent('sign_out');
        Auth.signOut();
        if (this.onSignOut) this.onSignOut();
        window.location.hash = '#/';
      });
    }
  }
}
