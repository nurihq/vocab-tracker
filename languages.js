// Comprehensive list of world languages with ISO 639-1 code, English name, native name, and country flag emoji
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'fa', name: 'Persian', nativeName: 'فਾਰਸੀ', flag: '🇮🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերენ', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Sinugboanon', flag: '🇵🇭' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🟢' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🌺' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '☀️' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🏛️' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာစာ', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'ny', name: 'Nyanja (Chichewa)', nativeName: 'Chinyanja', flag: '🇲🇼' },
  { code: 'or', name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିਆ', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇵🇰' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga', flag: '🇸🇴' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '✡️' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' }
];

export function getLanguageByCode(code) {
  if (!code) return null;
  const normalized = code.toLowerCase().split('-')[0];
  return LANGUAGES.find(l => l.code.toLowerCase() === code.toLowerCase() || l.code.toLowerCase() === normalized) || {
    code,
    name: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    flag: '🌐'
  };
}

export function getLocalizedLanguageName(code, baseLang = 'en') {
  if (!code) return '';
  const langObj = getLanguageByCode(code);
  const cleanBase = (baseLang || 'en').toLowerCase().split('-')[0];
  try {
    const displayNames = new Intl.DisplayNames([cleanBase, 'en'], { type: 'language' });
    const localized = displayNames.of(code);
    if (localized) {
      return localized.charAt(0).toUpperCase() + localized.slice(1);
    }
  } catch (e) {}
  return langObj ? langObj.name : code.toUpperCase();
}

// Detection logic:
// 1. Saved selection in localStorage (permanent user preference)
// 2. Device / Browser Language (navigator.languages / navigator.language)
// 3. Location / Timezone fallback
// 4. Default 'en'
export function detectBrowserLanguage() {
  // Check navigator languages
  const navLangs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
  for (const raw of navLangs) {
    if (!raw) continue;
    const clean = raw.toLowerCase();
    const shortCode = clean.split('-')[0];
    const match = LANGUAGES.find(l => l.code.toLowerCase() === clean || l.code.toLowerCase() === shortCode);
    if (match) return match.code;
  }

  // Timezone to language heuristic fallback
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone.includes('Tbilisi')) return 'ka';
    if (timeZone.includes('Tokyo')) return 'ja';
    if (timeZone.includes('Seoul')) return 'ko';
    if (timeZone.includes('Moscow') || timeZone.includes('Kyiv') || timeZone.includes('Minsk')) return 'ru';
    if (timeZone.includes('Paris') || timeZone.includes('Brussels')) return 'fr';
    if (timeZone.includes('Berlin') || timeZone.includes('Vienna') || timeZone.includes('Zurich')) return 'de';
    if (timeZone.includes('Rome')) return 'it';
    if (timeZone.includes('Madrid') || timeZone.includes('Buenos_Aires') || timeZone.includes('Mexico') || timeZone.includes('Bogota')) return 'es';
    if (timeZone.includes('Jakarta') || timeZone.includes('Makassar') || timeZone.includes('Pontianak')) return 'id';
    if (timeZone.includes('Bangkok')) return 'th';
    if (timeZone.includes('Istanbul')) return 'tr';
    if (timeZone.includes('Kolkata')) return 'hi';
  } catch (e) {}

  return 'en';
}

