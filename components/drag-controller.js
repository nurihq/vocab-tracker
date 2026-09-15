/**
 * Universal Touch & Mouse Drag-and-Drop Controller
 * Supports:
 * - Desktop HTML5 drag-and-drop
 * - Mobile Touch Hold-to-Drag (~280ms hold gesture) with native scroll preservation and click suppression
 * - Edge Auto-Scrolling while dragging on mobile and desktop
 * - Top / Bottom clamping so dragging above or below the list targets 1st or last position seamlessly
 */

export function setupDraggableList({
  container,
  itemSelector,
  handleSelector,
  getItemKey,
  onReorder
}) {
  if (!container) return;

  const items = Array.from(container.querySelectorAll(itemSelector));
  if (items.length === 0) return;

  let draggedItem = null;
  let touchStartPos = { x: 0, y: 0 };
  let lastTouchPos = { x: 0, y: 0 };
  let holdTimer = null;
  let isTouchDragging = false;
  let currentDropTarget = null;
  let suppressClickUntil = 0;
  let scrollSpeed = 0;
  let scrollAnimFrame = null;

  // Intercept and suppress accidental click events right after drag finishes
  const clickInterceptor = (e) => {
    if (Date.now() < suppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };
  container.addEventListener('click', clickInterceptor, true);

  function updateDropTarget(x, y) {
    if (!x || !y || items.length === 0) return;

    const firstRect = items[0].getBoundingClientRect();
    const lastRect = items[items.length - 1].getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let targetItem = null;

    // If finger is above first item or past top of list/screen
    if (y <= firstRect.top + firstRect.height * 0.4 || y < containerRect.top) {
      targetItem = items[0];
    }
    // If finger is below last item or past bottom of list/screen
    else if (y >= lastRect.bottom - lastRect.height * 0.4 || y > containerRect.bottom) {
      targetItem = items[items.length - 1];
    }
    else {
      const elem = document.elementFromPoint(x, y);
      targetItem = elem ? elem.closest(itemSelector) : null;

      if (!targetItem || !container.contains(targetItem)) {
        let minDistance = Infinity;
        for (const it of items) {
          const r = it.getBoundingClientRect();
          const midY = (r.top + r.bottom) / 2;
          const midX = (r.left + r.right) / 2;
          const dist = Math.hypot(x - midX, y - midY);
          if (dist < minDistance) {
            minDistance = dist;
            targetItem = it;
          }
        }
      }
    }

    if (targetItem && targetItem !== currentDropTarget && targetItem !== draggedItem && container.contains(targetItem)) {
      items.forEach(it => it.classList.remove('drag-over'));
      targetItem.classList.add('drag-over');
      currentDropTarget = targetItem;
    } else if (targetItem && targetItem === draggedItem) {
      items.forEach(it => it.classList.remove('drag-over'));
      currentDropTarget = targetItem;
    } else if (!targetItem) {
      items.forEach(it => it.classList.remove('drag-over'));
      currentDropTarget = null;
    }
  }

  function startAutoScroll() {
    if (scrollAnimFrame) return;

    function step() {
      if (!isTouchDragging && !draggedItem) {
        scrollAnimFrame = null;
        scrollSpeed = 0;
        return;
      }

      if (scrollSpeed !== 0) {
        window.scrollBy(0, scrollSpeed);
        if (lastTouchPos.x && lastTouchPos.y) {
          updateDropTarget(lastTouchPos.x, lastTouchPos.y);
        }
      }

      scrollAnimFrame = requestAnimationFrame(step);
    }

    scrollAnimFrame = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (scrollAnimFrame) {
      cancelAnimationFrame(scrollAnimFrame);
      scrollAnimFrame = null;
    }
    scrollSpeed = 0;
  }

  function handleAutoScrollCalculation(clientY) {
    const edgeMargin = Math.min(110, window.innerHeight * 0.18);
    const viewportHeight = window.innerHeight;

    if (clientY < edgeMargin) {
      const intensity = (edgeMargin - clientY) / edgeMargin;
      scrollSpeed = -Math.round(Math.min(24, Math.max(3, intensity * 26)));
      startAutoScroll();
    } else if (clientY > viewportHeight - edgeMargin) {
      const intensity = (clientY - (viewportHeight - edgeMargin)) / edgeMargin;
      scrollSpeed = Math.round(Math.min(24, Math.max(3, intensity * 26)));
      startAutoScroll();
    } else {
      scrollSpeed = 0;
    }
  }

  items.forEach((item, index) => {
    item.setAttribute('data-drag-index', index);
    item.setAttribute('draggable', 'true');

    // ─── Desktop HTML5 Drag & Drop ──────────────────────────────────
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      const key = getItemKey ? getItemKey(item) : item.getAttribute('data-id');
      e.dataTransfer.setData('text/plain', key || '');
    });

    item.addEventListener('dragend', () => {
      stopAutoScroll();
      if (draggedItem) draggedItem.classList.remove('is-dragging');
      items.forEach(it => it.classList.remove('drag-over'));
      draggedItem = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      lastTouchPos = { x: e.clientX, y: e.clientY };
      handleAutoScrollCalculation(e.clientY);
      updateDropTarget(e.clientX, e.clientY);
    });

    item.addEventListener('dragleave', (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over');
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      stopAutoScroll();
      item.classList.remove('drag-over');
      if (!draggedItem || draggedItem === item) return;

      const fromIndex = parseInt(draggedItem.getAttribute('data-drag-index'), 10);
      const toIndex = currentDropTarget 
        ? parseInt(currentDropTarget.getAttribute('data-drag-index'), 10)
        : parseInt(item.getAttribute('data-drag-index'), 10);

      if (!isNaN(fromIndex) && !isNaN(toIndex) && fromIndex !== toIndex) {
        onReorder(fromIndex, toIndex);
      }
      draggedItem = null;
      currentDropTarget = null;
    });

    // ─── Mobile Touch Hold-to-Drag ───────────────────────────────────
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      lastTouchPos = { x: touch.clientX, y: touch.clientY };
      isTouchDragging = false;
      currentDropTarget = null;

      // Do not initiate drag if user tapped an interactive button or select
      if (e.target.closest('button, select, input, a, .tile-action-btn')) {
        return;
      }

      holdTimer = setTimeout(() => {
        isTouchDragging = true;
        draggedItem = item;
        item.classList.add('is-touch-dragging', 'is-dragging');
        container.classList.add('is-dragging-active');

        // Optional haptic pulse
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(40); } catch (err) {}
        }
      }, 280);
    };

    const onTouchMove = (e) => {
      if (!holdTimer && !isTouchDragging) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPos.x;
      const dy = touch.clientY - touchStartPos.y;
      const dist = Math.hypot(dx, dy);

      if (!isTouchDragging) {
        // If moved more than 10px before hold timer fires, user is scrolling! Cancel hold timer.
        if (dist > 10) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        return;
      }

      // In touch dragging mode: prevent page scroll while moving
      if (e.cancelable) {
        e.preventDefault();
      }

      lastTouchPos = { x: touch.clientX, y: touch.clientY };
      handleAutoScrollCalculation(touch.clientY);
      updateDropTarget(touch.clientX, touch.clientY);
    };

    const onTouchEnd = (e) => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }

      stopAutoScroll();

      if (isTouchDragging) {
        if (e.cancelable) {
          e.preventDefault();
        }
        suppressClickUntil = Date.now() + 450;

        item.classList.remove('is-touch-dragging', 'is-dragging');
        container.classList.remove('is-dragging-active');
        items.forEach(it => it.classList.remove('drag-over'));

        if (currentDropTarget && currentDropTarget !== item) {
          const fromIndex = parseInt(item.getAttribute('data-drag-index'), 10);
          const toIndex = parseInt(currentDropTarget.getAttribute('data-drag-index'), 10);

          if (!isNaN(fromIndex) && !isNaN(toIndex) && fromIndex !== toIndex) {
            onReorder(fromIndex, toIndex);
          }
        }

        isTouchDragging = false;
        draggedItem = null;
        currentDropTarget = null;
      }
    };

    item.addEventListener('touchstart', onTouchStart, { passive: true });
    item.addEventListener('touchmove', onTouchMove, { passive: false });
    item.addEventListener('touchend', onTouchEnd, { passive: false });
    item.addEventListener('touchcancel', onTouchEnd, { passive: false });
  });

  return () => {
    stopAutoScroll();
    container.removeEventListener('click', clickInterceptor, true);
  };
}
