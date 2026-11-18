import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js?v=20261118_add_adjectives_deck';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js?v=20261116_standardize_khmer_font';
import { Api, getLocalStore } from '../api.js?v=20261118_add_adjectives_deck';
import { Modal } from '../components/modal.js?v=20261116_standardize_khmer_font';
import { trackEvent } from '../analytics.js?v=20261118_ga_human_and_return_tracking';
import { navigate } from '../app.js?v=20261118_fix_mobile_tile_clicks';
import { setupDraggableList } from '../components/drag-controller.js?v=20261118_fix_mobile_tile_clicks';

export function renderDecksScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedLangName = getLocalizedLanguageName(langCode, currentBase);
  const isStillMounted = () => window.location.hash.startsWith(`#/languages/${langCode}/decks`);

  const scriptKeyboardLink = langCode === 'ja'
    ? { url: '/scripts/japanese/hiragana', icon: 'あ', label: 'Hiragana Keyboard' }
    : langCode === 'km'
    ? { url: '/scripts/khmer', icon: 'ក', label: 'Khmer Keyboard' }
    : null;

  let showHidden = false;

  // Instant optimistic render from local cache
  const store = getLocalStore();
  let rawDecks = store.decks[langCode] || [
    { deckId: 'inbox', name: 'Inbox', icon: '📥', langCode, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'emotions', name: 'Emotions', icon: '❤️', langCode, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'verbs', name: 'Verbs', icon: '🏃🏽‍♀️', langCode, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'adjectives', name: 'Adjectives', icon: '🔥', langCode, order: 3, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'nouns', name: 'Nouns', icon: '👘', langCode, order: 4, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'colors', name: 'Colors', icon: '🌈', langCode, order: 5, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'fruits', name: 'Fruits', icon: '🍏', langCode, order: 6, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'numbers', name: 'Numbers', icon: '🔢', langCode, order: 7, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'all', name: 'All', icon: '📚', langCode, order: 8, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
  ];
  let decks = rawDecks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const words = store.words[langCode] || [];
  const counts = {};
  for (const w of words) {
    counts[w.deckId] = (counts[w.deckId] || 0) + 1;
  }
  decks = decks.map(d => ({
    ...d,
    wordCount: d.deckId === 'all' ? words.length : (counts[d.deckId] || 0)
  }));

  // Render immediately (0ms!)
  render();

  Api.syncLocalToCloud().catch(() => {});

  // Background async refresh from DynamoDB
  async function refreshBackground() {
    if (!isStillMounted()) return;
    try {
      const oldDataStr = JSON.stringify(decks.map(d => ({ id: d.deckId, order: d.order, name: d.name, icon: d.icon, count: d.wordCount, hidden: d.hidden })));

      const [decksRes, wordsRes] = await Promise.all([
        Api.getDecks(langCode),
        Api.getWords(langCode, 'all')
      ]);
      if (!isStillMounted()) return;

      const latestWords = wordsRes.words || [];
      const counts = {};
      for (const w of latestWords) {
        counts[w.deckId] = (counts[w.deckId] || 0) + 1;
      }

      const fetchedDecks = decksRes.decks || decks;
      const newDecks = fetchedDecks.map(d => ({
        ...d,
        wordCount: d.deckId === 'all' ? latestWords.length : (counts[d.deckId] || 0)
      })).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      const newDataStr = JSON.stringify(newDecks.map(d => ({ id: d.deckId, order: d.order, name: d.name, icon: d.icon, count: d.wordCount, hidden: d.hidden })));
      decks = newDecks;

      if (oldDataStr !== newDataStr) {
        render();
      }
    } catch (err) {
      console.warn('Background deck refresh:', err);
    }
  }
  refreshBackground();

  function getDeckDisplayName(deck) {
    if (!deck) return '';
    const dId = deck.deckId || '';
    const dName = deck.name || '';

    if (dId === 'all') return t('all');
    if (dId === 'inbox') {
      if (!dName || dName === 'Inbox' || dName === 'inbox') return t('inbox') || 'Inbox';
      return dName;
    }
    if (dId === 'emotions') {
      if (!dName || dName === 'Emotions' || dName === 'emotions') return t('emotions') || 'Emotions';
      return dName;
    }
    if (dId === 'verbs') {
      if (!dName || dName === 'Verbs' || dName === 'verbs') return t('verbs') || 'Verbs';
      return dName;
    }
    if (dId === 'adjectives') {
      if (!dName || dName === 'Adjectives' || dName === 'adjectives') return t('adjectives') || 'Adjectives';
      return dName;
    }
    if (dId === 'nouns') {
      if (!dName || dName === 'Nouns' || dName === 'nouns') return t('nouns') || 'Nouns';
      return dName;
    }
    if (dId === 'colors' || dId === 'colours') {
      if (!dName || dName === 'Colors' || dName === 'Colours' || dName === 'colors' || dName === 'colours') return t('colors') || t('colours') || 'Colors';
      return dName;
    }
    if (dId === 'fruits') {
      if (!dName || dName === 'Fruits' || dName === 'fruits') return t('fruits') || 'Fruits';
      return dName;
    }
    if (dId === 'numbers') {
      if (!dName || dName === 'Numbers' || dName === 'numbers') return t('numbers') || 'Numbers';
      return dName;
    }
    if (dId === 'nouns_practice') {
      if (!dName || dName === 'Nouns practice' || dName === 'Nouns (practice)' || dName === 'nouns_practice') return t('nounsPractice') || 'Nouns (practice)';
      return dName;
    }
    if (dId === 'nouns_mastered') {
      if (!dName || dName === 'Nouns mastered' || dName === 'Nouns (mastered)' || dName === 'nouns_mastered') return t('nounsMastered') || 'Nouns (mastered)';
      return dName;
    }
    if (dId === 'practicing') {
      if (!dName || dName === 'Practicing') return t('practicing');
      return dName;
    }
    if (dId === 'mastered') {
      if (!dName || dName === 'Mastered') return t('mastered');
      return dName;
    }
    return dName;
  }

  function getDeckEmoji(deck) {
    if (deck.icon) return deck.icon;
    if (deck.deckId === 'inbox') return '📥';
    if (deck.deckId === 'emotions') return '❤️';
    if (deck.deckId === 'verbs') return '🏃🏽‍♀️';
    if (deck.deckId === 'adjectives') return '🔥';
    if (deck.deckId === 'nouns') return '👘';
    if (deck.deckId === 'colors' || deck.deckId === 'colours') return '🌈';
    if (deck.deckId === 'fruits') return '🍏';
    if (deck.deckId === 'numbers') return '🔢';
    if (deck.deckId === 'all') return '📚';
    if (deck.deckId === 'nouns_practice') return '🪑';
    if (deck.deckId === 'nouns_mastered') return '🏠';
    if (deck.deckId === 'practicing') return '🌱';
    if (deck.deckId === 'mastered') return '✨';
    return '📁';
  }

  function render() {
    if (!isStillMounted()) return;

    const visibleDecks = showHidden ? decks : decks.filter(d => !d.hidden);
    const hasHidden = decks.some(d => d.hidden);

    container.innerHTML = `
      <div class="screen-header">
        <div class="screen-title-group">
          <div class="screen-lang-tag">
            <span>${langInfo.flag}</span>
            <span>${localizedLangName}</span>
          </div>
          <h2 class="screen-title" data-i18n="decks">${t('decks')}</h2>
        </div>
        <div class="screen-actions">
          ${scriptKeyboardLink ? `
            <a href="${scriptKeyboardLink.url}" class="btn btn-secondary" id="open-script-kb-btn" title="${scriptKeyboardLink.label}" style="text-decoration: none;">
              <span>${scriptKeyboardLink.icon}</span>
              <span>${scriptKeyboardLink.label}</span>
            </a>
          ` : ''}
          ${hasHidden ? `
            <button class="btn btn-secondary btn-sm" id="toggle-hidden-btn">
              ${showHidden ? `👁️ ${t('hideHidden')}` : `👁️ ${t('showHidden')}`}
            </button>
          ` : ''}
          <button class="btn btn-primary" id="add-deck-btn">
            + <span data-i18n="addDeck">${t('addDeck')}</span>
          </button>
        </div>
      </div>

      <div class="tiles-grid" id="decks-grid">
        ${visibleDecks.map((deck, index) => {
          const isAll = deck.deckId.toLowerCase() === 'all';
          const displayName = getDeckDisplayName(deck);
          const emoji = getDeckEmoji(deck);

          return `
            <a href="#/languages/${langCode}/decks/${deck.deckId}" 
               class="tile ${deck.hidden ? 'is-hidden-item' : ''}" 
               data-deck-id="${deck.deckId}" 
               data-index="${index}"
               role="button"
               tabindex="0">
              <div class="tile-top">
                <span class="tile-flag">${emoji}</span>
                <div class="tile-actions">
                  <span class="tile-badge">${deck.wordCount ?? 0} ${t('words')}</span>
                  <button class="tile-action-btn hide-toggle-btn ${deck.hidden ? 'is-unhide-active' : ''}" 
                          data-deck-id="${deck.deckId}" 
                          data-hidden="${deck.hidden ? 'true' : 'false'}" 
                          title="${deck.hidden ? t('unhide') : t('hide')}"
                          onclick="event.preventDefault(); event.stopPropagation();">
                    ${deck.hidden ? `
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      <span class="unhide-btn-text" data-i18n="unhide">${t('unhide') || 'Unhide'}</span>
                    ` : `
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    `}
                  </button>
                  ${!isAll ? `
                    <button class="tile-action-btn edit-deck-btn" 
                            data-deck-id="${deck.deckId}" 
                            title="${t('editDeck') || 'Edit Deck'}"
                            onclick="event.preventDefault(); event.stopPropagation();">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="tile-bottom">
                <div class="tile-title">${displayName}</div>
              </div>
              <div class="tile-drag-handle" title="Drag to reorder" onclick="event.preventDefault(); event.stopPropagation();">⋮⋮</div>
            </a>
          `;
        }).join('')}

        <div class="tile-add" id="tile-add-deck-card">
          <span class="tile-add-icon">+</span>
          <span class="tile-add-text" data-i18n="addDeck">${t('addDeck')}</span>
        </div>
      </div>
    `;

    autoTranslateUi(container);

    // Event Bindings
    const addBtn = container.querySelector('#add-deck-btn');
    const addCard = container.querySelector('#tile-add-deck-card');
    if (addBtn) addBtn.addEventListener('click', openAddDeckModal);
    if (addCard) addCard.addEventListener('click', openAddDeckModal);

    const toggleHiddenBtn = container.querySelector('#toggle-hidden-btn');
    if (toggleHiddenBtn) {
      toggleHiddenBtn.addEventListener('click', () => {
        showHidden = !showHidden;
        trackEvent('toggle_hidden_decks', { langCode, showHidden });
        render();
      });
    }

    container.querySelectorAll('.hide-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const deckId = btn.getAttribute('data-deck-id');
        const isCurrentlyHidden = btn.getAttribute('data-hidden') === 'true';
        try {
          await Api.toggleHideDeck(langCode, deckId, !isCurrentlyHidden);
          trackEvent(isCurrentlyHidden ? 'unhide_deck' : 'hide_deck', { langCode, deckId });
          refreshBackground();
        } catch (err) {
          console.error(err);
        }
      });
    });

    container.querySelectorAll('.edit-deck-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const deckId = btn.getAttribute('data-deck-id');
        const deck = decks.find(d => d.deckId === deckId);
        if (deck) {
          openEditDeckModal(deck);
        }
      });
    });

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const grid = container.querySelector('#decks-grid');
    if (!grid) return;

    setupDraggableList({
      container: grid,
      itemSelector: '.tile[data-deck-id]',
      handleSelector: '.tile-drag-handle',
      getItemKey: (el) => el.getAttribute('data-deck-id'),
      onReorder: async (fromIdx, toIdx) => {
        const visibleDecks = showHidden ? decks : decks.filter(d => !d.hidden);
        const [moved] = visibleDecks.splice(fromIdx, 1);
        visibleDecks.splice(toIdx, 0, moved);

        const orderMap = new Map();
        visibleDecks.forEach((d, idx) => orderMap.set(d.deckId, idx));
        decks.sort((a, b) => {
          const ordA = orderMap.has(a.deckId) ? orderMap.get(a.deckId) : (a.order ?? 0);
          const ordB = orderMap.has(b.deckId) ? orderMap.get(b.deckId) : (b.order ?? 0);
          return ordA - ordB;
        });

        const orderList = decks.map((d, idx) => {
          d.order = idx;
          return { deckId: d.deckId, order: idx, name: d.name, icon: d.icon };
        });

        render();

        try {
          await Api.reorderDecks(langCode, orderList);
          trackEvent('reorder_decks', { langCode, count: decks.length });
        } catch (err) {
          console.error('Failed to save deck reorder:', err);
        }
      }
    });

    grid.querySelectorAll('.tile[data-deck-id]').forEach(tile => {
      tile.addEventListener('click', (e) => {
        if (e.target.closest('.tile-action-btn') || e.target.closest('.tile-drag-handle')) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        e.preventDefault();
        const deckId = tile.getAttribute('data-deck-id');
        trackEvent('select_deck', { langCode, deckId });
        navigate(`#/languages/${langCode}/decks/${deckId}`);
      });

      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.target.closest('.tile-actions') || e.target.closest('.tile-drag-handle')) return;
          const deckId = tile.getAttribute('data-deck-id');
          navigate(`#/languages/${langCode}/decks/${deckId}`);
        }
      });
    });
  }

  function openAddDeckModal() {
    const popularIcons = ['📁', '✈️', '🍜', '💼', '🗣️', '🏠', '🎨', '🎵', '🏃', '💡', '🛒', '❤️', '🩺', '💻', '🚗', '🌤️', '🐾', '🔢', '🎯', '🌿', '🔥', '📚', '☕', '🎬'];
    let selectedIcon = '📁';

    const contentHtml = `
      <div class="form-group">
        <label class="form-label" data-i18n="deckName">${t('deckName')}</label>
        <input type="text" class="form-input" id="new-deck-name-input" placeholder="e.g. Travel, Food, Expressions..." autofocus autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" />
      </div>

      <div class="form-group">
        <label class="form-label">Icon</label>
        <div class="icon-selector-grid" id="deck-icon-grid">
          ${popularIcons.map((icon, idx) => `
            <button type="button" class="icon-picker-btn ${idx === 0 ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
          `).join('')}
        </div>
        <div style="margin-top: 0.65rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Custom emoji:</span>
          <input type="text" class="form-input" id="custom-deck-icon-input" maxlength="4" style="width: 70px; text-align: center; font-size: 1.1rem; padding: 0.35rem;" placeholder="📁" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" />
        </div>
      </div>
    `;

    const overlay = Modal.open({
      title: t('addDeck'),
      contentHtml,
      confirmText: t('createDeck'),
      onConfirm: async (modalEl) => {
        const input = modalEl.querySelector('#new-deck-name-input');
        const customIconInput = modalEl.querySelector('#custom-deck-icon-input');
        const name = input ? input.value.trim() : '';
        const customIcon = customIconInput ? customIconInput.value.trim() : '';
        const finalIcon = customIcon || selectedIcon || '📁';

        if (!name) return false;
        try {
          await Api.addDeck(langCode, name, finalIcon);
          trackEvent('add_deck', { langCode, name, icon: finalIcon });
          refreshBackground();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      }
    });

    const grid = overlay.querySelector('#deck-icon-grid');
    const customIconInput = overlay.querySelector('#custom-deck-icon-input');

    if (grid) {
      grid.querySelectorAll('.icon-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedIcon = btn.getAttribute('data-icon');
          if (customIconInput) customIconInput.value = '';
        });
      });
    }

    if (customIconInput) {
      customIconInput.addEventListener('input', () => {
        if (customIconInput.value.trim()) {
          grid?.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('selected'));
        }
      });
    }

    const input = overlay.querySelector('#new-deck-name-input');
    setTimeout(() => input && input.focus(), 50);
  }

  function openEditDeckModal(deck) {
    const popularIcons = ['📁', '🌱', '✨', '✈️', '🍜', '💼', '🗣️', '🏠', '🎨', '🎵', '🏃', '💡', '🛒', '❤️', '🩺', '💻', '🚗', '🌤️', '🐾', '🔢', '🎯', '🌿', '🔥', '📚', '☕', '🎬'];
    let currentEmoji = getDeckEmoji(deck);
    let selectedIcon = currentEmoji;
    const currentName = deck.name || getDeckDisplayName(deck);

    const contentHtml = `
      <div class="form-group">
        <label class="form-label" data-i18n="deckName">${t('deckName')}</label>
        <input type="text" class="form-input" id="edit-deck-name-input" value="${currentName.replace(/"/g, '&quot;')}" placeholder="Deck Name" autofocus autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" />
      </div>

      <div class="form-group">
        <label class="form-label">Icon</label>
        <div class="icon-selector-grid" id="edit-deck-icon-grid">
          ${popularIcons.map((icon) => `
            <button type="button" class="icon-picker-btn ${icon === selectedIcon ? 'selected' : ''}" data-icon="${icon}">${icon}</button>
          `).join('')}
        </div>
        <div style="margin-top: 0.65rem; display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Custom emoji:</span>
          <input type="text" class="form-input" id="edit-custom-deck-icon-input" maxlength="4" style="width: 70px; text-align: center; font-size: 1.1rem; padding: 0.35rem;" value="${popularIcons.includes(selectedIcon) ? '' : selectedIcon}" placeholder="📁" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" />
        </div>
      </div>

      <div style="margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid var(--border-color);">
        <button type="button" class="btn-outline-danger" id="edit-modal-delete-btn" style="width: 100%;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          <span data-i18n="deleteDeck">${t('deleteDeck') || 'Delete Deck'}</span>
        </button>
      </div>
    `;

    const overlay = Modal.open({
      title: t('editDeck') || 'Edit Deck',
      contentHtml,
      confirmText: t('save') || 'Save',
      onConfirm: async (modalEl) => {
        const input = modalEl.querySelector('#edit-deck-name-input');
        const customIconInput = modalEl.querySelector('#edit-custom-deck-icon-input');
        const name = input ? input.value.trim() : '';
        const customIcon = customIconInput ? customIconInput.value.trim() : '';
        const finalIcon = customIcon || selectedIcon || '📁';

        if (!name) return false;
        try {
          const target = decks.find(d => d.deckId === deck.deckId);
          if (target) {
            target.name = name;
            target.icon = finalIcon;
          }
          render();

          await Api.updateDeck(langCode, deck.deckId, name, finalIcon);
          trackEvent('edit_deck', { langCode, deckId: deck.deckId, name, icon: finalIcon });
          refreshBackground();
          return true;
        } catch (err) {
          console.error('Failed to update deck:', err);
          return false;
        }
      }
    });

    const deleteBtn = overlay.querySelector('#edit-modal-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        Modal.close();
        Modal.confirmDeleteDeck({
          deckName: currentName,
          onConfirm: async () => {
            try {
              decks = decks.filter(d => d.deckId !== deck.deckId);
              render();
              await Api.deleteDeck(langCode, deck.deckId);
              trackEvent('delete_deck', { langCode, deckId: deck.deckId });
              refreshBackground();
            } catch (err) {
              console.error('Failed to delete deck:', err);
            }
          }
        });
      });
    }

    const grid = overlay.querySelector('#edit-deck-icon-grid');
    const customIconInput = overlay.querySelector('#edit-custom-deck-icon-input');

    if (grid) {
      grid.querySelectorAll('.icon-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedIcon = btn.getAttribute('data-icon');
          if (customIconInput) customIconInput.value = '';
        });
      });
    }

    if (customIconInput) {
      customIconInput.addEventListener('input', () => {
        if (customIconInput.value.trim()) {
          grid?.querySelectorAll('.icon-picker-btn').forEach(b => b.classList.remove('selected'));
          selectedIcon = customIconInput.value.trim();
        }
      });
    }

    const input = overlay.querySelector('#edit-deck-name-input');
    setTimeout(() => {
      if (input) {
        input.focus();
        input.select();
      }
    }, 50);
  }
}