// Greetings dictionary for world languages (used on home screen preview cards)
export const LANGUAGE_GREETINGS = {
  ja: { word: 'こんにちは', pronunciation: 'konnichiwa', baseMeaning: 'Hello' },
  ka: { word: 'გამარჯობა', pronunciation: 'gamarjoba', baseMeaning: 'Hello' },
  es: { word: '¡Hola!', pronunciation: 'oh-lah', baseMeaning: 'Hello' },
  id: { word: 'Terima kasih', pronunciation: 'te-ri-ma ka-sih', baseMeaning: 'Thank you' },
  fr: { word: 'Bonjour', pronunciation: 'bohn-zhoor', baseMeaning: 'Hello' },
  de: { word: 'Guten Tag', pronunciation: 'goo-ten tahk', baseMeaning: 'Good day' },
  it: { word: 'Ciao', pronunciation: 'chow', baseMeaning: 'Hello' },
  pt: { word: 'Olá', pronunciation: 'oh-lah', baseMeaning: 'Hello' },
  ru: { word: 'Привет', pronunciation: 'pree-vyet', baseMeaning: 'Hello' },
  zh: { word: '你好', pronunciation: 'nǐ hǎo', baseMeaning: 'Hello' },
  'zh-tw': { word: '你好', pronunciation: 'nǐ hǎo', baseMeaning: 'Hello' },
  ko: { word: '안녕하세요', pronunciation: 'annyeonghaseyo', baseMeaning: 'Hello' },
  ar: { word: 'مرحبا', pronunciation: 'marhaban', baseMeaning: 'Hello' },
  hi: { word: 'नमस्ते', pronunciation: 'namaste', baseMeaning: 'Hello' },
  bn: { word: 'হ্যালো', pronunciation: 'hyālō', baseMeaning: 'Hello' },
  pa: { word: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', pronunciation: 'sat sri akaal', baseMeaning: 'Hello' },
  ms: { word: 'Halo', pronunciation: 'hah-loh', baseMeaning: 'Hello' },
  vi: { word: 'Xin chào', pronunciation: 'sin chow', baseMeaning: 'Hello' },
  th: { word: 'สวัสดี', pronunciation: 'sawatdee', baseMeaning: 'Hello' },
  tr: { word: 'Merhaba', pronunciation: 'mer-ha-ba', baseMeaning: 'Hello' },
  fa: { word: 'سلام', pronunciation: 'salaam', baseMeaning: 'Hello' },
  pl: { word: 'Cześć', pronunciation: 'cheshch', baseMeaning: 'Hello' },
  uk: { word: 'Привіт', pronunciation: 'pry-vit', baseMeaning: 'Hello' },
  nl: { word: 'Hallo', pronunciation: 'hah-loh', baseMeaning: 'Hello' },
  el: { word: 'Γειά σας', pronunciation: 'ya sas', baseMeaning: 'Hello' },
  cs: { word: 'Ahoj', pronunciation: 'ah-hoy', baseMeaning: 'Hello' },
  sv: { word: 'Hej', pronunciation: 'hey', baseMeaning: 'Hello' },
  hu: { word: 'Szia', pronunciation: 'see-ah', baseMeaning: 'Hello' },
  ro: { word: 'Bună', pronunciation: 'boo-nuh', baseMeaning: 'Hello' },
  da: { word: 'Hej', pronunciation: 'hey', baseMeaning: 'Hello' },
  fi: { word: 'Hei', pronunciation: 'hey', baseMeaning: 'Hello' },
  no: { word: 'Hei', pronunciation: 'hey', baseMeaning: 'Hello' },
  he: { word: 'שלום', pronunciation: 'shalom', baseMeaning: 'Hello' },
  sk: { word: 'Ahoj', pronunciation: 'ah-hoy', baseMeaning: 'Hello' },
  bg: { word: 'Здравейте', pronunciation: 'zdraveyte', baseMeaning: 'Hello' },
  hr: { word: 'Bok', pronunciation: 'bok', baseMeaning: 'Hello' },
  sr: { word: 'Здраво', pronunciation: 'zdravo', baseMeaning: 'Hello' },
  lt: { word: 'Labas', pronunciation: 'lah-bas', baseMeaning: 'Hello' },
  lv: { word: 'Sveiki', pronunciation: 'svay-kee', baseMeaning: 'Hello' },
  et: { word: 'Tere', pronunciation: 'teh-reh', baseMeaning: 'Hello' },
  sl: { word: 'Živjo', pronunciation: 'zheev-yo', baseMeaning: 'Hello' },
  ga: { word: 'Dia dhuit', pronunciation: 'dee-ah gwit', baseMeaning: 'Hello' },
  cy: { word: 'Helo', pronunciation: 'heh-lo', baseMeaning: 'Hello' },
  is: { word: 'Halló', pronunciation: 'hahl-loh', baseMeaning: 'Hello' },
  tl: { word: 'Kamusta', pronunciation: 'kah-moos-tah', baseMeaning: 'Hello' },
  sw: { word: 'Hujambo', pronunciation: 'hoo-jahm-boh', baseMeaning: 'Hello' },
  am: { word: 'ሰላም', pronunciation: 'selam', baseMeaning: 'Hello' },
  hy: { word: 'Բարև', pronunciation: 'barev', baseMeaning: 'Hello' },
  az: { word: 'Salam', pronunciation: 'sah-lahm', baseMeaning: 'Hello' },
  eu: { word: 'Kaixo', pronunciation: 'kai-sho', baseMeaning: 'Hello' },
  km: { word: 'សួស្តី', pronunciation: 'suosdei', baseMeaning: 'Hello' },
  la: { word: 'Salve', pronunciation: 'sahl-way', baseMeaning: 'Hello' },
  en: { word: 'Hello', pronunciation: 'heh-loh', baseMeaning: 'Hello' }
};

export function getLanguageGreeting(code) {
  if (!code) return { word: 'Hello', pronunciation: '', baseMeaning: 'Hello' };
  const clean = code.toLowerCase().trim();
  const shortCode = clean.split('-')[0];
  if (LANGUAGE_GREETINGS[clean]) return LANGUAGE_GREETINGS[clean];
  if (LANGUAGE_GREETINGS[shortCode]) return LANGUAGE_GREETINGS[shortCode];
  const langObj = getLanguageByCode(code);
  return {
    word: langObj?.nativeName || langObj?.name || code.toUpperCase(),
    pronunciation: langObj?.name || '',
    baseMeaning: 'Hello'
  };
}

// Khmer 15 A-Series Consonants (Orange) & 18 O-Series Consonants (Purple)
export const KHMER_A_SERIES = new Set([
  'ក', 'ខ', 'ច', 'ឆ', 'ដ', 'ឋ', 'ណ', 'ត', 'ថ', 'ប', 'ផ', 'ស', 'ហ', 'ឡ', 'អ'
]);

export const KHMER_O_SERIES = new Set([
  'គ', 'ឃ', 'ង', 'ជ', 'ឈ', 'ញ', 'ឌ', 'ឍ', 'ទ', 'ធ', 'ន', 'ព', 'ភ', 'ម', 'យ', 'រ', 'ល', 'វ'
]);

export function getKhmerConsonantSeries(ch) {
  if (!ch) return null;
  if (KHMER_A_SERIES.has(ch)) return 'a';
  if (KHMER_O_SERIES.has(ch)) return 'o';
  return null;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isKhmerColorSettingEnabled() {
  try {
    const raw = localStorage.getItem('vocab_tracker_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const allOn = parsed.allLanguagesColors !== false;
      const khmerOn = parsed.khmerConsonantColors !== false;
      return Boolean(allOn && khmerOn);
    }
  } catch (e) {}
  return true; // Enabled by default
}

/**
 * Formats study word text with Khmer consonant series coloring (A-series orange, O-series purple)
 * and interactive click attributes that navigate to /scripts/khmer with that consonant highlighted.
 */
export function formatStudyTextHtml(text, forceColor = null) {
  if (!text) return '';
  const str = String(text);
  // Quick check if string contains any Khmer characters (U+1780..U+17FF)
  if (!/[\u1780-\u17FF]/.test(str)) {
    return escapeHtml(str);
  }

  const enabled = forceColor !== null ? Boolean(forceColor) : isKhmerColorSettingEnabled();
  if (!enabled) {
    return escapeHtml(str);
  }

  const chars = Array.from(str);
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];

    // Check for Coeng (`្` U+17D2) followed by a consonant
    if (ch === '\u17D2' && i + 1 < chars.length) {
      const nextCh = chars[i + 1];
      const subSeries = getKhmerConsonantSeries(nextCh);
      if (subSeries) {
        const subToken = `្${nextCh}`;
        out += `<span class="khmer-cons-char khmer-color-${subSeries}" data-khmer-char="${subToken}" title="Click to locate ${subToken} on Khmer keyboard">${subToken}</span>`;
        i++;
        continue;
      }
    }

    const series = getKhmerConsonantSeries(ch);
    if (series) {
      let subAttr = '';
      if (chars[i + 1] === '\u17D2' && i + 2 < chars.length && getKhmerConsonantSeries(chars[i + 2])) {
        subAttr = ` data-khmer-sub="្${chars[i + 2]}"`;
      }
      out += `<span class="khmer-cons-char khmer-color-${series}" data-khmer-char="${ch}"${subAttr} title="Click to locate ${ch} on Khmer keyboard">${ch}</span>`;
      continue;
    }

    out += escapeHtml(ch);
  }

  return out;
}


