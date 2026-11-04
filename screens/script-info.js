import { autoTranslateUi } from '../i18n.js?v=20261104_scripts3';
import { trackEvent } from '../analytics.js?v=20261104_scripts3';
import { navigate } from '../app.js?v=20261104_scripts3';
import { notifyScriptProgressChange, syncScriptsProgress } from '../api.js?v=20261104_scripts24';
import { HIRAGANA_SECTIONS } from '../scripts/data/hiragana-data.js?v=20261104_scripts3';
import { KATAKANA_SECTIONS } from '../scripts/data/katakana-data.js?v=20261104_scripts3';
import { KHMER_SECTIONS } from '../scripts/data/khmer-data.js?v=20261104_scripts3';

// ============================================================================
// KHMER CHARACTER METADATA (Consonants + Subscripts + Dependent & Indep Vowels)
// ============================================================================

const KHMER_CHAR_LOOKUP = {
  // 15 A-Series Consonants
  'ក': { type: 'consonant', series: 'A', romaji: 'kâ', sub: 'គ' },
  'ខ': { type: 'consonant', series: 'A', romaji: 'khâ', sub: 'ឃ' },
  'ច': { type: 'consonant', series: 'A', romaji: 'châ', sub: 'ជ' },
  'ឆ': { type: 'consonant', series: 'A', romaji: 'chhâ', sub: 'ឈ' },
  'ដ': { type: 'consonant', series: 'A', romaji: 'dâ', sub: 'ឌ' },
  'ឋ': { type: 'consonant', series: 'A', romaji: 'thâ', sub: 'ឍ' },
  'ណ': { type: 'consonant', series: 'A', romaji: 'nâ', sub: 'ន' },
  'ត': { type: 'consonant', series: 'A', romaji: 'tâ', sub: 'ទ' },
  'ថ': { type: 'consonant', series: 'A', romaji: 'thâ', sub: 'ធ' },
  'ប': { type: 'consonant', series: 'A', romaji: 'bâ', sub: 'ព' },
  'ផ': { type: 'consonant', series: 'A', romaji: 'phâ', sub: 'ភ' },
  'ស': { type: 'consonant', series: 'A', romaji: 'sâ', sub: 'ៃ' },
  'ហ': { type: 'consonant', series: 'A', romaji: 'hâ', sub: 'ះ' },
  'ឡ': { type: 'consonant', series: 'A', romaji: 'lâ', sub: 'ល' },
  'អ': { type: 'consonant', series: 'A', romaji: '’â', sub: 'ង' },

  // 18 O-Series Consonants
  'គ': { type: 'consonant', series: 'O', romaji: 'kô', sub: 'ក' },
  'ឃ': { type: 'consonant', series: 'O', romaji: 'khô', sub: 'ខ' },
  'ង': { type: 'consonant', series: 'O', romaji: 'ngô', sub: 'អ' },
  'ជ': { type: 'consonant', series: 'O', romaji: 'chô', sub: 'ច' },
  'ឈ': { type: 'consonant', series: 'O', romaji: 'chhô', sub: 'ឆ' },
  'ញ': { type: 'consonant', series: 'O', romaji: 'nhô', sub: '្' },
  'ឌ': { type: 'consonant', series: 'O', romaji: 'dô', sub: 'ដ' },
  'ឍ': { type: 'consonant', series: 'O', romaji: 'thô', sub: 'ឋ' },
  'ទ': { type: 'consonant', series: 'O', romaji: 'tô', sub: 'ត' },
  'ធ': { type: 'consonant', series: 'O', romaji: 'thô', sub: 'ថ' },
  'ន': { type: 'consonant', series: 'O', romaji: 'nô', sub: 'ណ' },
  'ព': { type: 'consonant', series: 'O', romaji: 'pô', sub: 'ប' },
  'ភ': { type: 'consonant', series: 'O', romaji: 'phô', sub: 'ផ' },
  'ម': { type: 'consonant', series: 'O', romaji: 'mô', sub: 'ំ' },
  'យ': { type: 'consonant', series: 'O', romaji: 'yô', sub: 'ួ' },
  'រ': { type: 'consonant', series: 'O', romaji: 'rô', sub: 'ឬ' },
  'ល': { type: 'consonant', series: 'O', romaji: 'lô', sub: 'ឡ' },
  'វ': { type: 'consonant', series: 'O', romaji: 'vô', sub: 'េះ' },

  // 23 Dependent Vowels (with A-series & O-series forms and romanisations)
  'ា': { type: 'vowel', romaji: 'aa / éa', aForm: 'កា', aRom: 'kaa', oForm: 'គា', oRom: 'kea', sub: 'ាំ' },
  'ិ': { type: 'vowel', romaji: 'e / i', aForm: 'កិ', aRom: 'ke', oForm: 'គិ', oRom: 'ki', sub: 'ី' },
  'ី': { type: 'vowel', romaji: 'ei / ii', aForm: 'កី', aRom: 'kei', oForm: 'គី', oRom: 'kii', sub: 'ិ' },
  'ឹ': { type: 'vowel', romaji: 'oe / ue', aForm: 'កឹ', aRom: 'koe', oForm: 'គឹ', oRom: 'kue', sub: 'ឺ' },
  'ឺ': { type: 'vowel', romaji: 'eu / ueu', aForm: 'កឺ', aRom: 'keu', oForm: 'គឺ', oRom: 'kueu', sub: 'ឹ' },
  'ុ': { type: 'vowel', romaji: 'o / u', aForm: 'កុ', aRom: 'ko', oForm: 'គុ', oRom: 'ku', sub: 'ូ' },
  'ូ': { type: 'vowel', romaji: 'ou / uu', aForm: 'កូ', aRom: 'kou', oForm: 'គូ', oRom: 'kuu', sub: 'ុ' },
  'ួ': { type: 'vowel', romaji: 'uo', aForm: 'កួ', aRom: 'kuo', oForm: 'គួ', oRom: 'kuo', sub: 'យ' },
  'ើ': { type: 'vowel', romaji: 'aeu / oeu', aForm: 'កើ', aRom: 'kaeu', oForm: 'គើ', oRom: 'koeu', sub: 'ឿ' },
  'ឿ': { type: 'vowel', romaji: 'oeur / uea', aForm: 'កឿ', aRom: 'koeur', oForm: 'គឿ', oRom: 'kuea', sub: 'ើ' },
  'ៀ': { type: 'vowel', romaji: 'ie', aForm: 'កៀ', aRom: 'kie', oForm: 'គៀ', oRom: 'kie', sub: 'ោះ' },
  'េ': { type: 'vowel', romaji: 'ei / é', aForm: 'កេ', aRom: 'kei', oForm: 'គេ', oRom: 'ké', sub: 'ែ' },
  'ែ': { type: 'vowel', romaji: 'ae / ê', aForm: 'កែ', aRom: 'kae', oForm: 'គែ', oRom: 'kê', sub: 'េ' },
  'ៃ': { type: 'vowel', romaji: 'ai / ey', aForm: 'កៃ', aRom: 'kai', oForm: 'គៃ', oRom: 'key', sub: 'ស' },
  'ោ': { type: 'vowel', romaji: 'ao / ou', aForm: 'កោ', aRom: 'kao', oForm: 'គោ', oRom: 'kou', sub: 'ៅ' },
  'ៅ': { type: 'vowel', romaji: 'au / ov', aForm: 'កៅ', aRom: 'kau', oForm: 'គៅ', oRom: 'kov', sub: 'ោ' },
  'ុំ': { type: 'vowel', displayChar: 'ុំ', romaji: 'om / um', aForm: 'កុំ', aRom: 'kom', oForm: 'គុំ', oRom: 'kum', combo: 'ុ + ំ' },
  'ំ': { type: 'vowel', romaji: 'am / um', aForm: 'កំ', aRom: 'kam', oForm: 'គំ', oRom: 'kum', sub: 'ម' },
  'ាំ': { type: 'vowel', displayChar: 'ាំ', romaji: 'am / oam', aForm: 'កាំ', aRom: 'kam', oForm: 'គាំ', oRom: 'koam', sub: 'ា', combo: 'ា + ំ' },
  'ះ': { type: 'vowel', romaji: 'ah / eah', aForm: 'កះ', aRom: 'kah', oForm: 'គះ', oRom: 'keah', sub: 'ហ' },
  'ុះ': { type: 'vowel', displayChar: 'ុះ', romaji: 'oh / uh', aForm: 'កុះ', aRom: 'koh', oForm: 'គុះ', oRom: 'kuh', combo: 'ុ + ះ' },
  'េះ': { type: 'vowel', displayChar: 'េះ', romaji: 'eh / ih', aForm: 'កេះ', aRom: 'keh', oForm: 'គេះ', oRom: 'kih', sub: 'វ', combo: 'េ + ះ' },
  'ោះ': { type: 'vowel', displayChar: 'ោះ', romaji: 'aoh / uoh', aForm: 'កោះ', aRom: 'kaoh', oForm: 'គោះ', oRom: 'kuoh', sub: 'ៀ', combo: 'ោ + ះ' },

  // 14 Independent Vowels
  'ឥ': { type: 'indep_vowel', romaji: '’e', note: 'Indep. e' },
  'ឦ': { type: 'indep_vowel', romaji: '’ei', note: 'Indep. ei' },
  'ឧ': { type: 'indep_vowel', romaji: '’o', note: 'Indep. o' },
  'ឨ': { type: 'indep_vowel', romaji: '’ok', note: 'Indep. ok' },
  'ឩ': { type: 'indep_vowel', romaji: '’ou', note: 'Indep. ou' },
  'ឪ': { type: 'indep_vowel', romaji: '’ov', note: 'Indep. ov' },
  'ឫ': { type: 'indep_vowel', romaji: 'rue', note: 'Vocalic r' },
  'ឬ': { type: 'indep_vowel', romaji: 'rueu', note: 'Long vocalic r', sub: 'រ' },
  'ឭ': { type: 'indep_vowel', romaji: 'lue', note: 'Vocalic l' },
  'ឮ': { type: 'indep_vowel', romaji: 'lueu', note: 'Long vocalic l' },
  'ឯ': { type: 'indep_vowel', romaji: '’ae', note: 'Indep. ae' },
  'ឰ': { type: 'indep_vowel', romaji: '’ai', note: 'Indep. ai' },
  'ឱ': { type: 'indep_vowel', romaji: '’ao', note: 'Indep. ao' },
  'ឳ': { type: 'indep_vowel', romaji: '’au', note: 'Indep. au' },
  'ឲ': { type: 'indep_vowel', romaji: 'aoy', note: 'Indep. aoy ("give")' },

  // 10 Khmer Digits
  '១': { type: 'digit', romaji: '1', note: '1 (muoy) — Khmer Digit 1' },
  '២': { type: 'digit', romaji: '2', note: '2 (pii) — Khmer Digit 2' },
  '៣': { type: 'digit', romaji: '3', note: '3 (bei) — Khmer Digit 3' },
  '៤': { type: 'digit', romaji: '4', note: '4 (buon) — Khmer Digit 4' },
  '៥': { type: 'digit', romaji: '5', note: '5 (pram) — Khmer Digit 5' },
  '៦': { type: 'digit', romaji: '6', note: '6 (pram-muoy) — Khmer Digit 6' },
  '៧': { type: 'digit', romaji: '7', note: '7 (pram-pii) — Khmer Digit 7' },
  '៨': { type: 'digit', romaji: '8', note: '8 (pram-bei) — Khmer Digit 8' },
  '៩': { type: 'digit', romaji: '9', note: '9 (pram-buon) — Khmer Digit 9' },
  '០': { type: 'digit', romaji: '0', note: '0 (soun) — Khmer Digit 0' },

  // Khmer Diacritics & Punctuation Signs
  '់': { type: 'sign', romaji: 'bantoc', note: 'Bantoc — shortens preceding vowel sound' },
  '៉': { type: 'sign', romaji: 'muusik.', note: 'Muusikatoan — shifts O-series consonants to A-series sound' },
  '៊': { type: 'sign', romaji: 'triisap', note: 'Triisap — shifts A-series consonants to O-series sound' },
  'ៗ': { type: 'sign', romaji: 'repeat', note: 'Lekhto / Lek Too — repetition mark for words & phrases' },
  '។': { type: 'sign', romaji: 'khan (.)', note: 'Khan — sentence ending period / full stop' },
  '៕': { type: 'sign', romaji: 'end', note: 'Bariyoosan — marks end of text, chapter, or story' },
  '៖': { type: 'sign', romaji: 'colon (:)', note: 'Camnuc Pii Kuuh — Khmer colon / divider' },
  '៛': { type: 'sign', romaji: 'riel', note: 'Khmer Riel currency symbol (៛)' },
  '៍': { type: 'sign', romaji: 'silent', note: 'Toandakhiat — silences the consonant beneath it' },
  '័': { type: 'sign', romaji: 'samyok', note: 'Samyok Sannya — combines with consonants to modify vowel' },
  '៏': { type: 'sign', romaji: 'ahsda', note: 'Ahsda — used on short words (e.g. ក៏ "also")' },
  '៌': { type: 'sign', romaji: 'robat', note: 'Robat — Sanskrit repha symbol; appears in loanwords' },
  '៎': { type: 'sign', romaji: 'kakabat', note: 'Kakabat — exclamation / emphasis mark' },
  '៑': { type: 'sign', romaji: 'viriam', note: 'Viriam — virama / vowel killer in classical loanwords' },
  '!': { type: 'sign', romaji: '!', note: 'Exclamation mark' },
  '?': { type: 'sign', romaji: '?', note: 'Question mark' },
  '"': { type: 'sign', romaji: '"', note: 'Double quotation mark' },
  '%': { type: 'sign', romaji: '%', note: 'Percent sign' },
  '(': { type: 'sign', romaji: '(', note: 'Left parenthesis' },
  ')': { type: 'sign', romaji: ')', note: 'Right parenthesis' }
};

