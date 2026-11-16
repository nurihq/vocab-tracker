import { t, autoTranslateUi } from '../i18n.js?v=20261116_khmer_tts1';
import { getAppSettings, updateAppSettings } from '../api.js?v=20261116_khmer_tts1';
import { formatStudyTextHtml, formatStudyPronunciationHtml } from '../languages.js?v=20261116_khmer_tts1';
import { trackEvent } from '../analytics.js?v=20261116_khmer_tts1';

export function renderSettingsScreen(container) {
  function render() {
    const settings = getAppSettings();
    const allEnabled = settings.allLanguagesColors !== false;
    const khmerEnabled = settings.khmerConsonantColors !== false;
    const khmerAutoRomEnabled = settings.khmerAutoRomanisation !== false;
    const effectiveKhmer = Boolean(allEnabled && khmerEnabled);

    container.innerHTML = `
      <div class="settings-page">
        <div class="screen-header">
          <div class="screen-title-group">
            <h1 class="screen-title">⚙️ <span data-i18n="settings">${t('settings') || 'Settings'}</span></h1>
            <p class="settings-subtitle">Customize script colour-coding and study display preferences.</p>
          </div>
        </div>

        <section class="settings-card">
          <div class="settings-card-header">
            <h2 class="settings-card-title">🎨 Script &amp; Romanisation Settings</h2>
            <p class="settings-card-desc">
              Colour-code characters based on their phonetic series and automatically generate romanisation breakdowns on your cards.
            </p>
          </div>

          <div class="settings-rows">
            <!-- Master Toggle: All Languages -->
            <div class="settings-row">
              <div class="settings-row-info">
                <label class="settings-row-label" for="toggle-all-lang-colors">
                  Enable Colours for All Languages
                </label>
                <p class="settings-row-sub">
                  Master setting to enable script phonetic and series colour highlighting across all supported languages.
                </p>
              </div>
              <div class="settings-row-control">
                <label class="toggle-switch" title="Toggle colours for all languages">
                  <input type="checkbox" id="toggle-all-lang-colors" ${allEnabled ? 'checked' : ''} />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <!-- Khmer Specific Toggle -->
            <div class="settings-row ${!allEnabled ? 'is-disabled-row' : ''}">
              <div class="settings-row-info">
                <label class="settings-row-label" for="toggle-khmer-colors">
                  🇰🇭 Khmer Consonant Series Colours
                </label>
                <p class="settings-row-sub">
                  Colour Khmer consonants <strong class="khmer-color-a">Orange (A-Series)</strong> and <strong class="khmer-color-o">Purple (O-Series)</strong> in saved words and romanisations. Clicking any consonant opens the Khmer keyboard with that letter temporarily highlighted.
                </p>
              </div>
              <div class="settings-row-control">
                <label class="toggle-switch" title="Toggle Khmer consonant colours">
                  <input type="checkbox" id="toggle-khmer-colors" ${khmerEnabled ? 'checked' : ''} ${!allEnabled ? 'disabled' : ''} />
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
          </div>

          <!-- Live Interactive Preview Box -->
          <div class="settings-preview-box">
            <div class="settings-preview-header">
              <span class="settings-preview-badge">Live Preview</span>
              <span class="settings-preview-status ${effectiveKhmer ? 'is-active' : ''}">
                ${effectiveKhmer ? '✓ Colours Active' : 'Colours Off'} · ${khmerAutoRomEnabled ? 'Auto-Romanisation On' : 'Auto-Romanisation Off'}
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
        </section>
      </div>
    `;

    autoTranslateUi(container);

    const allToggle = container.querySelector('#toggle-all-lang-colors');
    if (allToggle) {
      allToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ allLanguagesColors: checked });
        trackEvent('setting_change', { setting: 'allLanguagesColors', value: checked });
        render();
      });
    }

    const khmerToggle = container.querySelector('#toggle-khmer-colors');
    if (khmerToggle) {
      khmerToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ khmerConsonantColors: checked });
        trackEvent('setting_change', { setting: 'khmerConsonantColors', value: checked });
        render();
      });
    }

    const khmerAutoRomToggle = container.querySelector('#toggle-khmer-auto-rom');
    if (khmerAutoRomToggle) {
      khmerAutoRomToggle.addEventListener('change', (e) => {
        const checked = e.target.checked;
        updateAppSettings({ khmerAutoRomanisation: checked });
        trackEvent('setting_change', { setting: 'khmerAutoRomanisation', value: checked });
        render();
      });
    }
  }

  render();
}
