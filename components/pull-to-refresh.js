/**
 * Mobile Pull-To-Refresh (Swipe Down to Refresh) Component
 * Provides a fluid, native-feel pull-to-refresh gesture and animated indicator
 * for the Single Page Application.
 */

export function setupPullToRefresh({ onRefresh }) {
  if (window.__ptrInitialized) return;
  window.__ptrInitialized = true;

  // Create UI element
  const ptrEl = document.createElement('div');
  ptrEl.className = 'ptr-indicator';
  ptrEl.setAttribute('aria-live', 'polite');
  ptrEl.innerHTML = `
    <div class="ptr-pill">
      <div class="ptr-icon-wrap">
        <svg class="ptr-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
        <div class="ptr-spinner"></div>
      </div>
      <span class="ptr-text">Pull to refresh</span>
    </div>
  `;
  document.body.appendChild(ptrEl);

  const ptrText = ptrEl.querySelector('.ptr-text');

  let startY = 0;
  let startX = 0;
  let isTracking = false;
  let isPulling = false;
  let isTriggered = false;
  let isRefreshing = false;
  let currentPull = 0;

  const PULL_THRESHOLD = 68; // px before triggering refresh
  const MAX_PULL = 110;

  function canStartPTR(target) {
    if (isRefreshing) return false;
    if (!target) return false;

    // Do not trigger inside inputs, canvas, active modals, zoom modal, or flashcard stage
    if (target.closest('input, textarea, select, canvas, .modal-box, .modal-overlay, .khmer-word-zoom-overlay, .card-stage, .script-practice-wrapper, .flashcards-container')) {
      return false;
    }

    // Check route exclusion (e.g. active flashcard study, script writing practice)
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    if (hash.includes('/study') || path.includes('/study')) return false;
    if (hash.includes('/practice') || path.includes('/practice')) return false;

    // Must be at the very top of the page
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    return scrollY <= 0;
  }

  function resetIndicator(smooth = true) {
    isTracking = false;
    isPulling = false;
    isTriggered = false;
    currentPull = 0;
    ptrEl.classList.remove('is-dragging', 'is-ready', 'is-refreshing', 'is-done');
    if (smooth) {
      ptrEl.style.transform = '';
      ptrEl.style.opacity = '';
    } else {
      ptrEl.style.transform = 'translate3d(-50%, -60px, 0)';
      ptrEl.style.opacity = '0';
    }
    if (ptrText) ptrText.textContent = 'Pull to refresh';
  }

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    if (!canStartPTR(e.target)) return;

    startY = e.touches[0].clientY;
    startX = e.touches[0].clientX;
    isTracking = true;
    isPulling = false;
    isTriggered = false;
    currentPull = 0;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isTracking || isRefreshing) return;
    if (e.touches.length !== 1) {
      resetIndicator();
      return;
    }

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY;
    const deltaX = touch.clientX - startX;

    // Check if scrolled down
    const scrollY = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (scrollY > 0) {
      if (isPulling) resetIndicator();
      isTracking = false;
      return;
    }

    // Cancel if horizontal swipe is dominant
    if (!isPulling && Math.abs(deltaX) > Math.abs(deltaY)) {
      isTracking = false;
      return;
    }

    // Only activate when pulling downwards
    if (deltaY > 8) {
      isPulling = true;
      if (e.cancelable) {
        e.preventDefault();
      }

      // Logarithmic dampened pull curve
      currentPull = Math.min(MAX_PULL, deltaY * 0.46);

      ptrEl.classList.add('is-dragging');
      ptrEl.style.transform = `translate3d(-50%, ${currentPull}px, 0)`;
      ptrEl.style.opacity = Math.min(1, currentPull / 32).toFixed(2);

      if (currentPull >= PULL_THRESHOLD) {
        if (!isTriggered) {
          isTriggered = true;
          ptrEl.classList.add('is-ready');
          if (ptrText) ptrText.textContent = 'Release to refresh';
          try {
            if (navigator.vibrate) navigator.vibrate(16);
          } catch (_) {}
        }
      } else {
        if (isTriggered) {
          isTriggered = false;
          ptrEl.classList.remove('is-ready');
          if (ptrText) ptrText.textContent = 'Pull to refresh';
        }
      }
    }
  }, { passive: false });

  document.addEventListener('touchend', async () => {
    if (!isPulling) {
      isTracking = false;
      return;
    }

    ptrEl.classList.remove('is-dragging');

    if (isTriggered && currentPull >= PULL_THRESHOLD && !isRefreshing) {
      isRefreshing = true;
      isTriggered = false;

      // Pin indicator during refresh
      ptrEl.classList.add('is-refreshing');
      ptrEl.style.transform = 'translate3d(-50%, 65px, 0)';
      ptrEl.style.opacity = '1';
      if (ptrText) ptrText.textContent = 'Refreshing...';

      const startTime = Date.now();
      try {
        if (typeof onRefresh === 'function') {
          await onRefresh();
        }
      } catch (err) {
        console.warn('Pull-to-refresh error:', err);
      }

      // Ensure minimum 500ms so animation feels natural and not a jarring flash
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise(r => setTimeout(r, 500 - elapsed));
      }

      // Show success
      ptrEl.classList.remove('is-refreshing');
      ptrEl.classList.add('is-done');
      if (ptrText) ptrText.textContent = '✓ Updated!';
      try {
        if (navigator.vibrate) navigator.vibrate(20);
      } catch (_) {}

      setTimeout(() => {
        isRefreshing = false;
        resetIndicator(true);
      }, 450);
    } else {
      resetIndicator(true);
    }
  }, { passive: true });

  document.addEventListener('touchcancel', () => {
    if (!isRefreshing) {
      resetIndicator(true);
    }
  }, { passive: true });
}
