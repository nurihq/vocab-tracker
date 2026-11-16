import { t, autoTranslateUi } from '../i18n.js?v=20261116_settings_override';
import { getAppSettings, updateAppSettings, shouldColorKhmer } from '../api.js?v=20261116_settings_override';
import { LANGUAGES, formatStudyTextHtml, formatStudyPronunciationHtml } from '../languages.js?v=20261116_settings_override';
import { trackEvent } from '../analytics.js?v=20261116_settings_override';

export function renderSettingsScreen(container) {
  let selectedLangCode = 'km';

  function render() {
    const settings = getAppSettings();
    const overrideMode = settings.globalColorsOverride || (settings.allLanguagesColors === false ? 'force_off' : 'inherit');
    const khmerEnabled = settings.khmerConsonantColors !== false;
    const khmerAutoRomEnabled = Boolean(settings.khmerAutoRomanisation);
    const khmerAutoTranslateEnabled = Boolean(settings.khmerAutoTranslateAdd);
    const effectiveKhmer = shouldColorKhmer();

    const selectedLang = LANGUAGES.find(l => l.code === selectedLangCode) || {
      code: selectedLangCode,
      name: 'Khmer',
      nativeName: 'ភាសាខ្មែរ',
      flag: '🇰🇭'
    };

    container.innerHTML = `
      <div class="settings-page">
        <div class="screen-header">
          <div class="screen-title-group">
            <h1 class="screen-title">⚙️ <span data-i18n="settings">${t('settings') || 'Settings'}</span></h1>
            <p class="settings-subtitle">Customize script colour-coding, romanisation, and translation preferences.</p>
          </div>
        </div>

        <section class="settings-card">
          <div class="settings-card-header">
            <h2 class="settings-card-title">🎨 Script &amp; Language Settings</h2>
            <p class="settings-card-desc">
              Manage script phonetic colour-coding, romanisation generators, and quick-add preferences globally or per language.
            </p>
          </div>

          <!-- Global All Languages Override Card -->
          <div class="settings-override-card">
            <div class="settings-override-info">
              <div class="settings-override-title-row">
                <span class="settings-override-badge">Master</span>
                <h3 class="settings-override-title">All Languages Colour Override</h3>
              </div>
              <p class="settings-override-desc">
                Control script colour highlights across all languages at once, or allow each language to use its own preference.
              </p>
              <div class="settings-override-note">
                ${overrideMode === 'inherit'
                  ? 'ℹ️ Respecting individual language settings below.'
                  : overrideMode === 'force_on'
                    ? '✓ Colours forced ON for all languages (language preferences remembered).'
                    : '✕ Colours forced OFF for all languages (language preferences remembered).'
                }
              </div>
            </div>
            <div class="settings-override-control">
              <div class="segmented-control" role="group" aria-label="Global Script Colours Override">
                <button type="button" class="segmented-btn ${overrideMode === 'inherit' ? 'is-active' : ''}" data-override="inherit" title="Follow each language's individual setting">
                  🌐 Per Language
                </button>
                <button type="button" class="segmented-btn ${overrideMode === 'force_on' ? 'is-active' : ''}" data-override="force_on" title="Force colours ON everywhere">
                  ✓ Force All ON
                </button>
                <button type="button" class="segmented-btn ${overrideMode === 'force_off' ? 'is-active' : ''}" data-override="force_off" title="Force colours OFF everywhere">
                  ✕ Force All OFF
                </button>
              </div>
            </div>
          </div>

          <!-- Language-Specific Settings Section -->
          <div class="settings-lang-section">
            <div class="settings-lang-header">
              <div class="settings-lang-title-group">
                <h3 style="font-size: 1.05rem; font-weight: 600; margin: 0 0 0.2rem 0; color: var(--text-primary);">Language Preferences</h3>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">Configure script display, romanisation, and translation for a specific language.</p>
              </div>
              <div class="settings-lang-picker">
                <label for="settings-lang-select" class="settings-lang-picker-label">Language:</label>
                <select id="settings-lang-select" class="settings-lang-select">
                  ${LANGUAGES.map(l => `
                    <option value="${l.code}" ${l.code === selectedLangCode ? 'selected' : ''}>
                      ${l.flag || '🌐'} ${l.name} (${l.nativeName})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            ${selectedLangCode === 'km' ? `
              <!-- Nested Settings: Khmer -->
              <div class="settings-rows">
                <!-- Khmer Consonant Colours -->
                <div class="settings-row">
                  <div class="settings-row-info">
                    <label class="settings-row-label" for="toggle-khmer-colors">
                      🇰🇭 Khmer Consonant Series Colours
                    </label>
                    <p class="settings-row-sub">
                      Colour Khmer consonants <strong class="khmer-color-a">Orange (A-Series)</strong> and <strong class="khmer-color-o">Purple (O-Series)</strong> in saved words and romanisations. Clicking any consonant opens the Khmer keyboard with that letter temporarily highlighted.
                    </p>
                    ${overrideMode !== 'inherit' ? `
                      <span class="settings-override-indicator ${overrideMode === 'force_on' ? 'is-forced-on' : 'is-forced-off'}">
                        ⚡ Global Override: ${overrideMode === 'force_on' ? 'Forced ON' : 'Forced OFF'} (your choice is preserved)
                      </span>
                    ` : ''}
                  </div>
                  <div class="settings-row-control">
                    <label class="toggle-switch" title="Toggle Khmer consonant colours">
                      <input type="checkbox" id="toggle-khmer-colors" ${khmerEnabled ? 'checked' : ''} />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <!-- Khmer Automatic Romanisation Toggle -->
                <div class="settings-row">
                  <div class="settings-row-info">
                    <label class="settings-row-label" for="toggle-khmer-auto-rom">
                      🇰🇭 Khmer Automatic Romanisation Breakdown
                    </label>
                    <p class="settings-row-sub">
                      Automatically add the character-by-character romanisation with inherent vowels (e.g. <strong>chraen = ${formatStudyPronunciationHtml('cha + ro + aeu + no', 'ច្រើន', 'km', effectiveKhmer)}</strong>) while entering a Khmer word and on cards by default.
                    </p>
                  </div>
                  <div class="settings-row-control">
                    <label class="toggle-switch" title="Toggle automatic Khmer romanisation">
                      <input type="checkbox" id="toggle-khmer-auto-rom" ${khmerAutoRomEnabled ? 'checked' : ''} />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <!-- Khmer Auto-Translate on Add Word Toggle -->
                <div class="settings-row">
                  <div class="settings-row-info">
                    <label class="settings-row-label" for="toggle-khmer-auto-translate">
                      🇰🇭 Quick Add (Auto-Translate Khmer)
                    </label>
                    <p class="settings-row-sub">
                      Add words by typing only in your base language (e.g. English) in the Add Word modal without having to type Khmer script. The Khmer translation is looked up and saved automatically.
                    </p>
                  </div>
                  <div class="settings-row-control">
                    <label class="toggle-switch" title="Toggle automatic Khmer translation on add">
                      <input type="checkbox" id="toggle-khmer-auto-translate" ${khmerAutoTranslateEnabled ? 'checked' : ''} />
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Live Interactive Preview Box for Khmer -->
              <div class="settings-preview-box">
                <div class="settings-preview-header">
                  <span class="settings-preview-badge">Live Preview · 🇰🇭 Khmer</span>
                  <span class="settings-preview-status ${effectiveKhmer ? 'is-active' : ''}">
                    ${effectiveKhmer ? '✓ Colours Active' : 'Colours Off'} · ${khmerAutoRomEnabled ? 'Auto-Romanisation On' : 'Auto-Romanisation Off'} · ${khmerAutoTranslateEnabled ? 'Quick Add On' : 'Quick Add Off'}
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
                    <span><strong class="khmer-color-a">A-Series</strong> Consonants (ក ខ ច ឆ ដ ឋ ណ ត ថ ប ផ ស ហ ឡ អ)</span>
                  </span>
                  <span class="settings-legend-pill">
                    <span class="legend-dot is-o-series"></span>
                    <span><strong class="khmer-color-o">O-Series</strong> Consonants (គ ឃ ង ជ ឈ ញ ឌ ឍ ទ ធ ន ព ភ ម យ រ ល វ)</span>
                  </span>
                </div>
                ${effectiveKhmer ? `
                  <div class="settings-preview-tip">
                    👆 Try clicking any consonant in the preview words above to see where it is on the Khmer keyboard!
                  </div>
                ` : ''}
              </div>
            ` : `
              <!-- Other Language Information Box -->
              <div class="settings-lang-empty-box">
                <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">${selectedLang.flag || '🌐'}</div>
                <h4 class="settings-lang-empty-title">${selectedLang.name} (${selectedLang.nativeName || selectedLang.name})</h4>
                <p class="settings-lang-empty-desc">
                  Script colour highlighting for ${selectedLang.name} is currently <strong>${effectiveKhmer ? 'Active' : 'Off'}</strong> based on your global settings.
                </p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">
                  Phonetic consonant series rules and romanisation generators are currently configured for 🇰🇭 Khmer. More language-specific rules are on the way!
                </p>
              </div>
            `}
          </div>
        </section>
      </div>
    `;

    autoTranslateUi(container);

    // Segmented Global Override Buttons
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

    // Language Selector
    const langSelect = container.querySelector('#settings-lang-select');
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        selectedLangCode = e.target.value;
        trackEvent('setting_change', { setting: 'selectedSettingsLang', value: selectedLangCode });
        render();
      });
    }

    // Khmer Consonants Toggle
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