// Populate subscript consonants (`្ក` .. `្វ`) in KHMER_CHAR_LOOKUP
Object.entries({ ...KHMER_CHAR_LOOKUP }).forEach(([ch, meta]) => {
  if (meta.type === 'consonant') {
    KHMER_CHAR_LOOKUP[`្${ch}`] = {
      type: 'subscript',
      baseChar: ch,
      displayChar: `\u200d្${ch}`,
      series: meta.series,
      romaji: meta.romaji,
      sub: ch
    };
  }
});

// Apple iOS Khmer Native Mobile Keyboard Layout (4 rows, 12 columns, 46 keys per layer)
const KHMER_KEYBOARD_ROWS = {
  // Layer 1: Default Mobile Keyboard (4 rows: 12 + 12 + 12 + 10 chars)
  layer1: [
    ['១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩', '០', 'ឥ', 'ឲ'],
    ['ឆ', 'ឹ', 'េ', 'រ', 'ត', 'យ', 'ុ', 'ិ', 'ោ', 'ផ', 'ៀ', 'ឪ'],
    ['ា', 'ស', 'ដ', 'ថ', 'ង', 'ហ', 'COENG_KEY', 'ក', 'ល', 'ើ', '់', 'ឭ'],
    ['SHIFT_KEY', 'ឋ', 'ខ', 'ច', 'វ', 'ប', 'ន', 'ម', 'ឦ', '។', '៊']
  ],
  // Layer 2: Shifted (⇧) Mobile Keyboard (4 rows: 12 + 12 + 12 + 10 chars)
  layer2: [
    ['!', 'ៗ', '"', '៛', '%', '៍', '័', '៏', 'ឰ', 'ឳ', '៌', '៎'],
    ['ឈ', 'ឺ', 'ែ', 'ឬ', 'ទ', 'ួ', 'ូ', 'ី', 'ៅ', 'ភ', 'ឿ', 'ឧ'],
    ['ឫ', 'ៃ', 'ឌ', 'ធ', 'អ', 'ះ', 'ញ', 'គ', 'ឡ', 'ោះ', '៉', 'ឮ'],
    ['SHIFT_KEY', 'ឍ', 'ឃ', 'ជ', 'េះ', 'ព', 'ណ', 'ំ', 'ឱ', '៕', 'ឯ']
  ],
  // Layer 3: Subscript Consonants (្ Coeng Layer — mapped in-place onto the consonant keys)
  coengLayer1: [
    [null, null, null, null, null, null, null, null, null, null, null, null],
    ['្ឆ', null, null, '្រ', '្ត', '្យ', null, null, null, '្ផ', null, null],
    [null, '្ស', '្ដ', '្ថ', '្ង', '្ហ', 'COENG_KEY', '្ក', '្ល', null, null, null],
    ['SHIFT_KEY', '្ឋ', '្ខ', '្ច', '្វ', '្ប', '្ន', '្ម', null, null, null]
  ],
  coengLayer2: [
    [null, null, null, null, null, null, null, null, null, null, null, null],
    ['្ឈ', null, null, null, '្ទ', null, null, null, null, '្ភ', null, null],
    [null, null, '្ឌ', '្ធ', '្អ', null, '្ញ', '្គ', '្ឡ', null, null, null],
    ['SHIFT_KEY', '្ឍ', '្ឃ', '្ជ', null, '្ព', '្ណ', null, null, null, 'COENG_KEY']
  ],
  // Additional Multi-keystroke Dependent Vowels & Independent Vowels row
  compoundVowels: ['ុំ', 'ុះ', 'ាំ', 'េះ', 'ោះ'],
  independentVowels: ['ឥ', 'ឦ', 'ឧ', 'ឨ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ', 'ឯ', 'ឰ', 'ឱ', 'ឳ']
};

