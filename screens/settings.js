import { t, autoTranslateUi } from '../i18n.js?v=20261116_settings_simple';
import { getAppSettings, updateAppSettings, shouldColorKhmer } from '../api.js?v=20261116_settings_simple';
import { LANGUAGES, formatStudyTextHtml, formatStudyPronunciationHtml } from '../languages.js?v=20261116_settings_simple';
import { trackEvent } from '../analytics.js?v=20261116_settings_simple';

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

  function render() {
    const settings = getAppSettings();
    const overrideMode = settings.globalColorsOverride || (settings.allLanguagesColors === false ? 'force_off' : 'inherit');
    const khmerEnabled = settings.khmerConsonantColors !== false;
    const khmerAutoRomEnabled = Boolean(settings.khmerAutoRomanisation);
    const khmerAutoTranslateEnabled = settings.khmerAutoTranslateAdd !== false;
    const effectiveKhmer = shouldColorKhmer();

    const selectedLang = LANGUAGES.find(l => l.code === selectedScope) || {
      code: selectedScope,
      name: 'Khmer',
      nativeName: 'ភាសាខ្មែរ',
      flag: '🇰🇭'
    };

    container.innerHTML = `
      <div class="settings-page">
        <div class="screen-header" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
          <div class="screen-title-group">
            <h1 class="screen-title">⚙️ <span data-i18n="settings">${t('settings') || 'Settings'}</span></h1>
          </div>
          <div class="settings-lang-picker">
            <select id="settings-lang-select" class="settings-lang-select" title="Select settings scope">
              <option value="all" ${selectedScope === 'all' ? 'selected' : ''}>🌐 All Languages</option>
              ${LANGUAGES.map(l => `
                <option value="${l.code}" ${l.code === selectedScope ? 'selected' : ''}>
                  ${l.flag || '🌐'} ${l.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        ${selectedScope === 'all' ? `
          <!-- All Settings View (Default) -->
          <section class="settings-card">
            <div class="settings-rows">
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Script Colours</span>
                  ${renderInfoTooltip('Control script character phonetic colouring across all languages, or respect each language\'s individual setting.')}
                </div>
                <div class="segmented-control" role="group" aria-label="Global Script Colours Override">
                  <button type="button" class="segmented-btn ${overrideMode === 'inherit' ? 'is-active' : ''}" data-override="inherit" title="Respect individual language preference">
                    🌐 Per Language
                  </button>
                  <button type="button" class="segmented-btn ${overrideMode === 'force_on' ? 'is-active' : ''}" data-override="force_on" title="Force colours ON everywhere">
                    ✓ Force ON
                  </button>
                  <button type="button" class="segmented-btn ${overrideMode === 'force_off' ? 'is-active' : ''}" data-override="force_off" title="Force colours OFF everywhere">
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
                  ${overrideMode !== 'inherit' ? `
                    <span class="settings-override-badge-pill ${overrideMode === 'force_on' ? 'is-active' : ''}">
                      ${overrideMode === 'force_on' ? 'Forced ON Globally' : 'Forced OFF Globally'}
                    </span>
                  ` : ''}
                </div>
                <label class="toggle-switch" title="Toggle Khmer consonant colours">
                  <input type="checkbox" id="toggle-khmer-colors" ${khmerEnabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>

              <!-- Khmer Auto-Romanisation -->
              <div class="settings-row-compact">
                <div class="settings-row-title-wrap">
                  <span class="settings-row-name">Auto Romanisation</span>
                  ${renderInfoTooltip('Automatically generate character-by-character romanisation hints with inherent vowels on cards.')}
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
                <span class="settings-preview-status ${effectiveKhmer ? 'is-active' : ''}">
                  ${effectiveKhmer ? '✓ Colours Active' : 'Colours Off'} · ${khmerAutoRomEnabled ? 'Romanisation On' : 'Romanisation Off'} · ${khmerAutoTranslateEnabled ? 'Quick Add On' : 'Quick Add Off'}
                </span>
              </div>

              <div class="settings-preview-samples">
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('ច្រើន', effectiveKhmer)}</div>
                  <div class="settings-preview-meta">${khmerAutoRomEnabled ? `chraen = ${formatStudyPronunciationHtml('cha + ro + aeu + no', 'ច្រើន', 'km', effectiveKhmer)} — ` : ''}Many / A lot</div>
                </div>
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('ភ្លៀង', effectiveKhmer)}</div>
                  <div class="settings-preview-meta">${khmerAutoRomEnabled ? `${formatStudyPronunciationHtml('pho + lo + ie + ngo', 'ភ្លៀង', 'km', effectiveKhmer)} — ` : ''}Rain</div>
                </div>
                <div class="settings-preview-item">
                  <div class="settings-preview-khmer">${formatStudyTextHtml('សួស្តី', effectiveKhmer)}</div>
                  <div class="settings-preview-meta">${khmerAutoRomEnabled ? `${formatStudyPronunciationHtml('sa + uo + sa + ta + ei', 'សួស្តី', 'km', effectiveKhmer)} — ` : ''}Hello</div>
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
                Script colours are currently <strong>${effectiveKhmer ? 'Active' : 'Off'}</strong> via the All Languages setting.
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

    // Language Selector Dropdown
    const langSelect = container.querySelector('#settings-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        selectedScope = e.target.value;
        trackEvent('setting_tab_change', { scope: selectedScope });
        render();
      });
    }

    // Global Segmented Override Buttons
    container.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const val = e.currentTarget.dataset.override;
        updateAppSettings({
          globalColorsOverride: val,
          allLanguagesColors: val !== 'force_off'
        });
        trackEvent('setting_change', { setting: 'globalColorsOverride', value: val });
        render();
      });
    });

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
