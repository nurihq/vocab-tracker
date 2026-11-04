import { autoTranslateUi } from '../i18n.js?v=20261104_scripts3';
import { trackEvent } from '../analytics.js?v=20261104_scripts3';
import { HIRAGANA_SECTIONS } from '../scripts/data/hiragana-data.js?v=20261104_scripts3';
import { KATAKANA_SECTIONS } from '../scripts/data/katakana-data.js?v=20261104_scripts3';
import { KHMER_SECTIONS } from '../scripts/data/khmer-data.js?v=20261104_scripts3';

function getScriptStats(storagePrefix, sections) {
  const allChars = sections.flatMap(s => s.characters);
  const total = allChars.length;
  let learnedMap = {};
  try {
    const raw = localStorage.getItem(`${storagePrefix}-learned`);
    if (raw) learnedMap = JSON.parse(raw) || {};
  } catch (e) {}

  const learnedCount = allChars.filter(c => learnedMap[c.char]).length;
  const savedIdx = parseInt(localStorage.getItem(`${storagePrefix}-progress`) || '0', 10);
  const currentIdx = Number.isFinite(savedIdx) ? Math.min(Math.max(0, savedIdx), total - 1) : 0;
  const currentObj = allChars[currentIdx] || allChars[0];
  const currentChar = currentObj?.displayChar || currentObj?.char || '';

  return {
    total,
    learnedCount,
    currentIdx,
    currentChar,
    percent: total > 0 ? Math.round((learnedCount / total) * 100) : 0
  };
}

export function renderScriptsScreen(container) {
  const hiraStats = getScriptStats('hiragana', HIRAGANA_SECTIONS);
  const kataStats = getScriptStats('katakana', KATAKANA_SECTIONS);
  const khmerStats = getScriptStats('khmer', KHMER_SECTIONS);
  const jpTotal = hiraStats.total + kataStats.total;
  const jpLearned = hiraStats.learnedCount + kataStats.learnedCount;

  container.innerHTML = `
    <div class="scripts-hub-container">
      <div class="screen-header">
        <div class="screen-title-group">
          <div class="screen-lang-tag">
            <span>✍️</span>
            <span data-i18n="writingSystems">Writing Systems</span>
          </div>
          <h1 class="screen-title" data-i18n="scriptsTitle">Scripts & Writing Practice</h1>
          <p class="screen-subtitle" data-i18n="scriptsSubtitle">
            Explore character reference guides, phone keyboard layouts, romanisations, and interactive stroke-by-stroke writing practice.
          </p>
        </div>
      </div>

      <div class="scripts-cards-grid">
        <!-- Japanese Writing Systems Card -->
        <div class="script-hub-card script-hub-card-dual">
          <div class="script-hub-card-top">
            <div class="script-hub-glyph" aria-hidden="true">あア</div>
            <div class="script-hub-meta">
              <div class="script-hub-lang-tag">
                <span>🇯🇵</span>
                <span>Japanese · 日本語</span>
              </div>
              <h2 class="script-hub-title">
                <a href="/scripts/japanese" class="script-hub-title-link">Japanese Scripts</a>
              </h2>
              <div class="script-hub-native">ひらがな & カタカナ · ${jpTotal} characters</div>
            </div>
          </div>

          <p class="script-hub-desc">
            Complete reference and stroke practice for both Japanese phonetic syllabaries — Hiragana (71 characters) and Katakana (71 characters) — with 12-key mobile flick keyboard guides.
          </p>

          <div class="script-hub-subcards">
            <div class="script-hub-subitem">
              <div class="script-hub-subitem-info">
                <strong>ひらがな Hiragana</strong>
                <span>Current: ${hiraStats.currentChar} (${hiraStats.currentIdx + 1}/${hiraStats.total}) · ${hiraStats.learnedCount} learned</span>
              </div>
              <div class="script-hub-subitem-links">
                <a href="/scripts/japanese/hiragana" class="btn btn-secondary btn-sm">Info</a>
                <a href="/scripts/japanese/hiragana/practice" class="btn btn-primary btn-sm">Practice →</a>
              </div>
            </div>

            <div class="script-hub-subitem">
              <div class="script-hub-subitem-info">
                <strong>カタカナ Katakana</strong>
                <span>Current: ${kataStats.currentChar} (${kataStats.currentIdx + 1}/${kataStats.total}) · ${kataStats.learnedCount} learned</span>
              </div>
              <div class="script-hub-subitem-links">
                <a href="/scripts/japanese/katakana" class="btn btn-secondary btn-sm">Info</a>
                <a href="/scripts/japanese/katakana/practice" class="btn btn-primary btn-sm">Practice →</a>
              </div>
            </div>
          </div>

          <div class="script-hub-footer">
            <div class="script-hub-progress-info">
              <span>Combined Progress</span>
              <span>${jpLearned}/${jpTotal} learned</span>
            </div>
            <div class="script-hub-progress-track">
              <div class="script-hub-progress-fill" style="width: ${Math.max(Math.round((jpLearned / jpTotal) * 100), 4)}%"></div>
            </div>
            <div class="script-hub-actions-row">
              <a href="/scripts/japanese" class="btn btn-secondary script-hub-action-btn">
                🇯🇵 Japanese Overview →
              </a>
            </div>
          </div>
        </div>

        <!-- Khmer Script Card -->
        <div class="script-hub-card script-hub-card-dual">
          <div class="script-hub-card-top">
            <div class="script-hub-glyph" aria-hidden="true">ក</div>
            <div class="script-hub-meta">
              <div class="script-hub-lang-tag">
                <span>🇰🇭</span>
                <span>Khmer · ភាសាខ្មែរ</span>
              </div>
              <h2 class="script-hub-title">
                <a href="/scripts/khmer" class="script-hub-title-link">Khmer Script</a>
              </h2>
              <div class="script-hub-native">អក្សរខ្មែរ · ${khmerStats.total} characters</div>
            </div>
          </div>

          <p class="script-hub-desc">
            Full reference for all 33 A-Series & O-Series Consonants, 33 Subscript Consonants (Coeng), 23 Dependent Vowels (with A/O series forms & romanisations), 14 Independent Vowels, and interactive Khmer Phone Keyboard layout.
          </p>

          <div class="script-hub-pills">
            ${KHMER_SECTIONS.map(sec => `<span class="script-section-pill">${sec.shortName || sec.name} (${sec.characters.length})</span>`).join('')}
          </div>

          <div class="script-hub-footer">
            <div class="script-hub-progress-info">
              <span>Current: <strong>${khmerStats.currentChar}</strong> (${khmerStats.currentIdx + 1}/${khmerStats.total})</span>
              <span>${khmerStats.learnedCount}/${khmerStats.total} learned</span>
            </div>
            <div class="script-hub-progress-track">
              <div class="script-hub-progress-fill" style="width: ${Math.max(khmerStats.percent, Math.round(((khmerStats.currentIdx + 1) / khmerStats.total) * 100))}%"></div>
            </div>
            <div class="script-hub-actions-row">
              <a href="/scripts/khmer" class="btn btn-secondary script-hub-action-btn">
                📖 Info & Keyboard
              </a>
              <a href="/scripts/khmer/practice" class="btn btn-primary script-hub-action-btn">
                ✍️ Practice →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  autoTranslateUi(container);

  container.querySelectorAll('a[href^="/scripts"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('select_script_route', { href: link.getAttribute('href') });
    });
  });
}
