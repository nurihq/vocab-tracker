import { t, getI18nBaseLang, autoTranslateUi } from '../i18n.js';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Api, getLocalStore } from '../api.js';
import { trackEvent } from '../analytics.js';
import { navigate } from '../app.js';

export function renderFlashcardsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedLangName = getLocalizedLanguageName(langCode, currentBase);

  // Instant optimistic words from local store
  const store = getLocalStore();
  let rawWords = (store.words[langCode] || []).filter(w => deckId === 'all' || w.deckId === deckId);
  let words = [...rawWords];
  let currentIndex = 0;
  let isFlipped = false;
  let showFirst = 'study'; // 'study' or 'base'
  let isFinished = false;

  render();

  // Background refresh
  async function refreshBackground() {
    try {
      const res = await Api.getWords(langCode, deckId);
      if (res.words && res.words.length > 0) {
        words = [...res.words];
        if (currentIndex >= words.length) currentIndex = 0;
        render();
      }
    } catch (err) {
      console.warn('Background flashcards refresh:', err);
    }
  }
  refreshBackground();

  function shuffleWords() {
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    currentIndex = 0;
    isFlipped = false;
    isFinished = false;
    trackEvent('card_shuffle', { langCode, deckId, totalCards: words.length });
    render();
  }

  function handleKey(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      nextCard();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      prevCard();
    }
  }

  function flipCard() {
    isFlipped = !isFlipped;
    const currentWord = words[currentIndex];
    trackEvent('card_flip', { 
      langCode, 
      deckId, 
      wordId: currentWord?.wordId, 
      isFlipped,
      cardIndex: currentIndex + 1
    });
    
    const inner = container.querySelector('.flashcard-inner');
    if (inner) {
      if (isFlipped) inner.classList.add('is-flipped');
      else inner.classList.remove('is-flipped');
    }
  }

  function nextCard() {
    if (currentIndex < words.length - 1) {
      currentIndex++;
      isFlipped = false;
      trackEvent('card_next', { langCode, deckId, cardIndex: currentIndex + 1 });
      render();
    } else {
      isFinished = true;
      trackEvent('deck_finished', { langCode, deckId, totalCards: words.length });
      render();
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      currentIndex--;
      isFlipped = false;
      trackEvent('card_prev', { langCode, deckId, cardIndex: currentIndex + 1 });
      render();
    }
  }

  function render() {
    if (words.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p data-i18n="noWordsYet">${t('noWordsYet')}</p>
          <a href="#/languages/${langCode}/decks/${deckId}" class="btn btn-secondary" style="margin-top: 1rem;" data-i18n="backToDeck">
            ${t('backToDeck')}
          </a>
        </div>
      `;
      autoTranslateUi(container);
      return;
    }

    if (isFinished) {
      container.innerHTML = `
        <div class="empty-state" style="animation: fadeIn 0.4s ease;">
          <span style="font-size: 3rem; margin-bottom: 1rem; display: block;">🎉</span>
          <h2 style="font-family: var(--font-display); font-size: 1.75rem; margin-bottom: 0.5rem;" data-i18n="deckFinished">
            ${t('deckFinished')}
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            ${words.length} ${words.length === 1 ? t('word') : t('words')} completed.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <button class="btn btn-primary" id="study-again-btn" data-i18n="studyAgain">
              ${t('studyAgain')}
            </button>
            <a href="#/languages/${langCode}/decks/${deckId}" class="btn btn-secondary" data-i18n="backToDeck">
              ${t('backToDeck')}
            </a>
          </div>
        </div>
      `;
      autoTranslateUi(container);

      const studyAgainBtn = container.querySelector('#study-again-btn');
      if (studyAgainBtn) {
        studyAgainBtn.addEventListener('click', () => {
          isFinished = false;
          currentIndex = 0;
          isFlipped = false;
          trackEvent('study_again_click', { langCode, deckId });
          render();
        });
      }
      return;
    }

    const currentWord = words[currentIndex];
    const progressPercent = ((currentIndex + 1) / words.length) * 100;

    const isStudyFront = showFirst === 'study';
    const frontWord = isStudyFront ? currentWord.studyWord : (currentWord.baseWord || '...');
    const frontPronunciation = isStudyFront ? currentWord.pronunciation : '';
    const frontTag = isStudyFront ? `${langInfo.flag} ${localizedLangName}` : t('baseLanguage');

    const backWord = isStudyFront ? (currentWord.baseWord || '...') : currentWord.studyWord;
    const backPronunciation = !isStudyFront ? currentWord.pronunciation : '';
    const backTag = !isStudyFront ? `${langInfo.flag} ${localizedLangName}` : t('baseLanguage');

    container.innerHTML = `
      <div class="flashcard-screen">
        <div class="flashcard-toolbar">
          <div class="show-first-toggle">
            <span style="font-size: 0.85rem; color: var(--text-secondary);" data-i18n="showFirst">${t('showFirst')}:</span>
            <select class="form-input" id="show-first-select" style="padding: 0.35rem 0.75rem; font-size: 0.85rem;">
              <option value="study" ${showFirst === 'study' ? 'selected' : ''}>${t('studyFirst')}</option>
              <option value="base" ${showFirst === 'base' ? 'selected' : ''}>${t('baseFirst')}</option>
            </select>
          </div>

          <button class="btn btn-secondary btn-sm" id="shuffle-btn" data-i18n="shuffle">
            🔀 ${t('shuffle')}
          </button>
        </div>

        <div class="flashcard-progress">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
          </div>
          <div class="progress-text">
            ${t('cardCount', { current: currentIndex + 1, total: words.length })}
          </div>
        </div>

        <div class="flashcard-stage" id="card-stage">
          <div class="flashcard-inner ${isFlipped ? 'is-flipped' : ''}">
            <!-- Front Face -->
            <div class="flashcard-face flashcard-front">
              <div class="flashcard-lang-tag">${frontTag}</div>
              <div class="flashcard-main-text">${frontWord}</div>
              ${frontPronunciation ? `<div class="flashcard-pronunciation-text">${frontPronunciation}</div>` : ''}
              <div class="flashcard-hint" data-i18n="tapToFlip">${t('tapToFlip')}</div>
            </div>

            <!-- Back Face -->
            <div class="flashcard-face flashcard-back">
              <div class="flashcard-lang-tag">${backTag}</div>
              <div class="flashcard-main-text">${backWord}</div>
              ${backPronunciation ? `<div class="flashcard-pronunciation-text">${backPronunciation}</div>` : ''}
              <div class="flashcard-hint" data-i18n="tapToFlipBack">${t('tapToFlipBack')}</div>
            </div>
          </div>
        </div>

        <div class="flashcard-controls">
          <button class="btn btn-secondary btn-lg" id="prev-card-btn" ${currentIndex === 0 ? 'disabled' : ''} data-i18n="prevCard">
            ← ${t('prevCard')}
          </button>
          <button class="btn btn-primary btn-lg" id="flip-card-btn" data-i18n="flipCard">
            🔄 ${t('flipCard')}
          </button>
          <button class="btn btn-secondary btn-lg" id="next-card-btn">
            <span data-i18n="nextCard">${t('nextCard')}</span> →
          </button>
        </div>

        <div class="keyboard-shortcuts" data-i18n="keyboardTips">
          ${t('keyboardTips')}
        </div>
      </div>
    `;

    autoTranslateUi(container);

    // Event Listeners
    const stage = container.querySelector('#card-stage');
    if (stage) stage.addEventListener('click', flipCard);

    const flipBtn = container.querySelector('#flip-card-btn');
    if (flipBtn) flipBtn.addEventListener('click', flipCard);

    const nextBtn = container.querySelector('#next-card-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextCard);

    const prevBtn = container.querySelector('#prev-card-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevCard);

    const shuffleBtn = container.querySelector('#shuffle-btn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleWords);

    const showFirstSelect = container.querySelector('#show-first-select');
    if (showFirstSelect) {
      showFirstSelect.addEventListener('change', (e) => {
        showFirst = e.target.value;
        isFlipped = false;
        trackEvent('change_show_first', { langCode, deckId, showFirst });
        render();
      });
    }

    // Keyboard Shortcuts
    window.removeEventListener('keydown', handleKey);
    window.addEventListener('keydown', handleKey);
  }
}
