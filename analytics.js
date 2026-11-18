// Google Analytics 4 tracking integration for monogenesis
// Custom human detection, return visit tracking, and bot filtering

export const GA_MEASUREMENT_ID = 'G-M5WYQQQWVV';
const PROFILE_KEY = 'monogenesis_human_profile';
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes inactivity cutoff for a distinct session

function isBot() {
  if (typeof navigator === 'undefined') return true;
  if (navigator.webdriver) return true;
  const ua = (navigator.userAgent || '').toLowerCase();
  if (/bot|crawler|spider|crawling|headless|phantom|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|headlesschrome|lighthouse|inspect/i.test(ua)) {
    return true;
  }
  return false;
}

function getReturnTier(returnCount) {
  if (returnCount <= 0) return '1st_visit';
  if (returnCount === 1) return '2nd_visit';
  if (returnCount === 2) return '3rd_visit';
  if (returnCount <= 5) return '4-6_visits';
  if (returnCount <= 10) return '7-11_visits';
  return '12+_visits';
}

function getOrCreateProfile() {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  let profile = null;

  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) profile = JSON.parse(raw);
  } catch (_) {}

  if (!profile || typeof profile !== 'object') {
    profile = {
      id: 'h_' + now.toString(36) + Math.random().toString(36).substr(2, 6),
      firstSeen: now,
      lastSession: now,
      sessionCount: 1,
      returnCount: 0,
      daysActive: [today],
      isReturningSession: false
    };
  } else {
    // Check if enough time has passed to constitute a distinct return visit
    const isNewSession = (now - (profile.lastSession || 0)) > SESSION_GAP_MS;
    if (isNewSession) {
      profile.sessionCount = (profile.sessionCount || 1) + 1;
      profile.returnCount = profile.sessionCount - 1;
      profile.isReturningSession = true;
      if (!Array.isArray(profile.daysActive)) profile.daysActive = [];
      if (!profile.daysActive.includes(today)) {
        profile.daysActive.push(today);
      }
    }
    profile.lastSession = now;
  }

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (_) {}

  return profile;
}

// Global state
let humanVerified = false;
let returnEventSent = false;
let engagedEventSent = false;
let interactionCount = 0;
const profile = typeof window !== 'undefined' ? getOrCreateProfile() : null;

export function initGA() {
  if (typeof window === 'undefined') return;
  if (isBot()) return;

  if (!window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      user_id: profile?.id
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  } else {
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      user_id: profile?.id
    });
  }

  // Set persistent user properties in GA4
  if (profile) {
    window.gtag('set', 'user_properties', {
      visitor_type: profile.returnCount > 0 ? 'returning_human' : 'new_human',
      return_count: profile.returnCount,
      return_tier: getReturnTier(profile.returnCount),
      days_active: Array.isArray(profile.daysActive) ? profile.daysActive.length : 1
    });
  }

  setupHumanVerificationListeners();
}

function verifyHuman(reason = 'interaction') {
  if (humanVerified) return;
  if (isBot()) return;

  humanVerified = true;

  if (profile) {
    // 1. Emit Key Event: human_engaged (confirms this was a real human, not a crawler)
    if (!engagedEventSent) {
      engagedEventSent = true;
      trackEvent('human_engaged', {
        visitor_type: profile.returnCount > 0 ? 'returning_human' : 'new_human',
        return_count: profile.returnCount,
        return_tier: getReturnTier(profile.returnCount),
        trigger: reason
      });
    }

    // 2. Emit Key Event: human_return_visitor IF user has returned at least once
    if (profile.returnCount > 0 && !returnEventSent) {
      returnEventSent = true;
      const daysSinceFirst = Math.max(0, Math.floor((Date.now() - profile.firstSeen) / (24 * 3600 * 1000)));
      trackEvent('human_return_visitor', {
        return_count: profile.returnCount,
        return_tier: getReturnTier(profile.returnCount),
        visitor_type: 'returning_human',
        days_since_first: daysSinceFirst,
        distinct_days_active: Array.isArray(profile.daysActive) ? profile.daysActive.length : 1,
        auth_status: localStorage.getItem('vocab_tracker_auth_token') ? 'signed_in' : 'guest'
      });
    }
  }
}

function setupHumanVerificationListeners() {
  if (typeof document === 'undefined') return;

  const onUserActivity = () => {
    interactionCount++;
    // 2 interactions confirm human behavior
    if (interactionCount >= 2) {
      verifyHuman('user_interactions');
      removeListeners();
    }
  };

  const removeListeners = () => {
    document.removeEventListener('click', onUserActivity, true);
    document.removeEventListener('touchstart', onUserActivity, true);
    document.removeEventListener('keydown', onUserActivity, true);
    window.removeEventListener('scroll', onUserActivity, true);
  };

  document.addEventListener('click', onUserActivity, { capture: true, passive: true });
  document.addEventListener('touchstart', onUserActivity, { capture: true, passive: true });
  document.addEventListener('keydown', onUserActivity, { capture: true, passive: true });
  window.addEventListener('scroll', onUserActivity, { capture: true, passive: true });

  // Fallback: If actively present on site for > 8 seconds without bot signals
  setTimeout(() => {
    if (!humanVerified && !isBot() && interactionCount >= 1) {
      verifyHuman('dwell_time');
      removeListeners();
    }
  }, 8000);
}

export function trackPageView(pagePath, pageTitle) {
  if (isBot()) return;
  if (typeof window.gtag === 'function') {
    const raw = (pagePath || '/').replace(/^#/, '');
    const cleanPath = raw.startsWith('/') ? raw : '/' + raw;
    const formattedPath = cleanPath === '/' ? '/' : '/#' + cleanPath;
    const fullUrl = window.location.origin + formattedPath;
    const title = pageTitle || document.title;

    window.gtag('set', {
      page_path: formattedPath,
      page_location: fullUrl,
      page_title: title
    });

    window.gtag('event', 'page_view', {
      page_path: formattedPath,
      page_location: fullUrl,
      page_title: title,
      screen_name: title,
      return_count: profile?.returnCount || 0,
      visitor_type: (profile?.returnCount || 0) > 0 ? 'returning_human' : 'new_human'
    });
  }
}

export function trackEvent(eventName, params = {}) {
  if (isBot()) return;
  // If an explicit app action is taken, immediately verify as human
  if (eventName.startsWith('card_') || eventName.startsWith('word_') || eventName.startsWith('script_') || eventName.startsWith('khmer_')) {
    verifyHuman(eventName);
    // If this is a returning learner, fire repeat_learner key event
    if (profile && profile.returnCount > 0 && eventName !== 'repeat_learner') {
      window.gtag?.('event', 'repeat_learner', {
        return_count: profile.returnCount,
        return_tier: getReturnTier(profile.returnCount),
        human_action: eventName
      });
    }
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      return_count: profile?.returnCount || 0,
      return_tier: getReturnTier(profile?.returnCount || 0)
    });
  }
}

export function getHumanStats() {
  if (!profile) return null;
  return {
    visitorId: profile.id,
    sessionCount: profile.sessionCount || 1,
    returnCount: profile.returnCount || 0,
    returnTier: getReturnTier(profile.returnCount || 0),
    firstSeenDate: new Date(profile.firstSeen).toLocaleDateString(),
    daysActive: profile.daysActive?.length || 1,
    isReturningUser: (profile.returnCount || 0) > 0,
    isHumanVerified: humanVerified
  };
}

if (typeof window !== 'undefined') {
  window.getHumanStats = getHumanStats;
  initGA();
}