// ============================================================================
// JAPANESE EXPANDED MOBILE FLICK KEYBOARD DATA (9 Keys + Wa Row, 5-Key Crosses)
// ============================================================================

const JAPANESE_EXPANDED_KEYBOARD = {
  hiragana: {
    // 9 main keys (3x3 grid), each a 5-key cross (center = a, left = i, up = u, right = e, down = o)
    // plus bottom row with Wa-key
    basic: [
      {
        col: 'a', label: 'あ行 (Vowels)',
        center: { char: 'あ', romaji: 'a' },
        left:   { char: 'い', romaji: 'i' },
        up:     { char: 'う', romaji: 'u' },
        right:  { char: 'え', romaji: 'e' },
        down:   { char: 'お', romaji: 'o' }
      },
      {
        col: 'ka', label: 'か行 (K-row)',
        center: { char: 'か', romaji: 'ka' },
        left:   { char: 'き', romaji: 'ki' },
        up:     { char: 'く', romaji: 'ku' },
        right:  { char: 'け', romaji: 'ke' },
        down:   { char: 'こ', romaji: 'ko' }
      },
      {
        col: 'sa', label: 'さ行 (S-row)',
        center: { char: 'さ', romaji: 'sa' },
        left:   { char: 'し', romaji: 'shi' },
        up:     { char: 'す', romaji: 'su' },
        right:  { char: 'せ', romaji: 'se' },
        down:   { char: 'そ', romaji: 'so' }
      },
      {
        col: 'ta', label: 'た行 (T-row)',
        center: { char: 'た', romaji: 'ta' },
        left:   { char: 'ち', romaji: 'chi' },
        up:     { char: 'つ', romaji: 'tsu' },
        right:  { char: 'て', romaji: 'te' },
        down:   { char: 'と', romaji: 'to' }
      },
      {
        col: 'na', label: 'な行 (N-row)',
        center: { char: 'な', romaji: 'na' },
        left:   { char: 'に', romaji: 'ni' },
        up:     { char: 'ぬ', romaji: 'nu' },
        right:  { char: 'ね', romaji: 'ne' },
        down:   { char: 'の', romaji: 'no' }
      },
      {
        col: 'ha', label: 'は行 (H-row)',
        center: { char: 'は', romaji: 'ha' },
        left:   { char: 'ひ', romaji: 'hi' },
        up:     { char: 'ふ', romaji: 'fu' },
        right:  { char: 'へ', romaji: 'he' },
        down:   { char: 'ほ', romaji: 'ho' }
      },
      {
        col: 'ma', label: 'ま行 (M-row)',
        center: { char: 'ま', romaji: 'ma' },
        left:   { char: 'み', romaji: 'mi' },
        up:     { char: 'む', romaji: 'mu' },
        right:  { char: 'め', romaji: 'me' },
        down:   { char: 'も', romaji: 'mo' }
      },
      {
        col: 'ya', label: 'や行 (Y-row)',
        center: { char: 'や', romaji: 'ya' },
        left:   null,
        up:     { char: 'ゆ', romaji: 'yu' },
        right:  null,
        down:   { char: 'よ', romaji: 'yo' }
      },
      {
        col: 'ra', label: 'ら行 (R-row)',
        center: { char: 'ら', romaji: 'ra' },
        left:   { char: 'り', romaji: 'ri' },
        up:     { char: 'る', romaji: 'ru' },
        right:  { char: 'れ', romaji: 're' },
        down:   { char: 'ろ', romaji: 'ro' }
      }
    ],
    waKey: {
      col: 'wa', label: 'わ行 (W / N)',
      center: { char: 'わ', romaji: 'wa' },
      left:   { char: 'を', romaji: 'wo' },
      up:     { char: 'ん', romaji: 'n' },
      right:  null,
      down:   null
    },
    voiced: [
      {
        col: 'ga', label: 'が行 (Dakuten G)',
        center: { char: 'が', romaji: 'ga' },
        left:   { char: 'ぎ', romaji: 'gi' },
        up:     { char: 'ぐ', romaji: 'gu' },
        right:  { char: 'げ', romaji: 'ge' },
        down:   { char: 'ご', romaji: 'go' }
      },
      {
        col: 'za', label: 'ざ行 (Dakuten Z)',
        center: { char: 'ざ', romaji: 'za' },
        left:   { char: 'じ', romaji: 'ji' },
        up:     { char: 'ず', romaji: 'zu' },
        right:  { char: 'ぜ', romaji: 'ze' },
        down:   { char: 'ぞ', romaji: 'zo' }
      },
      {
        col: 'da', label: 'だ行 (Dakuten D)',
        center: { char: 'だ', romaji: 'da' },
        left:   { char: 'ぢ', romaji: 'ji' },
        up:     { char: 'づ', romaji: 'zu' },
        right:  { char: 'で', romaji: 'de' },
        down:   { char: 'ど', romaji: 'do' }
      },
      {
        col: 'ba', label: 'ば行 (Dakuten B)',
        center: { char: 'ば', romaji: 'ba' },
        left:   { char: 'び', romaji: 'bi' },
        up:     { char: 'ぶ', romaji: 'bu' },
        right:  { char: 'べ', romaji: 'be' },
        down:   { char: 'ぼ', romaji: 'bo' }
      },
      {
        col: 'pa', label: 'ぱ行 (Handakuten P)',
        center: { char: 'ぱ', romaji: 'pa' },
        left:   { char: 'ぴ', romaji: 'pi' },
        up:     { char: 'ぷ', romaji: 'pu' },
        right:  { char: 'ぺ', romaji: 'pe' },
        down:   { char: 'ぽ', romaji: 'po' }
      }
    ]
  },
  katakana: {
    basic: [
      {
        col: 'a', label: 'ア行 (Vowels)',
        center: { char: 'ア', romaji: 'a' },
        left:   { char: 'イ', romaji: 'i' },
        up:     { char: 'ウ', romaji: 'u' },
        right:  { char: 'エ', romaji: 'e' },
        down:   { char: 'オ', romaji: 'o' }
      },
      {
        col: 'ka', label: 'カ行 (K-row)',
        center: { char: 'カ', romaji: 'ka' },
        left:   { char: 'キ', romaji: 'ki' },
        up:     { char: 'ク', romaji: 'ku' },
        right:  { char: 'ケ', romaji: 'ke' },
        down:   { char: 'コ', romaji: 'ko' }
      },
      {
        col: 'sa', label: 'サ行 (S-row)',
        center: { char: 'サ', romaji: 'sa' },
        left:   { char: 'シ', romaji: 'shi' },
        up:     { char: 'ス', romaji: 'su' },
        right:  { char: 'セ', romaji: 'se' },
        down:   { char: 'ソ', romaji: 'so' }
      },
      {
        col: 'ta', label: 'タ行 (T-row)',
        center: { char: 'タ', romaji: 'ta' },
        left:   { char: 'チ', romaji: 'chi' },
        up:     { char: 'ツ', romaji: 'tsu' },
        right:  { char: 'テ', romaji: 'te' },
        down:   { char: 'ト', romaji: 'to' }
      },
      {
        col: 'na', label: 'ナ行 (N-row)',
        center: { char: 'ナ', romaji: 'na' },
        left:   { char: 'ニ', romaji: 'ni' },
        up:     { char: 'ヌ', romaji: 'nu' },
        right:  { char: 'ネ', romaji: 'ne' },
        down:   { char: 'ノ', romaji: 'no' }
      },
      {
        col: 'ha', label: 'ハ行 (H-row)',
        center: { char: 'ハ', romaji: 'ha' },
        left:   { char: 'ヒ', romaji: 'hi' },
        up:     { char: 'フ', romaji: 'fu' },
        right:  { char: 'ヘ', romaji: 'he' },
        down:   { char: 'ホ', romaji: 'ho' }
      },
      {
        col: 'ma', label: 'マ行 (M-row)',
        center: { char: 'マ', romaji: 'ma' },
        left:   { char: 'ミ', romaji: 'mi' },
        up:     { char: 'ム', romaji: 'mu' },
        right:  { char: 'メ', romaji: 'me' },
        down:   { char: 'モ', romaji: 'mo' }
      },
      {
        col: 'ya', label: 'ヤ行 (Y-row)',
        center: { char: 'ヤ', romaji: 'ya' },
        left:   null,
        up:     { char: 'ユ', romaji: 'yu' },
        right:  null,
        down:   { char: 'ヨ', romaji: 'yo' }
      },
      {
        col: 'ra', label: 'ラ行 (R-row)',
        center: { char: 'ラ', romaji: 'ra' },
        left:   { char: 'リ', romaji: 'ri' },
        up:     { char: 'ル', romaji: 'ru' },
        right:  { char: 'レ', romaji: 're' },
        down:   { char: 'ロ', romaji: 'ro' }
      }
    ],
    waKey: {
      col: 'wa', label: 'ワ行 (W / N)',
      center: { char: 'ワ', romaji: 'wa' },
      left:   { char: 'ヲ', romaji: 'wo' },
      up:     { char: 'ン', romaji: 'n' },
      right:  null,
      down:   null
    },
    voiced: [
      {
        col: 'ga', label: 'ガ行 (Dakuten G)',
        center: { char: 'ガ', romaji: 'ga' },
        left:   { char: 'ギ', romaji: 'gi' },
        up:     { char: 'グ', romaji: 'gu' },
        right:  { char: 'ゲ', romaji: 'ge' },
        down:   { char: 'ゴ', romaji: 'go' }
      },
      {
        col: 'za', label: 'ザ行 (Dakuten Z)',
        center: { char: 'ザ', romaji: 'za' },
        left:   { char: 'ジ', romaji: 'ji' },
        up:     { char: 'ズ', romaji: 'zu' },
        right:  { char: 'ゼ', romaji: 'ze' },
        down:   { char: 'ゾ', romaji: 'zo' }
      },
      {
        col: 'da', label: 'ダ行 (Dakuten D)',
        center: { char: 'ダ', romaji: 'da' },
        left:   { char: 'ヂ', romaji: 'ji' },
        up:     { char: 'ヅ', romaji: 'zu' },
        right:  { char: 'デ', romaji: 'de' },
        down:   { char: 'ド', romaji: 'do' }
      },
      {
        col: 'ba', label: 'バ行 (Dakuten B)',
        center: { char: 'バ', romaji: 'ba' },
        left:   { char: 'ビ', romaji: 'bi' },
        up:     { char: 'ブ', romaji: 'bu' },
        right:  { char: 'ベ', romaji: 'be' },
        down:   { char: 'ボ', romaji: 'bo' }
      },
      {
        col: 'pa', label: 'パ行 (Handakuten P)',
        center: { char: 'パ', romaji: 'pa' },
        left:   { char: 'ピ', romaji: 'pi' },
        up:     { char: 'プ', romaji: 'pu' },
        right:  { char: 'ペ', romaji: 'pe' },
        down:   { char: 'ポ', romaji: 'po' }
      }
    ]
  }
};

