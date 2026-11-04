import { autoTranslateUi } from '../i18n.js?v=20261104_scripts3';
import { trackEvent } from '../analytics.js?v=20261104_scripts3';
import { notifyScriptProgressChange, syncScriptsProgress } from '../api.js?v=20261104_scripts26';
import { HIRAGANA_SECTIONS, HIRAGANA_STROKE_ORDER } from '../scripts/data/hiragana-data.js?v=20261104_scripts3';
import { KATAKANA_SECTIONS, KATAKANA_STROKE_ORDER } from '../scripts/data/katakana-data.js?v=20261104_scripts3';
import { KHMER_SECTIONS, KHMER_STROKE_ORDER } from '../scripts/data/khmer-data.js?v=20261104_scripts3';

const SCRIPT_CONFIGS = {
  hiragana: {
    id: 'hiragana',
    title: 'ひらがな Practice',
    subtitle: 'Hiragana',
    flag: '🇯🇵',
    infoRoute: '/scripts/japanese/hiragana',
    storagePrefix: 'hiragana',
    sections: HIRAGANA_SECTIONS,
    strokeOrderData: HIRAGANA_STROKE_ORDER,
    autoProgressDelay: 1200
  },
  katakana: {
    id: 'katakana',
    title: 'カタカナ Practice',
    subtitle: 'Katakana',
    flag: '🇯🇵',
    infoRoute: '/scripts/japanese/katakana',
    storagePrefix: 'katakana',
    sections: KATAKANA_SECTIONS,
    strokeOrderData: KATAKANA_STROKE_ORDER,
    autoProgressDelay: 1000
  },
  khmer: {
    id: 'khmer',
    title: 'អក្សរខ្មែរ Practice',
    subtitle: 'Khmer Script',
    flag: '🇰🇭',
    infoRoute: '/scripts/khmer',
    storagePrefix: 'khmer',
    sections: KHMER_SECTIONS,
    strokeOrderData: KHMER_STROKE_ORDER,
    autoProgressDelay: 1200
  }
};

let activeCleanup = null;

