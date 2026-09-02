import { t, getI18nBaseLang, getCachedWordMeaning, fetchWordMeaningTranslation, autoTranslateUi } from '../i18n.js';
import { getLanguageByCode, getLocalizedLanguageName } from '../languages.js';
import { Api, getLocalStore } from '../api.js';
import { trackEvent } from '../analytics.js';
import { navigate } from '../app.js';

export function renderFlashcardsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedStudyName = getLocalizedLanguageName(langCode, currentBase);
  const localizedBaseName = getLocalizedLanguageName(currentBase, currentBase);

  const isStillMounted = () => window.location.hash.startsWith(`#/languages/${langCode}/decks/${deckId}/study`);

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
      if (!isStillMounted()) return;
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
    
    const cardEl = container.querySelector('#active-flashcard');
    if (cardEl) {
      if (isFlipped) cardEl.classList.add('flipped');
      else cardEl.classList.remove('flipped');
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
    if (!isStillMounted()) return;

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
    const initialBaseMeaning = getCachedWordMeaning(currentWord.studyWord, currentWord.baseWord, langCode, currentBase);

    const isStudyFront = showFirst === 'study';
    const frontWord = isStudyFront ? currentWord.studyWord : initialBaseMeaning;
    const frontPronunciation = isStudyFront ? currentWord.pronunciation : '';
    const frontTag = isStudyFront ? `${langInfo.flag} ${localizedStudyName}` : localizedBaseName;

    const backWord = isStudyFront ? initialBaseMeaning : currentWord.studyWord;
    const backPronunciation = !isStudyFront ? currentWord.pronunciation : '';
    const backTag = !isStudyFront ? `${langInfo.flag} ${localizedStudyName}` : localizedBaseName;

    container.innerHTML = `
      <div class="flashcards-container">
        <!-- Top Controls: Show First Toggle & Shuffle -->
        <div class="flashcards-controls-top">
          <div class="lang-toggle-pill">
            <button class="lang-toggle-btn ${showFirst === 'study' ? 'active' : ''}" id="toggle-study-first-btn">
              ${langInfo.flag} ${localizedStudyName}
            </button>
            <button class="lang-toggle-btn ${showFirst === 'base' ? 'active' : ''}" id="toggle-base-first-btn">
              ${localizedBaseName}
            </button>
          </div>

          <button class="icon-btn" id="shuffle-btn" title="${t('shuffle')}" style="font-size: 0.85rem; width: auto; padding: 0 0.75rem; gap: 0.35rem; display: flex;">
            🔀 <span data-i18n="shuffle">${t('shuffle')}</span>
          </button>
        </div>

        <!-- 3D Interactive Card Stage -->
        <div class="card-stage" id="card-stage">
          <div class="flashcard ${isFlipped ? 'flipped' : ''}" id="active-flashcard">
            <!-- Front Face -->
            <div class="card-face">
              <div class="card-lang-indicator">${frontTag}</div>
              <div class="card-deck-badge">${currentIndex + 1} / ${words.length}</div>
              <div class="card-text-main" ${isStudyFront ? '' : 'data-card-base-text="true"'}>${frontWord}</div>
              ${frontPronunciation ? `<div class="card-pronunciation-sub">${frontPronunciation}</div>` : ''}
              <div class="card-hint" data-i18n="tapToFlip">${t('tapToFlip')}</div>
            </div>

            <!-- Back Face -->
            <div class="card-face card-face-back">
              <div class="card-lang-indicator">${backTag}</div>
              <div class="card-deck-badge">${currentIndex + 1} / ${words.length}</div>
              <div class="card-text-main" ${!isStudyFront ? '' : 'data-card-base-text="true"'}>${backWord}</div>
              ${backPronunciation ? `<div class="card-pronunciation-sub">${backPronunciation}</div>` : ''}
              <div class="card-hint" data-i18n="tapToFlipBack">${t('tapToFlipBack')}</div>
            </div>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flashcards-nav-actions">
          <button class="btn btn-secondary" id="prev-card-btn" ${currentIndex === 0 ? 'disabled' : ''} style="flex: 1;">
            ← <span data-i18n="prevCard">${t('prevCard')}</span>
          </button>
          <button class="btn btn-primary" id="flip-card-btn" style="flex: 1.4;">
            🔄 <span data-i18n="flipCard">${t('flipCard')}</span>
          </button>
          <button class="btn btn-secondary" id="next-card-btn" style="flex: 1;">
            <span data-i18n="nextCard">${t('nextCard')}</span> →
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="keyboard-shortcuts" style="margin-top: 1.25rem; font-size: 0.78rem; color: var(--text-muted); text-align: center;" data-i18n="keyboardTips">
          ${t('keyboardTips')}
        </div>
      </div>
    `;

    autoTranslateUi(container);

    // Asynchronously resolve and update base meaning if not yet in cache
    fetchWordMeaningTranslation(currentWord.studyWord, currentWord.baseWord, langCode, currentBase).then(trans => {
      if (!isStillMounted()) return;
      if (trans) {
        const baseEl = container.querySelector('[data-card-base-text="true"]');
        if (baseEl && baseEl.textContent !== trans) {
          baseEl.textContent = trans;
        }
      }
    });

    // Event Listeners
    const stage = container.querySelector('#card-stage');
    if (stage) stage.addEventListener('click', flipCard);

    const flipBtn = container.querySelector('#flip-card-btn');
    if (flipBtn) flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      flipCard();
    });

    const nextBtn = container.querySelector('#next-card-btn');
    if (nextBtn) nextBtn.addEventListener('click', nextCard);

    const prevBtn = container.querySelector('#prev-card-btn');
    if (prevBtn) prevBtn.addEventListener('click', prevCard);

    const shuffleBtn = container.querySelector('#shuffle-btn');
    if (shuffleBtn) shuffleBtn.addEventListener('click', shuffleWords);

    const studyFirstBtn = container.querySelector('#toggle-study-first-btn');
    if (studyFirstBtn) {
      studyFirstBtn.addEventListener('click', () => {
        if (showFirst !== 'study') {
          showFirst = 'study';
          isFlipped = false;
          trackEvent('change_show_first', { langCode, deckId, showFirst });
          render();
        }
      });
    }

    const baseFirstBtn = container.querySelector('#toggle-base-first-btn');
    if (baseFirstBtn) {
      baseFirstBtn.addEventListener('click', () => {
        if (showFirst !== 'base') {
          showFirst = 'base';
          isFlipped = false;
          trackEvent('change_show_first', { langCode, deckId, showFirst });
          render();
        }
      });
    }

    // Keyboard Shortcuts
    window.removeEventListener('keydown', handleKey);
    window.addEventListener('keydown', handleKey);
  }
}