function loadLearnedMap(storagePrefix) {
  try {
    const raw = localStorage.getItem(`${storagePrefix}-learned`);
    if (raw) return JSON.parse(raw) || {};
  } catch (e) {}
  return {};
}

function saveLearnedMap(storagePrefix, map) {
  const now = Date.now();
  localStorage.setItem(`${storagePrefix}-learned`, JSON.stringify(map));
  localStorage.setItem(`${storagePrefix}-learned-updatedAt`, String(now));
  notifyScriptProgressChange(`${storagePrefix}-learned`, map, now);
}

function getProgressStats(storagePrefix, sections) {
  const allChars = sections.flatMap(s => s.characters);
  const total = allChars.length;
  const learnedMap = loadLearnedMap(storagePrefix);
  const learnedCount = allChars.filter(c => learnedMap[c.char]).length;
  const savedIdx = parseInt(localStorage.getItem(`${storagePrefix}-progress`) || '0', 10);
  const currentIdx = Number.isFinite(savedIdx) ? Math.min(Math.max(0, savedIdx), total - 1) : 0;
  const currentObj = allChars[currentIdx] || allChars[0];
  const currentChar = currentObj?.displayChar || currentObj?.char || '';

  return {
    total,
    learnedCount,
    currentIdx,
    currentChar,
    learnedMap,
    allChars,
    percent: total > 0 ? Math.round((learnedCount / total) * 100) : 0
  };
}

// ============================================================================
// 1. `/scripts/japanese` — Japanese Writing Systems Landing Screen
// ============================================================================