export function renderScriptPracticeScreen(container, params = {}) {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }

  const scriptId = (params.scriptId || 'hiragana').toLowerCase();
  const config = SCRIPT_CONFIGS[scriptId] || SCRIPT_CONFIGS.hiragana;
  const strokeOrderData = config.strokeOrderData;

  // Deep-clone character sections so learned flags are mutable per session
  const sections = config.sections.map(sec => ({
    ...sec,
    characters: sec.characters.map(c => ({ ...c, learned: false }))
  }));

  // Compute section start offsets & flat character array
  let runningStart = 0;
  const sectionMeta = sections.map(sec => {
    const info = {
      id: sec.id,
      name: sec.name,
      shortName: sec.shortName || sec.name,
      count: sec.characters.length,
      start: runningStart,
      characters: sec.characters
    };
    runningStart += sec.characters.length;
    return info;
  });

  const allCharacters = sectionMeta.flatMap(s => s.characters);

  // Load learned state from localStorage
  const learnedKey = `${config.storagePrefix}-learned`;
  const progressKey = `${config.storagePrefix}-progress`;

  function loadLearnedState() {
    try {
      const saved = localStorage.getItem(learnedKey);
      if (saved) {
        const learnedMap = JSON.parse(saved) || {};
        allCharacters.forEach(c => {
          c.learned = Boolean(learnedMap[c.char]);
        });
      }
    } catch (e) {
      console.warn('Failed to load learned state:', e);
    }
  }

  function saveLearnedState() {
    const learnedMap = {};
    allCharacters.forEach(c => {
      if (c.learned) learnedMap[c.char] = true;
    });
    const now = Date.now();
    localStorage.setItem(learnedKey, JSON.stringify(learnedMap));
    localStorage.setItem(`${config.storagePrefix}-learned-updatedAt`, String(now));
    notifyScriptProgressChange(learnedKey, learnedMap, now);
  }

  function saveCurrentProgress() {
    localStorage.setItem(progressKey, String(currentIndex));
    notifyScriptProgressChange(progressKey, currentIndex);
  }

  loadLearnedState();

  // Restore saved character index
  let currentIndex = 0;
  const savedIdx = localStorage.getItem(progressKey);
  if (savedIdx !== null) {
    const parsed = parseInt(savedIdx, 10);
    if (Number.isFinite(parsed) && parsed >= 0 && parsed < allCharacters.length) {
      currentIndex = parsed;
    }
  }

  // Drawing & stroke state
  let canvas = null;
  let ctx = null;
  let isDrawing = false;
  let strokeWidth = 12;
  let showStrokeOrder = true;
  let autoProgressTimeout = null;
  let currentStrokeIndex = 0;
  let strokeStarted = false;
  let currentStrokePath = [];
  let completedStrokes = [];

  const STROKE_START_TOLERANCE = 25;
  const STROKE_PATH_TOLERANCE = 25;
  const MIN_STROKE_LENGTH = 10;

  function isDarkMode() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }

  function getStrokeColor() {
    return isDarkMode() ? '#a599c4' : '#685e7d';
  }

  // Build HTML layout in monogenesis Zen style
  container.innerHTML = `
    <div class="script-practice-wrapper" data-script="${config.id}">
      <!-- Top Header & Section Progress Bars -->
      <div class="script-practice-header">
        <div class="script-header-top-row">
          <div class="script-title-group">
            <span class="script-flag-badge">${config.flag}</span>
            <h1 class="script-practice-title">${config.title}</h1>
          </div>
          <div class="script-header-actions">
            <a href="${config.infoRoute}" class="btn btn-secondary btn-sm script-manage-btn" title="View Keyboard Layout & Learned Checklist">
              <span>⌨️</span>
              <span>Keyboard & Characters</span>
            </a>
          </div>
        </div>

        <div class="script-progress-bars-row ${sectionMeta.length > 3 ? 'is-multi-section' : ''}">
          ${sectionMeta.map((sec, idx) => `
            <div class="script-progress-segment" style="flex: ${Math.max(sec.count, 8)};" data-section-idx="${idx}">
              <div id="progressLabel${idx}" class="script-progress-label" title="${sec.name} (${sec.count})">
                ${sec.shortName} (${sec.count})
              </div>
              <div id="progressBarContainer${idx}" class="script-progress-track">
                <div id="progressBarFill${idx}" class="script-progress-fill" style="width: 0%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Compact Character Info Bar -->
      <div class="script-char-banner">
        <div class="script-char-glyph" id="characterDisplay"></div>
        <div class="script-char-details">
          <div class="script-char-romaji-row">
            <span class="script-char-romaji" id="romajiDisplay"></span>
            <span class="script-char-meaning" id="meaningDisplay"></span>
          </div>
          <div class="script-char-meta-row">
            <span class="script-char-counter">
              <span id="currentIndexDisplay">1</span>/<span id="totalCharsDisplay">${allCharacters.length}</span>
            </span>
            <label class="script-learned-toggle" id="quickLearnedContainer">
              <input type="checkbox" id="quickLearnedCheckbox" />
              <span data-i18n="learned">Learned</span>
            </label>
          </div>
        </div>
        <div id="successCheck" class="script-success-check hidden" aria-hidden="true">✓</div>
      </div>

      <!-- Interactive Drawing Canvas Stage -->
      <div class="script-canvas-stage">
        <div class="script-canvas-box" id="canvasBox">
          <canvas id="drawingCanvas" width="500" height="500" class="script-drawing-canvas"></canvas>
          <div class="script-reference-overlay" id="referenceCharacter" aria-hidden="true"></div>
          <div class="script-stroke-overlay" aria-hidden="true">
            <svg id="strokeOrderSvg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"></svg>
          </div>
          <div id="scriptErrorToast" class="script-error-toast hidden"></div>
        </div>
      </div>

      <!-- Controls Footer -->
      <div class="script-controls-footer">
        <div class="script-controls-buttons">
          <button id="prevBtn" class="btn btn-secondary script-nav-btn">
            ← <span data-i18n="prev">Prev</span>
          </button>
          <button id="clearBtn" class="btn btn-outline-danger script-nav-btn">
            <span data-i18n="clear">Clear</span>
          </button>
          <button id="nextBtn" class="btn btn-primary script-nav-btn">
            <span data-i18n="next">Next</span> →
          </button>
        </div>
        <div class="script-controls-options">
          <label class="script-stroke-toggle">
            <input type="checkbox" id="showStrokeOrder" checked />
            <span data-i18n="strokeOrder">Stroke Order</span>
          </label>
          <span class="script-keyboard-hint">Keys: ← / → navigate · C clear</span>
        </div>
      </div>

      <!-- Character Management Modal -->
      <div id="charModal" class="script-char-modal-overlay">
        <div class="script-char-modal">
          <div class="script-char-modal-header">
            <h2 class="modal-title">${config.subtitle} Characters</h2>
            <button id="closeCharModal" class="modal-close-btn" aria-label="Close">✕</button>
          </div>
          <div class="script-char-tabs" id="charSectionTabs">
            ${sectionMeta.map((sec, idx) => `
              <button class="script-char-tab ${idx === 0 ? 'active' : ''}" data-section-id="${sec.id}">
                ${sec.shortName} (${sec.count})
              </button>
            `).join('')}
          </div>
          <div class="script-char-modal-body">
            ${sectionMeta.map((sec, idx) => `
              <div id="charGrid_${sec.id}" class="script-char-grid" style="display: ${idx === 0 ? 'grid' : 'none'};"></div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  autoTranslateUi(container);

  canvas = container.querySelector('#drawingCanvas');
  ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = getStrokeColor();

  function getDistance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function canvasToSVG(x, y) {
    return {
      x: (x / canvas.width) * 100,
      y: (y / canvas.height) * 100
    };
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function isNearStrokeStart(x, y) {
    const current = allCharacters[currentIndex];
    const strokes = strokeOrderData[current.char];
    if (!strokes || currentStrokeIndex >= strokes.length) return false;

    const stroke = strokes[currentStrokeIndex];
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', stroke.path);

    const startPoint = pathEl.getPointAtLength(0);
    const svgPoint = canvasToSVG(x, y);
    return getDistance(svgPoint.x, svgPoint.y, startPoint.x, startPoint.y) < STROKE_START_TOLERANCE;
  }

  function validateStrokePath() {
    if (currentStrokePath.length < MIN_STROKE_LENGTH) return true;
    const current = allCharacters[currentIndex];
    const strokes = strokeOrderData[current.char];
    if (!strokes || currentStrokeIndex >= strokes.length) return false;

    const stroke = strokes[currentStrokeIndex];
    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', stroke.path);
    const pathLength = pathEl.getTotalLength();

    let validPoints = 0;
    const checkInterval = Math.max(1, Math.floor(currentStrokePath.length / 10));
    let totalChecked = 0;

    for (let i = 0; i < currentStrokePath.length; i += checkInterval) {
      totalChecked++;
      const point = currentStrokePath[i];
      const svgPoint = canvasToSVG(point.x, point.y);

      let minDist = Infinity;
      const step = Math.max(1, pathLength / 24);
      for (let t = 0; t <= pathLength; t += step) {
        const pathPoint = pathEl.getPointAtLength(t);
        const dist = getDistance(svgPoint.x, svgPoint.y, pathPoint.x, pathPoint.y);
        if (dist < minDist) minDist = dist;
      }
      const endPoint = pathEl.getPointAtLength(pathLength);
      minDist = Math.min(minDist, getDistance(svgPoint.x, svgPoint.y, endPoint.x, endPoint.y));

      if (minDist < STROKE_PATH_TOLERANCE) {
        validPoints++;
      }
    }

    return (validPoints / Math.max(1, totalChecked)) > 0.6;
  }

  let errorToastTimer = null;
  function showError(message) {
    const toast = container.querySelector('#scriptErrorToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    if (errorToastTimer) clearTimeout(errorToastTimer);
    errorToastTimer = setTimeout(() => {
      toast.classList.add('hidden');
    }, 1800);
  }

  function showSuccessCheckmark() {
    const check = container.querySelector('#successCheck');
    if (!check) return;
    check.classList.remove('hidden');
    check.classList.add('checkmark-animation');
  }

  function hideSuccessCheckmark() {
    const check = container.querySelector('#successCheck');
    if (!check) return;
    check.classList.add('hidden');
    check.classList.remove('checkmark-animation');
  }

  function showConfetti() {
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const colors = ['#756c88', '#887d9f', '#6b788c', '#a86c65', '#10b981', '#8b5cf6', '#f59e0b'];
    const confettiElements = [];

    for (let i = 0; i < 42; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = `${canvasRect.left + canvasRect.width / 2}px`;
      confetti.style.top = `${canvasRect.top + canvasRect.height / 2}px`;
      confetti.style.width = '8px';
      confetti.style.height = '8px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      confetti.style.pointerEvents = 'none';
      confetti.style.zIndex = '9999';
      confetti.style.transition = 'all 0.95s cubic-bezier(0.2, 0.8, 0.3, 1)';
      document.body.appendChild(confetti);
      confettiElements.push(confetti);

      setTimeout(() => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 140;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance - 40;
        confetti.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 540}deg)`;
        confetti.style.opacity = '0';
      }, 10);
    }

    setTimeout(() => {
      confettiElements.forEach(c => c.remove());
    }, 1000);
  }

  function redrawCompletedStrokes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = strokeWidth;
    for (const strokePts of completedStrokes) {
      if (!strokePts.length) continue;
      ctx.beginPath();
      ctx.moveTo(strokePts[0].x, strokePts[0].y);
      for (let i = 1; i < strokePts.length; i++) {
        ctx.lineTo(strokePts[i].x, strokePts[i].y);
      }
      ctx.stroke();
    }
  }

  function resetDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentStrokeIndex = 0;
    strokeStarted = false;
    currentStrokePath = [];
    completedStrokes = [];
    hideSuccessCheckmark();
    updateStrokeOrder();

    const box = container.querySelector('#canvasBox');
    if (box) {
      box.classList.remove('shake-anim');
      void box.offsetWidth;
      box.classList.add('shake-anim');
      setTimeout(() => box.classList.remove('shake-anim'), 450);
    }
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hideSuccessCheckmark();
    currentStrokeIndex = 0;
    strokeStarted = false;
    currentStrokePath = [];
    completedStrokes = [];
    if (autoProgressTimeout) {
      clearTimeout(autoProgressTimeout);
      autoProgressTimeout = null;
    }
    updateStrokeOrder();
  }

  function beginStrokeAt(pos) {
    if (!strokeStarted && !isNearStrokeStart(pos.x, pos.y)) {
      showError('Start at the numbered circle!');
      return;
    }
    isDrawing = true;
    strokeStarted = true;
    currentStrokePath = [{ x: pos.x, y: pos.y }];
    ctx.strokeStyle = getStrokeColor();
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function moveStrokeAt(pos) {
    if (!isDrawing) return;
    currentStrokePath.push({ x: pos.x, y: pos.y });
    ctx.lineWidth = strokeWidth;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endStroke() {
    if (!isDrawing) return;
    isDrawing = false;

    if (strokeStarted && currentStrokePath.length >= MIN_STROKE_LENGTH) {
      if (validateStrokePath()) {
        completedStrokes.push(currentStrokePath);
        currentStrokeIndex++;
        strokeStarted = false;
        currentStrokePath = [];

        const current = allCharacters[currentIndex];
        const strokes = strokeOrderData[current.char];

        if (strokes && currentStrokeIndex >= strokes.length) {
          showSuccessCheckmark();
          showConfetti();
          trackEvent('script_character_completed', {
            script: config.id,
            character: current.char,
            romaji: current.romaji,
            index: currentIndex
          });
          autoProgressTimeout = setTimeout(() => {
            if (currentIndex < allCharacters.length - 1) {
              nextCharacter();
            }
          }, config.autoProgressDelay);
        } else {
          updateStrokeOrder();
        }
      } else {
        showError('Wrong stroke! Try again');
        resetDrawing();
      }
    } else if (strokeStarted) {
      // Very short tap — reset current unfinished stroke back to completedStrokes
      strokeStarted = false;
      currentStrokePath = [];
      redrawCompletedStrokes();
    }
  }

  function nextCharacter() {
    let nextIdx = currentIndex + 1;
    while (nextIdx < allCharacters.length) {
      if (!allCharacters[nextIdx].learned) {
        currentIndex = nextIdx;
        saveCurrentProgress();
        updateDisplay();
        clearCanvas();
        return;
      }
      nextIdx++;
    }
    // If all remaining are learned, wrap or advance by 1 if possible
    if (currentIndex < allCharacters.length - 1) {
      currentIndex++;
      saveCurrentProgress();
      updateDisplay();
      clearCanvas();
    }
  }

  function previousCharacter() {
    let prevIdx = currentIndex - 1;
    while (prevIdx >= 0) {
      if (!allCharacters[prevIdx].learned) {
        currentIndex = prevIdx;
        saveCurrentProgress();
        updateDisplay();
        clearCanvas();
        return;
      }
      prevIdx--;
    }
    if (currentIndex > 0) {
      currentIndex--;
      saveCurrentProgress();
      updateDisplay();
      clearCanvas();
    }
  }

  function updateCurrentPositionIndicator(trackContainer, progressPercent, charObj) {
    // Remove indicators from all tracks first
    container.querySelectorAll('.script-pos-indicator').forEach(el => el.remove());

    const indicator = document.createElement('div');
    indicator.className = 'script-pos-indicator';
    indicator.textContent = `${charObj.displayChar || charObj.char} (${charObj.romaji})`;
    indicator.style.left = `${ Math.max(4, Math.min(96, progressPercent)) }%`;
    trackContainer.appendChild(indicator);
  }

  function updateDisplay() {
    const current = allCharacters[currentIndex];
    if (!current) return;

    const charDisplay = container.querySelector('#characterDisplay');
    const romajiDisplay = container.querySelector('#romajiDisplay');
    const meaningDisplay = container.querySelector('#meaningDisplay');

    if (charDisplay) charDisplay.textContent = current.displayChar || current.char;
    if (romajiDisplay) romajiDisplay.textContent = current.romaji;
    if (meaningDisplay) meaningDisplay.textContent = current.meaning ? `(${current.meaning})` : '';

    // Update SVG Reference Character overlay
    const refChar = container.querySelector('#referenceCharacter');
    if (refChar) {
      refChar.innerHTML = '';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('class', 'script-ref-svg');

      const strokes = strokeOrderData[current.char];
      if (strokes) {
        const strokeColor = isDarkMode() ? 'rgba(207, 203, 214, 0.22)' : 'rgba(33, 30, 41, 0.14)';
        strokes.forEach(stroke => {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', stroke.path);
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', strokeColor);
          path.setAttribute('stroke-width', '5');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('stroke-linejoin', 'round');
          svg.appendChild(path);
        });
      }
      refChar.appendChild(svg);
    }

    container.querySelector('#currentIndexDisplay').textContent = String(currentIndex + 1);
    container.querySelector('#totalCharsDisplay').textContent = String(allCharacters.length);

    // Determine active section
    let activeSecIdx = 0;
    for (let i = sectionMeta.length - 1; i >= 0; i--) {
      if (currentIndex >= sectionMeta[i].start) {
        activeSecIdx = i;
        break;
      }
    }

    // Update section labels & progress bars
    sectionMeta.forEach((sec, idx) => {
      const unlearned = sec.characters.filter(c => !c.learned);
      const labelEl = container.querySelector(`#progressLabel${idx}`);
      const fillEl = container.querySelector(`#progressBarFill${idx}`);
      const trackEl = container.querySelector(`#progressBarContainer${idx}`);

      if (labelEl) {
        labelEl.textContent = `${sec.shortName} ${unlearned.length}/${sec.count}`;
      }

      let progress = 0;
      if (idx < activeSecIdx) {
        progress = 100;
      } else if (idx === activeSecIdx && unlearned.length > 0) {
        const posInUnlearned = unlearned.findIndex(c => c.char === current.char);
        if (posInUnlearned !== -1) {
          progress = ((posInUnlearned + 1) / unlearned.length) * 100;
        } else {
          const posInSec = currentIndex - sec.start;
          progress = ((posInSec + 1) / sec.count) * 100;
        }
      }

      if (fillEl) fillEl.style.width = `${progress}%`;

      if (idx === activeSecIdx && trackEl) {
        const posInSec = currentIndex - sec.start;
        const posPercent = (posInSec / Math.max(1, sec.count)) * 100;
        updateCurrentPositionIndicator(trackEl, posPercent, current);
      }
    });

    // Update Prev / Next buttons
    const prevBtn = container.querySelector('#prevBtn');
    const nextBtn = container.querySelector('#nextBtn');
    if (prevBtn) {
      prevBtn.disabled = currentIndex === 0;
      prevBtn.style.opacity = currentIndex === 0 ? '0.45' : '1';
    }
    if (nextBtn) {
      const isLast = currentIndex === allCharacters.length - 1;
      nextBtn.innerHTML = isLast ? '🎉 Complete!' : '<span>Next</span> →';
    }

    // Update quick learned checkbox
    const quickCheckbox = container.querySelector('#quickLearnedCheckbox');
    if (quickCheckbox) {
      quickCheckbox.checked = Boolean(current.learned);
    }

    updateStrokeOrder();
  }

  function updateStrokeOrder() {
    const svg = container.querySelector('#strokeOrderSvg');
    if (!svg) return;
    svg.innerHTML = '';
    if (!showStrokeOrder) return;

    const current = allCharacters[currentIndex];
    const strokes = strokeOrderData[current.char];
    if (!strokes) return;

    const accentStrokeColor = isDarkMode() ? '#b4a5d9' : '#685e7d';

    strokes.forEach((stroke, index) => {
      const isCurrentStroke = index === currentStrokeIndex;
      const isCompleted = index < currentStrokeIndex;

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', stroke.path);
      const pathLength = pathEl.getTotalLength();

      const startPoint = pathEl.getPointAtLength(0);
      const directionPoint = pathEl.getPointAtLength(Math.min(4, Math.max(1, pathLength * 0.12)));

      const strokeDx = directionPoint.x - startPoint.x;
      const strokeDy = directionPoint.y - startPoint.y;
      const strokeAngle = Math.atan2(strokeDy, strokeDx);

      // Offset perpendicular to stroke direction so circle never covers stroke
      const offsetDistance = 6;
      const perpAngle = strokeAngle + Math.PI / 2;
      const indicatorX = Math.max(6, Math.min(94, startPoint.x + Math.cos(perpAngle) * offsetDistance));
      const indicatorY = Math.max(6, Math.min(94, startPoint.y + Math.sin(perpAngle) * offsetDistance));

      const arrowLength = 8;
      const arrowEndX = indicatorX + Math.cos(strokeAngle) * arrowLength;
      const arrowEndY = indicatorY + Math.sin(strokeAngle) * arrowLength;

      const opacity = isCompleted ? '0.28' : (isCurrentStroke ? '1' : '0.45');
      const circleColor = isCompleted ? '#10b981' : accentStrokeColor;

      // Short directional line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', indicatorX);
      line.setAttribute('y1', indicatorY);
      line.setAttribute('x2', arrowEndX);
      line.setAttribute('y2', arrowEndY);
      line.setAttribute('stroke', circleColor);
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('stroke-dasharray', '3, 3');
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('opacity', opacity);
      svg.appendChild(line);

      // Numbered circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', indicatorX);
      circle.setAttribute('cy', indicatorY);
      circle.setAttribute('r', isCurrentStroke ? '5' : '4');
      circle.setAttribute('fill', circleColor);
      circle.setAttribute('opacity', opacity);
      svg.appendChild(circle);

      // Stroke number text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', indicatorX);
      text.setAttribute('y', indicatorY);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '5');
      text.setAttribute('font-weight', 'bold');
      text.textContent = stroke.num;
      svg.appendChild(text);

      // Arrow head
      const arrowSize = 2.6;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const x1 = arrowEndX;
      const y1 = arrowEndY;
      const x2 = x1 - arrowSize * Math.cos(strokeAngle - Math.PI / 6);
      const y2 = y1 - arrowSize * Math.sin(strokeAngle - Math.PI / 6);
      const x3 = x1 - arrowSize * Math.cos(strokeAngle + Math.PI / 6);
      const y3 = y1 - arrowSize * Math.sin(strokeAngle + Math.PI / 6);

      arrow.setAttribute('points', `${x1},${y1} ${x2},${y2} ${x3},${y3}`);
      arrow.setAttribute('fill', circleColor);
      arrow.setAttribute('opacity', opacity);
      svg.appendChild(arrow);
    });
  }

  // Interactive progress bar scrubbing & tooltips
  function setupProgressBarInteractions() {
    sectionMeta.forEach((sec, secIdx) => {
      const track = container.querySelector(`#progressBarContainer${secIdx}`);
      if (!track) return;

      const getTargetFromEvent = (e) => {
        const rect = track.getBoundingClientRect();
        const clientX = e.touches?.[0]?.clientX ?? e.clientX;
        const pct = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
        const unlearned = sec.characters.filter(c => !c.learned);
        const pool = unlearned.length > 0 ? unlearned : sec.characters;
        const target = pool[Math.min(Math.floor(pct * pool.length), pool.length - 1)];
        return { target, clientX, rect };
      };

      const jumpToPosition = (e) => {
        const { target } = getTargetFromEvent(e);
        if (!target) return;
        const newIdx = allCharacters.findIndex(c => c.char === target.char);
        if (newIdx !== -1 && newIdx !== currentIndex) {
          currentIndex = newIdx;
          saveCurrentProgress();
          updateDisplay();
          clearCanvas();
        }
      };

      const showTooltip = (e) => {
        const { target, clientX, rect } = getTargetFromEvent(e);
        if (!target) return;
        let tooltip = document.getElementById('scriptProgressTooltip');
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.id = 'scriptProgressTooltip';
          tooltip.className = 'script-progress-tooltip';
          document.body.appendChild(tooltip);
        }
        tooltip.textContent = `${target.displayChar || target.char} (${target.romaji})`;
        tooltip.style.left = `${clientX}px`;
        tooltip.style.top = `${rect.top - 36}px`;
        tooltip.style.display = 'block';
      };

      const hideTooltip = () => {
        const tooltip = document.getElementById('scriptProgressTooltip');
        if (tooltip) tooltip.style.display = 'none';
      };

      track.addEventListener('click', jumpToPosition);
      track.addEventListener('mouseenter', showTooltip);
      track.addEventListener('mousemove', showTooltip);
      track.addEventListener('mouseleave', hideTooltip);
      track.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showTooltip(e);
        jumpToPosition(e);
      }, { passive: false });
      track.addEventListener('touchmove', (e) => {
        e.preventDefault();
        showTooltip(e);
        jumpToPosition(e);
      }, { passive: false });
      track.addEventListener('touchend', hideTooltip);
    });
  }

  // Character Management Modal
  function populateCharacterGrids() {
    sectionMeta.forEach(sec => {
      const grid = container.querySelector(`#charGrid_${sec.id}`);
      if (!grid) return;
      grid.innerHTML = '';

      sec.characters.forEach(charData => {
        const card = document.createElement('div');
        card.className = `script-char-card ${charData.learned ? 'is-learned' : ''}`;

        card.innerHTML = `
          <div class="script-char-card-glyph">${charData.displayChar || charData.char}</div>
          <div class="script-char-card-romaji">${charData.romaji}</div>
          ${charData.meaning ? `<div class="script-char-card-meaning">${charData.meaning}</div>` : ''}
          <label class="script-char-card-check">
            <input type="checkbox" ${charData.learned ? 'checked' : ''} />
            <span>Learned</span>
          </label>
        `;

        const checkbox = card.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          charData.learned = e.target.checked;
          card.classList.toggle('is-learned', charData.learned);
          saveLearnedState();
          updateDisplay();
        });

        card.addEventListener('click', (e) => {
          if (e.target.closest('.script-char-card-check')) return;
          const idx = allCharacters.findIndex(c => c.char === charData.char);
          if (idx !== -1) {
            currentIndex = idx;
            saveCurrentProgress();
            updateDisplay();
            clearCanvas();
            container.querySelector('#charModal')?.classList.remove('is-open');
          }
        });

        grid.appendChild(card);
      });
    });
  }

  // Bind UI events
  canvas.addEventListener('mousedown', (e) => beginStrokeAt(getMousePos(e)));
  canvas.addEventListener('mousemove', (e) => moveStrokeAt(getMousePos(e)));
  canvas.addEventListener('mouseup', endStroke);
  canvas.addEventListener('mouseout', endStroke);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    beginStrokeAt(getTouchPos(e));
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    moveStrokeAt(getTouchPos(e));
  }, { passive: false });
  canvas.addEventListener('touchend', endStroke);

  container.querySelector('#prevBtn')?.addEventListener('click', previousCharacter);
  container.querySelector('#clearBtn')?.addEventListener('click', clearCanvas);
  container.querySelector('#nextBtn')?.addEventListener('click', nextCharacter);

  container.querySelector('#showStrokeOrder')?.addEventListener('change', (e) => {
    showStrokeOrder = e.target.checked;
    updateStrokeOrder();
  });

  container.querySelector('#quickLearnedCheckbox')?.addEventListener('change', (e) => {
    const current = allCharacters[currentIndex];
    if (!current) return;
    current.learned = e.target.checked;
    saveLearnedState();
    if (e.target.checked) {
      nextCharacter();
    } else {
      updateDisplay();
    }
  });

  // Modal open/close & tabs
  const charModal = container.querySelector('#charModal');
  container.querySelector('#openCharModalBtn')?.addEventListener('click', () => {
    populateCharacterGrids();
    charModal?.classList.add('is-open');
  });
  container.querySelector('#closeCharModal')?.addEventListener('click', () => {
    charModal?.classList.remove('is-open');
    updateDisplay();
  });
  charModal?.addEventListener('click', (e) => {
    if (e.target === charModal) {
      charModal.classList.remove('is-open');
      updateDisplay();
    }
  });

  container.querySelectorAll('.script-char-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.script-char-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetSecId = tab.getAttribute('data-section-id');
      sectionMeta.forEach(sec => {
        const grid = container.querySelector(`#charGrid_${sec.id}`);
        if (grid) grid.style.display = sec.id === targetSecId ? 'grid' : 'none';
      });
    });
  });

  const handleKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (charModal?.classList.contains('is-open')) {
      if (e.key === 'Escape') charModal.classList.remove('is-open');
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextCharacter();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      previousCharacter();
    } else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      clearCanvas();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Observe theme changes on <html data-theme="..."> to refresh canvas & SVG contrast
  const themeObserver = new MutationObserver(() => {
    redrawCompletedStrokes();
    updateDisplay();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  setupProgressBarInteractions();
  updateDisplay();

  const onScriptsSynced = () => {
    loadLearnedState();
    updateDisplay();
    populateCharacterGrids();
  };
  window.addEventListener('vocab-scripts-synced', onScriptsSynced);

  syncScriptsProgress().then((changed) => {
    if (changed) {
      loadLearnedState();
      updateDisplay();
      populateCharacterGrids();
    }
  }).catch(() => {});

  activeCleanup = () => {
    window.removeEventListener('vocab-scripts-synced', onScriptsSynced);
    document.removeEventListener('keydown', handleKeyDown);
    themeObserver.disconnect();
    if (autoProgressTimeout) clearTimeout(autoProgressTimeout);
    if (errorToastTimer) clearTimeout(errorToastTimer);
    document.getElementById('scriptProgressTooltip')?.remove();
  };
}
