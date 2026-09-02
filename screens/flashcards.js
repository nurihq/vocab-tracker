import { t, getI18nBaseLang, fetchLiveTranslation } from '../i18n.js';
import { getLanguageByCode } from '../languages.js';
import { Api } from '../api.js';

export async function renderFlashcardsScreen(container, params = {}) {
  const langCode = params.code || 'ja';
  const deckId = params.deckId || 'practicing';
  const langInfo = getLanguageByCode(langCode);
  const currentBase = getI18nBaseLang();
  const baseLangInfo = getLanguageByCode(currentBase);

  let words = [];
  let allDecks = [];
  let currentIndex = 0;
  let isFlipped = false;
  let showStudyFirst = true;
  let keydownHandler = null;

  async function loadData() {
    try {
      const [wordsRes, decksRes] = await Promise.all([
        Api.getWords(langCode, deckId, 'custom'),
        Api.getDecks(langCode)
      ]);
      words = wordsRes.words || [];
      allDecks = decksRes.decks || [];
      currentIndex = 0;
      isFlipped = false;

      // Translate words into active base language
      for (const w of words) {
        fetchLiveTranslation(w.studyWord, currentBase).then(trans => {
          if (trans && trans !== w.studyWord) {
            w.baseWord = trans;
            const el = container.querySelector(`[data-card-base-id="${w.wordId}"]`);
            if (el) el.textContent = trans;
          }
        });
      }

      render();
    } catch (err) {
      console.error('Failed to load flashcards:', err);
    }
  }

  function getDeckDisplayName(dId) {
    if (dId === 'practicing') return t('practicing');
    if (dId === 'mastered') return t('mastered');
    if (dId === 'all') return t('all');
    const match = allDecks.find(d => d.deckId === dId);
    return match ? match.name : dId;
  }

  function render() {
    if (keydownHandler) {
      window.removeEventListener('keydown', keydownHandler);
      keydownHandler = null;
    }

    if (words.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 3rem;">
          <div class="empty-icon">📭</div>
          <h3>${t('noWordsYet')}</h3>
          <p style="margin-bottom: 1.5rem; max-width: 400px; color: var(--text-secondary);">
            Add some vocabulary words to this deck to unlock flash card study mode.
          </p>
          <a href="#/languages/${langCode}/decks/${deckId}" class="btn btn-primary">
            ${t('backToDeck')}
          </a>
        </div>
      `;
      return;
    }

    const currentWord = words[currentIndex];
    const isCompleted = currentIndex >= words.length;

    if (isCompleted) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 3rem;">
          <div class="empty-icon">🎉</div>
          <h2 style="font-family: var(--font-serif); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">${t('deckFinished')}</h2>
          <p style="margin-bottom: 2rem; color: var(--text-secondary);">
            You have reviewed all ${words.length} cards in this deck.
          </p>
          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-primary" id="restart-study-btn">${t('studyAgain')}</button>
            <a href="#/languages/${langCode}/decks/${deckId}" class="btn btn-secondary">${t('backToDeck')}</a>
          </div>
        </div>
      `;

      container.querySelector('#restart-study-btn').addEventListener('click', () => {
        currentIndex = 0;
        isFlipped = false;
        render();
      });
      return;
    }

    const frontMain = showStudyFirst ? currentWord.studyWord : currentWord.baseWord;
    const frontSub = showStudyFirst ? currentWord.pronunciation : '';

    const backMain = showStudyFirst ? currentWord.baseWord : currentWord.studyWord;
    const backSub = showStudyFirst ? '' : currentWord.pronunciation;

    const frontLangLabel = showStudyFirst ? `${langInfo.flag} ${langInfo.name}` : `${baseLangInfo?.flag || '🌐'} ${t('baseLanguage')}`;
    const backLangLabel = showStudyFirst ? `${baseLangInfo?.flag || '🌐'} ${t('baseLanguage')}` : `${langInfo.flag} ${langInfo.name}`;

    const progressPercent = Math.round(((currentIndex + 1) / words.length) * 100);

    container.innerHTML = `
      <div class="flashcards-container">
        <!-- Top Toolbar -->
        <div class="flashcards-controls-top">
          <div class="lang-toggle-pill">
            <button class="lang-toggle-btn ${showStudyFirst ? 'active' : ''}" id="toggle-study-first">
              ${langInfo.flag} ${t('studyFirst')}
            </button>
            <button class="lang-toggle-btn ${!showStudyFirst ? 'active' : ''}" id="toggle-base-first">
              ${baseLangInfo?.flag || '🌐'} ${t('baseFirst')}
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button class="btn btn-secondary btn-sm" id="shuffle-cards-btn" title="${t('shuffle')}">
              🔀 ${t('shuffle')}
            </button>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">
              ${t('cardCount', { current: currentIndex + 1, total: words.length })}
            </span>
          </div>
        </div>

        <!-- 3D Flippable Flashcard -->
        <div class="card-stage" id="card-stage">
          <div class="flashcard ${isFlipped ? 'flipped' : ''}" id="flashcard-el">
            <!-- Front Face -->
            <div class="card-face card-face-front">
              <span class="card-lang-indicator">${frontLangLabel}</span>
              <span class="card-deck-badge">${getDeckDisplayName(currentWord.deckId)}</span>
              
              <div class="card-text-main">${frontMain}</div>
              ${frontSub ? `<div class="card-pronunciation-sub">${frontSub}</div>` : ''}

              <span class="card-hint">Tap card or press [Space] to flip</span>
            </div>

            <!-- Back Face -->
            <div class="card-face card-face-back">
              <span class="card-lang-indicator">${backLangLabel}</span>
              <span class="card-deck-badge">${getDeckDisplayName(currentWord.deckId)}</span>
              
              <div class="card-text-main" data-card-base-id="${currentWord.wordId}">${backMain}</div>
              ${backSub ? `<div class="card-pronunciation-sub">${backSub}</div>` : ''}

              <span class="card-hint">Tap card to flip back</span>
            </div>
          </div>
        </div>

        <!-- Bottom Action Bar -->
        <div class="flashcards-nav-actions">
          <button class="btn btn-secondary" id="prev-card-btn" ${currentIndex === 0 ? 'disabled style="opacity: 0.4;"' : ''}>
            ← ${t('prevCard')}
          </button>

          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn btn-primary" id="flip-card-btn">
              🔄 ${t('flipCard')}
            </button>

            <select class="move-select" id="card-move-dropdown" style="padding: 0.65rem 0.85rem;" title="${t('moveWord')}">
              <option value="" disabled selected>${t('moveWord')}...</option>
              ${allDecks.filter(d => d.deckId !== 'all').map(d => `
                <option value="${d.deckId}" ${d.deckId === currentWord.deckId ? 'disabled' : ''}>
                  ${d.deckId === currentWord.deckId ? '✓ ' : ''}${getDeckDisplayName(d.deckId)}
                </option>
              `).join('')}
            </select>
          </div>

          <button class="btn btn-primary" id="next-card-btn">
            ${t('nextCard')} →
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
        </div>

        <div class="keyboard-shortcut-hint">
          ${t('keyboardTips')}
        </div>
      </div>
    `;

    const cardEl = container.querySelector('#flashcard-el');
    const stageEl = container.querySelector('#card-stage');
    const flipBtn = container.querySelector('#flip-card-btn');

    function toggleFlip() {
      isFlipped = !isFlipped;
      if (cardEl) {
        if (isFlipped) cardEl.classList.add('flipped');
        else cardEl.classList.remove('flipped');
      }
    }

    if (stageEl) stageEl.addEventListener('click', toggleFlip);
    if (flipBtn) flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFlip();
    });

    const nextBtn = container.querySelector('#next-card-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentIndex < words.length) {
          currentIndex++;
          isFlipped = false;
          render();
        }
      });
    }

    const prevBtn = container.querySelector('#prev-card-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          isFlipped = false;
          render();
        }
      });
    }

    container.querySelector('#toggle-study-first').addEventListener('click', () => {
      showStudyFirst = true;
      isFlipped = false;
      render();
    });
    container.querySelector('#toggle-base-first').addEventListener('click', () => {
      showStudyFirst = false;
      isFlipped = false;
      render();
    });

    container.querySelector('#shuffle-cards-btn').addEventListener('click', () => {
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      currentIndex = 0;
      isFlipped = false;
      render();
    });

    const moveDropdown = container.querySelector('#card-move-dropdown');
    if (moveDropdown) {
      moveDropdown.addEventListener('change', async (e) => {
        const targetDeck = e.target.value;
        if (!targetDeck || targetDeck === currentWord.deckId) return;

        try {
          await Api.moveWord(langCode, currentWord.wordId, currentWord.deckId, targetDeck);
          currentWord.deckId = targetDeck;
          currentIndex = Math.min(currentIndex, words.length - 1);
          render();
        } catch (err) {
          console.error('Failed to move word:', err);
        }
      });
    }

    keydownHandler = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < words.length) {
          currentIndex++;
          isFlipped = false;
          render();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          currentIndex--;
          isFlipped = false;
          render();
        }
      }
    };
    window.addEventListener('keydown', keydownHandler);
  }

  await loadData();
}
