import { t } from '../i18n.js';
import { LANGUAGES, getLanguageByCode } from '../languages.js';
import { Api } from '../api.js';
import { Modal } from '../components/modal.js';

export async function renderStudyLanguagesScreen(container) {
  let showHidden = false;
  let languages = [];

  async function loadData() {
    try {
      const res = await Api.getLanguages();
      languages = res.languages || [];
      render();
    } catch (err) {
      console.error('Failed to load languages:', err);
    }
  }

  function render() {
    const visibleLanguages = showHidden ? languages : languages.filter(l => !l.hidden);
    const hasHidden = languages.some(l => l.hidden);

    container.innerHTML = `
      <div class="screen-header">
        <div class="screen-title-group">
          <h2 class="screen-title">
            <span>🌍</span> <span>${t('studyLanguages')}</span>
          </h2>
          <p class="screen-subtitle">${t('dragToReorder')}</p>
        </div>
        <div class="screen-actions">
          ${hasHidden ? `
            <button class="btn btn-secondary btn-sm" id="toggle-hidden-btn">
              ${showHidden ? `👁️ ${t('hideHidden')}` : `👁️ ${t('showHidden')}`}
            </button>
          ` : ''}
          <button class="btn btn-primary" id="add-lang-btn">
            <span>+</span> <span>${t('addLanguage')}</span>
          </button>
        </div>
      </div>

      <div class="tiles-grid" id="languages-grid">
        ${visibleLanguages.map((lang, index) => {
          const langInfo = getLanguageByCode(lang.code) || lang;
          return `
            <div class="tile ${lang.hidden ? 'is-hidden-item' : ''}" 
                 draggable="true" 
                 data-code="${lang.code}" 
                 data-index="${index}">
              <div class="tile-top">
                <span class="tile-flag">${langInfo.flag || lang.flag || '🌐'}</span>
                <div class="tile-actions">
                  <button class="tile-action-btn hide-toggle-btn" 
                          data-code="${lang.code}" 
                          data-hidden="${lang.hidden ? 'true' : 'false'}" 
                          title="${lang.hidden ? t('unhide') : t('hide')}"
                          onclick="event.stopPropagation();">
                    ${lang.hidden ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>
              <div class="tile-bottom">
                <div class="tile-title">${lang.name || langInfo.name}</div>
                <div class="tile-subtitle">${langInfo.nativeName || lang.code.toUpperCase()}</div>
              </div>
              <div class="tile-drag-handle" title="Drag to reorder">⋮⋮</div>
            </div>
          `;
        }).join('')}

        <div class="tile-add" id="tile-add-card">
          <span class="tile-add-icon">+</span>
          <span class="tile-add-text">${t('addLanguage')}</span>
        </div>
      </div>

      ${languages.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🌐</div>
          <p>${t('noLanguagesYet')}</p>
        </div>
      ` : ''}
    `;

    // Event Bindings
    const addBtn = container.querySelector('#add-lang-btn');
    const addCard = container.querySelector('#tile-add-card');
    if (addBtn) addBtn.addEventListener('click', openAddLanguageModal);
    if (addCard) addCard.addEventListener('click', openAddLanguageModal);

    const toggleHiddenBtn = container.querySelector('#toggle-hidden-btn');
    if (toggleHiddenBtn) {
      toggleHiddenBtn.addEventListener('click', () => {
        showHidden = !showHidden;
        render();
      });
    }

    // Tile Click (Navigate to Decks)
    container.querySelectorAll('.tile[data-code]').forEach(tile => {
      tile.addEventListener('click', () => {
        const code = tile.getAttribute('data-code');
        window.location.hash = `#/languages/${code}/decks`;
      });
    });

    // Hide / Unhide Click
    container.querySelectorAll('.hide-toggle-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-code');
        const isCurrentlyHidden = btn.getAttribute('data-hidden') === 'true';
        try {
          await Api.toggleHideLanguage(code, !isCurrentlyHidden);
          await loadData();
        } catch (err) {
          console.error(err);
        }
      });
    });

    // Drag and Drop Reordering
    setupDragAndDrop();
  }

  function setupDragAndDrop() {
    const grid = container.querySelector('#languages-grid');
    if (!grid) return;

    let draggedTile = null;

    grid.querySelectorAll('.tile[data-code]').forEach(tile => {
      tile.addEventListener('dragstart', (e) => {
        draggedTile = tile;
        tile.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tile.getAttribute('data-code'));
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

        const srcCode = draggedTile.getAttribute('data-code');
        const targetCode = tile.getAttribute('data-code');

        const fromIdx = languages.findIndex(l => l.code === srcCode);
        const toIdx = languages.findIndex(l => l.code === targetCode);

        if (fromIdx !== -1 && toIdx !== -1) {
          const [moved] = languages.splice(fromIdx, 1);
          languages.splice(toIdx, 0, moved);

          // Update order fields
          const orderList = languages.map((l, idx) => ({ code: l.code, order: idx }));
          render();

          try {
            await Api.reorderLanguages(orderList);
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
        ${available.map(l => `
          <div class="lang-search-item" data-code="${l.code}" data-name="${l.name}" data-flag="${l.flag}">
            <span style="font-size: 1.5rem;">${l.flag}</span>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--text-primary);">${l.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${l.nativeName} (${l.code})</div>
            </div>
            <button class="btn btn-primary btn-sm">+ Select</button>
          </div>
        `).join('')}
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
      const filtered = available.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
      );

      listEl.innerHTML = filtered.map(l => `
        <div class="lang-search-item" data-code="${l.code}" data-name="${l.name}" data-flag="${l.flag}">
          <span style="font-size: 1.5rem;">${l.flag}</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: var(--text-primary);">${l.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${l.nativeName} (${l.code})</div>
          </div>
          <button class="btn btn-primary btn-sm">+ Select</button>
        </div>
      `).join('');

      bindSelection();
    });

    function bindSelection() {
      listEl.querySelectorAll('.lang-search-item').forEach(item => {
        item.addEventListener('click', async () => {
          const code = item.getAttribute('data-code');
          const name = item.getAttribute('data-name');
          const flag = item.getAttribute('data-flag');
          Modal.close();
          try {
            await Api.addLanguage({ code, name, flag });
            await loadData();
          } catch (err) {
            console.error('Failed to add language:', err);
          }
        });
      });
    }

    bindSelection();
  }

  await loadData();
}
