import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Api, getLocalStore } from '../api.js';
import { Modal } from '../components/modal.js';
import { trackEvent } from '../analytics.js';
import { navigate } from '../app.js';

export function renderDecksScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedLangName = getLocalizedLanguageName(langCode, currentBase);
  const isStillMounted = () => window.location.hash.startsWith(`#/languages/${langCode}/decks`);

  let showHidden = false;

  // Instant optimistic render from local cache
  const store = getLocalStore();
  let decks = store.decks[langCode] || [
    { deckId: 'practicing', name: 'Practicing', langCode, order: 0, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'mastered', name: 'Mastered', langCode, order: 1, hidden: false, isDefault: true, createdAt: new Date().toISOString() },
    { deckId: 'all', name: 'All', langCode, order: 2, hidden: false, isDefault: true, createdAt: new Date().toISOString() }
  ];

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

  // Background async refresh from DynamoDB
  async function refreshBackground() {
    if (!isStillMounted()) return;
    try {
      const res = await Api.getDecks(langCode);
      if (res.decks) {
        decks = res.decks;
        render();
      }
    } catch (err) {
      console.warn('Background deck refresh:', err);
    }
  }
  refreshBackground();

  function getDeckDisplayName(deck) {
    if (deck.deckId === 'practicing') return t('practicing');
    if (deck.deckId === 'mastered') return t('mastered');
    if (deck.deckId === 'all') return t('all');
    return deck.name;
  }

  function getDeckEmoji(deck) {
    if (deck.deckId === 'practicing') return '🌱';
    if (deck.deckId === 'mastered') return '✨';
    if (deck.deckId === 'all') return '📚';
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
          const isDefault = ['practicing', 'mastered', 'all'].includes(deck.deckId.toLowerCase());
          const displayName = getDeckDisplayName(deck);
          const emoji = getDeckEmoji(deck);

          return `
            <div class="tile ${deck.hidden ? 'is-hidden-item' : ''}" 
                 draggable="true" 
                 data-deck-id="${deck.deckId}" 
                 data-index="${index}">
              <div class="tile-top">
                <span class="tile-flag">${emoji}</span>
                <div class="tile-actions">
                  <span class="tile-badge">${deck.wordCount ?? 0} ${t('words')}</span>
                  <button class="tile-action-btn hide-toggle-btn" 
                          data-deck-id="${deck.deckId}" 
                          data-hidden="${deck.hidden ? 'true' : 'false'}" 
                          title="${deck.hidden ? t('unhide') : t('hide')}"
                          onclick="event.stopPropagation();">
                    ${deck.hidden ? `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
  ` : `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
  `}
                  </button>
                  ${!isDefault ? `
                    <button class="tile-action-btn delete-hover delete-deck-btn" 
                            data-deck-id="${deck.deckId}" 
                            data-name="${deck.name}"
                            title="${t('deleteDeck')}"
                            onclick="event.stopPropagation();">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  ` : ''}
                </div>
              </div>
              <div class="tile-bottom">
                <div class="tile-title">${displayName}</div>
                <div class="tile-subtitle">${isDefault ? '' : 'Custom'}</div>
              </div>
              <div class="tile-drag-handle" title="Drag to reorder">⋮⋮</div>
            </div>
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

    container.querySelectorAll('.tile[data-deck-id]').forEach(tile => {
      tile.addEventListener('click', () => {
        const deckId = tile.getAttribute('data-deck-id');
        trackEvent('select_deck', { langCode, deckId });
        navigate(`#/languages/${langCode}/decks/${deckId}`);
      });
    });

    container.querySelectorAll('.hide-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
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

    container.querySelectorAll('.delete-deck-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.getAttribute('data-deck-id');
        const name = btn.getAttribute('data-name');

        Modal.confirmDeleteDeck({
          deckName: name,
          onConfirm: async () => {
            try {
              await Api.deleteDeck(langCode, deckId);
              trackEvent('delete_deck', { langCode, deckId });
              refreshBackground();
            } catch (err) {
              console.error('Failed to delete deck:', err);
            }
          }
        });
      });
    });

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const grid = container.querySelector('#decks-grid');
    if (!grid) return;

    let draggedTile = null;

    grid.querySelectorAll('.tile[data-deck-id]').forEach(tile => {
      tile.addEventListener('dragstart', (e) => {
        draggedTile = tile;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tile.getAttribute('data-deck-id'));
      });

      tile.addEventListener('dragend', () => {
        if (draggedTile) draggedTile.classList.remove('is-dragging');
        grid.querySelectorAll('.tile').forEach(t => t.classList.remove('drag-over'));
        draggedTile = null;
      });

      tile.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedTile && draggedTile !== tile) {
          tile.classList.add('drag-over');
        }
      });

      tile.addEventListener('dragleave', () => {
        tile.classList.remove('drag-over');
      });

      tile.addEventListener('drop', async (e) => {
        e.preventDefault();
        tile.classList.remove('drag-over');
        if (!draggedTile || draggedTile === tile) return;

        const srcId = draggedTile.getAttribute('data-deck-id');
        const targetId = tile.getAttribute('data-deck-id');

        const fromIdx = decks.findIndex(d => d.deckId === srcId);
        const toIdx = decks.findIndex(d => d.deckId === targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = decks.splice(fromIdx, 1);
          decks.splice(toIdx, 0, moved);

          const orderList = decks.map((d, idx) => ({ deckId: d.deckId, order: idx }));
          render();

          try {
            await Api.reorderDecks(langCode, orderList);
            trackEvent('reorder_decks', { langCode, count: decks.length });
          } catch (err) {
            console.error('Failed to save deck reorder:', err);
          }
        }
      });
    });
  }

  function openAddDeckModal() {
    const contentHtml = `
      <div class="form-group">
        <label class="form-label" data-i18n="deckName">${t('deckName')}</label>
        <input type="text" class="form-input" id="new-deck-name-input" placeholder="e.g. Travel, Food, Expressions..." autofocus />
      </div>
    `;

    const overlay = Modal.open({
      title: t('addDeck'),
      contentHtml,
      confirmText: t('createDeck'),
      onConfirm: async (modalEl) => {
        const input = modalEl.querySelector('#new-deck-name-input');
        const name = input ? input.value.trim() : '';
        if (!name) return false;
        try {
          await Api.addDeck(langCode, name);
          trackEvent('add_deck', { langCode, name });
          refreshBackground();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      }
    });

    const input = overlay.querySelector('#new-deck-name-input');
    setTimeout(() => input && input.focus(), 50);
  }
}
