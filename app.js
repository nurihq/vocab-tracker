import { Navbar } from './components/navbar.js';
import { detectBrowserLanguage } from './languages.js';
import { setI18nBaseLang, getI18nBaseLang } from './i18n.js';
import { Auth } from './api.js';
import { trackPageView } from './analytics.js';

import { renderHomeScreen } from './screens/home.js';
import { renderSignInScreen } from './screens/signin.js';
import { renderStudyLanguagesScreen } from './screens/study-languages.js';
import { renderDecksScreen } from './screens/decks.js';
import { renderDeckWordsScreen } from './screens/deck-words.js';
import { renderFlashcardsScreen } from './screens/flashcards.js';

class App {
  constructor() {
    this.navContainer = document.getElementById('nav-container');
    this.mainContainer = document.getElementById('app');

    // Initialize Base Language: from localStorage, or default to computer's language
    const savedBaseLang = localStorage.getItem('vocab_base_lang');
    const detectedLang = detectBrowserLanguage();
    const initialBaseLang = savedBaseLang || detectedLang || 'en';
    setI18nBaseLang(initialBaseLang);

    this.navbar = new Navbar(
      (newBaseLang) => this.handleBaseLangChange(newBaseLang),
      (newTheme) => this.handleThemeChange(newTheme),
      () => this.handleSignOut()
    );

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleBaseLangChange(newLang) {
    this.handleRoute();
  }

  handleThemeChange(theme) {
  }

  handleSignOut() {
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace(/^#/, '');

    // Track SPA Page View in GA4
    trackPageView(path || '/');

    // Re-render navbar with updated active state
    this.navbar.render(this.navContainer, hash);

    // Protected Route Check
    const isPublic = path === '' || path === '/' || path === '/signin';
    if (!isPublic && !Auth.isAuthenticated()) {
      window.location.hash = '#/signin';
      return;
    }

    // Router Pattern Matching
    if (path === '' || path === '/') {
      renderHomeScreen(this.mainContainer);
    } else if (path === '/signin') {
      if (Auth.isAuthenticated()) {
        window.location.hash = '#/languages';
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
