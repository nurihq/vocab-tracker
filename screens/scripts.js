import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js?v=20261104_scripts6';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js?v=20261104_scripts6';
import { trackEvent } from '../analytics.js?v=20261104_scripts6';

const SCRIPT_LANGUAGES = [
  { code: 'ja', href: '/scripts/japanese', defaultName: 'Japanese', defaultNative: '日本語', defaultFlag: '🇯🇵' },
  { code: 'km', href: '/scripts/khmer', defaultName: 'Khmer', defaultNative: 'ភាសាខ្មែរ', defaultFlag: '🇰🇭' }
];

export function renderScriptsScreen(container) {
  const currentBase = getI18nBaseLang();

  container.innerHTML = `
    <div class="screen-header">
      <div class="screen-title-group">
        <h2 class="screen-title">
          <span data-i18n="scripts">${t('scripts') || 'Scripts'}</span>
        </h2>
      </div>
    </div>

    <div class="tiles-grid" id="scripts-languages-grid">
      ${SCRIPT_LANGUAGES.map(item => {
        const langInfo = getLanguageByCode(item.code) || {};
        const localizedTitle = getLocalizedLanguageName(item.code, currentBase) || item.defaultName;
        const nativeName = langInfo.nativeName || item.defaultNative;
        const flag = langInfo.flag || item.defaultFlag;

        return `
          <a href="${item.href}" class="tile" data-code="${item.code}">
            <div class="tile-top">
              <span class="tile-flag">${flag}</span>
            </div>
            <div class="tile-bottom">
              <div class="tile-title">${localizedTitle}</div>
              <div class="tile-subtitle">${nativeName}</div>
            </div>
          </a>
        `;
      }).join('')}
    </div>
  `;

  autoTranslateUi(container);

  container.querySelectorAll('a[href^="/scripts"]').forEach(link => {
    link.addEventListener('click', () => {
      trackEvent('select_script_route', { href: link.getAttribute('href') });
    });
  });
}
