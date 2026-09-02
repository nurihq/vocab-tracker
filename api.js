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

export function getLocalStore() {
  const raw = localStorage.getItem(LOCAL_DATA_KEY);
  if (raw) {
    try { 
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.languages)) return parsed;
    } catch (e) {}
  }
  const defaultStore = {
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
        { wordId: 'w1', studyWord: 'こんにちは\nkonnichiwa', baseWord: 'Hello', pronunciation: 'Greeting used during the daytime', langCode: 'ja', deckId: 'practicing', order: 0, createdAt: new Date(Date.now() - 3000000).toISOString() },
        { wordId: 'w2', studyWord: 'ありがとう\narigatou', baseWord: 'Thank you', pronunciation: 'Casual form of thank you', langCode: 'ja', deckId: 'practicing', order: 1, createdAt: new Date(Date.now() - 2000000).toISOString() }
      ],
      'es': [
        { wordId: 'w3', studyWord: 'Hola', baseWord: 'Hello', pronunciation: 'Silent H', langCode: 'es', deckId: 'practicing', order: 0, createdAt: new Date().toISOString() }
      ]
    }
  };
  saveLocalStore(defaultStore);
  return defaultStore;
}

export function saveLocalStore(store) {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(store));
}

export const Auth = {
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  setToken(token) {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  },
  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  },
  isAuthenticated() {
    return !!this.getToken() || !!this.getUser();
  },
  signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

function shouldUseCloud() {
  return !!CONFIG.API_ENDPOINTS.languages && !!Auth.getToken();
}

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
    Auth.setToken(null);
    throw new Error('Authentication expired. Switched to local mode.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

// Sync local data to cloud on login
async function syncLocalToCloud() {
  if (!shouldUseCloud()) return;
  try {
    const store = getLocalStore();
    const cloudLangs = await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, { method: 'GET' });
    
    if (!cloudLangs.languages || cloudLangs.languages.length === 0) {
      for (const l of store.languages) {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
          method: 'POST',
          body: JSON.stringify({ action: 'add', code: l.code, name: l.name, flag: l.flag })
        });

        const decks = store.decks[l.code] || [];
        for (const d of decks) {
          if (!['practicing', 'mastered', 'all'].includes(d.deckId.toLowerCase())) {
            await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
              method: 'POST',
              body: JSON.stringify({ action: 'add', langCode: l.code, name: d.name })
            });
          }
        }

        const words = store.words[l.code] || [];
        for (const w of words) {
          await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
            method: 'POST',
            body: JSON.stringify({
              action: 'add',
              langCode: l.code,
              deckId: w.deckId || 'practicing',
              baseWord: w.baseWord,
              studyWord: w.studyWord,
              pronunciation: w.pronunciation || ''
            })
          });
        }
      }
    }
  } catch (e) {
    console.warn('Sync note:', e);
  }
}

