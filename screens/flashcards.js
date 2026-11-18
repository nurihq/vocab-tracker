import { t, getI18nBaseLang, getCachedWordMeaning, fetchWordMeaningTranslation, autoTranslateUi } from '../i18n.js?v=20261118_fix_desktop_drag';
import { getLanguageByCode, getLocalizedLanguageName, formatStudyTextHtml, formatStudyPronunciationHtml, escapeHtml, parseKhmerWordTokens } from '../languages.js?v=20261118_fix_desktop_drag';
import { Api, getLocalStore } from '../api.js?v=20261118_fix_desktop_drag';
import { trackEvent } from '../analytics.js?v=20261118_fix_desktop_drag';
import { navigate } from '../app.js?v=20261118_fix_desktop_drag';
import { openKhmerWordZoomModal } from '../components/khmer-word-modal.js?v=20261118_fix_desktop_drag';

export function renderFlashcardsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const localizedStudyName = getLocalizedLanguageName(langCode, currentBase);
  const localizedBaseName = getLocalizedLanguageName(currentBase, currentBase);

  const mountToken = Symbol('flashcards-screen');
  container.__mountToken = mountToken;
  const isStillMounted = () => {
    if (container.__mountToken !== mountToken) return false;
    const hash = (window.location.hash || '').split('?')[0].replace(/\/+$/, '');
    return hash === `#/languages/${langCode}/decks/${deckId}/study`;
  };

  // Instant optimistic words and decks from local store
  const store = getLocalStore();
  let rawWords = (store.words[langCode] || []).filter(w => deckId === 'all' || w.deckId === deckId);
  let words = [...rawWords];
  let allDecks = store.decks[langCode] || [
    { deckId: 'inbox', name: 'Inbox', icon: '📥', isDefault: true },
    { deckId: 'emotions', name: 'Emotions', icon: '❤️', isDefault: true },
    { deckId: 'verbs', name: 'Verbs', icon: '🏃🏽‍♀️', isDefault: true },
    { deckId: 'adjectives', name: 'Adjectives', icon: '🔥', isDefault: true },
    { deckId: 'nouns', name: 'Nouns', icon: '👘', isDefault: true },
    { deckId: 'colors', name: 'Colors', icon: '🌈', isDefault: true },
    { deckId: 'fruits', name: 'Fruits', icon: '🍏', isDefault: true },
    { deckId: 'numbers', name: 'Numbers', icon: '🔢', isDefault: true },
    { deckId: 'all', name: 'All', icon: '📚', isDefault: true }
  ];

  let currentIndex = 0;
  let isFlipped = false;
  let showFirst = 'study'; // 'study' or 'base'
  let isFinished = false;
  let isShuffled = false;
  let showHints = true;
  try {
    const savedHints = localStorage.getItem('vocab_flashcards_show_hints');
    if (savedHints !== null) showHints = savedHints === 'true';
  } catch (e) {}

  render();

  // Reopen Khmer word zoom modal if returning from the Khmer keyboard
  try {
    const rawZoom = sessionStorage.getItem('khmer_zoom_return_state');
    if (rawZoom) {
      const parsedZoom = JSON.parse(rawZoom);
      const expectedPath = `/languages/${langCode}/decks/${deckId}/study`;
      if (parsedZoom && parsedZoom.route === expectedPath && parsedZoom.wordId) {
        sessionStorage.removeItem('khmer_zoom_return_state');
        const targetIdx = words.findIndex(w => w.wordId === parsedZoom.wordId);
        if (targetIdx !== -1) {
          currentIndex = targetIdx;
          render();
        }
        const targetWord = words.find(w => w.wordId === parsedZoom.wordId);
        if (targetWord) {
          openKhmerWordZoomModal(targetWord, { langCode });
        }
      }
    }
  } catch (err) {}

  // Background refresh
  async function refreshBackground() {
    try {
      const oldDataStr = JSON.stringify(words.map(w => ({ id: w.wordId, study: w.studyWord, base: w.baseWord, deck: w.deckId, order: w.order })));
      const [wordsRes, decksRes] = await Promise.all([
        Api.getWords(langCode, deckId),
        Api.getDecks(langCode)
      ]);
      if (!isStillMounted()) return;
      if (decksRes.decks) allDecks = decksRes.decks;

      const newWords = wordsRes.words || [];
      const newDataStr = JSON.stringify(newWords.map(w => ({ id: w.wordId, study: w.studyWord, base: w.baseWord, deck: w.deckId, order: w.order })));

      // Only update and re-render if data has genuinely changed
      if (newWords.length > 0 && oldDataStr !== newDataStr) {
        const currentWordId = words[currentIndex]?.wordId;
        if (!isShuffled) {
          words = [...newWords];
        } else {
          // If already shuffled, preserve the user's shuffle sequence and merge updated word properties
          const newMap = new Map(newWords.map(w => [w.wordId, w]));
          words = words.map(w => newMap.get(w.wordId) || w);
          const existingIds = new Set(words.map(w => w.wordId));
          for (const nw of newWords) {
            if (!existingIds.has(nw.wordId)) words.push(nw);
          }
        }

        if (currentWordId) {
          const matchIndex = words.findIndex(w => w.wordId === currentWordId);
          if (matchIndex !== -1) {
            currentIndex = matchIndex;
          }
        }
        if (currentIndex >= words.length) currentIndex = Math.max(0, words.length - 1);
        render();
      }
    } catch (err) {
      console.warn('Background flashcards refresh:', err);
    }
  }
  refreshBackground();

  function getDeckDisplayName(dId) {
    if (dId === 'all') return t('all');
    const match = allDecks.find(d => d.deckId === dId);
    const dName = match?.name;
    if (dId === 'inbox') {
      if (!dName || dName === 'Inbox' || dName === 'inbox') return t('inbox') || 'Inbox';
      return dName;
    }
    if (dId === 'emotions') {
      if (!dName || dName === 'Emotions' || dName === 'emotions') return t('emotions') || 'Emotions';
      return dName;
    }
    if (dId === 'verbs') {
      if (!dName || dName === 'Verbs' || dName === 'verbs') return t('verbs') || 'Verbs';
      return dName;
    }
    if (dId === 'adjectives') {
      if (!dName || dName === 'Adjectives' || dName === 'adjectives') return t('adjectives') || 'Adjectives';
      return dName;
    }
    if (dId === 'nouns') {
      if (!dName || dName === 'Nouns' || dName === 'nouns') return t('nouns') || 'Nouns';
      return dName;
    }
    if (dId === 'colors' || dId === 'colours') {
      if (!dName || dName === 'Colors' || dName === 'Colours' || dName === 'colors' || dName === 'colours') return t('colors') || t('colours') || 'Colors';
      return dName;
    }
    if (dId === 'fruits') {
      if (!dName || dName === 'Fruits' || dName === 'fruits') return t('fruits') || 'Fruits';
      return dName;
    }
    if (dId === 'numbers') {
      if (!dName || dName === 'Numbers' || dName === 'numbers') return t('numbers') || 'Numbers';
      return dName;
    }
    if (dId === 'nouns_practice') {
      if (!dName || dName === 'Nouns practice' || dName === 'Nouns (practice)' || dName === 'nouns_practice') return t('nounsPractice') || 'Nouns (practice)';
      return dName;
    }
    if (dId === 'nouns_mastered') {
      if (!dName || dName === 'Nouns mastered' || dName === 'Nouns (mastered)' || dName === 'nouns_mastered') return t('nounsMastered') || 'Nouns (mastered)';
      return dName;
    }
    if (dId === 'practicing') {
      if (!dName || dName === 'Practicing') return t('practicing');
      return dName;
    }
    if (dId === 'mastered') {
      if (!dName || dName === 'Mastered') return t('mastered');
      return dName;
    }
    return dName || dId;
  }

  function shuffleWords() {
    isShuffled = true;
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
    if (document.querySelector('.modal-overlay.is-active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
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
      cardEl.style.transform = '';
      cardEl.style.transition = '';
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
    const hasKhmerScript = (langCode && langCode.toLowerCase() === 'km') || /[\u1780-\u17FF]/.test(currentWord.studyWord || '');
    const khmerTokens = hasKhmerScript ? parseKhmerWordTokens(currentWord.studyWord) : [];

    const renderKhmerHintDetails = (isFront) => {
      if (!hasKhmerScript) return '';
      return `
        <div class="flashcard-hint-row">
          <button type="button" class="flashcard-hint-modal-btn ${isFront ? 'front-hint-btn' : 'back-hint-btn'}" title="View Khmer character breakdown, romanisation & audio">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <span>Romanisation Details</span>
          </button>
        </div>
        ${khmerTokens.length > 0 ? `
          <div class="flashcard-hint-tokens" title="Tap to open full Khmer romanisation breakdown">
            ${khmerTokens.map(tok => `
              <span class="flashcard-hint-token-pill ${tok.series ? `khmer-color-${tok.series}` : 'is-vowel-pill'}">
                <span class="hint-token-glyph">${tok.display}</span>
                ${tok.romaji ? `<span class="hint-token-romaji">${tok.romaji}</span>` : ''}
              </span>
            `).join('')}
          </div>
        ` : ''}
      `;
    };

    const studyPronHtml = formatStudyPronunciationHtml(currentWord.pronunciation, currentWord.studyWord, langCode);
    const frontWord = isStudyFront ? formatStudyTextHtml(currentWord.studyWord) : formatStudyTextHtml(initialBaseMeaning);
    const frontPronunciation = isStudyFront ? studyPronHtml : '';
    const frontTag = isStudyFront ? `${langInfo.flag} ${localizedStudyName}` : localizedBaseName;

    const backWord = isStudyFront ? formatStudyTextHtml(initialBaseMeaning) : formatStudyTextHtml(currentWord.studyWord);
    const backPronunciation = !isStudyFront ? studyPronHtml : '';
    const backTag = !isStudyFront ? `${langInfo.flag} ${localizedStudyName}` : localizedBaseName;

    const targetDecks = allDecks.filter(d => d.deckId !== 'all' && d.deckId !== currentWord.deckId);

    container.innerHTML = `
      <div class="flashcards-container ${showHints ? '' : 'hide-hints'}">
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
              <div class="card-text-main" id="front-card-text" data-study-text="${escapeHtml(isStudyFront ? currentWord.studyWord : initialBaseMeaning)}" ${isStudyFront ? '' : 'data-card-base-text="true"'}>${frontWord}</div>
              ${isStudyFront ? `
                <div class="card-pronunciation-sub front-hint">
                  ${frontPronunciation ? `<div class="flashcard-hint-pron">${frontPronunciation}</div>` : ''}
                  ${renderKhmerHintDetails(true)}
                </div>
              ` : (hasKhmerScript ? `
                <div class="card-pronunciation-sub front-hint">
                  <div class="flashcard-hint-row">
                    <button type="button" class="flashcard-hint-modal-btn front-hint-btn" title="Peek Khmer romanisation & breakdown hint">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                      </svg>
                      <span>Romanisation Hint</span>
                    </button>
                  </div>
                </div>
              ` : '')}
              <div class="card-hint" data-i18n="tapToFlip">${t('tapToFlip')}</div>
            </div>

            <!-- Back Face -->
            <div class="card-face card-face-back">
              <div class="card-lang-indicator">${backTag}</div>
              <div class="card-deck-badge">${currentIndex + 1} / ${words.length}</div>
              <div class="card-text-main" id="back-card-text" data-study-text="${escapeHtml(!isStudyFront ? currentWord.studyWord : initialBaseMeaning)}" ${!isStudyFront ? '' : 'data-card-base-text="true"'}>${backWord}</div>
              ${!isStudyFront ? `
                <div class="card-pronunciation-sub">
                  ${backPronunciation ? `<div class="flashcard-hint-pron">${backPronunciation}</div>` : ''}
                  ${renderKhmerHintDetails(false)}
                </div>
              ` : (backPronunciation ? `
                <div class="card-pronunciation-sub">
                  <div class="flashcard-hint-pron">${backPronunciation}</div>
                </div>
              ` : '')}
              <div class="card-hint" data-i18n="tapToFlipBack">${t('tapToFlipBack')}</div>
            </div>
          </div>
        </div>

        <!-- Utility Bar: Move Select + Hints Checkbox + Current Deck Badge -->
        <div class="flashcards-utility-bar">
          <div class="flashcards-utility-left">
            <select class="move-select flashcard-move-select" id="flashcard-move-select" title="${t('move') || 'Move'}" aria-label="${t('move') || 'Move'}">
              <option value="" disabled selected>${t('move') || 'Move'}...</option>
              ${targetDecks.map(d => `
                <option value="${d.deckId}">${getDeckDisplayName(d.deckId)}</option>
              `).join('')}
            </select>

            <label class="flashcard-hints-toggle" for="flashcard-hints-checkbox">
              <input type="checkbox" id="flashcard-hints-checkbox" ${showHints ? 'checked' : ''}>
              <span data-i18n="hints">${t('hints') || 'Hints'}</span>
            </label>
          </div>

          <span class="flashcard-current-deck-badge" title="${getDeckDisplayName(currentWord.deckId || deckId)}">
            ${getDeckDisplayName(currentWord.deckId || deckId)}
          </span>
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
        if (baseEl) {
          baseEl.textContent = trans;
        }
      }
    });

    // Move Word Event Listener
    const moveSelect = container.querySelector('#flashcard-move-select');
    if (moveSelect) {
      moveSelect.addEventListener('mousedown', (e) => e.stopPropagation());
      moveSelect.addEventListener('pointerdown', (e) => e.stopPropagation());

      moveSelect.addEventListener('change', async (e) => {
        const toDeckId = e.target.value;
        if (!toDeckId) return;

        const movedWord = currentWord;
        const fromDeckId = movedWord.deckId || deckId;
        trackEvent('move_word_flashcard', { langCode, wordId: movedWord.wordId, fromDeckId, toDeckId });

        if (deckId.toLowerCase() !== 'all') {
          // Remove from current study list immediately
          words.splice(currentIndex, 1);
          if (words.length === 0) {
            isFinished = true;
          } else if (currentIndex >= words.length) {
            currentIndex = words.length - 1;
          }
        } else {
          movedWord.deckId = toDeckId;
        }
        isFlipped = false;
        render();

        try {
          await Api.moveWord(langCode, movedWord.wordId, fromDeckId, toDeckId);
        } catch (err) {
          console.error('Failed to move word in flashcards:', err);
        }
      });
    }

    // Hints Toggle Event Listener
    const hintsCheckbox = container.querySelector('#flashcard-hints-checkbox');
    if (hintsCheckbox) {
      hintsCheckbox.addEventListener('mousedown', (e) => e.stopPropagation());
      hintsCheckbox.addEventListener('pointerdown', (e) => e.stopPropagation());
      hintsCheckbox.addEventListener('change', (e) => {
        showHints = e.target.checked;
        try {
          localStorage.setItem('vocab_flashcards_show_hints', showHints ? 'true' : 'false');
        } catch (err) {}
        const flashcardsContainer = container.querySelector('.flashcards-container');
        if (flashcardsContainer) {
          if (showHints) flashcardsContainer.classList.remove('hide-hints');
          else flashcardsContainer.classList.add('hide-hints');
        }
      });
    }

    // Khmer Romanisation Details Hint Modal Listeners
    container.querySelectorAll('.flashcard-hint-modal-btn, .flashcard-hint-tokens, .flashcard-hint-token-pill').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        trackEvent('open_khmer_hint_modal', { langCode, wordId: currentWord.wordId });
        openKhmerWordZoomModal(currentWord, { langCode });
      });
    });

    // Card Gesture & Swipe Controller (Touch + Tap)
    const stage = container.querySelector('#card-stage');
    if (stage) {
      let startX = 0;
      let startY = 0;
      let currentX = 0;
      let currentY = 0;
      let isTouching = false;
      let isHorizontalSwipe = false;
      let isVerticalScroll = false;
      let touchStartTime = 0;
      let lastTouchTapTime = 0;

      stage.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        currentX = touch.clientX;
        currentY = touch.clientY;
        touchStartTime = Date.now();
        isTouching = true;
        isHorizontalSwipe = false;
        isVerticalScroll = false;
      }, { passive: true });

      stage.addEventListener('touchmove', (e) => {
        if (!isTouching || e.touches.length !== 1) return;
        const touch = e.touches[0];
        currentX = touch.clientX;
        currentY = touch.clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        // Disambiguate horizontal swipe vs vertical scroll
        if (!isHorizontalSwipe && !isVerticalScroll) {
          if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            isHorizontalSwipe = true;
          } else if (Math.abs(deltaY) > 12) {
            isVerticalScroll = true;
          }
        }

        if (isHorizontalSwipe) {
          if (e.cancelable) e.preventDefault();
          const cardEl = container.querySelector('#active-flashcard');
          if (cardEl) {
            cardEl.style.transition = 'none';
            const baseFlip = isFlipped ? 'rotateY(180deg) ' : '';
            const rotateDeg = Math.max(-14, Math.min(14, deltaX * 0.05));
            cardEl.style.transform = `${baseFlip}translateX(${deltaX}px) rotateZ(${rotateDeg}deg)`;
          }
        }
      }, { passive: false });

      stage.addEventListener('touchend', (e) => {
        if (!isTouching) return;
        isTouching = false;

        const cardEl = container.querySelector('#active-flashcard');
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        const elapsed = Date.now() - touchStartTime;

        if (isHorizontalSwipe && cardEl) {
          lastTouchTapTime = Date.now();
          const threshold = 55;
          const isQuickFlick = elapsed < 280 && Math.abs(deltaX) > 35;

          if (deltaX < -threshold || (deltaX < -35 && isQuickFlick)) {
            // Swipe Left -> Next Card
            cardEl.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
            const baseFlip = isFlipped ? 'rotateY(180deg) ' : '';
            cardEl.style.transform = `${baseFlip}translateX(-120%) rotateZ(-12deg)`;
            cardEl.style.opacity = '0';
            setTimeout(() => {
              nextCard();
            }, 180);
            return;
          } else if (deltaX > threshold || (deltaX > 30 && isQuickFlick)) {
            // Swipe Right -> Previous Card
            if (currentIndex > 0) {
              cardEl.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
              const baseFlip = isFlipped ? 'rotateY(180deg) ' : '';
              cardEl.style.transform = `${baseFlip}translateX(120%) rotateZ(12deg)`;
              cardEl.style.opacity = '0';
              setTimeout(() => {
                prevCard();
              }, 180);
              return;
            } else {
              // Resistance snap back
              cardEl.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
              cardEl.style.transform = '';
            }
          } else {
            // Snap back to center
            cardEl.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
            cardEl.style.transform = '';
          }
        } else if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
        }

        // Tap detected: If user didn't swipe horizontally or scroll vertically, and movement was minimal (< 22px)
        if (!isHorizontalSwipe && !isVerticalScroll && Math.abs(deltaX) < 22 && Math.abs(deltaY) < 22) {
          // If finger was held down (long press >= 380ms, e.g. copying Khmer text), do not flip card
          if (elapsed >= 380) return;
          if (e.target.closest?.('button, a, select, input, .flashcard-hint-modal-btn, .flashcard-hint-tokens, .flashcard-hint-token-pill, .khmer-zoom-token-pill, .khmer-zoom-token-speak-btn')) {
            return;
          }
          lastTouchTapTime = Date.now();
          if (e && e.cancelable) e.preventDefault();
          flipCard();
        }
      });

      stage.addEventListener('touchcancel', () => {
        isTouching = false;
        isHorizontalSwipe = false;
        isVerticalScroll = false;
        const cardEl = container.querySelector('#active-flashcard');
        if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
        }
      });

      // Desktop click handler (and fallback if touch was not consumed)
      stage.addEventListener('click', (e) => {
        if (e.target.closest?.('button, a, select, input, .flashcard-hint-modal-btn, .flashcard-hint-tokens, .flashcard-hint-token-pill, .khmer-zoom-token-pill, .khmer-zoom-token-speak-btn')) {
          return;
        }
        // Prevent duplicate flip if this click is a synthetic event from a touch tap in the last 600ms
        if (Date.now() - lastTouchTapTime < 600) return;
        // If user highlighted / selected text on desktop, do not flip
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) return;
        flipCard();
      });
    }

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
