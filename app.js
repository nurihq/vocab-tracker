import { Navbar } from './components/navbar.js?v=20261116_khmer_tts2';
import { Modal } from './components/modal.js?v=20261116_khmer_tts2';
import { detectBrowserLanguage, getLanguageByCode } from './languages.js?v=20261116_khmer_tts2';
import { setI18nBaseLang } from './i18n.js?v=20261116_khmer_tts2';
import { Auth, syncLocalToCloud, recordLanguageUsage, shouldColorKhmer } from './api.js?v=20261116_khmer_tts2';
import { trackPageView, trackEvent } from './analytics.js?v=20261116_khmer_tts2';

import { renderHomeScreen } from './screens/home.js?v=20261116_khmer_tts2';
import { renderSignInScreen } from './screens/signin.js?v=20261116_khmer_tts2';
import { renderStudyLanguagesScreen } from './screens/study-languages.js?v=20261116_khmer_tts2';
import { renderDecksScreen } from './screens/decks.js?v=20261116_khmer_tts2';
import { renderDeckWordsScreen } from './screens/deck-words.js?v=20261116_khmer_tts2';
import { renderFlashcardsScreen } from './screens/flashcards.js?v=20261116_khmer_tts2';
import { renderAboutScreen } from './screens/about.js?v=20261116_khmer_tts2';
import { renderScriptsScreen } from './screens/scripts.js?v=20261116_khmer_tts2';
import { renderJapaneseScriptsLandingScreen, renderScriptInfoScreen } from './screens/script-info.js?v=20261116_khmer_tts2';
import { renderScriptPracticeScreen } from './screens/script-practice.js?v=20261116_khmer_tts2';
import { renderSettingsScreen } from './screens/settings.js?v=20261116_khmer_tts2';

const routeHistory = [];

function normalizeScriptAlias(rawPath) {
  let p = rawPath.replace(/^\/scripts\/japananese(\/|$)/, '/scripts/japanese$1');
  if (p === '/scripts/hiragana') return '/scripts/japanese/hiragana';
  if (p === '/scripts/hiragana/practice') return '/scripts/japanese/hiragana/practice';
  if (p === '/scripts/katakana') return '/scripts/japanese/katakana';
  if (p === '/scripts/katakana/practice') return '/scripts/japanese/katakana/practice';
  return p;
}

