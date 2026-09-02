import { t, getI18nBaseLang, fetchLiveTranslation, autoTranslateUi } from '../i18n.js';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Auth } from '../api.js';
import { trackEvent } from '../analytics.js';

export function renderHomeScreen(container) {
  const currentBase = getI18nBaseLang();
  const baseLangInfo = getLanguageByCode(currentBase);
  const localizedBaseName = getLocalizedLanguageName(currentBase, currentBase);

  // Pool of cards in diverse study languages
  const CARD_POOL = [
    { langCode: 'ja', word: 'こんにちは', pronunciation: 'konnichiwa', baseMeaning: 'Hello' },
    { langCode: 'ka', word: 'გამარჯობა', pronunciation: 'gamarjoba', baseMeaning: 'Hello' },
    { langCode: 'es', word: '¡Hola!', pronunciation: 'oh-lah', baseMeaning: 'Hello' },
    { langCode: 'id', word: 'Terima kasih', pronunciation: 'te-ri-ma ka-sih', baseMeaning: 'Thank you' },
    { langCode: 'fr', word: 'Bonjour', pronunciation: 'bohn-zhoor', baseMeaning: 'Hello' },
    { langCode: 'de', word: 'Guten Tag', pronunciation: 'goo-ten tahk', baseMeaning: 'Good day' }
  ];

  // Filter out any card that matches the user's active base language, then take top 3
  const activeCards = CARD_POOL
    .filter(c => c.langCode.toLowerCase() !== currentBase.toLowerCase().split('-')[0])
    .slice(0, 3);

  container.innerHTML = `
    <div class="hero-wrapper">
      <div class="hero-badge">
        <span>✨</span> <span data-i18n="tagline">${t('tagline')}</span>
      </div>
      
      <h1 class="hero-title">${t('appTitle')}</h1>
      <p class="hero-subtitle" data-i18n="subtitle">${t('subtitle')}</p>

      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" id="home-start-btn">
          <span data-i18n="startLearning">${t('startLearning')}</span>
          <span style="font-size: 1.15rem;">→</span>
        </button>
      </div>

      <!-- Interactive 3D Flippable Preview Cards -->
      <div class="hero-preview-cards" id="hero-cards-container">
        ${activeCards.map((card, idx) => {
          const langInfo = getLanguageByCode(card.langCode) || { flag: '🌐', name: card.langCode };
          const localizedStudyName = getLocalizedLanguageName(card.langCode, currentBase);

          return `
            <div class="home-card-stage" data-card-idx="${idx}" data-lang="${card.langCode}" data-word="${card.word}" title="Click to flip">
              <div class="home-card-inner">
                <!-- Front Side: Study Language -->
                <div class="home-card-face home-card-front">
                  <div class="home-card-top-tag">
                    <span>${langInfo.flag}</span>
                    <span>${localizedStudyName}</span>
                  </div>
                  <div class="home-card-word">${card.word}</div>
                  <div class="home-card-pronunciation">${card.pronunciation}</div>
                  <div class="home-card-hint">Tap to flip</div>
                </div>

                <!-- Back Side: Base Language Translation -->
                <div class="home-card-face home-card-back">
                  <div class="home-card-top-tag">
                    <span>${baseLangInfo?.flag || '🌐'}</span>
                    <span>${localizedBaseName}</span>
                  </div>
                  <div class="home-card-word" data-home-trans-id="${card.langCode}">${card.baseMeaning}</div>
                  <div class="home-card-hint">Tap to flip back</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Dynamically translate meanings on cards to active base language
  activeCards.forEach(card => {
    fetchLiveTranslation(card.baseMeaning, currentBase).then(translated => {
      if (translated && translated !== card.baseMeaning) {
        const transEl = container.querySelector(`[data-home-trans-id="${card.langCode}"]`);
        if (transEl) transEl.textContent = translated;
      }
    });
  });

  // Dynamically translate all UI text across the page for all 100+ languages
  autoTranslateUi(container);

  // Enable 3D flip on click with event tracking
  container.querySelectorAll('.home-card-stage').forEach(stage => {
    stage.addEventListener('click', () => {
      stage.classList.toggle('is-flipped');
      const lang = stage.getAttribute('data-lang');
      const word = stage.getAttribute('data-word');
      trackEvent('home_card_flip', { langCode: lang, word });
    });
  });

  const startBtn = container.querySelector('#home-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      trackEvent('home_start_click', { authenticated: Auth.isAuthenticated() });
      if (Auth.isAuthenticated()) {
        window.location.hash = '#/languages';
      } else {
        window.location.hash = '#/signin';
      }
    });
  }
}
