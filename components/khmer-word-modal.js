import { escapeHtml, formatStudyTextHtml, parseKhmerWordTokens } from '../languages.js?v=20261118_unified_nav_fix';
import { copyToClipboard, showCopiedTooltip, speakKhmer } from '../api.js?v=20261118_unified_nav_fix';
import { trackEvent } from '../analytics.js?v=20261118_unified_nav_fix';

export function getKhmerTokenSpeakText(tok) {
  if (!tok) return '';
  if (tok.speakText) return tok.speakText;
  if (tok.kind === 'subscript') return tok.char.slice(1);
  if (tok.kind === 'vowel') {
    const carrier = (tok.vowelSeries === 'o' || tok.series === 'o') ? '\u17A2\u17CA' : '\u17A2';
    return `${carrier}${tok.char}`;
  }
  return tok.char;
}

export function openKhmerWordZoomModal(word, options = {}) {
  const langCode = options.langCode || 'km';
  if (!word || !word.studyWord) return;
  document.querySelectorAll('.khmer-word-zoom-overlay').forEach(el => el.remove());

  const tokens = parseKhmerWordTokens(word.studyWord);
  const speakerSvg = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  `;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay khmer-word-zoom-overlay is-active';
  overlay.setAttribute('data-word-id', word.wordId || '');
  overlay.innerHTML = `
    <div class="modal-box khmer-word-zoom-box" role="dialog" aria-modal="true">
      <button type="button" class="khmer-zoom-close-btn" id="khmer-zoom-close-btn" aria-label="Close">✕</button>
      <div class="khmer-zoom-word-row">
        <div class="khmer-zoom-word" data-study-text="${escapeHtml(word.studyWord)}">
          ${formatStudyTextHtml(word.studyWord)}
        </div>
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0;">
          <button type="button"
                  class="tile-action-btn khmer-zoom-word-copy-btn"
                  id="khmer-zoom-word-copy-btn"
                  title="Copy word to clipboard"
                  aria-label="Copy word to clipboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button type="button"
                  class="tile-action-btn khmer-zoom-word-speak-btn"
                  id="khmer-zoom-word-speak-btn"
                  title="Listen to whole word in Khmer"
                  aria-label="Listen to whole word in Khmer">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="pointer-events: none;">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
        </div>
      </div>
      ${tokens.length > 0 ? `
        <div class="khmer-zoom-tokens" aria-label="Tap any character or vowel to locate on keyboard">
          ${tokens.map(tok => {
            const speakText = getKhmerTokenSpeakText(tok);
            return `
              <div class="khmer-zoom-token-item">
                <button type="button"
                        class="khmer-cons-char khmer-zoom-token-pill ${tok.series ? `khmer-color-${tok.series}` : 'is-vowel-pill'}"
                        data-khmer-char="${tok.char}"
                        title="Locate ${tok.display} on Khmer keyboard">
                  <span class="khmer-zoom-token-glyph">${tok.display}</span>
                  ${tok.romaji ? `<span class="khmer-zoom-token-romaji">${tok.romaji}</span>` : ''}
                </button>
                <button type="button"
                        class="tile-action-btn khmer-zoom-token-speak-btn"
                        data-speak-text="${speakText}"
                        title="Listen to ${tok.romaji || tok.display}"
                        aria-label="Listen to ${tok.romaji || tok.display}">
                  ${speakerSvg}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}
      <div class="khmer-zoom-hint">Tap any character to locate it on the keyboard, or tap 🔊 to listen</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeZoom = () => {
    window.removeEventListener('keydown', onEsc);
    overlay.remove();
    if (typeof options.onClose === 'function') {
      options.onClose();
    }
  };

  const onEsc = (e) => {
    if (e.key === 'Escape') closeZoom();
  };
  window.addEventListener('keydown', onEsc);

  overlay.querySelector('#khmer-zoom-word-copy-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    copyToClipboard(word.studyWord);
    showCopiedTooltip(rect.left + rect.width / 2, rect.top - 10, 'Copied!');
  });

  overlay.querySelector('#khmer-zoom-word-speak-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    trackEvent('speak_khmer_word_modal', { langCode, wordId: word.wordId });
    speakKhmer(word.studyWord, btn);
  });

  overlay.querySelectorAll('.khmer-zoom-token-speak-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.getAttribute('data-speak-text');
      if (text) {
        trackEvent('speak_khmer_token_modal', { langCode, text });
        speakKhmer(text, btn);
      }
    });
  });

  overlay.querySelector('#khmer-zoom-close-btn')?.addEventListener('click', closeZoom);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeZoom();
  });
}
