import { t, autoTranslateUi } from '../i18n.js?v=20261116_back_nav1';
import { getAppSettings, updateAppSettings } from '../api.js?v=20261116_back_nav1';
import { formatStudyTextHtml } from '../languages.js?v=20261116_back_nav1';
import { trackEvent } from '../analytics.js?v=20261116_back_nav1';

export function renderSettingsScreen(container) {
  function render() {
    const settings = getAppSettings();
    const allEnabled = settings.allLanguagesColors !== false;
    const khmerEnabled = settings.khmerConsonantColors !== false;
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
            <h2 class="settings-card-title">🎨 Script &amp; Consonant Colours</h2>
            <p class="settings-card-desc">
              Colour-code characters based on their phonetic series in your saved vocabulary lists and flashcards.
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
                  Colour Khmer consonants <strong class="khmer-color-a">Orange (A-Series)</strong> and <strong class="khmer-color-o">Purple (O-Series)</strong> in saved words. Clicking any consonant opens the Khmer keyboard with that letter temporarily highlighted.
                </p>
              </div>
              <div class="settings-row-control">
                <label class="toggle-switch" title="Toggle Khmer consonant colours">
                  <input type="checkbox" id="toggle-khmer-colors" ${khmerEnabled ? 'checked' : ''} ${!allEnabled ? 'disabled' : ''} />
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
                ${effectiveKhmer ? '✓ Active' : 'Off'}
              </span>
            </div>

            <div class="settings-preview-samples">
              <div class="settings-preview-item">
                <div class="settings-preview-khmer">${formatStudyTextHtml('អរគុណ', effectiveKhmer)}</div>
                <div class="settings-preview-meta">’âr-kun — Thank you</div>
              </div>
              <div class="settings-preview-item">
                <div class="settings-preview-khmer">${formatStudyTextHtml('ភាសាខ្មែរ', effectiveKhmer)}</div>
                <div class="settings-preview-meta">phea-saa khmae — Khmer language</div>
              </div>
              <div class="settings-preview-item">
                <div class="settings-preview-khmer">${formatStudyTextHtml('សួស្តី', effectiveKhmer)}</div>
                <div class="settings-preview-meta">suosdei — Hello</div>
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
  }

  render();
}
