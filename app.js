import { Navbar } from './components/navbar.js?v=20261104_scripts7';
import { detectBrowserLanguage, getLanguageByCode } from './languages.js?v=20261104_scripts7';
import { setI18nBaseLang } from './i18n.js?v=20261104_scripts7';
import { Auth, syncLocalToCloud } from './api.js?v=20261104_scripts7';
import { trackPageView } from './analytics.js?v=20261104_scripts7';

import { renderHomeScreen } from './screens/home.js?v=20261104_scripts7';
import { renderSignInScreen } from './screens/signin.js?v=20261104_scripts7';
import { renderStudyLanguagesScreen } from './screens/study-languages.js?v=20261104_scripts7';
import { renderDecksScreen } from './screens/decks.js?v=20261104_scripts7';
import { renderDeckWordsScreen } from './screens/deck-words.js?v=20261104_scripts7';
import { renderFlashcardsScreen } from './screens/flashcards.js?v=20261104_scripts7';
import { renderAboutScreen } from './screens/about.js?v=20261104_scripts7';
import { renderScriptsScreen } from './screens/scripts.js?v=20261104_scripts7';
import { renderJapaneseScriptsLandingScreen, renderScriptInfoScreen } from './screens/script-info.js?v=20261104_scripts7';
import { renderScriptPracticeScreen } from './screens/script-practice.js?v=20261104_scripts7';

function normalizeScriptAlias(rawPath) {
  let p = rawPath.replace(/^\/scripts\/japananese(\/|$)/, '/scripts/japanese$1');
  if (p === '/scripts/hiragana') return '/scripts/japanese/hiragana';
  if (p === '/scripts/hiragana/practice') return '/scripts/japanese/hiragana/practice';
  if (p === '/scripts/katakana') return '/scripts/japanese/katakana';
  if (p === '/scripts/katakana/practice') return '/scripts/japanese/katakana/practice';
  return p;
}

