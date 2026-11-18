import { t, getI18nBaseLang, fetchLiveTranslation, autoTranslateUi } from '../i18n.js?v=20261116_standardize_khmer_font';
import { getLanguageByCode, getLocalizedLanguageName, getLanguageGreeting, formatStudyTextHtml } from '../languages.js?v=20261116_standardize_khmer_font';
import { Auth, Api, getRecentStudyLanguages, recordLanguageUsage } from '../api.js?v=20261118_new_default_decks_inbox_emotions';
import { trackEvent } from '../analytics.js?v=20261116_standardize_khmer_font';
import { navigate } from '../app.js?v=20261116_standardize_khmer_font';

export function renderHomeScreen(container) {
  const currentBase = getI18nBaseLang();
  const baseLangInfo = getLanguageByCode(currentBase);
  const localizedBaseName = getLocalizedLanguageName(currentBase, currentBase);
  const isLoggedIn = Auth.isAuthenticated();

  // Pool of flippy preview cards for signed-out users
  const CARD_POOL = [
    { langCode: 'ja', word: 'こんにちは', pronunciation: 'konnichiwa', baseMeaning: 'Hello' },
    { langCode: 'ka', word: 'გამარჯობა', pronunciation: 'gamarjoba', baseMeaning: 'Hello' },
    { langCode: 'es', word: '¡Hola!', pronunciation: 'oh-lah', baseMeaning: 'Hello' },
    { langCode: 'id', word: 'Terima kasih', pronunciation: 'te-ri-ma ka-sih', baseMeaning: 'Thank you' },
    { langCode: 'fr', word: 'Bonjour', pronunciation: 'bohn-zhoor', baseMeaning: 'Hello' },
    { langCode: 'de', word: 'Guten Tag', pronunciation: 'goo-ten tahk', baseMeaning: 'Good day' }
  ];

  // For signed-out users: filter out any card that matches user's active base language, take top 3
  const activeCards = CARD_POOL
    .filter(c => c.langCode.toLowerCase() !== currentBase.toLowerCase().split('-')[0])
    .slice(0, 3);

  // For logged-in users: get up to top 3 most recent study languages
  const recentLanguages = isLoggedIn ? getRecentStudyLanguages(3) : [];

  let previewCardsHtml = '';

  if (isLoggedIn) {
    if (recentLanguages.length > 0) {
      previewCardsHtml = recentLanguages.map((lang, idx) => {
        const langInfo = getLanguageByCode(lang.code) || lang;
        const localizedStudyName = getLocalizedLanguageName(lang.code, currentBase);
        const greeting = getLanguageGreeting(lang.code);
        const wordCount = lang.wordCount ?? 0;

        return `
          <div class="home-card-stage is-recent-card" 
               data-card-idx="${idx}" 
               data-lang="${lang.code}" 
               role="button" 
               tabindex="0" 
               title="${localizedStudyName} — ${t('decks')}">
            <div class="home-card-inner">
              <div class="home-card-face home-card-front is-recent-face">
                <div class="home-card-top-tag">
                  <span>${langInfo.flag || '🌐'}</span>
                  <span>${localizedStudyName}</span>
                </div>
                <div class="home-card-word">${formatStudyTextHtml(greeting.word)}</div>
                <div class="home-card-pronunciation">${greeting.pronunciation || langInfo.nativeName || ''}</div>
                ${wordCount > 0 ? `
                  <div class="home-card-badge-row">
                    <span class="home-card-count-badge">${wordCount} ${wordCount === 1 ? (t('word') || 'word') : (t('words') || 'words')}</span>
                  </div>
                ` : ''}
                <div class="home-card-hint home-card-deck-hint">
                  <span data-i18n="decks">${t('decks')}</span> <span class="action-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // If user has fewer than 3 study languages, provide a clean "+ Add Language" card to fill the stage
      if (recentLanguages.length < 3) {
        previewCardsHtml += `
          <div class="home-card-stage is-recent-card is-empty-add-card" 
               role="button" 
               tabindex="0" 
               title="${t('addLanguage')}">
            <div class="home-card-inner">
              <div class="home-card-face home-card-front is-recent-face">
                <div class="home-card-add-icon">+</div>
                <div class="home-card-word" style="font-size: 1.05rem;" data-i18n="addLanguage">${t('addLanguage')}</div>
                <div class="home-card-pronunciation" data-i18n="chooseLanguage">${t('chooseLanguage') || 'Choose a language'}</div>
                <div class="home-card-hint home-card-deck-hint">
                  <span data-i18n="startLearning">${t('startLearning')}</span> <span class="action-arrow">→</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    } else {
      // Logged in, but 0 study languages yet
      previewCardsHtml = `
        <div class="home-card-stage is-recent-card is-empty-add-card" 
             role="button" 
             tabindex="0" 
             title="${t('addLanguage')}">
          <div class="home-card-inner">
            <div class="home-card-face home-card-front is-recent-face">
              <div class="home-card-add-icon">+</div>
              <div class="home-card-word" style="font-size: 1.05rem;" data-i18n="addLanguage">${t('addLanguage')}</div>
              <div class="home-card-pronunciation" data-i18n="chooseLanguage">${t('chooseLanguage') || 'Choose a language'}</div>
              <div class="home-card-hint home-card-deck-hint">
                <span data-i18n="startLearning">${t('startLearning')}</span> <span class="action-arrow">→</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    // Signed-out users: Keep the 3D flippy preview cards!
    previewCardsHtml = activeCards.map((card, idx) => {
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
              <div class="home-card-hint" data-i18n="tapToFlip">${t('tapToFlip')}</div>
            </div>

            <!-- Back Side: Base Language Translation -->
            <div class="home-card-face home-card-back">
              <div class="home-card-top-tag">
                <span>${baseLangInfo?.flag || '🌐'}</span>
                <span>${localizedBaseName}</span>
              </div>
              <div class="home-card-word" data-home-trans-id="${card.langCode}">${card.baseMeaning}</div>
              <div class="home-card-hint" data-i18n="tapToFlipBack">${t('tapToFlipBack')}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

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

      <!-- Preview Cards: Recent Languages (when logged in) or Flippable Preview (when signed out) -->
      <div class="hero-preview-cards" id="hero-cards-container">
        ${previewCardsHtml}
      </div>
    </div>
  `;

  if (!isLoggedIn) {
    // Dynamically translate meanings on cards to active base language for signed-out flippy cards
    activeCards.forEach(card => {
      fetchLiveTranslation(card.baseMeaning, currentBase).then(translated => {
        if (translated && translated !== card.baseMeaning) {
          const transEl = container.querySelector(`[data-home-trans-id="${card.langCode}"]`);
          if (transEl) transEl.textContent = translated;
        }
      });
    });

    // Enable 3D flip on click with event tracking for signed-out users
    container.querySelectorAll('.home-card-stage:not(.is-recent-card)').forEach(stage => {
      stage.addEventListener('click', () => {
        stage.classList.toggle('is-flipped');
        const lang = stage.getAttribute('data-lang');
        const word = stage.getAttribute('data-word');
        trackEvent('home_card_flip', { langCode: lang, word });
      });
    });
  } else {
    // Logged in: navigate to decks of that language instead of flipping
    container.querySelectorAll('.home-card-stage.is-recent-card').forEach(stage => {
      const handleSelect = () => {
        const lang = stage.getAttribute('data-lang');
        if (lang) {
          trackEvent('home_recent_language_click', { langCode: lang });
          recordLanguageUsage(lang);
          sessionStorage.setItem('vocab_decks_back_source', 'home');
          navigate(`#/languages/${lang}/decks`);
        } else if (stage.classList.contains('is-empty-add-card')) {
          trackEvent('home_add_language_click');
          sessionStorage.setItem('vocab_decks_back_source', 'languages');
          navigate('#/languages');
        }
      };

      stage.addEventListener('click', handleSelect);
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      });
    });

    // Background async refresh in case cloud languages updated
    Api.getLanguages().then(res => {
      if (res && res.languages) {
        const updatedRecent = getRecentStudyLanguages(3);
        const currentCodes = Array.from(container.querySelectorAll('.home-card-stage.is-recent-card[data-lang]'))
          .map(el => el.getAttribute('data-lang'));
        const newCodes = updatedRecent.map(l => l.code);
        if (JSON.stringify(currentCodes) !== JSON.stringify(newCodes)) {
          const rawHash = (window.location.hash || '').replace(/\/+$/, '');
          if (rawHash === '' || rawHash === '#' || rawHash === '#/') {
            renderHomeScreen(container);
          }
        }
      }
    }).catch(() => {});
  }

  // Dynamically translate all UI text across the page for all 100+ languages
  autoTranslateUi(container);

  const startBtn = container.querySelector('#home-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      trackEvent('home_start_click', { authenticated: Auth.isAuthenticated() });
      if (Auth.isAuthenticated()) {
        sessionStorage.setItem('vocab_decks_back_source', 'languages');
        navigate('/languages');
      } else {
        navigate('/signin');
      }
    });
  }
}

