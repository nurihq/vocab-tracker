import { CONFIG } from './config.js?v=20260918_1789711631718';
import { getI18nBaseLang } from './i18n.js?v=20260918_1789711631718';

const STORAGE_PREFIX = 'vocab_tracker_';
const AUTH_TOKEN_KEY = `${STORAGE_PREFIX}auth_token`;
const USER_KEY = `${STORAGE_PREFIX}user`;
const LOCAL_DATA_KEY = `${STORAGE_PREFIX}local_data`;

// Client fallback auto-translate helper
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

// Strict word deduplicator: preserves true cloud IDs over temporary IDs
export function deduplicateWords(words = []) {
  const seen = new Map();
  for (const w of words) {
    if (!w || !w.studyWord) continue;
    const key = `${w.deckId || 'practicing'}:${w.studyWord.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.set(key, w);
    } else {
      const existing = seen.get(key);
      // If existing was temporary and new one has cloud ID, or newer timestamp
      if (existing.wordId?.startsWith('w_') && !w.wordId?.startsWith('w_')) {
        seen.set(key, w);
      } else if (new Date(w.updatedAt || w.createdAt || 0) > new Date(existing.updatedAt || existing.createdAt || 0)) {
        seen.set(key, w);
      }
    }
  }
  return Array.from(seen.values());
}

export function migrateLegacyDefaultDecks(store) {
  if (!store || !store.decks) return;
  for (const code of Object.keys(store.decks)) {
    const decks = store.decks[code] || [];
    const words = store.words?.[code] || [];
    const isLegacyOnly = decks.length === 3 &&
      decks.some(d => d.deckId === 'practicing') &&
      decks.some(d => d.deckId === 'mastered') &&
      decks.some(d => d.deckId === 'all');
    
    // If language has empty default decks and no words, migrate seamlessly
    if (isLegacyOnly && words.length === 0) {
      store.decks[code] = [
        { deckId: 'nouns_practice', name: 'Nouns (practice)', icon: '🪑', langCode: code, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'nouns_mastered', name: 'Nouns (mastered)', icon: '🏠', langCode: code, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'colours', name: 'Colours', icon: '🎨', langCode: code, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'numbers', name: 'Numbers', icon: '🔢', langCode: code, order: 3, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'verbs', name: 'Verbs', icon: '🏃🏽‍♀️', langCode: code, order: 4, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
        { deckId: 'all', name: 'All', icon: '📚', langCode: code, order: 5, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
      ];
    }
  }
}

export function getLocalStore() {
  const raw = localStorage.getItem(LOCAL_DATA_KEY);
  if (raw) {
    try { 
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.languages)) {
        // Auto-deduplicate words in all languages
        if (parsed.words) {
          for (const code of Object.keys(parsed.words)) {
            parsed.words[code] = deduplicateWords(parsed.words[code]);
          }
        }
        migrateLegacyDefaultDecks(parsed);
        return parsed;
      }
    } catch (e) {}
  }
  const defaultStore = {
    languages: [],
    decks: {},
    words: {}
  };
  saveLocalStore(defaultStore);
  return defaultStore;
}

export function saveLocalStore(store) {
  if (store && store.words) {
    for (const code of Object.keys(store.words)) {
      store.words[code] = deduplicateWords(store.words[code]);
    }
  }
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
  isTokenValid() {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return typeof payload.exp === 'number' && (payload.exp * 1000) > Date.now();
    } catch (e) {
      return false;
    }
  },
  isAuthenticated() {
    return this.isTokenValid() && !!this.getUser();
  },
  signOut() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

let isRefreshingToken = false;
export async function attemptSilentGoogleRefresh() {
  if (isRefreshingToken) return false;
  isRefreshingToken = true;

  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: CONFIG.GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response && response.credential) {
            Auth.setToken(response.credential);
            try {
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              Auth.setUser({
                sub: payload.sub,
                name: payload.name,
                email: payload.email,
                picture: payload.picture
              });
            } catch (e) {}
            syncLocalToCloud().catch(() => {});
            isRefreshingToken = false;
            resolve(true);
            return;
          }
          isRefreshingToken = false;
          resolve(false);
        },
        auto_select: true,
        cancel_on_tap_outside: true
      });
      google.accounts.id.prompt((notification) => {
        if (notification && (notification.isNotDisplayed() || notification.isSkippedMoment())) {
          isRefreshingToken = false;
          resolve(false);
        }
      });
      setTimeout(() => {
        isRefreshingToken = false;
        resolve(false);
      }, 3500);
    } else {
      isRefreshingToken = false;
      resolve(false);
    }
  });
}

function shouldUseCloud() {
  return !!CONFIG.API_ENDPOINTS.languages && !!Auth.getToken();
}

async function fetchWithAuth(url, options = {}) {
  if (!Auth.isTokenValid()) {
    await attemptSilentGoogleRefresh();
  }

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
    if (window.location.hash && !['#/', '#/signin', '#'].includes(window.location.hash)) {
      window.location.hash = '#/signin';
    }
    throw new Error('Authentication expired. Redirected to sign-in.');
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

let isSyncing = false;

// Robust Continuous Two-Way Sync Engine: Deduplicates and prevents any word loss
export async function syncLocalToCloud() {
  if (!shouldUseCloud() || isSyncing) return;
  isSyncing = true;

  try {
    const store = getLocalStore();
    const cloudLangsRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, { method: 'GET' }).catch(() => null);
    if (!cloudLangsRes) {
      isSyncing = false;
      return;
    }

    const cloudLangs = (cloudLangsRes.languages || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const cloudLangCodes = new Set(cloudLangs.map(l => l.code));

    // 1. Sync Languages: Upload missing local languages to DynamoDB
    for (const l of store.languages) {
      if (!cloudLangCodes.has(l.code)) {
        await fetchWithAuth(CONFIG.API_ENDPOINTS.languages, {
          method: 'POST',
          body: JSON.stringify({ action: 'add', code: l.code, name: l.name, flag: l.flag })
        }).catch(() => {});
      }
    }

    // Merge cloud languages into local store preserving cloud order
    const unsyncedLangs = store.languages.filter(l => !cloudLangCodes.has(l.code));
    store.languages = [...cloudLangs, ...unsyncedLangs];

    // 2. Sync Decks and Words for each language
    for (const l of store.languages) {
      // Sync Decks: upload missing local custom decks to DynamoDB, then merge
      const cloudDecksRes = await fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(l.code)}`, { method: 'GET' }).catch(() => null);
      const rawCloudDecks = (cloudDecksRes && Array.isArray(cloudDecksRes.decks)) ? cloudDecksRes.decks : [];
      const cloudDecks = rawCloudDecks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const cloudDeckIds = new Set(cloudDecks.map(d => d.deckId));
      const localDecks = store.decks[l.code] || [];

      // Upload any local decks that haven't reached DynamoDB yet
      for (const ld of localDecks) {
        if (ld.deckId.toLowerCase() !== 'all' && !cloudDeckIds.has(ld.deckId)) {
          try {
            const res = await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
              method: 'POST',
              body: JSON.stringify({
                action: 'add',
                langCode: l.code,
                name: ld.name,
                icon: ld.icon || '📁',
                deckId: ld.deckId
              })
            });
            if (res && res.deck) {
              cloudDecks.push(res.deck);
              cloudDeckIds.add(res.deck.deckId);
            }
          } catch (err) {
            console.warn('Failed to sync custom deck to cloud:', ld.name, err);
            cloudDecks.push(ld);
          }
        }
      }

      const unsyncedCustomDecks = localDecks.filter(d => !cloudDeckIds.has(d.deckId));
      store.decks[l.code] = cloudDecks.length > 0 ? [...cloudDecks, ...unsyncedCustomDecks] : localDecks;

      // Check cloud words
      const cloudWordsRes = await fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(l.code)}&deckId=all`, { method: 'GET' }).catch(() => ({ words: [] }));
      const cloudWords = (cloudWordsRes && Array.isArray(cloudWordsRes.words)) ? cloudWordsRes.words : [];
      const localWords = store.words[l.code] || [];
      
      const cloudIds = new Set(cloudWords.map(w => w.wordId));
      const cloudTexts = new Set(cloudWords.map(w => (w.studyWord || '').toLowerCase().trim()));

      // Upload ANY local word that is missing from DynamoDB
      for (const lw of localWords) {
        if (!lw || !lw.studyWord) continue;
        const studyKey = lw.studyWord.toLowerCase().trim();
        if (!cloudIds.has(lw.wordId) && !cloudTexts.has(studyKey)) {
          try {
            const res = await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
              method: 'POST',
              body: JSON.stringify({
                action: 'add',
                langCode: l.code,
                deckId: lw.deckId || 'nouns_practice',
                baseWord: lw.baseWord,
                studyWord: lw.studyWord,
                pronunciation: lw.pronunciation || '',
                createdAt: lw.createdAt || new Date().toISOString()
              })
            });

            if (res && res.word) {
              cloudWords.push(res.word);
              cloudIds.add(res.word.wordId);
              cloudTexts.add(studyKey);
            }
          } catch (err) {
            console.warn('Failed to upload local word:', lw.studyWord, err);
            cloudWords.push(lw);
          }
        }
      }

      const pendingLocal = localWords.filter(lw => lw && lw.studyWord && !cloudIds.has(lw.wordId) && !cloudTexts.has((lw.studyWord || '').toLowerCase().trim()));
      store.words[l.code] = deduplicateWords([...cloudWords, ...pendingLocal]);
    }

    saveLocalStore(store);
  } catch (err) {
    console.warn('Sync background check:', err);
  } finally {
    isSyncing = false;
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
        if (cloudRes.languages) {
          const store = getLocalStore();
          const cloudLangs = cloudRes.languages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const cloudCodes = new Set(cloudLangs.map(l => l.code));
          const unsyncedLocal = store.languages.filter(l => !cloudCodes.has(l.code));
          store.languages = [...cloudLangs, ...unsyncedLocal];
          saveLocalStore(store);
          
          if (unsyncedLocal.length > 0) {
            syncLocalToCloud();
          }
          return { languages: store.languages };
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
          { deckId: 'nouns_practice', name: 'Nouns (practice)', icon: '🪑', langCode: lang.code, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'nouns_mastered', name: 'Nouns (mastered)', icon: '🏠', langCode: lang.code, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'colours', name: 'Colours', icon: '🎨', langCode: lang.code, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'numbers', name: 'Numbers', icon: '🔢', langCode: lang.code, order: 3, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'verbs', name: 'Verbs', icon: '🏃🏽‍♀️', langCode: lang.code, order: 4, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
          { deckId: 'all', name: 'All', icon: '📚', langCode: lang.code, order: 5, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
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
        if (res.decks && Array.isArray(res.decks) && res.decks.length > 0) {
          const store = getLocalStore();
          const cloudDecks = res.decks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          const cloudDeckIds = new Set(cloudDecks.map(d => d.deckId));
          const localDecks = store.decks[langCode] || [];
          
          // Preserve any local custom decks that haven't synced to cloud yet
          const unsyncedCustom = localDecks.filter(d => !cloudDeckIds.has(d.deckId));
          
          store.decks[langCode] = [...cloudDecks, ...unsyncedCustom];
          saveLocalStore(store);

          if (unsyncedCustom.length > 0) {
            syncLocalToCloud().catch(() => {});
          }

          const words = store.words[langCode] || [];
          const counts = {};
          for (const w of words) {
            counts[w.deckId] = (counts[w.deckId] || 0) + 1;
          }
          const decksWithCount = store.decks[langCode].map(d => ({
            ...d,
            wordCount: d.deckId === 'all' ? words.length : (counts[d.deckId] || 0)
          }));
          return { decks: decksWithCount };
        }
      } catch (e) {}
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [
      { deckId: 'nouns_practice', name: 'Nouns (practice)', icon: '🪑', langCode, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'nouns_mastered', name: 'Nouns (mastered)', icon: '🏠', langCode, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'colours', name: 'Colours', icon: '🎨', langCode, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'numbers', name: 'Numbers', icon: '🔢', langCode, order: 3, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'verbs', name: 'Verbs', icon: '🏃🏽‍♀️', langCode, order: 4, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
      { deckId: 'all', name: 'All', icon: '📚', langCode, order: 5, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
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

  async addDeck(langCode, name, icon = '📁') {
    const store = getLocalStore();
    if (!store.decks[langCode]) store.decks[langCode] = [];
    const deckId = 'deck_' + Date.now().toString(36);
    const newDeck = {
      deckId,
      name: name.trim(),
      icon: icon || '📁',
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
        const cloudRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
          method: 'POST',
          body: JSON.stringify({ action: 'add', langCode, name, icon: icon || '📁', deckId })
        });
        if (cloudRes && cloudRes.deck) {
          const currentStore = getLocalStore();
          currentStore.decks[langCode] = (currentStore.decks[langCode] || []).map(d => d.deckId === deckId ? cloudRes.deck : d);
          saveLocalStore(currentStore);
          return cloudRes;
        }
      } catch (e) {
        console.warn('Deck created locally, will sync when online:', e);
      }
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

  async updateDeck(langCode, deckId, name, icon) {
    if (deckId.toLowerCase() === 'all') {
      throw new Error('The All deck cannot be edited');
    }
    const store = getLocalStore();
    const decks = store.decks[langCode] || [];
    const target = decks.find(d => d.deckId === deckId);
    if (target) {
      if (name !== undefined) target.name = name.trim();
      if (icon !== undefined) target.icon = icon;
      target.updatedAt = new Date().toISOString();
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        const cloudRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.decks, {
          method: 'POST',
          body: JSON.stringify({
            action: 'update',
            langCode,
            deckId,
            name: name ? name.trim() : target?.name,
            icon: icon !== undefined ? icon : target?.icon
          })
        });
        if (cloudRes && cloudRes.deck) {
          const currentStore = getLocalStore();
          currentStore.decks[langCode] = (currentStore.decks[langCode] || []).map(d => d.deckId === deckId ? cloudRes.deck : d);
          saveLocalStore(currentStore);
          return cloudRes;
        }
      } catch (e) {
        console.warn('Deck updated locally, will sync when online:', e);
      }
    }
    return { deck: target };
  },

  async deleteDeck(langCode, deckId) {
    if (deckId.toLowerCase() === 'all') {
      throw new Error('The All deck cannot be deleted');
    }
    const store = getLocalStore();
    const currentDecks = store.decks[langCode] || [];
    store.decks[langCode] = currentDecks.filter(d => d.deckId !== deckId);

    // Reassign words from deleted deck to fallback deck
    const remainingDecks = store.decks[langCode].filter(d => d.deckId.toLowerCase() !== 'all');
    const fallbackDeckId = remainingDecks.length > 0 ? remainingDecks[0].deckId : 'practicing';

    const words = store.words[langCode] || [];
    for (const w of words) {
      if (w.deckId === deckId) w.deckId = fallbackDeckId;
    }
    saveLocalStore(store);

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.decks) {
      try {
        await fetchWithAuth(`${CONFIG.API_ENDPOINTS.decks}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.warn('Failed to delete deck in cloud:', e);
      }
    }
    return { message: 'Deleted' };
  },

  async getWords(langCode, deckId, sort = 'newest') {
    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        const res = await fetchWithAuth(`${CONFIG.API_ENDPOINTS.words}?langCode=${encodeURIComponent(langCode)}&deckId=${encodeURIComponent(deckId)}&sort=${encodeURIComponent(sort)}`, {
          method: 'GET'
        });
        if (res.words) {
          const store = getLocalStore();
          const cloudWords = res.words;
          const localList = store.words[langCode] || [];
          
          // Preserve any local words that are not in cloudWords yet
          const cloudIds = new Set(cloudWords.map(w => w.wordId));
          const cloudTexts = new Set(cloudWords.map(w => (w.studyWord || '').toLowerCase().trim()));
          const unsyncedLocal = localList.filter(w => w && w.studyWord && !cloudIds.has(w.wordId) && !cloudTexts.has((w.studyWord || '').toLowerCase().trim()));
          
          store.words[langCode] = deduplicateWords([...cloudWords, ...unsyncedLocal]);
          saveLocalStore(store);

          if (unsyncedLocal.length > 0) {
            syncLocalToCloud().catch(() => {});
          }
          
          let filtered = store.words[langCode].filter(w => deckId === 'all' || w.deckId === deckId);
          if (sort === 'alpha') {
            filtered.sort((a, b) => (a.studyWord || '').localeCompare(b.studyWord || ''));
          } else if (sort === 'custom') {
            filtered.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
          } else {
            filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          }
          return { words: filtered };
        }
      } catch (e) {}
    }
    const store = getLocalStore();
    let words = (store.words[langCode] || []).filter(w => deckId === 'all' || w.deckId === deckId);
    words = deduplicateWords(words);

    if (sort === 'alpha') {
      words.sort((a, b) => (a.studyWord || '').localeCompare(b.studyWord || ''));
    } else if (sort === 'custom') {
      words.sort((a, b) => ((a.order ?? 0) - (b.order ?? 0)) || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
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

    const tempId = 'w_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    const store = getLocalStore();
    if (!store.words[langCode]) store.words[langCode] = [];

    // Shift orders of existing words so new word takes top position (order: 0)
    for (const w of store.words[langCode]) {
      if (w.deckId === deckId || deckId === 'all') {
        w.order = (w.order !== undefined ? w.order : 0) + 1;
      }
    }

    const newWord = {
      wordId: tempId,
      baseWord: finalBase,
      studyWord: finalStudy,
      pronunciation: (pronunciation || '').trim(),
      langCode,
      deckId,
      order: 0,
      _needsSync: true,
      createdAt: new Date().toISOString()
    };
    store.words[langCode].unshift(newWord);
    store.words[langCode] = deduplicateWords(store.words[langCode]);
    saveLocalStore(store);

    // Immediate Direct Cloud Write
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
            baseLang,
            order: 0
          })
        });
        if (cloudRes.word) {
          newWord.wordId = cloudRes.word.wordId;
          delete newWord._needsSync;
          store.words[langCode] = deduplicateWords(store.words[langCode]);
          saveLocalStore(store);
          return cloudRes;
        }
      } catch (e) {
        console.warn('Word saved locally, will sync when online:', e);
      }
    }
    return { word: newWord };
  },

  async updateWord(langCode, deckId, wordId, baseWord, studyWord, pronunciation = '') {
    const baseLang = getI18nBaseLang();
    let finalBase = (baseWord || '').trim();
    let finalStudy = (studyWord || '').trim();
    let finalPron = (pronunciation || '').trim();

    if (!finalStudy && finalBase) {
      finalStudy = await clientAutoTranslate(finalBase, baseLang, langCode);
    } else if (!finalBase && finalStudy) {
      finalBase = await clientAutoTranslate(finalStudy, langCode, baseLang);
    }

    const store = getLocalStore();
    const words = store.words[langCode] || [];
    const target = words.find(w => w.wordId === wordId);
    const originalCreatedAt = target?.createdAt || new Date().toISOString();

    if (target) {
      target.baseWord = finalBase;
      target.studyWord = finalStudy;
      target.pronunciation = finalPron;
      target.createdAt = originalCreatedAt;
      target.updatedAt = new Date().toISOString();
      target._needsSync = true;
      store.words[langCode] = deduplicateWords(words);
      saveLocalStore(store);
    }

    if (shouldUseCloud() && CONFIG.API_ENDPOINTS.words) {
      try {
        const cloudRes = await fetchWithAuth(CONFIG.API_ENDPOINTS.words, {
          method: 'POST',
          body: JSON.stringify({
            action: 'update',
            wordId,
            langCode,
            deckId: target ? target.deckId : deckId,
            baseWord: finalBase,
            studyWord: finalStudy,
            pronunciation: finalPron,
            baseLang,
            createdAt: originalCreatedAt
          })
        });
        if (cloudRes.word && target) {
          delete target._needsSync;
          target.createdAt = originalCreatedAt;
          cloudRes.word.createdAt = originalCreatedAt;
          saveLocalStore(store);
          return cloudRes;
        }
      } catch (e) {
        console.warn('Word updated locally, will sync when online:', e);
      }
    }
    return { word: target };
  },

  async moveWord(langCode, wordId, fromDeckId, toDeckId) {
    const store = getLocalStore();
    const words = store.words[langCode] || [];
    const target = words.find(w => w.wordId === wordId);
    if (target) {
      target.deckId = toDeckId;
      target.updatedAt = new Date().toISOString();
      store.words[langCode] = deduplicateWords(words);
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
