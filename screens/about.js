import { t, autoTranslateUi } from '../i18n.js?v=20260915_1789464100957';
import { Auth } from '../api.js?v=20260915_1789464100957';
import { trackEvent } from '../analytics.js?v=20260915_1789464100957';
import { navigate } from '../app.js?v=20260915_1789464100957';

export function renderAboutScreen(container) {
  const isAuthed = Auth.isAuthenticated();

  const CEFR_TIERS = [
    {
      cefr: 'A1',
      tier: 'A1',
      totalWords: '500',
      wordsNeeded: '+250',
      reason: 'You only need basic survival nouns and verbs.',
      badgeClass: 'badge-a1'
    },
    {
      cefr: 'A1',
      tier: 'A1+',
      totalWords: '750',
      wordsNeeded: '+250',
      reason: 'Adding basic adjectives and connectives.',
      badgeClass: 'badge-a1'
    },
    {
      cefr: 'A2',
      tier: 'A2',
      totalWords: '1,000',
      wordsNeeded: '+500',
      reason: 'Grouping routine words (family, shopping, work).',
      badgeClass: 'badge-a2'
    },
    {
      cefr: 'A2',
      tier: 'A2+',
      totalWords: '1,500',
      wordsNeeded: '+500',
      reason: 'The Middle Zone. You are expanding past the basics.',
      badgeClass: 'badge-a2'
    },
    {
      cefr: 'B1',
      tier: 'B1',
      totalWords: '2,000',
      wordsNeeded: '+1,000',
      reason: 'Doubling the vocabulary to handle abstract opinions.',
      badgeClass: 'badge-b1'
    },
    {
      cefr: 'B1',
      tier: 'B1+',
      totalWords: '3,000',
      wordsNeeded: '+1,000',
      reason: 'Adding nuance and specific situational terms.',
      badgeClass: 'badge-b1'
    },
    {
      cefr: 'B2',
      tier: 'B2',
      totalWords: '4,000',
      wordsNeeded: '+2,000',
      reason: 'Huge jump. Required for professional, fluid work.',
      badgeClass: 'badge-b2'
    },
    {
      cefr: 'B2',
      tier: 'B2+',
      totalWords: '6,000',
      wordsNeeded: '+2,000',
      reason: 'Mastering idioms and technical topics.',
      badgeClass: 'badge-b2'
    },
    {
      cefr: 'C1',
      tier: 'C1',
      totalWords: '8,000',
      wordsNeeded: '+8,000',
      reason: 'The Exponential Leap. Moving into academic fluency.',
      badgeClass: 'badge-c1'
    },
    {
      cefr: 'C2',
      tier: 'C2',
      totalWords: '16,000+',
      wordsNeeded: '—',
      reason: 'Near-native vocabulary across all domains.',
      badgeClass: 'badge-c2'
    }
  ];

  container.innerHTML = `
    <div class="about-container">
      <div class="about-header">
        <div class="about-badge">
          <span>📚</span> <span>Vocabulary Framework</span>
        </div>
        <h1 class="about-title">Vocabulary Growth is Exponential</h1>
        <p class="about-subtitle">
          Language acquisition doesn't advance in straight lines. As you progress from elementary survival words to professional fluency, each tier demands an expanding foundation of vocabulary families.
        </p>
      </div>

      <div class="about-table-card">
        <div class="table-responsive">
          <table class="cefr-table">
            <thead>
              <tr>
                <th>CEFR Level</th>
                <th>Extended Tier</th>
                <th>Total Word Families</th>
                <th>Words Needed to Advance to Next Tier</th>
                <th>Why it's not linear</th>
              </tr>
            </thead>
            <tbody>
              ${CEFR_TIERS.map(row => `
                <tr>
                  <td>
                    <span class="cefr-badge ${row.badgeClass}">${row.cefr}</span>
                  </td>
                  <td class="tier-cell"><strong>${row.tier}</strong></td>
                  <td class="num-cell"><strong>${row.totalWords}</strong></td>
                  <td class="advance-cell"><span class="advance-badge">${row.wordsNeeded}</span></td>
                  <td class="reason-cell">${row.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="about-footer-cta">
        <p class="about-cta-text">
          Track your personal word collections, create custom decks, and master vocabulary at your own pace.
        </p>
        <button class="btn btn-primary btn-lg" id="about-start-btn">
          <span>${isAuthed ? t('studyLanguages') : t('startLearning')}</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;

  autoTranslateUi(container);

  const startBtn = container.querySelector('#about-start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      trackEvent('about_cta_click', { isAuthed });
      if (isAuthed) {
        navigate('#/languages');
      } else {
        navigate('#/signin');
      }
    });
  }
}
