import { t } from '../i18n.js';
import { Auth } from '../api.js';

export function renderHomeScreen(container) {
  container.innerHTML = `
    <div class="hero-wrapper">
      <div class="hero-badge">
        <span>✨</span> <span>${t('tagline')}</span>
      </div>
      
      <h1 class="hero-title">${t('appTitle')}</h1>
      <p class="hero-subtitle">${t('subtitle')}</p>

      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" id="home-start-btn">
          <span>${t('startLearning')}</span>
          <span style="font-size: 1.25rem;">→</span>
        </button>
      </div>

      <div class="hero-preview-cards">
        <div class="preview-card-mini">
          <span class="preview-flag">🇯🇵</span>
          <span class="preview-word">こんにちは</span>
          <span class="preview-trans">Hello</span>
        </div>
        <div class="preview-card-mini" style="transform: translateY(-8px);">
          <span class="preview-flag">🇬🇪</span>
          <span class="preview-word">გამარჯობა</span>
          <span class="preview-trans">Hello</span>
        </div>
        <div class="preview-card-mini">
          <span class="preview-flag">🇪🇸</span>
          <span class="preview-word">¡Hola!</span>
          <span class="preview-trans">Hello</span>
        </div>
      </div>
    </div>
  `;

  const startBtn = container.querySelector('#home-start-btn');
  startBtn.addEventListener('click', () => {
    if (Auth.isAuthenticated()) {
      window.location.hash = '#/languages';
    } else {
      window.location.hash = '#/signin';
    }
  });
}
