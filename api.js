import { CONFIG } from './config.js';
import { getI18nBaseLang } from './i18n.js';

const STORAGE_PREFIX = 'vocab_tracker_';
const AUTH_TOKEN_KEY = `${STORAGE_PREFIX}auth_token`;
const USER_KEY = `${STORAGE_PREFIX}user`;
const LOCAL_DATA_KEY = `${STORAGE_PREFIX}local_data`;

// Auto-translate helper for local offline/fallback mode
async function clientAutoTranslate(text, fromLang, toLang) {
  if (!text) return '';
  const cleanFrom = (fromLang || 'auto').toLowerCase().split('-')[0];
  const cleanTo = (toLang || 'en').toLowerCase().split('-')[0];
  if (cleanFrom === cleanTo) return text;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(cleanFrom)}&tl=${encodeURIComponent(cleanTo)}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
  } catch (e) {}
  return text;
}

function getLocalStore() {
  const raw = localStorage.getItem(LOCAL_DATA_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) {}
  }
  return {
    languages: [
      { code: 'ja', name: 'Japanese', flag: '🇯🇵', order: 0, hidden: false, createdAt: new Date().toISOString() },
      { code: 'es', name: 'Spanish', flag: '🇪🇸', order: 1, hidden: false, createdAt: new Date().toISOString() },
      { code: 'ka', name: 'Georgian', flag: '🇬🇪', order: 2, hidden: false, createdAt: new Date().toISOString() }
    ],
    decks: {
      'ja': [
        { deckId: 'practicing', name: 'Practicing', langCode: 'ja', order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'mastered', name: 'Mastered', langCode: 'ja', order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'all', name: 'All', langCode: 'ja', order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
      ],
      'es': [
        { deckId: 'practicing', name: 'Practicing', langCode: 'es', order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'mastered', name: 'Mastered', langCode: 'es', order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'all', name: 'All', langCode: 'es', order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
      ],
      'ka': [
        { deckId: 'practicing', name: 'Practicing', langCode: 'ka', order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'mastered', name: 'Mastered', langCode: 'ka', order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'all', name: 'All', langCode: 'ka', order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
      ]
    },
    words: {
      'ja': [
        { wordId: 'w1', studyWord: 'こんにちは', baseWord: 'Hello', pronunciation: 'Konnichiwa', langCode: 'ja', deckId: 'practicing', order: 0, createdAt: new Date(Date.now() - 3000000).toISOString() },
        { wordId: 'w2', studyWord: 'ありがとう', baseWord: 'Thank you', pronunciation: 'Arigatou', langCode: 'ja', deckId: 'practicing', order: 1, createdAt: new Date(Date.now() - 2000000).toISOString() },
        { wordId: 'w3', studyWord: 'さようなら', baseWord: 'Goodbye', pronunciation: 'Sayounara', langCode: 'ja', deckId: 'mastered', order: 0, createdAt: new Date(Date.now() - 1000000).toISOString() }
      ],
      'es': [
        { wordId: 'w4', studyWord: 'Hola', baseWord: 'Hello', pronunciation: 'OH-lah', langCode: 'es', deckId: 'practicing', order: 0, createdAt: new Date().toISOString() },
        { wordId: 'w5', studyWord: 'Gracias', baseWord: 'Thank you', pronunciation: 'GRAH-syahs', langCode: 'es', deckId: 'mastered', order: 0, createdAt: new Date().toISOString() }
      ],
      'ka': [
        { wordId: 'w6', studyWord: 'გამარჯობა', baseWord: 'Hello', pronunciation: 'Gamarjoba', langCode: 'ka', deckId: 'practicing', order: 0, createdAt: new Date().toISOString() },
        { wordId: 'w7', studyWord: 'მადლობა', baseWord: 'Thank you', pronunciation: 'Madloba', langCode: 'ka', deckId: 'practicing', order: 1, createdAt: new Date().toISOString() }
      ]
    }
  };
}

function saveLocalStore(store) {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(store));
}

export const Auth = {
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  setToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  },
  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  isAuthenticated() {
    return !!this.getToken() || !!this.getUser();
  },
  signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function fetchWithAuth(url, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    Auth.signOut();
    window.location.hash = '#/signin';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const Api = {
  async getProfile() {
    if (CONFIG.API_ENDPOINTS.profile) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.profile, { method: 'GET' });
    }
    const user = Auth.getUser() || { sub: 'local-user', name: 'Learner', email: 'user@vocab.app' };
    return { profile: user };
  },

  async updateProfile(profileData) {
    if (CONFIG.API_ENDPOINTS.profile) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.profile, {
        method: 'POST',
        body: JSON.stringify(profileData)
      });
    }
    const current = Auth.getUser() || {};
    const updated = { ...current, ...profileData };
    Auth.setUser(updated);
    return { profile: updated };
  },

  async getLanguages() {
    if (CONFIG.API_ENDPOINTS.languages) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.languages, { method: 'GET' });
    }
    const store = getLocalStore();
    return { languages: store.languages || [] };
  },

  async addLanguage(lang) {
    if (CONFIG.API_ENDPOINTS.languages) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
        method: 'POST',
        body: JSON.stringify({ action: 'add', ...lang })
      });
    }
    const store = getLocalStore();
    if (!store.languages.find(l => l.code === lang.code)) {
      const newLang = {
        code: lang.code,
        name: lang.name,
        flag: lang.flag,
        order: store.languages.length,
        hidden: false,
        createdAt: new Date().toISOString()
      };
      store.languages.push(newLang);
      store.decks[lang.code] = [
        { deckId: 'practicing', name: 'Practicing', langCode: lang.code, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'mastered', name: 'Mastered', langCode: lang.code, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'all', name: 'All', langCode: lang.code, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
      ];
      store.words[lang.code] = [];
      saveLocalStore(store);
      return { language: newLang };
    }
    return { language: store.languages.find(l => l.code === lang.code) };
  },

  async reorderLanguages(orderList) {
    if (CONFIG.API_ENDPOINTS.languages) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
        method: 'POST',
        body: JSON.stringify({ action: 'reorder', orderList })
      });
    }
    const store = getLocalStore();
    for (const item of orderList) {
      const target = store.languages.find(l => l.code === item.code);
      if (target) target.order = item.order;
    }
    store.languages.sort((a, b) => a.order - b.order);
    saveLocalStore(store);
    return { message: 'Reordered' };
  },

  async toggleHideLanguage(code, hide) {
    if (CONFIG.API_ENDPOINTS.languages) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
        method: 'POST',
        body: JSON.stringify({ action: hide ? 'hide' : 'unhide', code })
      });
    }
    const store = getLocalStore();
    const target = store.languages.find(l => l.code === code);
    if (target) {
      target.hidden = hide;
      saveLocalStore(store);
      return { language: target };
    }
    throw new Error('Language not found');
  },

  async getDecks(langCode) {
    if (CONFIG.API_ENDPOINTS.decks) {
      return fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(langCode)}`, { method: 'GET' });
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    const words = store.words[langCode] || [];
    const counts = {};
    for (const w of words) {
      counts[w.deckId] = (counts[w.deckId] || 0) + 1;
    }
    const decksWithCount = decks.map(d => ({
      ...d,
      wordCount: d.deckId === 'all' ? words.length : (counts[d.deckId] || 0)
    }));
    return { decks: decksWithCount };
  },

  async addDeck(langCode, name) {
    if (CONFIG.API_ENDPOINTS.decks) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
        method: 'POST',
        body: JSON.stringify({ action: 'add', langCode, name })
      });
    }
    const store = getLocalStore();
    if (!store.decks[langCode]) store.decks[langCode] = [];
    const deckId = 'deck_' + Date.now().toString(36);
    const newDeck = {
      deckId,
      name: name.trim(),
      langCode,
      order: store.decks[langCode].length,
      hidden: false,
      isDefault: false,
      createdAt: new Date().toISOString()
    };
    store.decks[langCode].push(newDeck);
    saveLocalStore(store);
    return { deck: newDeck };
  },

  async reorderDecks(langCode, orderList) {
    if (CONFIG.API_ENDPOINTS.decks) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
        method: 'POST',
        body: JSON.stringify({ action: 'reorder', langCode, orderList })
      });
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    for (const item of orderList) {
      const target = decks.find(d => d.deckId === item.deckId);
      if (target) target.order = item.order;
    }
    decks.sort((a, b) => a.order - b.order);
    saveLocalStore(store);
    return { message: 'Decks reordered' };
  },

  async toggleHideDeck(langCode, deckId, hide) {
    if (CONFIG.API_ENDPOINTS.decks) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
        method: 'POST',
        body: JSON.stringify({ action: hide ? 'hide' : 'unhide', langCode, deckId })
      });
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    const target = decks.find(d => d.deckId === deckId);
    if (target) {
      target.hidden = hide;
      saveLocalStore(store);
      return { deck: target };
    }
    throw new Error('Deck not found');
  },

  async deleteDeck(langCode, deckId) {
    if (CONFIG.API_ENDPOINTS.decks) {
      return fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}`, {
        method: 'DELETE'
      });
    }
    const store = getLocalStore();
    if (['practicing', 'mastered', 'all'].includes(deckId.toLowerCase())) {
      throw new Error('Default decks cannot be deleted');
    }
    store.decks[langCode] = (store.decks[langCode] || []).filter(d => d.deckId !== deckId);
    const words = store.words[langCode] || [];
    for (const w of words) {
      if (w.deckId === deckId) w.deckId = 'practicing';
    }
    saveLocalStore(store);
    return { message: 'Deleted' };
  },

  async getWords(langCode, deckId, sort = 'newest') {
    if (CONFIG.API_ENDPOINTS.words) {
      return fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}&sort=${encodeURIComponent(sort)}`, {
        method: 'GET'
      });
    }
    const store = getLocalStore();
    let words = (store.words[langCode] || []).filter(w => deckId === 'all' || w.deckId === deckId);

    if (sort === 'alpha') {
      words.sort((a, b) => (a.studyWord || '').localeCompare(b.studyWord || ''));
    } else if (sort === 'custom') {
      words.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } else {
      words.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return { words };
  },

  async addWord(langCode, deckId, studyWord, pronunciation = '') {
    const baseLang = getI18nBaseLang();
    if (CONFIG.API_ENDPOINTS.words) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
        method: 'POST',
        body: JSON.stringify({
          action: 'add',
          langCode,
          deckId,
          studyWord,
          pronunciation,
          baseLang
        })
      });
    }
    const store = getLocalStore();
    if (!store.words[langCode]) store.words[langCode] = [];
    const autoTranslated = await clientAutoTranslate(studyWord, langCode, baseLang);
    const wordId = 'w_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const newWord = {
      wordId,
      studyWord: studyWord.trim(),
      baseWord: autoTranslated,
      pronunciation: (pronunciation || '').trim(),
      langCode,
      deckId,
      order: store.words[langCode].length,
      createdAt: new Date().toISOString()
    };
    store.words[langCode].unshift(newWord);
    saveLocalStore(store);
    return { word: newWord };
  },

  async moveWord(langCode, wordId, fromDeckId, toDeckId) {
    if (CONFIG.API_ENDPOINTS.words) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
        method: 'POST',
        body: JSON.stringify({ action: 'move', langCode, wordId, fromDeckId, toDeckId })
      });
    }
    const store = getLocalStore();
    const words = store.words[langCode] || [];
    const target = words.find(w => w.wordId === wordId);
    if (target) {
      target.deckId = toDeckId;
      target.updatedAt = new Date().toISOString();
      saveLocalStore(store);
      return { word: target };
    }
    throw new Error('Word not found');
  },

  async reorderWords(langCode, deckId, orderList) {
    if (CONFIG.API_ENDPOINTS.words) {
      return fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
        method: 'POST',
        body: JSON.stringify({ action: 'reorder', langCode, deckId, orderList })
      });
    }
    const store = getLocalStore();
    const words = store.words[langCode] || [];
    for (const item of orderList) {
      const target = words.find(w => w.wordId === item.wordId);
      if (target) target.order = item.order;
    }
    saveLocalStore(store);
    return { message: 'Words reordered' };
  },

  async deleteWord(langCode, deckId, wordId) {
    if (CONFIG.API_ENDPOINTS.words) {
      return fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}&wordId=${encodeURIComponent(wordId)}`, {
        method: 'DELETE'
      });
    }
    const store = getLocalStore();
    store.words[langCode] = (store.words[langCode] || []).filter(w => w.wordId !== wordId);
    saveLocalStore(store);
    return { message: 'Word deleted' };
  }
};
