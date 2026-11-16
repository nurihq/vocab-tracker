import { LANGUAGES } from '../languages.js?v=20261116_khmer_zoom5';
import { t, setI18nBaseLang, getI18nBaseLang, autoTranslateUi } from '../i18n.js?v=20261116_khmer_zoom5';
import { Auth, Api } from '../api.js?v=20261116_khmer_zoom5';
import { trackEvent } from '../analytics.js?v=20261116_khmer_zoom5';
import { navigate, navigateBack } from '../app.js?v=20261116_khmer_zoom5';

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
      const fromHome = sessionStorage.getItem('vocab_decks_back_source') === 'home';
      if (fromHome) {
        return {
          label: t('home'),
          target: '#/'
        };
      }
      return {
        label: t('languages'),
        target: '#/languages'
      };
    }

    if (cleanRoute === '/languages') {
      return {
        label: t('home'),
        target: '#/'
      };
    }

    if (cleanRoute === '/signin') {
      return {
        label: t('home'),
        target: '#/'
      };
    }

    if (cleanRoute === '/about') {
      return {
        label: t('home'),
        target: '#/'
      };
    }

    if (cleanRoute === '/scripts') {
      return {
        label: t('home'),
        target: '#/'
      };
    }

    if (cleanRoute === '/scripts/khmer/practice') {
      return {
        label: 'Khmer',
        target: '/scripts/khmer'
      };
    }

    if (cleanRoute === '/scripts/japanese/hiragana/practice') {
      return {
        label: 'Hiragana',
        target: '/scripts/japanese/hiragana'
      };
    }

    if (cleanRoute === '/scripts/japanese/katakana/practice') {
      return {
        label: 'Katakana',
        target: '/scripts/japanese/katakana'
      };
    }

    if (cleanRoute === '/scripts/japanese/hiragana' || cleanRoute === '/scripts/japanese/katakana') {
      const jpReturnRoute = sessionStorage.getItem('japanese_kb_return_route');
      if (jpReturnRoute) {
        return {
          label: t('back') || 'Back',
          target: jpReturnRoute
        };
      }
      return {
        label: 'Japanese',
        target: '/scripts/japanese'
      };
    }

    if (cleanRoute === '/scripts/khmer') {
      const returnRoute = sessionStorage.getItem('khmer_kb_return_route');
      return {
        label: t('back') || 'Back',
        target: returnRoute || '/scripts'
      };
    }

    if (cleanRoute === '/scripts/japanese') {
      return {
        label: t('scripts') || 'Scripts',
        target: '/scripts'
      };
    }

    if (cleanRoute === '/settings') {
      const prevRoute = sessionStorage.getItem('vocab_settings_return_route');
      return {
        label: prevRoute && prevRoute !== '#/settings' ? (t('back') || 'Back') : t('home'),
        target: prevRoute && prevRoute !== '#/settings' ? prevRoute : '#/'
      };
    }

    const scriptMatch = cleanRoute.match(/^\/scripts\/([^/]+)\/?$/);
    if (scriptMatch) {
      return {
        label: t('scripts') || 'Scripts',
        target: '/scripts'
      };
    }

    return null;
  }

  render(container, currentRoute) {
    const isAuthed = Auth.isAuthenticated();
    const user = isAuthed ? Auth.getUser() : null;
    const currentBase = getI18nBaseLang();
    const backInfo = this.getNavBackInfo(currentRoute);
    const cleanPath = (currentRoute || '').replace(/^#/, '') || '/';
    const isHomeScreen = cleanPath === '/' || cleanPath === '';
    const isSignInScreen = cleanPath === '/signin';
    const isSettingsScreen = cleanPath === '/settings';
    const showUnauthBanner = !isAuthed && !isHomeScreen && !isSignInScreen && !isSettingsScreen;

    // Remember last non-settings route so Back button from Settings returns smoothly
    if (!isSettingsScreen) {
      sessionStorage.setItem('vocab_settings_return_route', currentRoute || '#/');
    }

    const userInitial = (user?.name || user?.email || 'U').trim().charAt(0).toUpperCase();

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
          ${isHomeScreen ? `
            <a href="/scripts" class="nav-about-btn" id="nav-scripts-btn" title="${t('scripts') || 'Scripts'}">
              <svg class="nav-about-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                <path d="M2 2l7.586 7.586"/>
                <circle cx="11" cy="11" r="2"/>
              </svg>
              <span class="nav-about-text" data-i18n="scripts">${t('scripts') || 'Scripts'}</span>
            </a>

            <a href="#/about" class="nav-about-btn" id="nav-about-btn" title="${t('about')}">
              <svg class="nav-about-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span class="nav-about-text" data-i18n="about">${t('about')}</span>
            </a>
          ` : ''}

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

          <!-- Profile Dropdown Menu -->
          <div class="profile-menu-wrapper" id="profile-menu-wrapper">
            <button type="button" class="profile-avatar-btn" id="profile-menu-btn" title="Account &amp; Settings" aria-haspopup="true" aria-expanded="false">
              ${user?.picture ? `
                <img src="${user.picture}" alt="${user.name || 'Profile'}" class="profile-avatar-img" referrerpolicy="no-referrer" />
              ` : isAuthed ? `
                <span class="profile-avatar-initial">${userInitial}</span>
              ` : `
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              `}
              <svg class="profile-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            <div class="profile-dropdown-menu" id="profile-dropdown-menu" role="menu">
              ${isAuthed && user ? `
                <div class="profile-dropdown-user">
                  <div class="profile-dropdown-name">${user.name || 'Learner'}</div>
                  ${user.email ? `<div class="profile-dropdown-email">${user.email}</div>` : ''}
                </div>
                <div class="profile-dropdown-divider"></div>
              ` : ''}

              <a href="#/settings" class="profile-dropdown-item ${isSettingsScreen ? 'is-active' : ''}" role="menuitem" id="dropdown-settings-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                <span data-i18n="settings">${t('settings') || 'Settings'}</span>
              </a>

              <a href="/scripts" class="profile-dropdown-item" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                </svg>
                <span data-i18n="scripts">${t('scripts') || 'Scripts'}</span>
              </a>

              <a href="#/about" class="profile-dropdown-item" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <span data-i18n="about">${t('about')}</span>
              </a>

              <div class="profile-dropdown-divider"></div>

              ${isAuthed ? `
                <button type="button" class="profile-dropdown-item is-danger-item" id="nav-signout-btn" role="menuitem">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span data-i18n="signOut">${t('signOut')}</span>
                </button>
              ` : `
                <a href="#/signin" class="profile-dropdown-item" role="menuitem">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  <span>Sign In</span>
                </a>
              `}
            </div>
          </div>
        </div>
      </header>
      ${showUnauthBanner ? `
        <div class="unauth-warning-banner" role="alert">
          <div class="unauth-warning-content">
            <span class="unauth-warning-icon">⚠️</span>
            <span class="unauth-warning-text">
              <strong>You are not signed in.</strong> Any words, decks, or script progress you add are not synced to your account and will be lost.
            </span>
          </div>
          <a href="#/signin" class="unauth-warning-cta">Sign In to Save →</a>
        </div>
      ` : ''}
    `;

    autoTranslateUi(container);

    // Bind event listeners
    const backBtn = container.querySelector('#nav-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        const target = backBtn.getAttribute('data-target');
        if (cleanPath === '/scripts/khmer') {
          sessionStorage.removeItem('khmer_kb_return_route');
        } else if (cleanPath === '/scripts/japanese/hiragana' || cleanPath === '/scripts/japanese/katakana') {
          sessionStorage.removeItem('japanese_kb_return_route');
        }
        trackEvent('nav_back_click', { target: target || 'history' });
        if (target) {
          navigateBack(target);
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

    // Profile menu dropdown toggle
    const profileBtn = container.querySelector('#profile-menu-btn');
    const profileMenu = container.querySelector('#profile-dropdown-menu');
    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = profileMenu.classList.toggle('is-open');
        profileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });

      // Close dropdown when clicking any link inside
      profileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          profileMenu.classList.remove('is-open');
          profileBtn.setAttribute('aria-expanded', 'false');
        });
      });

      // Close dropdown when clicking outside
      if (!this._outsideClickBound) {
        this._outsideClickBound = true;
        document.addEventListener('click', (e) => {
          const menu = document.getElementById('profile-dropdown-menu');
          const btn = document.getElementById('profile-menu-btn');
          if (menu && menu.classList.contains('is-open')) {
            if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
              menu.classList.remove('is-open');
              if (btn) btn.setAttribute('aria-expanded', 'false');
            }
          }
        });
      }
    }

    const signOutBtn = container.querySelector('#nav-signout-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        trackEvent('sign_out');
        Auth.signOut();
        if (this.onSignOut) this.onSignOut();
        navigate('#/');
      });
    }
  }
}
