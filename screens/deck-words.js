import { t, getI18nBaseLang, fetchLiveTranslation } from '../i18n.js';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Api } from '../api.js';
import { Modal } from '../components/modal.js';
import { trackEvent } from '../analytics.js';

export async function renderDeckWordsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedStudyLangName = getLocalizedLanguageName(langCode, currentBase);
  const localizedBaseLangName = getLocalizedLanguageName(currentBase, currentBase);

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

      // Dynamically translate base words to current base language if switched
      for (const w of words) {
        if (w.baseWord) {
          fetchLiveTranslation(w.baseWord, currentBase).then(trans => {
            if (trans && trans !== w.baseWord) {
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
          <div class="screen-lang-tag">
            <span>${langInfo.flag}</span>
            <span>${localizedStudyLangName}</span>
          </div>
          <h2 class="screen-title">${deckName}</h2>
        </div>
        <div class="screen-actions">
          ${words.length > 0 ? `
            <a href="#/languages/${langCode}/decks/${deckId}/study" class="btn btn-primary" id="study-deck-btn">
              ${t('studyDeck')}
            </a>
          ` : ''}
          <button class="btn btn-secondary" id="add-word-btn">
            + ${t('addWord')}
          </button>
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
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            ${words.length} ${words.length === 1 ? t('word') : t('words')}
          </span>
        </div>

        <div id="words-list">
          ${words.map((w, index) => {
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
                </div>

                <div class="word-actions">
                  <select class="move-select word-move-dropdown" data-word-id="${w.wordId}" title="${t('moveWord')}">
                    <option value="" disabled selected>${t('moveWord')}...</option>
                    ${allDecks.filter(d => d.deckId !== 'all' && d.deckId !== w.deckId).map(d => `
                      <option value="${d.deckId}">${getDeckDisplayName(d.deckId)}</option>
                    `).join('')}
                  </select>

                  <button class="tile-action-btn delete-hover delete-word-btn" 
                          data-word-id="${w.wordId}" 
                          data-deck-id="${w.deckId || 'practicing'}"
                          title="${t('delete')}">
                    🗑️
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${words.length === 0 ? `
          <div class="empty-state">
            <p>${t('noWordsYet')}</p>
          </div>
        ` : ''}
      </div>
    `;

    const addWordBtn = container.querySelector('#add-word-btn');
    if (addWordBtn) addWordBtn.addEventListener('click', openAddWordModal);

    const studyDeckBtn = container.querySelector('#study-deck-btn');
    if (studyDeckBtn) {
      studyDeckBtn.addEventListener('click', () => {
        trackEvent('study_deck_click', { langCode, deckId, wordCount: words.length });
      });
    }

    const sortDropdown = container.querySelector('#sort-dropdown');
    if (sortDropdown) {
      sortDropdown.addEventListener('change', async (e) => {
        currentSort = e.target.value;
        trackEvent('sort_words', { langCode, deckId, sort: currentSort });
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
          trackEvent('move_word', { langCode, fromDeckId: deckId, toDeckId });
          await loadData();
        } catch (err) {
          console.error('Failed to move word:', err);
        }
      });
    });

    container.querySelectorAll('.delete-word-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const wordId = btn.getAttribute('data-word-id');
        const targetDeck = btn.getAttribute('data-deck-id') || deckId;
        try {
          await Api.deleteWord(langCode, targetDeck, wordId);
          trackEvent('delete_word', { langCode, deckId: targetDeck, wordId });
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
            trackEvent('reorder_words', { langCode, deckId, count: words.length });
          } catch (err) {
            console.error('Failed to save word reorder:', err);
          }
        }
      });
    });
  }

  function getBaseExample() {
    const code = currentBase.toLowerCase().split('-')[0];
    if (code === 'ru') return 'например, Спасибо';
    if (code === 'es') return 'ej. Gracias';
    if (code === 'fr') return 'ex. Merci';
    if (code === 'de') return 'z.B. Danke';
    if (code === 'ja') return '例: ありがとう';
    if (code === 'zh') return '例如：谢谢';
    if (code === 'id') return 'misal: Terima kasih';
    return 'e.g. Thank you';
  }

  function getStudyExample() {
    const code = langCode.toLowerCase().split('-')[0];
    if (code === 'ja') return 'ありがとう\narigatou';
    if (code === 'ru') return 'Спасибо\nspasibo';
    if (code === 'zh') return '谢谢\nxièxie';
    if (code === 'ko') return '감사합니다\ngamsahamnida';
    if (code === 'ar') return 'شكرا\nshukran';
    if (code === 'ka') return 'მადლობა\nmadloba';
    if (code === 'es') return 'Gracias\ngrah-syahs';
    return 'e.g. Word in script\nTransliteration / romanization';
  }

  function openAddWordModal() {
    const baseExample = getBaseExample();
    const studyExample = getStudyExample();
    const targetDestinationDeck = deckId.toLowerCase() === 'all' ? 'practicing' : deckId;

    const contentHtml = `
      <div class="form-group">
        <label class="form-label">${t('wordInBase', { lang: localizedBaseLangName })}</label>
        <input type="text" class="form-input" id="new-base-word-input" placeholder="${baseExample}" autofocus />
      </div>

      <div class="form-group">
        <label class="form-label">${localizedStudyLangName} Translation</label>
        <textarea class="form-input" id="new-study-word-input" rows="2" placeholder="${studyExample}"></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">${t('pronunciationNotes')}</label>
        <textarea class="form-input" id="new-pronunciation-input" rows="2" placeholder="e.g. Tone, phonetic hints, or context notes"></textarea>
      </div>
    `;

    const overlay = Modal.open({
      title: t('addWord'),
      contentHtml,
      confirmText: t('save'),
      onConfirm: async (modalEl) => {
        const baseInput = modalEl.querySelector('#new-base-word-input');
        const studyInput = modalEl.querySelector('#new-study-word-input');
        const pronInput = modalEl.querySelector('#new-pronunciation-input');

        const baseWord = baseInput ? baseInput.value.trim() : '';
        const studyWord = studyInput ? studyInput.value.trim() : '';
        const pronunciation = pronInput ? pronInput.value.trim() : '';

        if (!baseWord && !studyWord) return false;

        try {
          await Api.addWord(langCode, targetDestinationDeck, baseWord, studyWord, pronunciation);
          trackEvent('add_word', { langCode, deckId: targetDestinationDeck, hasPronunciation: !!pronunciation });
          await loadData();
          return true;
        } catch (err) {
          console.error(err);
          return false;
        }
      }
    });

    const input = overlay.querySelector('#new-base-word-input');
    setTimeout(() => input && input.focus(), 50);
  }

  await loadData();
}