export const Api = {
  syncLocalToCloud,

  async getProfile() {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.profile) {
      try {
        return await fetchWithAuth(CONFIG.API_ENDPOINTS.profile, { method: 'GET' });
      } catch (e) {}
    }
    const user = Auth.getUser() || { sub: 'local-user', name: 'Learner', email: 'user@vocab.app' };
    return { profile: user };
  },

  async updateProfile(profileData) {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.profile) {
      try {
        return await fetchWithAuth(CONFIG.API_ENDPOINTS.profile, {
          method: 'POST',
          body: JSON.stringify(profileData)
        });
      } catch (e) {}
    }
    const current = Auth.getUser() || {};
    const updated = { ...current, ...profileData };
    Auth.setUser(updated);
    return { profile: updated };
  },

  async getLanguages() {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.languages) {
      try {
        const cloudRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, { method: 'GET' });
        if (cloudRes.languages && cloudRes.languages.length > 0) {
          // Update local store with cloud data
          const store = getLocalStore();
          store.languages = cloudRes.languages;
          saveLocalStore(store);
          return cloudRes;
        }
        await syncLocalToCloud();
        const retryRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, { method: 'GET' });
        if (retryRes.languages && retryRes.languages.length > 0) {
          const store = getLocalStore();
          store.languages = retryRes.languages;
          saveLocalStore(store);
          return retryRes;
        }
      } catch (e) {}
    }
    const store = getLocalStore();
    return { languages: store.languages || [] };
  },

  async addLanguage(lang) {
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
      if (!store.decks[lang.code]) {
        store.decks[lang.code] = [
          { deckId: 'practicing', name: 'Practicing', langCode: lang.code, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'mastered', name: 'Mastered', langCode: lang.code, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'all', name: 'All', langCode: lang.code, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
        ];
      }
      if (!store.words[lang.code]) store.words[lang.code] = [];
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.languages) {
      try {
        return await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
          method: 'POST',
          body: JSON.stringify({ action: 'add', ...lang })
        });
      } catch (e) {}
    }
    return { language: store.languages.find(l => l.code === lang.code) };
  },

  async reorderLanguages(orderList) {
    const store = getLocalStore();
    for (const item of orderList) {
      const target = store.languages.find(l => l.code === item.code);
      if (target) target.order = item.order;
    }
    store.languages.sort((a, b) => a.order - b.order);
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.languages) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
          method: 'POST',
          body: JSON.stringify({ action: 'reorder', orderList })
        });
      } catch (e) {}
    }
    return { message: 'Reordered' };
  },

  async toggleHideLanguage(code, hide) {
    const store = getLocalStore();
    const target = store.languages.find(l => l.code === code);
    if (target) {
      target.hidden = hide;
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.languages) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
          method: 'POST',
          body: JSON.stringify({ action: hide ? 'hide' : 'unhide', code })
        });
      } catch (e) {}
    }
    return { language: target };
  },

  async getDecks(langCode) {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        const res = await fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(langCode)}`, { method: 'GET' });
        if (res.decks && res.decks.length > 0) {
          const store = getLocalStore();
          store.decks[langCode] = res.decks;
          saveLocalStore(store);
          return res;
        }
      } catch (e) {}
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [
      { deckId: 'practicing', name: 'Practicing', langCode, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'mastered', name: 'Mastered', langCode, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'all', name: 'All', langCode, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
    ];
    store.decks[langCode] = decks;
    saveLocalStore(store);

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

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        return await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
          method: 'POST',
          body: JSON.stringify({ action: 'add', langCode, name })
        });
      } catch (e) {}
    }
    return { deck: newDeck };
  },

  async reorderDecks(langCode, orderList) {
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    for (const item of orderList) {
      const target = decks.find(d => d.deckId === item.deckId);
      if (target) target.order = item.order;
    }
    decks.sort((a, b) => a.order - b.order);
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
          method: 'POST',
          body: JSON.stringify({ action: 'reorder', langCode, orderList })
        });
      } catch (e) {}
    }
    return { message: 'Decks reordered' };
  },

  async toggleHideDeck(langCode, deckId, hide) {
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    const target = decks.find(d => d.deckId === deckId);
    if (target) {
      target.hidden = hide;
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
          method: 'POST',
          body: JSON.stringify({ action: hide ? 'hide' : 'unhide', langCode, deckId })
        });
      } catch (e) {}
    }
    return { deck: target };
  },

  async deleteDeck(langCode, deckId) {
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

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        await fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    }
    return { message: 'Deleted' };
  },

  async getWords(langCode, deckId, sort = 'newest') {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        const res = await fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}&sort=${encodeURIComponent(sort)}`, {
          method: 'GET'
        });
        if (res.words) return res;
      } catch (e) {}
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

  async addWord(langCode, deckId, baseWord, studyWord, pronunciation = '') {
    const baseLang = getI18nBaseLang();
    
    // Auto-fill if one is empty
    let finalBase = (baseWord || '').trim();
    let finalStudy = (studyWord || '').trim();

    if (!finalStudy && finalBase) {
      finalStudy = await clientAutoTranslate(finalBase, baseLang, langCode);
    } else if (!finalBase && finalStudy) {
      finalBase = await clientAutoTranslate(finalStudy, langCode, baseLang);
    }

    const wordId = 'w_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    const store = getLocalStore();
    if (!store.words[langCode]) store.words[langCode] = [];
    const newWord = {
      wordId,
      baseWord: finalBase,
      studyWord: finalStudy,
      pronunciation: (pronunciation || '').trim(),
      langCode,
      deckId,
      order: store.words[langCode].length,
      createdAt: new Date().toISOString()
    };
    store.words[langCode].unshift(newWord);
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        const cloudRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
          method: 'POST',
          body: JSON.stringify({
            action: 'add',
            langCode,
            deckId,
            baseWord: finalBase,
            studyWord: finalStudy,
            pronunciation,
            baseLang
          })
        });
        if (cloudRes.word) return cloudRes;
      } catch (e) {}
    }
    return { word: newWord };
  },

  async moveWord(langCode, wordId, fromDeckId, toDeckId) {
    const store = getLocalStore();
    const words = store.words[langCode] || [];
    const target = words.find(w => w.wordId === wordId);
    if (target) {
      target.deckId = toDeckId;
      target.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
          method: 'POST',
          body: JSON.stringify({ action: 'move', langCode, wordId, fromDeckId, toDeckId })
        });
      } catch (e) {}
    }
    return { word: target };
  },

  async reorderWords(langCode, deckId, orderList) {
    const store = getLocalStore();
    const words = store.words[langCode] || [];
    for (const item of orderList) {
      const target = words.find(w => w.wordId === item.wordId);
      if (target) target.order = item.order;
    }
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
          method: 'POST',
          body: JSON.stringify({ action: 'reorder', langCode, deckId, orderList })
        });
      } catch (e) {}
    }
    return { message: 'Words reordered' };
  },

  async deleteWord(langCode, deckId, wordId) {
    const store = getLocalStore();
    store.words[langCode] = (store.words[langCode] || []).filter(w => w.wordId !== wordId);
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        await fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}&wordId=${encodeURIComponent(wordId)}`, {
          method: 'DELETE'
        });
      } catch (e) {}
    }
    return { message: 'Word deleted' };
  }
};