function getActiveRoutePath() {
  const rawHash = window.location.hash || '';
  if (rawHash && rawHash !== '#' && rawHash !== '#/') {
    const hashPath = rawHash.replace(/^#/, '').replace(/\/+$/, '') || '/';
    const withSlash = hashPath.startsWith('/') ? hashPath : '/' + hashPath;
    return normalizeScriptAlias(withSlash);
  }
  const pathname = (window.location.pathname || '/').replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';
  if (pathname === '/scripts' || pathname.startsWith('/scripts/')) {
    return normalizeScriptAlias(pathname);
  }
  return '/';
}

export function navigate(to) {
  const raw = (to || '/').trim();
  const normalized = normalizeScriptAlias(raw.replace(/^#/, '').replace(/\/+$/, '') || '/');
  const isScriptPath = normalized === '/scripts' || normalized.startsWith('/scripts/');

  if (isScriptPath) {
    if (window.location.pathname.replace(/\/+$/, '') !== normalized || window.location.hash) {
      window.history.pushState(null, '', normalized);
    }
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

  let cleanTo = raw;
  if (!cleanTo.startsWith('#')) {
    cleanTo = '#' + (cleanTo.startsWith('/') ? cleanTo : '/' + cleanTo);
  }

  // If currently on a /scripts/* pathname, move back to root path with the target hash
  const currentPathname = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  if (currentPathname !== '/') {
    const nextUrl = cleanTo === '#/' ? '/' : '/' + cleanTo;
    window.history.pushState(null, '', nextUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
    return;
  }

  if (window.location.hash !== cleanTo) {
    window.location.hash = cleanTo;
  } else {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
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

    // Global safeguard: prevent auto-capitalization and auto-correction on mobile inputs
    document.addEventListener('focusin', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        if (!e.target.hasAttribute('autocapitalize')) e.target.setAttribute('autocapitalize', 'none');
        if (!e.target.hasAttribute('autocorrect')) e.target.setAttribute('autocorrect', 'off');
        if (!e.target.hasAttribute('spellcheck')) e.target.setAttribute('spellcheck', 'false');
      }
    });

    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('popstate', () => this.handleRoute());

    // Intercept any internal links for instant SPA navigation (unless opening in a new tab/window)
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.getAttribute('href')) {
        if (
          link.getAttribute('target') === '_blank' ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          (typeof e.button === 'number' && e.button !== 0)
        ) {
          return;
        }
        const href = link.getAttribute('href');
        if (href.startsWith('#/') || href === '/scripts' || href.startsWith('/scripts/')) {
          e.preventDefault();
          navigate(href);
        }
      }
    });

    // Start initial background sync
    syncLocalToCloud();

    // Auto-sync from cloud when switching back to tab/window or unlocking screen
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Auth.isAuthenticated()) {
        syncLocalToCloud().then(() => {
          const currentPath = getActiveRoutePath();
          // Never interrupt an active study session, script drawing, or active text editing
          if (currentPath.includes('/study') || currentPath.startsWith('/scripts')) return;
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
          this.handleRoute();
        });
      }
    });

    window.addEventListener('focus', () => {
      if (Auth.isAuthenticated()) {
        syncLocalToCloud().then(() => {
          const currentPath = getActiveRoutePath();
          // Never interrupt an active study session, script drawing, or active text editing
          if (currentPath.includes('/study') || currentPath.startsWith('/scripts')) return;
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
          this.handleRoute();
        });
      }
    });

    // Periodic live sync every 15 seconds if active (syncs data in background without unmounting active view)
    setInterval(() => {
      if (document.visibilityState === 'visible' && Auth.isAuthenticated()) {
        syncLocalToCloud();
      }
    }, 15000);
  }

  init() {
    this.handleRoute();
  }

  handleBaseLangChange() {
    this.handleRoute();
  }

  handleThemeChange() {}

  handleSignOut() {
    navigate('#/');
  }

  handleRoute() {
    const path = getActiveRoutePath();
    const routeToken = path === '/' ? '#/' : `#${path}`;

    const practiceMatch = path.match(/^\/scripts\/(?:japanese\/(hiragana|katakana)|(khmer))\/practice$/);
    const infoMatch = path.match(/^\/scripts\/(?:japanese\/(hiragana|katakana)|(khmer))$/);
    const isJapaneseLanding = path === '/scripts/japanese';
    const isScriptsRoute = path === '/scripts' || path.startsWith('/scripts/');

    document.body.classList.toggle('is-script-practice-route', Boolean(practiceMatch));

    // Re-render navbar (and global unauthenticated warning banner) with updated active state
    this.navbar.render(this.navContainer, routeToken);

    // Router Pattern Matching with Dynamic Title & GA4 Page View Tracking
    if (path === '/' || path === '') {
      document.title = 'monogenesis — Track and improve your vocabulary in multiple languages';
      trackPageView('/', document.title);
      renderHomeScreen(this.mainContainer);
    } else if (path === '/about') {
      document.title = 'About — Vocabulary Growth & CEFR Milestones | monogenesis';
      trackPageView('/about', document.title);
      renderAboutScreen(this.mainContainer);
    } else if (path === '/scripts') {
      document.title = 'Scripts & Writing Systems — Japanese & Khmer | monogenesis';
      trackPageView('/scripts', document.title);
      renderScriptsScreen(this.mainContainer);
    } else if (isJapaneseLanding) {
      document.title = 'Japanese Writing Systems — Hiragana & Katakana | monogenesis';
      trackPageView('/scripts/japanese', document.title);
      renderJapaneseScriptsLandingScreen(this.mainContainer);
    } else if (infoMatch) {
      const scriptId = (infoMatch[1] || infoMatch[2]).toLowerCase();
      const infoTitles = {
        hiragana: 'Hiragana Guide, Romanisation & Phone Keyboard Layout | monogenesis',
        katakana: 'Katakana Guide, Romanisation & Phone Keyboard Layout | monogenesis',
        khmer: 'Khmer Script Guide, Phone Keyboard Layout & A/O Series Vowels | monogenesis'
      };
      document.title = infoTitles[scriptId] || 'Script Guide | monogenesis';
      trackPageView(path, document.title);
      window.scrollTo(0, 0);
      renderScriptInfoScreen(this.mainContainer, { scriptId });
    } else if (practiceMatch) {
      const scriptId = (practiceMatch[1] || practiceMatch[2]).toLowerCase();
      const practiceTitles = {
        hiragana: 'Hiragana Writing Practice — Interactive Stroke Order | monogenesis',
        katakana: 'Katakana Writing Practice — Interactive Stroke Order | monogenesis',
        khmer: 'Khmer Script Writing Practice — Interactive Stroke Order | monogenesis'
      };
      document.title = practiceTitles[scriptId] || 'Script Practice | monogenesis';
      trackPageView(path, document.title);
      renderScriptPracticeScreen(this.mainContainer, { scriptId });
    } else if (path === '/signin') {
      if (Auth.isAuthenticated()) {
        navigate('#/languages');
      } else {
        document.title = 'Sign In | monogenesis';
        trackPageView('/signin', document.title);
        renderSignInScreen(this.mainContainer);
      }
    } else if (path === '/languages') {
      document.title = 'Study Languages | monogenesis';
      trackPageView('/languages', document.title);
      renderStudyLanguagesScreen(this.mainContainer);
    } else {
      // Regex routes
      const studyMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)\/study$/);
      if (studyMatch) {
        const lang = getLanguageByCode(studyMatch[1])?.name || studyMatch[1].toUpperCase();
        document.title = `Flashcards (${lang}) | monogenesis`;
        trackPageView(path, document.title);
        renderFlashcardsScreen(this.mainContainer, { code: studyMatch[1], deckId: studyMatch[2] });
        return;
      }

      const deckWordsMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)$/);
      if (deckWordsMatch) {
        const lang = getLanguageByCode(deckWordsMatch[1])?.name || deckWordsMatch[1].toUpperCase();
        document.title = `Deck Words (${lang}) | monogenesis`;
        trackPageView(path, document.title);
        renderDeckWordsScreen(this.mainContainer, { code: deckWordsMatch[1], deckId: deckWordsMatch[2] });
        return;
      }

      const decksMatch = path.match(/^\/languages\/([^/]+)\/decks$/);
      if (decksMatch) {
        const lang = getLanguageByCode(decksMatch[1])?.name || decksMatch[1].toUpperCase();
        document.title = `Decks (${lang}) | monogenesis`;
        trackPageView(path, document.title);
        renderDecksScreen(this.mainContainer, { code: decksMatch[1] });
        return;
      }

      // Fallback
      document.title = 'monogenesis — Track and improve your vocabulary in multiple languages';
      trackPageView('/', document.title);
      renderHomeScreen(this.mainContainer);
    }
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
