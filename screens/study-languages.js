import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js';
import { LANGUAGES, getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Api, getLocalStore } from '../api.js';
import { Modal } from '../components/modal.js';
import { trackEvent } from '../analytics.js';
import { navigate } from '../app.js';

export function renderStudyLanguagesScreen(container) {
  let showHidden = false;
  const currentBase = getI18nBaseLang();
  const isStillMounted = () => window.location.hash === '#/languages' || window.location.hash === '#/languages/';

  // Instant optimistic load from local storage
  const store = getLocalStore();
  let languages = store.languages || [];
  let vocabCounts = {};
  for (const l of languages) {
    vocabCounts[l.code] = (store.words[l.code] || []).length;
  }

  // Render on frame 0 (0ms latency!)
  render();

  // Background async refresh from DynamoDB
  async function refreshBackground() {
    try {
      const oldDataStr = JSON.stringify(languages.map(l => ({ code: l.code, count: vocabCounts[l.code] || 0, hidden: l.hidden })));
      
      const res = await Api.getLanguages();
      if (!isStillMounted()) return;
      if (res.languages) {
        const newCounts = {};
        const countPromises = res.languages.map(async (l) => {
          try {
            const wordsRes = await Api.getWords(l.code, 'all');
            newCounts[l.code] = (wordsRes.words || []).length;
          } catch (e) {
            newCounts[l.code] = (store.words[l.code] || []).length;
          }
        });
        await Promise.all(countPromises);
        if (!isStillMounted()) return;

        const newDataStr = JSON.stringify(res.languages.map(l => ({ code: l.code, count: newCounts[l.code] || 0, hidden: l.hidden })));
        
        vocabCounts = newCounts;
        languages = res.languages;

        // If counts or languages changed, immediately update UI
        if (oldDataStr !== newDataStr) {
          render();
        }
      }
    } catch (err) {
      console.warn('Background language refresh:', err);
    }
  }
  refreshBackground();

  function render() {
    if (!isStillMounted()) return;

    const visibleLanguages = showHidden ? languages : languages.filter(l => !l.hidden);
    const hasHidden = languages.some(l => l.hidden);

    container.innerHTML = `
      <div class="screen-header">
        <div class="screen-title-group">
          <h2 class="screen-title">
            <span data-i18n="studyLanguages">${t('studyLanguages')}</span>
          </h2>
        </div>
        <div class="screen-actions">
          ${hasHidden ? `
            <button class="btn btn-secondary btn-sm" id="toggle-hidden-btn">
              ${showHidden ? `👁️ ${t('hideHidden')}` : `👁️ ${t('showHidden')}`}
            </button>
          ` : ''}
          <button class="btn btn-primary" id="add-lang-btn">
            + <span data-i18n="addLanguage">${t('addLanguage')}</span>
          </button>
        </div>
      </div>

      <div class="tiles-grid" id="languages-grid">
        ${visibleLanguages.map((lang, index) => {
          const langInfo = getLanguageByCode(lang.code) || lang;
          const localizedTitle = getLocalizedLanguageName(lang.code, currentBase);
          const totalWords = vocabCounts[lang.code] || 0;

          return `
            <a href="#/languages/${lang.code}/decks" 
               class="tile ${lang.hidden ? 'is-hidden-item' : ''}" 
               data-code="${lang.code}" 
               data-index="${index}">
              <div class="tile-top">
                <span class="tile-flag">${langInfo.flag || lang.flag || '🌐'}</span>
                <div class="tile-actions" onclick="event.stopPropagation();">
                  <span class="tile-badge">${totalWords} ${totalWords === 1 ? t('word') : t('words')}</span>
                  <button class="tile-action-btn hide-toggle-btn" 
                          data-code="${lang.code}" 
                          data-hidden="${lang.hidden ? 'true' : 'false'}" 
                          title="${lang.hidden ? t('unhide') : t('hide')}"
                          onclick="event.preventDefault(); event.stopPropagation();">
                    ${lang.hidden ? `
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    ` : `
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    `}
                  </button>
                </div>
              </div>
              <div class="tile-bottom">
                <div class="tile-title">${localizedTitle}</div>
                <div class="tile-subtitle">${langInfo.nativeName || lang.code.toUpperCase()}</div>
              </div>
              <div class="tile-drag-handle" draggable="true" title="Drag to reorder" onclick="event.preventDefault(); event.stopPropagation();">⋮⋮</div>
            </a>
          `;
        }).join('')}

        <div class="tile-add" id="tile-add-card">
          <span class="tile-add-icon">+</span>
          <span class="tile-add-text" data-i18n="addLanguage">${t('addLanguage')}</span>
        </div>
      </div>

      ${languages.length === 0 ? `
        <div class="empty-state">
          <p data-i18n="noLanguagesYet">${t('noLanguagesYet')}</p>
        </div>
      ` : ''}
    `;

    autoTranslateUi(container);

    // Event Bindings
    const addBtn = container.querySelector('#add-lang-btn');
    const addCard = container.querySelector('#tile-add-card');
    if (addBtn) addBtn.addEventListener('click', openAddLanguageModal);
    if (addCard) addCard.addEventListener('click', openAddLanguageModal);

    const toggleHiddenBtn = container.querySelector('#toggle-hidden-btn');
    if (toggleHiddenBtn) {
      toggleHiddenBtn.addEventListener('click', () => {
        showHidden = !showHidden;
        trackEvent('toggle_hidden_languages', { showHidden });
        render();
      });
    }

    container.querySelectorAll('.tile[data-code]').forEach(tile => {
      tile.addEventListener('click', (e) => {
        if (e.target.closest('.tile-actions') || e.target.closest('.tile-drag-handle')) return;
        const code = tile.getAttribute('data-code');
        trackEvent('select_study_language', { langCode: code });
      });
    });

    container.querySelectorAll('.hide-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        const isCurrentlyHidden = btn.getAttribute('data-hidden') === 'true';
        try {
          await Api.toggleHideLanguage(code, !isCurrentlyHidden);
          trackEvent(isCurrentlyHidden ? 'unhide_language' : 'hide_language', { langCode: code });
          refreshBackground();
        } catch (err) {
          console.error(err);
        }
      });
    });

    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const grid = container.querySelector('#languages-grid');
    if (!grid) return;

    let draggedTile = null;

    grid.querySelectorAll('.tile-drag-handle').forEach(handle => {
      const tile = handle.closest('.tile');
      if (!tile) return;

      handle.addEventListener('dragstart', (e) => {
        draggedTile = tile;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tile.getAttribute('data-code'));
      });

      handle.addEventListener('dragend', () => {
        if (draggedTile) draggedTile.classList.remove('is-dragging');
        grid.querySelectorAll('.tile').forEach(t => t.classList.remove('drag-over'));
        draggedTile = null;
      });
    });

    grid.querySelectorAll('.tile[data-code]').forEach(tile => {
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

        const srcCode = draggedTile.getAttribute('data-code');
        const targetCode = tile.getAttribute('data-code');

        const fromIdx = languages.findIndex(l => l.code === srcCode);
        const toIdx = languages.findIndex(l => l.code === targetCode);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = languages.splice(fromIdx, 1);
          languages.splice(toIdx, 0, moved);

          const orderList = languages.map((l, idx) => ({ code: l.code, order: idx }));
          render();

          try {
            await Api.reorderLanguages(orderList);
            trackEvent('reorder_languages', { count: languages.length });
          } catch (err) {
            console.error('Failed to save reorder:', err);
          }
        }
      });
    });
  }

  function openAddLanguageModal() {
    const existingCodes = new Set(languages.map(l => l.code.toLowerCase()));
    const available = LANGUAGES.filter(l => !existingCodes.has(l.code.toLowerCase()));

    const contentHtml = `
      <div class="form-group">
        <input type="text" class="form-input" id="modal-lang-search" placeholder="${t('searchLanguages')}" autofocus />
      </div>
      <div class="lang-search-list" id="modal-lang-list">
        ${available.map(l => {
          const localized = getLocalizedLanguageName(l.code, currentBase);
          return `
            <div class="lang-search-item" data-code="${l.code}" data-name="${l.name}" data-flag="${l.flag}">
              <span style="font-size: 1.5rem;">${l.flag}</span>
              <div style="flex: 1;">
                <div style="font-weight: 600; color: var(--text-primary);">${localized}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${l.nativeName} (${l.code})</div>
              </div>
              <button class="btn btn-secondary btn-sm">+ Select</button>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const overlay = Modal.open({
      title: t('addLanguage'),
      contentHtml
    });

    const searchInput = overlay.querySelector('#modal-lang-search');
    const listEl = overlay.querySelector('#modal-lang-list');

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = available.filter(l => {
        const localized = getLocalizedLanguageName(l.code, currentBase).toLowerCase();
        return (
          localized.includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
        );
      });

      listEl.innerHTML = filtered.map(l => {
        const localized = getLocalizedLanguageName(l.code, currentBase);
        return `
          <div class="lang-search-item" data-code="${l.code}" data-name="${l.name}" data-flag="${l.flag}">
            <span style="font-size: 1.5rem;">${l.flag}</span>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--text-primary);">${localized}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${l.nativeName} (${l.code})</div>
            </div>
            <button class="btn btn-secondary btn-sm">+ Select</button>
          </div>
        `;
      }).join('');

      bindSelection();
    });

    function bindSelection() {
      listEl.querySelectorAll('.lang-search-item').forEach(item => {
        item.addEventListener('click', async () => {
          const code = item.getAttribute('data-code');
          const name = item.getAttribute('data-name');
          const flag = item.getAttribute('data-flag');
          Modal.close();

          vocabCounts[code] = 0;
          const newLangObj = { code, name, flag, order: languages.length, hidden: false, createdAt: new Date().toISOString() };
          languages.push(newLangObj);
          render();

          try {
            await Api.addLanguage(newLangObj);
            trackEvent('add_language', { langCode: code, langName: name });
            refreshBackground();
          } catch (err) {
            console.error('Failed to add language:', err);
          }
        });
      });
    }

    bindSelection();
  }
}