function normalizeTargetToPath(target) {
  const raw = (target || '/').trim();
  const stripped = raw.replace(/^#/, '').replace(/\/+$/, '') || '/';
  const withSlash = stripped.startsWith('/') ? stripped : '/' + stripped;
  return normalizeScriptAlias(withSlash);
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

export function navigateBack(target) {
  if (target) {
    const targetPath = normalizeTargetToPath(target);
    if (routeHistory.length >= 2 && routeHistory[routeHistory.length - 2] === targetPath) {
      window.history.back();
      return;
    }
    navigate(target);
    return;
  }
  window.history.back();
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

    // Initialize Khmer consonant color setting attribute
    document.documentElement.setAttribute('data-khmer-colors', shouldColorKhmer() ? 'on' : 'off');

    this.navbar = new Navbar(
      (newBaseLang) => this.handleBaseLangChange(newBaseLang),
      (newTheme) => this.handleThemeChange(newTheme),
      () => this.handleSignOut()
    );

    // Global capture-phase click handler for colored Khmer consonants:
    // In the word list (.word-row), clicking a Khmer word opens the large Khmer Word Modal first.
    // Inside the Khmer Word Modal, Flashcards, or Settings preview, clicking a consonant navigates to the Khmer keyboard with that letter highlighted.
    document.addEventListener('click', (e) => {
      if (!e.target || !e.target.closest) return;
      const khmerCharEl = e.target.closest('.khmer-cons-char[data-khmer-char]');
      if (!khmerCharEl) return;
      if (
        khmerCharEl.closest('.khmer-kb-key') ||
        khmerCharEl.closest('.home-card-stage') ||
        khmerCharEl.closest('.word-row') ||
        khmerCharEl.closest('.khmer-zoom-word')
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // If triggered from inside the Khmer word zoom modal, remember it so navigating back reopens it
      const curPathForZoom = getActiveRoutePath();
      const zoomOverlay = khmerCharEl.closest('.khmer-word-zoom-overlay');
      if (zoomOverlay) {
        const zoomWordId = zoomOverlay.getAttribute('data-word-id');
        if (zoomWordId) {
          sessionStorage.setItem('khmer_zoom_return_state', JSON.stringify({
            route: curPathForZoom,
            wordId: zoomWordId
          }));
        }
      }

      // Close any open modal overlay before navigating to the keyboard
      document.querySelectorAll('.modal-overlay').forEach(el => el.remove());

      let targetChar = khmerCharEl.getAttribute('data-khmer-char');
      const subChar = khmerCharEl.getAttribute('data-khmer-sub');
      const vowelChar = khmerCharEl.getAttribute('data-khmer-vowel');
      const vowelPos = khmerCharEl.getAttribute('data-khmer-vowel-pos');

      const rect = khmerCharEl.getBoundingClientRect();
      const relX = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0.5;
      const relY = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;

      let matchedVowel = false;
      if (vowelChar && vowelPos) {
        if (vowelPos === 'left' && relX < 0.36) matchedVowel = true;
        else if (vowelPos === 'right' && relX > 0.64) matchedVowel = true;
        else if (vowelPos === 'circumfix' && (relX < 0.30 || relX > 0.72)) matchedVowel = true;
        else if (vowelPos === 'above' && relY < 0.32) matchedVowel = true;
        else if (vowelPos === 'below' && !subChar && relY > 0.66) matchedVowel = true;
        else if (vowelPos === 'below' && subChar && relY > 0.78) matchedVowel = true;
      }

      if (matchedVowel) {
        targetChar = vowelChar;
      } else if (subChar && relY > 0.58) {
        targetChar = subChar;
      }

      // Save return route so the navbar Back button returns the user straight back to their deck/card
      const curPath = getActiveRoutePath();
      const returnToken = curPath === '/' ? '#/' : (curPath.startsWith('/scripts') ? curPath : `#${curPath}`);
      sessionStorage.setItem('khmer_kb_return_route', returnToken);

      const hlPayload = {
        char: targetChar,
        subChar: subChar || vowelChar || null,
        timestamp: Date.now()
      };
      window.__activeKhmerHighlight = hlPayload;
      sessionStorage.setItem('khmer_kb_highlight', JSON.stringify(hlPayload));

      trackEvent('khmer_consonant_locate', { char: targetChar });
      navigate('/scripts/khmer');
    }, true);

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

    window.addEventListener('vocab-auth-changed', () => {
      const path = getActiveRoutePath();
      const routeToken = path === '/' ? '#/' : `#${path}`;
      this.navbar.render(this.navContainer, routeToken);
      if (path === '/' || path === '') {
        renderHomeScreen(this.mainContainer);
      }
    });

    // Periodic live sync every 15 seconds if active & immediate auth expiration detection
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        if (Auth.isAuthenticated()) {
          syncLocalToCloud();
        } else if (localStorage.getItem('vocab_tracker_auth_token')) {
          // Token expired locally! Clean up and surface banner
          Auth.signOut();
        }
      }
    }, 10000);
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
    const prevPath = this.currentPath || null;
    const path = getActiveRoutePath();
    const routeToken = path === '/' ? '#/' : `#${path}`;

    if (routeHistory.length >= 2 && routeHistory[routeHistory.length - 2] === path) {
      routeHistory.pop();
    } else if (routeHistory[routeHistory.length - 1] !== path) {
      routeHistory.push(path);
    }

    const practiceMatch = path.match(/^\/scripts\/(?:japanese\/(hiragana|katakana)|(khmer))\/practice$/);
    const infoMatch = path.match(/^\/scripts\/(?:japanese\/(hiragana|katakana)|(khmer))$/);
    const isJapaneseLanding = path === '/scripts/japanese';
    const isScriptsRoute = path === '/scripts' || path.startsWith('/scripts/');

    // Track whether the user entered a language's decks from Home vs Languages
    if (path === '/languages') {
      sessionStorage.setItem('vocab_decks_back_source', 'languages');
    } else if (/^\/languages\/[^/]+\/decks$/.test(path)) {
      if (prevPath === '/' || prevPath === '') {
        sessionStorage.setItem('vocab_decks_back_source', 'home');
      } else if (prevPath === '/languages') {
        sessionStorage.setItem('vocab_decks_back_source', 'languages');
      }
    }

    // Track return route when navigating to script keyboard pages from decks/modals or scripts hub
    if (path === '/scripts/khmer') {
      if (prevPath && prevPath !== '/scripts/khmer' && prevPath !== '/scripts/khmer/practice') {
        const returnToken = prevPath === '/' ? '#/' : (prevPath.startsWith('/scripts') ? prevPath : `#${prevPath}`);
        sessionStorage.setItem('khmer_kb_return_route', returnToken);
      }
    } else if (path === '/scripts/japanese/hiragana' || path === '/scripts/japanese/katakana') {
      if (prevPath && !prevPath.startsWith('/scripts')) {
        const returnToken = prevPath === '/' ? '#/' : `#${prevPath}`;
        sessionStorage.setItem('japanese_kb_return_route', returnToken);
      } else if (prevPath === '/scripts/japanese' || prevPath === '/scripts') {
        sessionStorage.removeItem('japanese_kb_return_route');
      }
    }

    // Suspend any open modal when jumping to scripts/keyboards, and restore it when coming back
    if (isScriptsRoute) {
      if (Modal.activeOverlay && !Modal.isSuspended && prevPath && !prevPath.startsWith('/scripts')) {
        Modal.suspend(prevPath);
      }
    } else {
      if (Modal.activeOverlay && Modal.isSuspended) {
        if (Modal.suspendedRoute === path) {
          Modal.resume(path);
        } else {
          Modal.close();
        }
      } else if (Modal.activeOverlay && !Modal.isSuspended && prevPath && prevPath !== path) {
        Modal.close();
      }
      try {
        const rawZoom = sessionStorage.getItem('khmer_zoom_return_state');
        if (rawZoom) {
          const parsedZoom = JSON.parse(rawZoom);
          if (!parsedZoom || parsedZoom.route !== path) {
            sessionStorage.removeItem('khmer_zoom_return_state');
          }
        }
      } catch (e) {
        sessionStorage.removeItem('khmer_zoom_return_state');
      }
    }

    this.currentPath = path;

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
    } else if (path === '/settings') {
      document.title = 'Settings | monogenesis';
      trackPageView('/settings', document.title);
      renderSettingsScreen(this.mainContainer);
    } else {
      // Regex routes
      const studyMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)\/study$/);
      if (studyMatch) {
        recordLanguageUsage(studyMatch[1]);
        const lang = getLanguageByCode(studyMatch[1])?.name || studyMatch[1].toUpperCase();
        document.title = `Flashcards (${lang}) | monogenesis`;
        trackPageView(path, document.title);
        renderFlashcardsScreen(this.mainContainer, { code: studyMatch[1], deckId: studyMatch[2] });
        return;
      }

      const deckWordsMatch = path.match(/^\/languages\/([^/]+)\/decks\/([^/]+)$/);
      if (deckWordsMatch) {
        recordLanguageUsage(deckWordsMatch[1]);
        const lang = getLanguageByCode(deckWordsMatch[1])?.name || deckWordsMatch[1].toUpperCase();
        document.title = `Deck Words (${lang}) | monogenesis`;
        trackPageView(path, document.title);
        renderDeckWordsScreen(this.mainContainer, { code: deckWordsMatch[1], deckId: deckWordsMatch[2] });
        return;
      }

      const decksMatch = path.match(/^\/languages\/([^/]+)\/decks$/);
      if (decksMatch) {
        recordLanguageUsage(decksMatch[1]);
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
  if (window.__monogenesisAppInitialized) return;
  window.__monogenesisAppInitialized = true;
  const app = new App();
  app.init();
});
