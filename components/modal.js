import { t } from '../i18n.js';

export const Modal = {
  activeOverlay: null,

  open({ title, contentHtml, onConfirm, confirmText, confirmClass = 'btn-primary', onCancel }) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close-btn" id="modal-close">×</button>
        </div>
        <div class="modal-body">
          ${contentHtml}
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="modal-cancel">${t('cancel')}</button>
          ${confirmText ? `<button class="btn ${confirmClass}" id="modal-confirm">${confirmText}</button>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.activeOverlay = overlay;

    // Trigger transition
    requestAnimationFrame(() => {
      overlay.classList.add('is-active');
    });

    const closeHandler = () => {
      this.close();
      if (onCancel) onCancel();
    };

    overlay.querySelector('#modal-close').addEventListener('click', closeHandler);
    overlay.querySelector('#modal-cancel').addEventListener('click', closeHandler);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeHandler();
    });

    const confirmBtn = overlay.querySelector('#modal-confirm');
    if (confirmBtn && onConfirm) {
      confirmBtn.addEventListener('click', async () => {
        const result = await onConfirm(overlay);
        if (result !== false) {
          this.close();
        }
      });
    }

    // Keyboard ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeHandler();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);

    return overlay;
  },

  confirmDeleteDeck({ deckName, onConfirm }) {
    const warning = t('deleteConfirmWarning');
    const typePrompt = t('typeToConfirm', { name: deckName });

    const contentHtml = `
      <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.95rem;">${warning}</p>
      <div class="form-group">
        <label class="form-label">${typePrompt}</label>
        <input type="text" class="form-input" id="confirm-deck-name-input" placeholder="${deckName}" autocomplete="off" />
      </div>
    `;

    const overlay = this.open({
      title: t('deleteConfirmTitle'),
      contentHtml,
      confirmText: t('delete'),
      confirmClass: 'btn-danger',
      onConfirm: async (modalEl) => {
        const input = modalEl.querySelector('#confirm-deck-name-input');
        if (input && input.value.trim() === deckName.trim()) {
          await onConfirm();
          return true;
        } else {
          input.style.borderColor = 'var(--accent-red)';
          input.focus();
          return false;
        }
      }
    });

    const confirmBtn = overlay.querySelector('#modal-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = '0.5';
      const input = overlay.querySelector('#confirm-deck-name-input');
      input.addEventListener('input', () => {
        const match = input.value.trim() === deckName.trim();
        confirmBtn.disabled = !match;
        confirmBtn.style.opacity = match ? '1' : '0.5';
      });
      setTimeout(() => input.focus(), 50);
    }
  },

  close() {
    if (this.activeOverlay) {
      this.activeOverlay.classList.remove('is-active');
      const toRemove = this.activeOverlay;
      setTimeout(() => {
        if (toRemove.parentNode) toRemove.parentNode.removeChild(toRemove);
      }, 200);
      this.activeOverlay = null;
    }
  }
};
