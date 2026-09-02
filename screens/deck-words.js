import { t, getI18nBaseLang, fetchLiveTranslation } from '../i18n.js';
import { getLanguageByCode } from '../languages.js';
import { Api } from '../api.js';
import { Modal } from '../components/modal.js';

export async function renderDeckWordsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();

  let words = [];
  let allDecks = [];
  let currentSort = 'newest';

  async function loadData() {
    try {
      const [wordsRes, decksRes] = await Promise.all([
        Api.getWords(langCode, deckId, currentSort),
        Api.getDecks(langCode)
      ]);
      words = wordsRes.words || [];
      allDecks = decksRes.decks || [];

      // Ensure translations are displayed in current base language
      for (const w of words) {
        if (!w.baseWord || w.baseWord === w.studyWord) {
          fetchLiveTranslation(w.studyWord, currentBase).then(trans => {
            if (trans && trans !== w.studyWord) {
              w.baseWord = trans;
              const el = container.querySelector(`[data-word-base-id="${w.wordId}"]`);
              if (el) el.textContent = trans;
            }
          });
        }
      }

      render();
    } catch (err) {
      console.error('Failed to load words:', err);
    }
  }

  function getDeckDisplayName(dId) {
    if (dId === 'practicing') return t('practicing');
    if (dId === 'mastered') return t('mastered');
    if (dId === 'all') return t('all');
    const match = allDecks.find(d => d.deckId === dId);
    return match ? match.name : dId;
  }

  function render() {
    const isAllDeck = deckId.toLowerCase() === 'all';
    const deckName = getDeckDisplayName(deckId);

    container.innerHTML = `
      <div class="screen-header">
        <div class="screen-title-group">
          <h2 class="screen-title">
            <span>${langInfo.flag}</span>
            <span>${deckName} (${words.length})</span>
          </h2>
          <p class="screen-subtitle">
            ${isAllDeck ? t('allDeckNotice') : `${langInfo.name} vocabulary deck`}
          </p>
        </div>
        <div class="screen-actions">
          ${words.length > 0 ? `
            <a href="#/languages/${langCode}/decks/${deckId}/study" class="btn btn-primary" id="study-deck-btn">
              <span>🃏</span> <span>${t('studyDeck')}</span>
            </a>
          ` : ''}
          ${!isAllDeck ? `
            <button class="btn btn-secondary" id="add-word-btn">
              <span>+</span> <span>${t('addWord')}</span>
            </button>
          ` : ''}
        </div>
      </div>

      <div class="word-list-container">
        <div class="word-list-toolbar">
          <div class="sort-select-wrapper">
            <span>${t('sortBy')}:</span>
            <select class="sort-select" id="sort-dropdown">
              <option value="newest" ${currentSort === 'newest' ? 'selected' : ''}>${t('sortNewest')}</option>
              <option value="alpha" ${currentSort === 'alpha' ? 'selected' : ''}>${t('sortAlpha')}</option>
              <option value="custom" ${currentSort === 'custom' ? 'selected' : ''}>${t('sortCustom')}</option>
            </select>
          </div>
          <span style="font-size: 0.85rem; color: var(--text-muted);">
            ${words.length} ${words.length === 1 ? t('word') : t('words')}
          </span>
        </div>

        <div id="words-list">
          ${words.map((w, index) => {
            const dateStr = w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '';
            return `
              <div class="word-row ${currentSort === 'custom' ? 'draggable-row' : ''}" 
                   ${currentSort === 'custom' ? 'draggable="true"' : ''}
                   data-word-id="${w.wordId}" 
                   data-index="${index}">
                <div class="word-content">
                  <div class="word-study-row">
                    <span class="word-study">${w.studyWord}</span>
                    ${w.pronunciation ? `<span class="word-pronunciation">${w.pronunciation}</span>` : ''}
                  </div>
                  <div class="word-base" data-word-base-id="${w.wordId}">${w.baseWord || '...'}</div>
                  ${dateStr ? `<div class="word-date">${dateStr}</div>` : ''}
                </div>

                <div class="word-actions">
                  <select class="move-select word-move-dropdown" data-word-id="${w.wordId}" title="${t('moveWord')}">
                    <option value="" disabled selected>${t('moveWord')}...</option>
                    ${allDecks.filter(d => d.deckId !== 'all' && d.deckId !== w.deckId).map(d => `
                      <option value="${d.deckId}">${getDeckDisplayName(d.deckId)}</option>
                    `).join('')}
                  </select>

                  ${!isAllDeck ? `
                    <button class="tile-action-btn delete-hover delete-word-btn" 
                            data-word-id="${w.wordId}" 
                            title="${t('delete')}">
                      🗑️
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${words.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <p>${t('noWordsYet')}</p>
          </div>
        ` : ''}
      </div>
    `;

    const addWordBtn = container.querySelector('#add-word-btn');
    if (addWordBtn) addWordBtn.addEventListener('click', openAddWordModal);

    const sortDropdown = container.querySelector('#sort-dropdown');
    if (sortDropdown) {
      sortDropdown.addEventListener('change', async (e) => {
        currentSort = e.target.value;
        await loadData();
      });
    }

    container.querySelectorAll('.word-move-dropdown').forEach(select => {
      select.addEventListener('change', async (e) => {
        const wordId = select.getAttribute('data-word-id');
        const toDeckId = e.target.value;
        if (!toDeckId) return;

        try {
          await Api.moveWord(langCode, wordId, deckId, toDeckId);
          await loadData();
        } catch (err) {
          console.error('Failed to move word:', err);
        }
      });
    });

    container.querySelectorAll('.delete-word-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const wordId = btn.getAttribute('data-word-id');
        try {
          await Api.deleteWord(langCode, deckId, wordId);
          await loadData();
        } catch (err) {
          console.error('Failed to delete word:', err);
        }
      });
    });

    if (currentSort === 'custom' && !isAllDeck) {
      setupWordDragAndDrop();
    }
  }

  function setupWordDragAndDrop() {
    const listEl = container.querySelector('#words-list');
    if (!listEl) return;

    let draggedRow = null;

    listEl.querySelectorAll('.draggable-row').forEach(row => {
      row.addEventListener('dragstart', (e) => {
        draggedRow = row;
        row.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', row.getAttribute('data-word-id'));
      });

      row.addEventListener('dragend', () => {
        if (draggedRow) draggedRow.classList.remove('is-dragging');
        listEl.querySelectorAll('.draggable-row').forEach(r => r.classList.remove('drag-over'));
        draggedRow = null;
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedRow && draggedRow !== row) {
          row.classList.add('drag-over');
        }
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', async (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        if (!draggedRow || draggedRow === row) return;

        const srcId = draggedRow.getAttribute('data-word-id');
        const targetId = row.getAttribute('data-word-id');

        const fromIdx = words.findIndex(w => w.wordId === srcId);
        const toIdx = words.findIndex(w => w.wordId === targetId);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = words.splice(fromIdx, 1);
          words.splice(toIdx, 0, moved);

          const orderList = words.map((w, idx) => ({ wordId: w.wordId, order: idx }));
          render();

          try {
            await Api.reorderWords(langCode, deckId, orderList);
          } catch (err) {
            console.error('Failed to save word reorder:', err);
          }
        }
      });
    });
  }

  function openAddWordModal() {
    const contentHtml = `
      <div class="form-group">
        <label class="form-label">${t('studyWord')} (${langInfo.name})</label>
        <input type="text" class="form-input" id="new-study-word-input" placeholder="e.g. ありがとう or Gamarjoba" autofocus />
      </div>
      <div class="form-group">
        <label class="form-label">${t('pronunciationNotes')}</label>
        <input type="text" class="form-input" id="new-pronunciation-input" placeholder="${t('pronunciationPlaceholder')}" />
        <span class="form-hint">✨ ${t('translationAuto')}</span>
      </div>
    `;

    const overlay = Modal.open({
      title: t('addWord'),
      contentHtml,
      confirmText: t('save'),
      onConfirm: async (modalEl) => {
        const studyInput = modalEl.querySelector('#new-study-word-input');
        const pronInput = modalEl.querySelector('#new-pronunciation-input');
        const studyWord = studyInput ? studyInput.value.trim() : '';
        const pronunciation = pronInput ? pronInput.value.trim() : '';

        if (!studyWord) return false;

        try {
          await Api.addWord(langCode, deckId, studyWord, pronunciation);
          await loadData();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      }
    });

    const input = overlay.querySelector('#new-study-word-input');
    setTimeout(() => input && input.focus(), 50);
  }

  await loadData();
}