export function renderJapaneseScriptsLandingScreen(container) {
  container.innerHTML = `
    <div class="scripts-hub-container">
      <div class="screen-header">
        <div class="screen-title-group">
          <div class="screen-lang-tag">
            <span>🇯🇵</span>
            <span>Japanese Writing Systems · 日本語の文字</span>
          </div>
          <h1 class="screen-title">Japanese Scripts</h1>
          <p class="screen-subtitle">
            Written Japanese combines three scripts: two phonetic syllabaries (Hiragana and Katakana) and logographic characters (Kanji).
          </p>
        </div>
      </div>

      <div class="scripts-cards-grid">
        <!-- Hiragana -->
        <a href="/scripts/japanese/hiragana" class="script-hub-card">
          <div class="script-hub-card-top">
            <div class="script-hub-glyph" aria-hidden="true">あ</div>
            <div class="script-hub-meta">
              <div class="script-hub-lang-tag">
                <span>Phonetic Syllabary</span>
              </div>
              <h2 class="script-hub-title">Hiragana</h2>
              <div class="script-hub-native">ひらがな · 71 characters</div>
            </div>
          </div>

          <p class="script-hub-desc">
            Curved phonetic characters used for native Japanese words, verb and adjective endings (okurigana), and grammatical particles.
          </p>

          <div class="script-hub-footer">
            <div class="script-hub-cta">
              <span>Explore Hiragana</span>
              <span>→</span>
            </div>
          </div>
        </a>

        <!-- Katakana -->
        <a href="/scripts/japanese/katakana" class="script-hub-card">
          <div class="script-hub-card-top">
            <div class="script-hub-glyph" aria-hidden="true">ア</div>
            <div class="script-hub-meta">
              <div class="script-hub-lang-tag">
                <span>Phonetic Syllabary</span>
              </div>
              <h2 class="script-hub-title">Katakana</h2>
              <div class="script-hub-native">カタカナ · 71 characters</div>
            </div>
          </div>

          <p class="script-hub-desc">
            Angular phonetic characters representing the same sounds as Hiragana, used for foreign loanwords (gairaigo), foreign names, onomatopoeia, and emphasis.
          </p>

          <div class="script-hub-footer">
            <div class="script-hub-cta">
              <span>Explore Katakana</span>
              <span>→</span>
            </div>
          </div>
        </a>

        <!-- Kanji (No link yet) -->
        <div class="script-hub-card script-hub-card-dual" style="opacity: 0.85;">
          <div class="script-hub-card-top">
            <div class="script-hub-glyph" aria-hidden="true">字</div>
            <div class="script-hub-meta">
              <div class="script-hub-lang-tag">
                <span>Logographic Characters</span>
              </div>
              <h2 class="script-hub-title">Kanji</h2>
              <div class="script-hub-native">漢字 · 2,136 Jōyō characters</div>
            </div>
          </div>

          <p class="script-hub-desc">
            Meaning-based characters adapted from Chinese script used for nouns, verb and adjective stems, and names, often paired with Hiragana endings.
          </p>

          <div class="script-hub-footer">
            <div class="script-hub-progress-info">
              <span>Coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  autoTranslateUi(container);
}

// ============================================================================
// 2. Dispatcher for `/scripts/khmer`, `/scripts/japanese/hiragana`, `/scripts/japanese/katakana`
// ============================================================================

export function renderScriptInfoScreen(container, params = {}) {
  const scriptId = (params.scriptId || 'khmer').toLowerCase();
  if (scriptId === 'khmer') {
    renderKhmerKeyboardChecklistScreen(container);
  } else if (scriptId === 'katakana') {
    renderJapaneseExpandedKeyboardScreen(container, 'katakana');
  } else {
    renderJapaneseExpandedKeyboardScreen(container, 'hiragana');
  }
}

// ============================================================================
// 3. `/scripts/japanese/hiragana` & `/scripts/japanese/katakana`
//    Expanded 9-Key Mobile Flick Keyboard (each key surrounded by 4 vowel keys)
//    with interactive ゛ Dakuten / ゜ Handakuten modifier keys & Remembered buttons
// ============================================================================

function renderJapaneseExpandedKeyboardScreen(container, scriptId) {
  const isKatakana = scriptId === 'katakana';
  const sections = isKatakana ? KATAKANA_SECTIONS : HIRAGANA_SECTIONS;
  const kbData = isKatakana ? JAPANESE_EXPANDED_KEYBOARD.katakana : JAPANESE_EXPANDED_KEYBOARD.hiragana;
  const practiceUrl = `/scripts/japanese/${scriptId}/practice`;

  let learnedMap = loadLearnedMap(scriptId);
  const allChars = sections.flatMap(s => s.characters);
  let activeModifier = 'basic'; // 'basic' | 'dakuten' | 'handakuten'
  let focusedBaseCol = null; // e.g. 'a', 'ka', 'sa', ..., 'wa' when focused on mobile/small screen
  let selectedCharSlot = null; // For individual letter action modal ({ char, romaji, groupLabel })

  // Map voiced clusters by base column so toggling ゛ or ゜ swaps the clusters in-place on the 9-key grid
  const dakutenByCol = {
    ka: kbData.voiced.find(v => v.col === 'ga'),
    sa: kbData.voiced.find(v => v.col === 'za'),
    ta: kbData.voiced.find(v => v.col === 'da'),
    ha: kbData.voiced.find(v => v.col === 'ba')
  };
  const handakutenByCol = {
    ha: kbData.voiced.find(v => v.col === 'pa')
  };

  // Lookup any character's metadata across the script
  const charMetaLookup = {};
  [...kbData.basic, kbData.waKey, ...kbData.voiced].forEach(cluster => {
    [cluster.center, cluster.left, cluster.up, cluster.right, cluster.down].filter(Boolean).forEach(s => {
      charMetaLookup[s.char] = { char: s.char, romaji: s.romaji, groupLabel: cluster.label };
    });
  });

  function getCounts() {
    const basicSec = sections[0]?.characters || [];
    const dakutenSec = sections[1]?.characters || [];
    const handakutenSec = sections[2]?.characters || [];
    return {
      total: allChars.length,
      learnedTotal: allChars.filter(c => learnedMap[c.char]).length,
      basicLearned: basicSec.filter(c => learnedMap[c.char]).length,
      basicTotal: basicSec.length,
      dakutenLearned: dakutenSec.filter(c => learnedMap[c.char]).length,
      dakutenTotal: dakutenSec.length,
      handakutenLearned: handakutenSec.filter(c => learnedMap[c.char]).length,
      handakutenTotal: handakutenSec.length
    };
  }

  function resolveClusterForBaseCol(baseCol) {
    if (baseCol === 'wa') {
      return { baseCol: 'wa', cluster: kbData.waKey, dimmed: activeModifier !== 'basic' };
    }
    const baseCluster = kbData.basic.find(b => b.col === baseCol) || kbData.basic[0];
    if (activeModifier === 'dakuten') {
      const voiced = dakutenByCol[baseCluster.col];
      return voiced
        ? { baseCol, cluster: voiced, dimmed: false }
        : { baseCol, cluster: baseCluster, dimmed: true };
    }
    if (activeModifier === 'handakuten') {
      const semiVoiced = handakutenByCol[baseCluster.col];
      return semiVoiced
        ? { baseCol, cluster: semiVoiced, dimmed: false }
        : { baseCol, cluster: baseCluster, dimmed: true };
    }
    return { baseCol, cluster: baseCluster, dimmed: false };
  }

  function renderSubKey(slot, posName, dimmed = false) {
    if (!slot) {
      return `<div class="jp-petal-empty jp-petal-${posName}" aria-hidden="true"></div>`;
    }
    const isRemembered = Boolean(learnedMap[slot.char]);
    return `
      <button
        type="button"
        class="jp-petal-key jp-petal-${posName} ${isRemembered ? 'is-learned' : 'needs-practice'} ${dimmed ? 'is-dimmed-key' : ''}"
        data-char="${slot.char}"
        title="${slot.char} (${slot.romaji})"
      >
        <span class="jp-petal-glyph">${slot.char}</span>
        <span class="jp-petal-romaji">${slot.romaji}</span>
      </button>
    `;
  }

  function renderClusterCard(baseCol, cluster, dimmed = false) {
    const slots = [cluster.center, cluster.left, cluster.up, cluster.right, cluster.down].filter(Boolean);
    const learnedInCluster = slots.filter(s => learnedMap[s.char]).length;
    const allClusterLearned = learnedInCluster === slots.length;
    const surroundingChars = [cluster.left, cluster.up, cluster.right, cluster.down]
      .filter(Boolean)
      .map(s => s.char)
      .join(' ');

    return `
      <div
        class="jp-expanded-cluster ${allClusterLearned ? 'cluster-all-learned' : ''} ${dimmed ? 'is-dimmed-cluster' : ''}"
        data-base-col="${baseCol}"
      >
        <!-- Compact Single-Key Face (shown on small screens; clicking brings the 5-key cross into focus) -->
        <button
          type="button"
          class="jp-compact-key-btn ${allClusterLearned ? 'is-learned' : ''}"
          data-focus-col="${baseCol}"
          title="Tap to expand ${cluster.label}"
        >
          <span class="jp-compact-key-status">${learnedInCluster}/${slots.length} ✓</span>
          <span class="jp-compact-key-glyph">${cluster.center.char}</span>
          <span class="jp-compact-key-romaji">${cluster.center.romaji}</span>
          <span class="jp-compact-key-sub">${surroundingChars}</span>
        </button>

        <!-- Expanded 5-Key Cross Face (shrinking overview on larger screens) -->
        <div class="jp-cluster-expanded-inner">
          <div class="jp-cluster-header">
            <span class="jp-cluster-label">${cluster.label}</span>
          </div>

          <div class="jp-cross-5grid">
            ${renderSubKey(cluster.up, 'up', dimmed)}
            ${renderSubKey(cluster.left, 'left', dimmed)}
            ${renderSubKey(cluster.center, 'center', dimmed)}
            ${renderSubKey(cluster.right, 'right', dimmed)}
            ${renderSubKey(cluster.down, 'down', dimmed)}
          </div>
        </div>
      </div>
    `;
  }

  function renderFocusedClusterModal() {
    if (!focusedBaseCol) return '';
    const { cluster, dimmed } = resolveClusterForBaseCol(focusedBaseCol);
    const slots = [cluster.center, cluster.left, cluster.up, cluster.right, cluster.down].filter(Boolean);
    const learnedInCluster = slots.filter(s => learnedMap[s.char]).length;
    const allClusterLearned = learnedInCluster === slots.length;

    return `
      <div class="jp-focus-overlay" id="jp-focus-overlay" role="dialog" aria-modal="true">
        <div class="jp-focus-card">
          <div class="jp-focus-card-header">
            <div>
              <h3 class="jp-focus-card-title">${cluster.label}</h3>
              <p class="jp-focus-card-subtitle">Tap any letter for actions</p>
            </div>
            <div class="jp-focus-card-actions">
              <button type="button" class="jp-focus-close-btn" id="jp-focus-close-btn" aria-label="Close">✕</button>
            </div>
          </div>

          <div class="jp-cross-5grid jp-focus-cross-grid">
            ${renderSubKey(cluster.up, 'up', dimmed)}
            ${renderSubKey(cluster.left, 'left', dimmed)}
            ${renderSubKey(cluster.center, 'center', dimmed)}
            ${renderSubKey(cluster.right, 'right', dimmed)}
            ${renderSubKey(cluster.down, 'down', dimmed)}
          </div>
        </div>
      </div>
    `;
  }

  function renderCharActionModal() {
    if (!selectedCharSlot) return '';
    const { char, romaji, groupLabel } = selectedCharSlot;
    const isRemembered = Boolean(learnedMap[char]);

    return `
      <div class="jp-focus-overlay char-action-overlay" id="char-action-overlay" role="dialog" aria-modal="true">
        <div class="jp-focus-card char-action-modal-card">
          <div class="char-action-modal-top">
            <span class="char-action-status-pill ${isRemembered ? 'is-remembered' : 'needs-practice'}">
              ${isRemembered ? '✓ Remembered' : 'Needs Practice'}
            </span>
            <button type="button" class="jp-focus-close-btn" id="char-action-close-btn" aria-label="Close">✕</button>
          </div>

          <div class="char-action-hero">
            <div class="char-action-big-glyph">${char}</div>
            <div class="char-action-romaji">${romaji}</div>
            ${groupLabel ? `<div class="char-action-submeta">${groupLabel}</div>` : ''}
          </div>

          <div class="char-action-buttons">
            <button
              type="button"
              class="btn ${isRemembered ? 'btn-secondary' : 'btn-primary'} char-action-btn"
              id="char-modal-toggle-remembered"
            >
              ${isRemembered ? '↺ Mark as Needs Practice' : '✓ Mark as Remembered'}
            </button>
            <button
              type="button"
              class="btn btn-secondary char-action-btn"
              id="char-modal-practice-btn"
            >
              ✍️ Practice Writing
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderPage() {
    const counts = getCounts();
    const needsPracticeCount = counts.total - counts.learnedTotal;
    const pct = Math.round((counts.learnedTotal / counts.total) * 100);

    // Resolve the 9 keys on the grid based on activeModifier ('basic' | 'dakuten' | 'handakuten')
    const displayedNineClusters = kbData.basic.map(baseCluster => resolveClusterForBaseCol(baseCluster.col));

    container.innerHTML = `
      <div class="script-info-page">
        <!-- 1. Expanded 9-Key Mobile Flick Keyboard Card (First!) -->
        <section class="script-info-section jp-kb-section">
          <div class="script-info-section-header jp-kb-top-bar">
            <div class="jp-kb-title-group">
              <h1 class="script-info-section-title">
                ${isKatakana ? 'カタカナ Katakana' : 'ひらがな Hiragana'}
              </h1>
              <div class="script-kb-layer-tabs">
                <button type="button" class="script-kb-tab ${activeModifier === 'basic' ? 'active' : ''}" data-jp-mod="basic">
                  Basic (${counts.basicLearned}/${counts.basicTotal})
                </button>
                <button type="button" class="script-kb-tab ${activeModifier === 'dakuten' ? 'active' : ''}" data-jp-mod="dakuten">
                  ゛ Dakuten (${counts.dakutenLearned}/${counts.dakutenTotal})
                </button>
                <button type="button" class="script-kb-tab ${activeModifier === 'handakuten' ? 'active' : ''}" data-jp-mod="handakuten">
                  ゜ Handakuten (${counts.handakutenLearned}/${counts.handakutenTotal})
                </button>
              </div>
            </div>

            <a href="${practiceUrl}" class="btn btn-primary btn-sm jp-top-practice-btn">
              ✍️ Practice →
            </a>
          </div>

          <!-- 3x3 Main Flick Keys -->
          <div class="jp-expanded-kb-grid">
            ${displayedNineClusters.map(({ baseCol, cluster, dimmed }) => renderClusterCard(baseCol, cluster, dimmed)).join('')}
          </div>

          <!-- Bottom Mobile Row: [ ゛ / ゜ Modifier Keys ]  [ わ / ワ Key ]  [ Flick Direction Guide ] -->
          <div class="jp-expanded-kb-grid jp-bottom-row-grid">
            <!-- Interactive ゛゜ Modifier Key Cluster -->
            <div class="jp-expanded-cluster jp-modifier-card">
              <div class="jp-cluster-header">
                <span class="jp-cluster-label">゛゜ Shift</span>
              </div>
              <div class="jp-modifier-buttons-grid">
                <button
                  type="button"
                  class="jp-mod-key-btn ${activeModifier === 'basic' ? 'is-active' : ''}"
                  data-jp-mod="basic"
                >
                  <span class="mod-glyph">${isKatakana ? 'ア' : 'あ'}</span>
                  <span class="mod-title">Basic</span>
                </button>
                <button
                  type="button"
                  class="jp-mod-key-btn ${activeModifier === 'dakuten' ? 'is-active' : ''}"
                  data-jp-mod="dakuten"
                >
                  <span class="mod-glyph">゛</span>
                  <span class="mod-title">Dakuten</span>
                </button>
                <button
                  type="button"
                  class="jp-mod-key-btn ${activeModifier === 'handakuten' ? 'is-active' : ''}"
                  data-jp-mod="handakuten"
                >
                  <span class="mod-glyph">゜</span>
                  <span class="mod-title">Handakuten</span>
                </button>
              </div>
            </div>

            <!-- わ / ワ Key -->
            ${renderClusterCard('wa', kbData.waKey, activeModifier !== 'basic')}

            <!-- Flick Direction Legend -->
            <div class="jp-expanded-cluster jp-modifier-card jp-direction-cluster">
              <div class="jp-cluster-header">
                <span class="jp-cluster-label">Flick Directions</span>
              </div>
              <div class="jp-cross-5grid jp-direction-guide-cross">
                <div class="jp-dir-pill jp-petal-up">↑ -u</div>
                <div class="jp-dir-pill jp-petal-left">← -i</div>
                <div class="jp-dir-pill jp-petal-center">Tap -a</div>
                <div class="jp-dir-pill jp-petal-right">→ -e</div>
                <div class="jp-dir-pill jp-petal-down">↓ -o</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. Remembered Stats Card (Below the Keyboard Card) -->
        <section class="script-info-section script-stats-bottom-card">
          <div class="script-info-cta-stat">
            <span><strong>${counts.learnedTotal}</strong> Remembered</span>
            <span><strong>${needsPracticeCount}</strong> Need Practice (${pct}%)</span>
          </div>
          <div class="script-hub-progress-track">
            <div class="script-hub-progress-fill" style="width: ${Math.max(pct, 3)}%"></div>
          </div>
          <div class="script-stats-bottom-footer">
            <div class="script-section-mini-pills">
              <span>Basic: <strong>${counts.basicLearned}/${counts.basicTotal}</strong></span>
              <span>゛ Dakuten: <strong>${counts.dakutenLearned}/${counts.dakutenTotal}</strong></span>
              <span>゜ Handakuten: <strong>${counts.handakutenLearned}/${counts.handakutenTotal}</strong></span>
            </div>
            <a href="${practiceUrl}" class="btn btn-primary btn-sm jp-top-practice-btn">
              ✍️ Practice ${needsPracticeCount > 0 ? `${needsPracticeCount} Remaining` : 'All'} Characters →
            </a>
          </div>
        </section>

        ${renderFocusedClusterModal()}
        ${renderCharActionModal()}
      </div>
    `;

    bindEvents();
    autoTranslateUi(container);
  }

  function toggleCharLearned(charStr) {
    if (learnedMap[charStr]) {
      delete learnedMap[charStr];
    } else {
      learnedMap[charStr] = true;
    }
    saveLearnedMap(scriptId, learnedMap);
    renderPage();
  }

  function jumpToPractice(charStr) {
    const idx = allChars.findIndex(c => c.char === charStr);
    if (idx !== -1) {
      localStorage.setItem(`${scriptId}-progress`, String(idx));
      notifyScriptProgressChange(`${scriptId}-progress`, idx);
    }
    trackEvent('jump_to_script_char', { scriptId, char: charStr });
    navigate(practiceUrl);
  }

  function bindEvents() {
    // Modifier buttons (Basic / ゛ Dakuten / ゜ Handakuten)
    container.querySelectorAll('[data-jp-mod]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMod = btn.getAttribute('data-jp-mod');
        activeModifier = (activeModifier === targetMod && targetMod !== 'basic') ? 'basic' : targetMod;
        renderPage();
      });
    });

    // Mobile / Compact 9-Key click -> bring that key's 5-key cross into focus
    container.querySelectorAll('[data-focus-col]').forEach(btn => {
      btn.addEventListener('click', () => {
        focusedBaseCol = btn.getAttribute('data-focus-col');
        renderPage();
      });
    });

    // Close focused 5-key cross modal
    const closeBtn = container.querySelector('#jp-focus-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        focusedBaseCol = null;
        renderPage();
      });
    }
    const focusOverlay = container.querySelector('#jp-focus-overlay');
    if (focusOverlay) {
      focusOverlay.addEventListener('click', (e) => {
        if (e.target === focusOverlay) {
          focusedBaseCol = null;
          renderPage();
        }
      });
    }

    // Clicking an individual letter key opens the Letter Action Modal
    container.querySelectorAll('.jp-petal-key[data-char]').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        const ch = card.getAttribute('data-char');
        selectedCharSlot = charMetaLookup[ch] || { char: ch, romaji: '', groupLabel: '' };
        renderPage();
      });
    });

    // Letter Action Modal events
    container.querySelector('#char-action-close-btn')?.addEventListener('click', () => {
      selectedCharSlot = null;
      renderPage();
    });
    const actionOverlay = container.querySelector('#char-action-overlay');
    if (actionOverlay) {
      actionOverlay.addEventListener('click', (e) => {
        if (e.target === actionOverlay) {
          selectedCharSlot = null;
          renderPage();
        }
      });
    }
    container.querySelector('#char-modal-toggle-remembered')?.addEventListener('click', () => {
      if (!selectedCharSlot) return;
      const ch = selectedCharSlot.char;
      selectedCharSlot = null;
      toggleCharLearned(ch);
    });
    container.querySelector('#char-modal-practice-btn')?.addEventListener('click', () => {
      if (!selectedCharSlot) return;
      const ch = selectedCharSlot.char;
      selectedCharSlot = null;
      jumpToPractice(ch);
    });

    // Cluster toggle-all button
    container.querySelectorAll('[data-cluster-chars]').forEach(btn => {
      btn.addEventListener('click', () => {
        const chars = btn.getAttribute('data-cluster-chars').split(',').filter(Boolean);
        const allLearned = chars.every(c => learnedMap[c]);
        chars.forEach(c => {
          if (allLearned) {
            delete learnedMap[c];
          } else {
            learnedMap[c] = true;
          }
        });
        saveLearnedMap(scriptId, learnedMap);
        renderPage();
      });
    });
  }

  const onScriptsSynced = () => {
    learnedMap = loadLearnedMap(scriptId);
    renderPage();
  };
  window.addEventListener('vocab-scripts-synced', onScriptsSynced);

  syncScriptsProgress().then((changed) => {
    if (changed) {
      learnedMap = loadLearnedMap(scriptId);
      renderPage();
    }
  }).catch(() => {});

  renderPage();
}

