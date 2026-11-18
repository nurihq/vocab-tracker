import { t, autoTranslateUi } from '../i18n.js?v=20261116_standardize_khmer_font';
import { getAppSettings, updateAppSettings, shouldColorKhmer, shouldAutoRomaniseKhmer, shouldAutoTranslateKhmerAdd } from '../api.js?v=20261118_new_default_decks_inbox_emotions';
import { LANGUAGES, formatStudyTextHtml, formatStudyPronunciationHtml } from '../languages.js?v=20261116_standardize_khmer_font';
import { trackEvent } from '../analytics.js?v=20261116_standardize_khmer_font';

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;');
}

function renderInfoTooltip(text) {
  return `
    <span class="info-tooltip" tabindex="0" role="tooltip" aria-label="${escapeAttr(text)}">
      <svg class="info-tooltip-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span class="info-tooltip-bubble">${escapeHtml(text)}</span>
    </span>
  `;
}

export function renderSettingsScreen(container) {
  let selectedScope = 'all';
  let isComboboxOpen = false;
  let comboboxSearchQuery = '';

  // Outside click listener cleanup handler
  let onDocClick = null;
  let onDocKeydown = null;

  function cleanupListeners() {
    if (onDocClick) {
      document.removeEventListener('click', onDocClick);
      onDocClick = null;
    }
    if (onDocKeydown) {
      document.removeEventListener('keydown', onDocKeydown);
      onDocKeydown = null;
    }
  }

  function render() {
    cleanupListeners();

    const settings = getAppSettings();
    const colorOverride = settings.globalColorsOverride || (settings.allLanguagesColors === false ? 'force_off' : 'inherit');
    const autoRomOverride = settings.globalAutoRomOverride || 'inherit';
    const autoTranslateOverride = settings.globalAutoTranslateOverride || 'inherit';

    const khmerColorsEnabled = settings.khmerConsonantColors !== false;
    const khmerAutoRomEnabled = Boolean(settings.khmerAutoRomanisation);
    const khmerAutoTranslateEnabled = settings.khmerAutoTranslateAdd !== false;

    const effectiveKhmerColor = shouldColorKhmer();
    const effectiveKhmerAutoRom = shouldAutoRomaniseKhmer();
    const effectiveKhmerAutoTranslate = shouldAutoTranslateKhmerAdd();

    const selectedLang = selectedScope === 'all'
      ? { code: 'all', name: 'All Languages', nativeName: '', flag: '🌐' }
      : (LANGUAGES.find(l => l.code === selectedScope) || {
          code: selectedScope,
          name: 'Khmer',
          nativeName: 'ភាសាខ្មែរ',
          flag: '🇰🇭'
        });

    container.innerHTML = `
      <div class="settings-page">
        <div class="screen-header" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div class="screen-title-group">
            <h1 class="screen-title">⚙️ <span data-i18n="settings">${t('settings') || 'Settings'}</span></h1>
          </div>
          <div class="settings-lang-picker">
            <div id="settings-lang-combobox" class="settings-searchable-combobox ${isComboboxOpen ? 'is-open' : ''}">
              <button type="button" id="settings-combobox-trigger" class="settings-combobox-trigger" aria-haspopup="listbox" aria-expanded="${isComboboxOpen}">
                <span class="settings-combobox-value">
                  <span>${selectedLang.flag || '🌐'}</span>
                  <span>${escapeHtml(selectedLang.name)}</span>
                </span>
                <svg class="settings-combobox-arrow" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              <div id="settings-combobox-menu" class="settings-combobox-menu">
                <div class="settings-combobox-search-wrap">
                  <svg class="settings-combobox-search-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input type="text" id="settings-combobox-search" class="settings-combobox-search-input" placeholder="Search languages..." autocomplete="off" spellcheck="false" value="${escapeAttr(comboboxSearchQuery)}" />
                </div>
                <ul id="settings-combobox-list" class="settings-combobox-list" role="listbox">
                  <!-- Populated dynamically -->
                </ul>
              </div>
            </div>
          </div>
        </div>

        ${selectedScope === 'all' ? `
          <!-- All Settings View (Default) -->
          <section class="settings-card">
            <div class="settings-rows">
              <!-- Global Script Colours Row -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Script Colours</span>
                  ${renderInfoTooltip('Control script phonetic colouring across all languages, or respect each language\'s preference.')}
                </div>
                <div class="segmented-control" role="group" aria-label="Global Script Colours Override">
                  <button type="button" class="segmented-btn ${colorOverride === 'inherit' ? 'is-active' : ''}" data-setting="colors" data-override="inherit" title="Respect individual language preference">
                    🌐 Per Language
                  </button>
                  <button type="button" class="segmented-btn ${colorOverride === 'force_on' ? 'is-active' : ''}" data-setting="colors" data-override="force_on" title="Force colours ON everywhere">
                    ✓ Force ON
                  </button>
                  <button type="button" class="segmented-btn ${colorOverride === 'force_off' ? 'is-active' : ''}" data-setting="colors" data-override="force_off" title="Force colours OFF everywhere">
                    ✕ Force OFF
                  </button>
                </div>
              </div>

              <!-- Global Auto Romanisation Row -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Auto Romanisation</span>
                  ${renderInfoTooltip('Generate character-by-character romanisation hints on cards, or respect each language\'s preference.')}
                </div>
                <div class="segmented-control" role="group" aria-label="Global Auto Romanisation Override">
                  <button type="button" class="segmented-btn ${autoRomOverride === 'inherit' ? 'is-active' : ''}" data-setting="auto_rom" data-override="inherit" title="Respect individual language preference">
                    🌐 Per Language
                  </button>
                  <button type="button" class="segmented-btn ${autoRomOverride === 'force_on' ? 'is-active' : ''}" data-setting="auto_rom" data-override="force_on" title="Force romanisation ON everywhere">
                    ✓ Force ON
                  </button>
                  <button type="button" class="segmented-btn ${autoRomOverride === 'force_off' ? 'is-active' : ''}" data-setting="auto_rom" data-override="force_off" title="Force romanisation OFF everywhere">
                    ✕ Force OFF
                  </button>
                </div>
              </div>

              <!-- Global Quick Add / Auto-Translate Row -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Quick Add (Auto-Translate)</span>
                  ${renderInfoTooltip('Automatically translate study words from your base language without typing native script, or respect each language\'s preference.')}
                </div>
                <div class="segmented-control" role="group" aria-label="Global Auto Translate Override">
                  <button type="button" class="segmented-btn ${autoTranslateOverride === 'inherit' ? 'is-active' : ''}" data-setting="auto_translate" data-override="inherit" title="Respect individual language preference">
                    🌐 Per Language
                  </button>
                  <button type="button" class="segmented-btn ${autoTranslateOverride === 'force_on' ? 'is-active' : ''}" data-setting="auto_translate" data-override="force_on" title="Force auto-translate ON everywhere">
                    ✓ Force ON
                  </button>
                  <button type="button" class="segmented-btn ${autoTranslateOverride === 'force_off' ? 'is-active' : ''}" data-setting="auto_translate" data-override="force_off" title="Force auto-translate OFF everywhere">
                    ✕ Force OFF
                  </button>
                </div>
              </div>
            </div>
          </section>
        ` : selectedScope === 'km' ? `
          <!-- Khmer Language Settings View -->
          <section class="settings-card">
            <div class="settings-rows">
              <!-- Khmer Consonant Colours -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Consonant Series Colours</span>
                  ${renderInfoTooltip('Colour Khmer consonants Orange (A-Series) and Purple (O-Series). Clicking a consonant opens the keyboard with that letter.')}
                  ${colorOverride !== 'inherit' ? `
                    <span class="settings-override-badge-pill ${colorOverride === 'force_on' ? 'is-active' : ''}">
                      ${colorOverride === 'force_on' ? 'Forced ON Globally' : 'Forced OFF Globally'}
                    </span>
                  ` : ''}
                </div>
                <label class="toggle-switch" title="Toggle Khmer consonant colours">
                  <input type="checkbox" id="toggle-khmer-colors" ${khmerColorsEnabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- Khmer Auto-Romanisation -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Auto Romanisation</span>
                  ${renderInfoTooltip('Automatically generate character-by-character romanisation hints with inherent vowels on cards.')}
                  ${autoRomOverride !== 'inherit' ? `
                    <span class="settings-override-badge-pill ${autoRomOverride === 'force_on' ? 'is-active' : ''}">
                      ${autoRomOverride === 'force_on' ? 'Forced ON Globally' : 'Forced OFF Globally'}
                    </span>
                  ` : ''}
                </div>
                <label class="toggle-switch" title="Toggle automatic Khmer romanisation">
                  <input type="checkbox" id="toggle-khmer-auto-rom" ${khmerAutoRomEnabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- Khmer Quick Add -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Quick Add (Auto-Translate)</span>
                  ${renderInfoTooltip('Type words in English or your base language in the Add Word modal; Khmer script is translated and saved automatically.')}
                  ${autoTranslateOverride !== 'inherit' ? `
                    <span class="settings-override-badge-pill ${autoTranslateOverride === 'force_on' ? 'is-active' : ''}">
                      ${autoTranslateOverride === 'force_on' ? 'Forced ON Globally' : 'Forced OFF Globally'}
                    </span>
                  ` : ''}
                </div>
                <label class="toggle-switch" title="Toggle Quick Add auto-translation">
                  <input type="checkbox" id="toggle-khmer-auto-translate" ${khmerAutoTranslateEnabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Compact Live Preview for Khmer -->
            <div class="settings-preview-box" style="margin-top: 1.25rem;">
              <div class="settings-preview-header">
                <span class="settings-preview-badge">Live Preview · 🇰🇭 Khmer</span>
                <span class="settings-preview-status ${effectiveKhmerColor ? 'is-active' : ''}">
                  ${effectiveKhmerColor ? '✓ Colours Active' : 'Colours Off'} · ${effectiveKhmerAutoRom ? 'Romanisation On' : 'Romanisation Off'} · ${effectiveKhmerAutoTranslate ? 'Quick Add On' : 'Quick Add Off'}
                </span>
              </div>

              <div class="settings-preview-samples">
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('ច្រើន', effectiveKhmerColor)}</div>
                  <div class="settings-preview-meta">${effectiveKhmerAutoRom ? `chraen = ${formatStudyPronunciationHtml('cha + ro + aeu + no', 'ច្រើន', 'km', effectiveKhmerColor)} — ` : ''}Many / A lot</div>
                </div>
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('ភ្លៀង', effectiveKhmerColor)}</div>
                  <div class="settings-preview-meta">${effectiveKhmerAutoRom ? `${formatStudyPronunciationHtml('pho + lo + ie + ngo', 'ភ្លៀង', 'km', effectiveKhmerColor)} — ` : ''}Rain</div>
                </div>
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('សួស្តី', effectiveKhmerColor)}</div>
                  <div class="settings-preview-meta">${effectiveKhmerAutoRom ? `${formatStudyPronunciationHtml('sa + uo + sa + ta + ei', 'សួស្តី', 'km', effectiveKhmerColor)} — ` : ''}Hello</div>
                </div>
              </div>

              <div class="settings-preview-legend">
                <span class="settings-legend-pill">
                  <span class="legend-dot is-a-series"></span>
                  <span><strong class="khmer-color-a">A-Series</strong> (Orange)</span>
                </span>
                <span class="settings-legend-pill">
                  <span class="legend-dot is-o-series"></span>
                  <span><strong class="khmer-color-o">O-Series</strong> (Purple)</span>
                </span>
              </div>
            </div>
          </section>
        ` : `
          <!-- Other Language Information View -->
          <section class="settings-card">
            <div class="settings-lang-empty-box">
              <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">${selectedLang.flag || '🌐'}</div>
              <h4 class="settings-lang-empty-title">${selectedLang.name}</h4>
              <p class="settings-lang-empty-desc">
                Global settings apply: Script colours are <strong>${effectiveKhmerColor ? 'Active' : 'Off'}</strong>,
                Auto-romanisation is <strong>${effectiveKhmerAutoRom ? 'Active' : 'Off'}</strong>,
                and Quick Add is <strong>${effectiveKhmerAutoTranslate ? 'Active' : 'Off'}</strong>.
              </p>
              ${selectedScope === 'ja' ? `
                <a href="#/scripts/japanese/hiragana" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; text-decoration: none; margin-top: 0.25rem;">
                  <span>🇯🇵</span>
                  <span>Open Japanese Scripts Hub →</span>
                </a>
              ` : `
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0;">
                  Language-specific phonetic rules are currently available for 🇰🇭 Khmer.
                </p>
              `}
            </div>
          </section>
        `}
      </div>
    `;

    autoTranslateUi(container);

    // Setup Searchable Language Combobox
    setupSearchableCombobox();

    // Setup Segmented Override Buttons
    setupSegmentedControls();

    // Setup Khmer Individual Toggles
    setupKhmerToggles();
  }

  function setupSearchableCombobox() {
    const comboboxEl = container.querySelector('#settings-lang-combobox');
    const triggerBtn = container.querySelector('#settings-combobox-trigger');
    const searchInput = container.querySelector('#settings-combobox-search');
    const listEl = container.querySelector('#settings-combobox-list');

    if (!comboboxEl || !triggerBtn || !listEl) return;

    function renderOptions() {
      const q = comboboxSearchQuery.trim().toLowerCase();
      const allScopeItem = { code: 'all', name: 'All Languages', nativeName: '', flag: '🌐' };
      const items = [allScopeItem, ...LANGUAGES];

      const filtered = q
        ? items.filter(l =>
            l.name.toLowerCase().includes(q) ||
            (l.nativeName && l.nativeName.toLowerCase().includes(q)) ||
            l.code.toLowerCase().includes(q)
          )
        : items;

      if (filtered.length === 0) {
        listEl.innerHTML = `<li class="settings-combobox-empty">No languages match "${escapeHtml(comboboxSearchQuery)}"</li>`;
        return;
      }

      listEl.innerHTML = filtered.map(l => {
        const isSelected = l.code === selectedScope;
        return `
          <li class="settings-combobox-item ${isSelected ? 'is-selected' : ''}" data-code="${l.code}" role="option" aria-selected="${isSelected}">
            <span class="settings-combobox-item-left">
              <span>${l.flag || '🌐'}</span>
              <span>${escapeHtml(l.name)}</span>
            </span>
            ${l.nativeName && l.nativeName !== l.name ? `
              <span class="settings-combobox-native-name">${escapeHtml(l.nativeName)}</span>
            ` : ''}
          </li>
        `;
      }).join('');

      listEl.querySelectorAll('.settings-combobox-item').forEach(itemEl => {
        itemEl.addEventListener('click', () => {
          const code = itemEl.dataset.code;
          selectedScope = code;
          isComboboxOpen = false;
          comboboxSearchQuery = '';
          trackEvent('setting_tab_change', { scope: selectedScope });
          render();
        });
      });
    }

    renderOptions();

    triggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isComboboxOpen = !isComboboxOpen;
      comboboxEl.classList.toggle('is-open', isComboboxOpen);
      triggerBtn.setAttribute('aria-expanded', isComboboxOpen);
      if (isComboboxOpen && searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        comboboxSearchQuery = e.target.value;
        renderOptions();
      });

      searchInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          isComboboxOpen = false;
          comboboxEl.classList.remove('is-open');
          triggerBtn.focus();
        } else if (e.key === 'Enter') {
          const firstOption = listEl.querySelector('.settings-combobox-item');
          if (firstOption) {
            firstOption.click();
          }
        }
      });
    }

    onDocClick = (e) => {
      if (!comboboxEl.contains(e.target)) {
        if (isComboboxOpen) {
          isComboboxOpen = false;
          comboboxEl.classList.remove('is-open');
          triggerBtn.setAttribute('aria-expanded', 'false');
        }
      }
    };
    document.addEventListener('click', onDocClick);

    onDocKeydown = (e) => {
      if (e.key === 'Escape' && isComboboxOpen) {
        isComboboxOpen = false;
        comboboxEl.classList.remove('is-open');
        triggerBtn.setAttribute('aria-expanded', 'false');
        triggerBtn.focus();
      }
    };
    document.addEventListener('keydown', onDocKeydown);
  }

  function setupSegmentedControls() {
    container.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const settingType = e.currentTarget.dataset.setting;
        const val = e.currentTarget.dataset.override;

        if (settingType === 'colors') {
          updateAppSettings({
            globalColorsOverride: val,
            allLanguagesColors: val !== 'force_off'
          });
          trackEvent('setting_change', { setting: 'globalColorsOverride', value: val });
        } else if (settingType === 'auto_rom') {
          updateAppSettings({
            globalAutoRomOverride: val
          });
          trackEvent('setting_change', { setting: 'globalAutoRomOverride', value: val });
        } else if (settingType === 'auto_translate') {
          updateAppSettings({
            globalAutoTranslateOverride: val
          });
          trackEvent('setting_change', { setting: 'globalAutoTranslateOverride', value: val });
        }
        render();
      });
    });
  }

  function setupKhmerToggles() {
    // Khmer Consonant Colours Toggle
    const khmerToggle = container.querySelector('#toggle-khmer-colors');
    if (khmerToggle) {
      khmerToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ khmerConsonantColors: checked });
        trackEvent('setting_change', { setting: 'khmerConsonantColors', value: checked });
        render();
      });
    }

    // Khmer Auto-Romanisation Toggle
    const khmerAutoRomToggle = container.querySelector('#toggle-khmer-auto-rom');
    if (khmerAutoRomToggle) {
      khmerAutoRomToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ khmerAutoRomanisation: checked });
        trackEvent('setting_change', { setting: 'khmerAutoRomanisation', value: checked });
        render();
      });
    }

    // Khmer Auto-Translate Toggle
    const khmerAutoTranslateToggle = container.querySelector('#toggle-khmer-auto-translate');
    if (khmerAutoTranslateToggle) {
      khmerAutoTranslateToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ khmerAutoTranslateAdd: checked });
        trackEvent('setting_change', { setting: 'khmerAutoTranslateAdd', value: checked });
        render();
      });
    }
  }

  render();
}
