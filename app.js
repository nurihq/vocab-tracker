import { Navbar } from './components/navbar.js';
import { detectBrowserLanguage } from './languages.js';
import { setI18nBaseLang } from './i18n.js';
import { Auth, syncLocalToCloud } from './api.js';
import { trackPageView } from './analytics.js';

import { renderHomeScreen } from './screens/home.js';
import { renderSignInScreen } from './screens/signin.js';
import { renderStudyLanguagesScreen } from './screens/study-languages.js';
import { renderDecksScreen } from './screens/decks.js';
import { renderDeckWordsScreen } from './screens/deck-words.js';
import { renderFlashcardsScreen } from './screens/flashcards.js';

export function getBasePath() {
  const isSubdir = window.location.pathname.indexOf('/vocab-tracker') === 0;
  return isSubdir ? '/vocab-tracker' : '';
}

export function getCurrentRoute() {
  const basePath = getBasePath();
  let pathname = window.location.pathname;
  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length);
  }
  if (!pathname || pathname === '') pathname = '/';

  // If hash exists, migrate from hash to clean path
  const hash = window.location.hash.replace(/^#/, '');
  if (hash && hash !== '/' && hash !== '') {
    return hash.startsWith('/') ? hash : '/' + hash;
  }
  return pathname;
}

export function navigate(to) {
  const basePath = getBasePath();
  let cleanTo = to;
  if (cleanTo.startsWith('#')) cleanTo = cleanTo.replace(/^#/, '');
  if (!cleanTo.startsWith('/')) cleanTo = '/' + cleanTo;

  const targetUrl = basePath + cleanTo;
  if (window.location.pathname + window.location.hash !== targetUrl) {
    window.history.pushState({}, '', targetUrl);
  }
  window.dispatchEvent(new CustomEvent('app-route-change', { detail: { path: cleanTo } }));
}

class App {
  constructor() {
    this.navContainer = document.getElementById('nav-container');
    this.mainContainer = document.getElementById('app');

    // Initialize Base Language
    const savedBaseLang = localStorage.getItem('vocab_base_lang');
    const detectedLang = detectBrowserLanguage();
    const initialBaseLang = savedBaseLang || detectedLang || 'en';
    setI18nBaseLang(initialBaseLang);

    this.navbar = new Navbar(
      (newBaseLang) => this.handleBaseLangChange(newBaseLang),
      (newTheme) => this.handleThemeChange(newTheme),
      () => this.handleSignOut()
    );

    window.addEventListener('popstate', () => this.handleRoute());
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('app-route-change', () => this.handleRoute());

    // Intercept clicks on internal links for fast SPA clean navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')) {
        const href = link.getAttribute('href');
        if (href.startsWith('#/') || href.startsWith('/')) {
          e.preventDefault();
          navigate(href);
        }
      }
    });

    // Start background sync
    syncLocalToCloud();
  }

  init() {
    this.handleRoute();
  }

  handleBaseLangChange() {
    this.handleRoute();
  }

  handleThemeChange() {}

  handleSignOut() {
    navigate('/');
  }

  handleRoute() {
    const path = getCurrentRoute();

    // Track Clean Page View in GA4
    trackPageView(path);

    // Re-render navbar with updated active state
    this.navbar.render(this.navContainer, path);

    // Protected Route Check
    const isPublic = path === '/' || path === '/signin';
    if (!isPublic && !Auth.isAuthenticated()) {
      navigate('/signin');
      return;
    }

    // Router Pattern Matching
    if (path === '/' || path === '') {
      renderHomeScreen(this.mainContainer);
    } else if (path === '/signin') {
      if (Auth.isAuthenticated()) {
        navigate('/languages');
      } else {
        renderSignInScreen(this.mainContainer);
      }
    } else if (path === '/languages') {
      renderStudyLanguagesScreen(this.mainContainer);
    } else {
      // Regex routes
      const studyMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)\/study$/);
      if (studyMatch) {
        renderFlashcardsScreen(this.mainContainer, { code: studyMatch[1], deckId: studyMatch[2] });
        return;
      }

      const deckWordsMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)$/);
      if (deckWordsMatch) {
        renderDeckWordsScreen(this.mainContainer, { code: deckWordsMatch[1], deckId: deckWordsMatch[2] });
        return;
      }

      const decksMatch = path.match(/^\/languages\/([^/]+)\/decks$/);
      if (decksMatch) {
        renderDecksScreen(this.mainContainer, { code: decksMatch[1] });
        return;
      }

      // Fallback
      renderHomeScreen(this.mainContainer);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