// ============================================================================
// 4. `/scripts/khmer` — Interactive Khmer Phone Keyboard & Remembered Checklist
//    - Pressing `⇧ Shift` changes the keyboard between Layer 1 and Layer 2
//    - Pressing `្ Coeng` changes the consonant keys in-place to Subscripts (`្ក`..`្វ`)
//      while greying out non-consonant keys so the keyboard height & layout never shift
//    - Independent & Compound Vowels live in their own card directly beneath the main card
//    - Clicking any letter opens a clean modal with Remembered & Practice Writing actions
// ============================================================================

function renderKhmerKeyboardChecklistScreen(container) {
  let learnedMap = loadLearnedMap('khmer');
  const allChars = KHMER_SECTIONS.flatMap(s => s.characters);
  let isShifted = false;
  let isCoeng = false;
  let selectedKhmerChar = null; // Key token currently open in the Letter Action Modal

  // Independent & Compound Vowels rows (own card beneath the main keyboard card)
  const extraVowelRows = [
    ['ឥ', 'ឦ', 'ឧ', 'ឨ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ'],
    ['ឯ', 'ឰ', 'ឱ', 'ឳ', 'ុំ', 'ុះ', 'ាំ', 'េះ', 'ោះ']
  ];

  function toggleCharLearned(charStr) {
    if (!charStr) return;
    if (learnedMap[charStr]) {
      delete learnedMap[charStr];
    } else {
      learnedMap[charStr] = true;
    }
    saveLearnedMap('khmer', learnedMap);
    renderPage();
  }

  function jumpToPractice(charStr) {
    if (!charStr) return;
    const idx = allChars.findIndex(c => c.char === charStr);
    if (idx !== -1) {
      localStorage.setItem('khmer-progress', String(idx));
      notifyScriptProgressChange('khmer-progress', idx);
    }
    trackEvent('jump_to_script_char', { scriptId: 'khmer', char: charStr });
    navigate('/scripts/khmer/practice');
  }

  function getLayerCounts() {
    const l1 = KHMER_KEYBOARD_ROWS.layer1.flat().filter(k => k && !k.endsWith('_KEY'));
    const l2 = KHMER_KEYBOARD_ROWS.layer2.flat().filter(k => k && !k.endsWith('_KEY'));
    const c1 = KHMER_KEYBOARD_ROWS.coengLayer1.flat().filter(k => k && !k.endsWith('_KEY'));
    const c2 = KHMER_KEYBOARD_ROWS.coengLayer2.flat().filter(k => k && !k.endsWith('_KEY'));
    const ex = extraVowelRows.flat();
    return {
      l1, l1Done: l1.filter(c => learnedMap[c]).length,
      l2, l2Done: l2.filter(c => learnedMap[c]).length,
      c1, c1Done: c1.filter(c => learnedMap[c]).length,
      c2, c2Done: c2.filter(c => learnedMap[c]).length,
      coengAll: [...c1, ...c2],
      coengDone: [...c1, ...c2].filter(c => learnedMap[c]).length,
      ex, exDone: ex.filter(c => learnedMap[c]).length
    };
  }

  function renderKhmerKeyCard(keyToken, dimmed = false) {
    if (!keyToken) {
      return `<div class="khmer-kb-key is-placeholder" aria-hidden="true"></div>`;
    }

    if (keyToken === 'SHIFT_KEY') {
      return `
        <button
          type="button"
          class="khmer-kb-key is-modifier-key ${isShifted ? 'is-active' : ''}"
          data-kb-action="shift"
          title="Tap to toggle Shift Layer (⇧)"
        >
          <span class="khmer-key-mod-icon">⇧</span>
          <span class="khmer-key-mod-label">Shift</span>
        </button>
      `;
    }

    if (keyToken === 'COENG_KEY') {
      return `
        <button
          type="button"
          class="khmer-kb-key is-coeng-key ${isCoeng ? 'is-active' : ''}"
          data-kb-action="coeng"
          title="Tap to toggle Subscript Consonants (្ Coeng)"
        >
          <span class="khmer-key-mod-icon">្</span>
          <span class="khmer-key-mod-label">Coeng</span>
        </button>
      `;
    }

    const meta = KHMER_CHAR_LOOKUP[keyToken];
    if (!meta) return '';

    const isRemembered = Boolean(learnedMap[keyToken]);
    const displayGlyph = meta.displayChar || keyToken;

    const isConsOrSub = meta.type === 'consonant' || meta.type === 'subscript';
    const glyphColorClass = isConsOrSub ? `khmer-color-${meta.series.toLowerCase()}` : '';

    let romajiHtml = meta.romaji;
    if (meta.type === 'vowel') {
      const parts = meta.romaji.split(' / ');
      const aSound = parts[0];
      const oSound = parts[1] || parts[0];
      romajiHtml = `<span class="khmer-color-a">${aSound}</span><span class="khmer-rom-sep">/</span><span class="khmer-color-o">${oSound}</span>`;
    }

    return `
      <button
        type="button"
        class="khmer-kb-key is-${meta.type} ${isRemembered ? 'is-learned' : 'needs-practice'} ${dimmed ? 'is-dimmed-key' : ''}"
        data-char="${keyToken}"
        title="${displayGlyph} (${meta.romaji})"
      >
        <div class="khmer-key-glyph ${glyphColorClass}">${displayGlyph}</div>
        <div class="khmer-key-romaji ${isConsOrSub ? 'is-neutral-romaji' : ''}">${romajiHtml}</div>
      </button>
    `;
  }

  function renderKhmerCharActionModal() {
    if (!selectedKhmerChar) return '';
    const meta = KHMER_CHAR_LOOKUP[selectedKhmerChar];
    if (!meta) return '';

    const isRemembered = Boolean(learnedMap[selectedKhmerChar]);
    const displayGlyph = meta.displayChar || selectedKhmerChar;
    const isConsOrSub = meta.type === 'consonant' || meta.type === 'subscript';
    const glyphColorClass = isConsOrSub ? `khmer-color-${meta.series.toLowerCase()}` : '';

    let modalRomajiHtml = meta.romaji;
    let extraInfoHtml = '';
    if (meta.type === 'consonant') {
      extraInfoHtml = `<div class="char-action-submeta"><span class="khmer-color-${meta.series.toLowerCase()}">${meta.series}-Series</span> Consonant</div>`;
    } else if (meta.type === 'subscript') {
      extraInfoHtml = `<div class="char-action-submeta"><span class="khmer-color-${meta.series.toLowerCase()}">${meta.series}-Series</span> Subscript Consonant (Coeng ${meta.baseChar})</div>`;
    } else if (meta.type === 'vowel') {
      const parts = meta.romaji.split(' / ');
      const aSound = parts[0];
      const oSound = parts[1] || parts[0];
      modalRomajiHtml = `<span class="khmer-color-a">${aSound}</span> <span class="khmer-rom-sep">/</span> <span class="khmer-color-o">${oSound}</span>`;
      extraInfoHtml = `
        <div class="char-action-submeta">Dependent Vowel${meta.combo ? ` (${meta.combo})` : ''}</div>
        <div class="char-action-ao-pills">
          <span class="ao-pill series-a">A: <strong>${meta.aForm}</strong> <em>(${meta.aRom})</em></span>
          <span class="ao-pill series-o">O: <strong>${meta.oForm}</strong> <em>(${meta.oRom})</em></span>
        </div>
      `;
    } else if (meta.type === 'digit') {
      extraInfoHtml = `<div class="char-action-submeta">Khmer Digit (${meta.note || ''})</div>`;
    } else if (meta.type === 'sign') {
      extraInfoHtml = `<div class="char-action-submeta">Diacritic / Sign (${meta.note || ''})</div>`;
    } else {
      extraInfoHtml = `<div class="char-action-submeta">${meta.note || 'Independent Vowel'}</div>`;
    }

    const hasPractice = allChars.some(c => c.char === selectedKhmerChar);

    return `
      <div class="jp-focus-overlay char-action-overlay" id="khmer-char-action-overlay" role="dialog" aria-modal="true">
        <div class="jp-focus-card char-action-modal-card">
          <div class="char-action-modal-top">
            <span class="char-action-status-pill ${isRemembered ? 'is-remembered' : 'needs-practice'}">
              ${isRemembered ? '✓ Remembered' : 'Needs Practice'}
            </span>
            <button type="button" class="jp-focus-close-btn" id="khmer-char-action-close-btn" aria-label="Close">✕</button>
          </div>

          <div class="char-action-hero">
            <div class="char-action-big-glyph ${glyphColorClass}">${displayGlyph}</div>
            <div class="char-action-romaji">${modalRomajiHtml}</div>
            ${extraInfoHtml}
          </div>

          <div class="char-action-buttons">
            <button
              type="button"
              class="btn ${isRemembered ? 'btn-secondary' : 'btn-primary'} char-action-btn"
              id="khmer-modal-toggle-remembered"
            >
              ${isRemembered ? '↺ Mark as Needs Practice' : '✓ Mark as Remembered'}
            </button>
            ${hasPractice ? `
              <button
                type="button"
                class="btn btn-secondary char-action-btn"
                id="khmer-modal-practice-btn"
              >
                ✍️ Practice Writing
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Resolve the 3 rows of the main keyboard.
  // When Coeng is active, consonant keys transform to their subscript (`្ក`..`្វ`)
  // and non-consonant keys (vowels) stay in their exact slots greyed out (`dimmed: true`)
  // so the keyboard layout and row heights remain 100% identical!
  function getActiveResolvedRows() {
    const baseRows = isShifted ? KHMER_KEYBOARD_ROWS.layer2 : KHMER_KEYBOARD_ROWS.layer1;
    if (!isCoeng) {
      return baseRows.map(row => row.map(token => ({ token, dimmed: false })));
    }
    const coengRows = isShifted ? KHMER_KEYBOARD_ROWS.coengLayer2 : KHMER_KEYBOARD_ROWS.coengLayer1;
    return baseRows.map((row, rIdx) =>
      row.map((baseToken, cIdx) => {
        const coengToken = coengRows[rIdx]?.[cIdx];
        if (coengToken) {
          return { token: coengToken, dimmed: false };
        }
        return { token: baseToken, dimmed: true };
      })
    );
  }

  function getActiveLayerTargetChars() {
    if (isCoeng) {
      const coengRows = isShifted ? KHMER_KEYBOARD_ROWS.coengLayer2 : KHMER_KEYBOARD_ROWS.coengLayer1;
      return coengRows.flat().filter(k => k && !k.endsWith('_KEY'));
    }
    const baseRows = isShifted ? KHMER_KEYBOARD_ROWS.layer2 : KHMER_KEYBOARD_ROWS.layer1;
    return baseRows.flat().filter(k => k && !k.endsWith('_KEY'));
  }

  function toggleGroupLearned(chars) {
    const valid = chars.filter(k => k && !k.endsWith('_KEY'));
    const allLearned = valid.every(c => learnedMap[c]);
    valid.forEach(c => {
      if (allLearned) delete learnedMap[c];
      else learnedMap[c] = true;
    });
    saveLearnedMap('khmer', learnedMap);
    renderPage();
  }

  function renderPage() {
    const learnedTotal = allChars.filter(c => learnedMap[c.char]).length;
    const total = allChars.length;
    const needsPracticeCount = total - learnedTotal;
    const pct = Math.round((learnedTotal / total) * 100);
    const layerStats = getLayerCounts();
    const resolvedRows = getActiveResolvedRows();
    const activeLayerChars = getActiveLayerTargetChars();
    const activeLayerDone = activeLayerChars.filter(c => learnedMap[c]).length;

    container.innerHTML = `
      <div class="script-info-page">
        <!-- 1. Main Interactive Khmer Phone Keyboard Card -->
        <section class="script-info-section khmer-kb-section">
          <div class="script-info-section-header jp-kb-top-bar" style="flex-wrap: nowrap;">
            <div class="jp-kb-title-group">
              <h1 class="script-info-section-title">អក្សរខ្មែរ Khmer</h1>
            </div>
            <a href="/scripts/khmer/practice" class="btn btn-primary btn-sm jp-top-practice-btn" style="margin-left: auto; flex-shrink: 0;">
              ✍️ Practice →
            </a>
          </div>

          <!-- Live Phone Keyboard Grid (Identical Layout & Height on All Layers) -->
          <div class="khmer-kb-rows-container">
            ${resolvedRows.map(row => `
              <div class="khmer-kb-row">
                ${row.map(({ token, dimmed }) => renderKhmerKeyCard(token, dimmed)).join('')}
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 2. Independent & Compound Vowels Card (Beneath the Main Keyboard Card) -->
        <section class="script-info-section khmer-kb-section">
          <div class="script-info-section-header jp-kb-top-bar">
            <div class="jp-kb-title-group">
              <h2 class="script-info-section-title">ឥឦឧ Independent & Compound Vowels</h2>
            </div>
          </div>

          <div class="khmer-kb-rows-container">
            ${extraVowelRows.map(row => `
              <div class="khmer-kb-row">
                ${row.map(token => renderKhmerKeyCard(token, false)).join('')}
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 3. Remembered Stats Card (Below the Keyboard Cards) -->
        <section class="script-info-section script-stats-bottom-card">
          <div class="script-info-cta-stat">
            <span><strong>${learnedTotal}</strong> Remembered</span>
            <span><strong>${needsPracticeCount}</strong> Need Practice (${pct}%)</span>
          </div>
          <div class="script-hub-progress-track">
            <div class="script-hub-progress-fill" style="width: ${Math.max(pct, 3)}%"></div>
          </div>
          <div class="script-stats-bottom-footer">
            <div class="script-section-mini-pills">
              ${KHMER_SECTIONS.map(sec => {
                const secLearned = sec.characters.filter(c => learnedMap[c.char]).length;
                return `<span>${sec.shortName}: <strong>${secLearned}/${sec.characters.length}</strong></span>`;
              }).join('')}
            </div>
            <a href="/scripts/khmer/practice" class="btn btn-primary btn-sm jp-top-practice-btn">
              ✍️ Practice ${needsPracticeCount > 0 ? `${needsPracticeCount} Remaining` : 'All'} Characters →
            </a>
          </div>
        </section>

        ${renderKhmerCharActionModal()}
      </div>
    `;

    // Bind modifier keys on keyboard and top Coeng button (⇧ Shift, ្ Coeng)
    container.querySelectorAll('[data-kb-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.getAttribute('data-kb-action');
        if (act === 'shift') {
          isShifted = !isShifted;
        } else if (act === 'coeng') {
          isCoeng = !isCoeng;
        }
        renderPage();
      });
    });

    // Clicking any letter key opens the Letter Action Modal
    container.querySelectorAll('.khmer-kb-key[data-char]').forEach(card => {
      card.addEventListener('click', () => {
        selectedKhmerChar = card.getAttribute('data-char');
        renderPage();
      });
    });

    // Letter Action Modal events
    container.querySelector('#khmer-char-action-close-btn')?.addEventListener('click', () => {
      selectedKhmerChar = null;
      renderPage();
    });
    const khmerOverlay = container.querySelector('#khmer-char-action-overlay');
    if (khmerOverlay) {
      khmerOverlay.addEventListener('click', (e) => {
        if (e.target === khmerOverlay) {
          selectedKhmerChar = null;
          renderPage();
        }
      });
    }
    container.querySelector('#khmer-modal-toggle-remembered')?.addEventListener('click', () => {
      if (!selectedKhmerChar) return;
      const ch = selectedKhmerChar;
      selectedKhmerChar = null;
      toggleCharLearned(ch);
    });
    container.querySelector('#khmer-modal-practice-btn')?.addEventListener('click', () => {
      if (!selectedKhmerChar) return;
      const ch = selectedKhmerChar;
      selectedKhmerChar = null;
      jumpToPractice(ch);
    });

    autoTranslateUi(container);
  }

  const onScriptsSynced = () => {
    learnedMap = loadLearnedMap('khmer');
    renderPage();
  };
  window.addEventListener('vocab-scripts-synced', onScriptsSynced);

  syncScriptsProgress().then((changed) => {
    if (changed) {
      learnedMap = loadLearnedMap('khmer');
      renderPage();
    }
  }).catch(() => {});

  renderPage();
}
