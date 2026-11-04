import { autoTranslateUi } from '../i18n.js?v=20261104_scripts3';
import { trackEvent } from '../analytics.js?v=20261104_scripts3';
import { navigate } from '../app.js?v=20261104_scripts3';
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
  'ុំ': { type: 'vowel', romaji: 'om / um', aForm: 'កុំ', aRom: 'kom', oForm: 'គុំ', oRom: 'kum', combo: 'ុ + ំ' },
  'ំ': { type: 'vowel', romaji: 'am / um', aForm: 'កំ', aRom: 'kam', oForm: 'គំ', oRom: 'kum', sub: 'ម' },
  'ាំ': { type: 'vowel', romaji: 'am / oam', aForm: 'កាំ', aRom: 'kam', oForm: 'គាំ', oRom: 'koam', sub: 'ា', combo: 'ា + ំ' },
  'ះ': { type: 'vowel', romaji: 'ah / eah', aForm: 'កះ', aRom: 'kah', oForm: 'គះ', oRom: 'keah', sub: 'ហ' },
  'ុះ': { type: 'vowel', romaji: 'oh / uh', aForm: 'កុះ', aRom: 'koh', oForm: 'គុះ', oRom: 'kuh', combo: 'ុ + ះ' },
  'េះ': { type: 'vowel', romaji: 'eh / ih', aForm: 'កេះ', aRom: 'keh', oForm: 'គេះ', oRom: 'kih', sub: 'វ', combo: 'េ + ះ' },
  'ោះ': { type: 'vowel', romaji: 'aoh / uoh', aForm: 'កោះ', aRom: 'kaoh', oForm: 'គោះ', oRom: 'kuoh', sub: 'ៀ', combo: 'ោ + ះ' },

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
  'ឳ': { type: 'indep_vowel', romaji: '’au', note: 'Indep. au' }
};

// Populate subscript consonants (`្ក` .. `្វ`) in KHMER_CHAR_LOOKUP
Object.entries({ ...KHMER_CHAR_LOOKUP }).forEach(([ch, meta]) => {
  if (meta.type === 'consonant') {
    KHMER_CHAR_LOOKUP[`្${ch}`] = {
      type: 'subscript',
      baseChar: ch,
      displayChar: `\u200d្${ch}`,
      series: meta.series,
      romaji: `coeng ${meta.romaji}`,
      sub: ch
    };
  }
});

// Khmer Mobile Phone Keyboard Rows (exact physical positions on Khmer mobile keyboard)
const KHMER_KEYBOARD_ROWS = {
  // Layer 1: Default Mobile Keyboard
  layer1: [
    ['ឆ', 'ឹ', 'េ', 'រ', 'ត', 'យ', 'ុ', 'ិ', 'ោ', 'ផ'],
    ['ា', 'ស', 'ដ', 'ថ', 'ង', 'ហ', 'COENG_KEY', 'ក', 'ល'],
    ['SHIFT_KEY', 'ឋ', 'ខ', 'ច', 'វ', 'ប', 'ន', 'ម', 'ើ', 'ៀ']
  ],
  // Layer 2: Shifted (⇧) Mobile Keyboard
  layer2: [
    ['ឈ', 'ឺ', 'ែ', 'ឬ', 'ទ', 'ួ', 'ូ', 'ី', 'ៅ', 'ភ'],
    ['ាំ', 'ៃ', 'ឌ', 'ធ', 'អ', 'ះ', 'ញ', 'គ', 'ឡ'],
    ['SHIFT_KEY', 'ឍ', 'ឃ', 'ជ', 'េះ', 'ព', 'ណ', 'ំ', 'ឿ', 'ោះ']
  ],
  // Layer 3: Subscript Consonants (្ Coeng Layer — laid out on the exact same consonant keys!)
  coengLayer1: [
    ['្ឆ', null, null, '្រ', '្ត', '្យ', null, null, null, '្ផ'],
    [null, '្ស', '្ដ', '្ថ', '្ង', '្ហ', 'COENG_KEY', '្ក', '្ល'],
    ['SHIFT_KEY', '្ឋ', '្ខ', '្ច', '្វ', '្ប', '្ន', '្ម', null, null]
  ],
  coengLayer2: [
    ['្ឈ', null, null, null, '្ទ', null, null, null, null, '្ភ'],
    [null, null, '្ឌ', '្ធ', '្អ', null, '្ញ', '្គ', '្ឡ'],
    ['SHIFT_KEY', '្ឍ', '្ឃ', '្ជ', null, '្ព', '្ណ', null, null, null]
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
  localStorage.setItem(`${storagePrefix}-learned`, JSON.stringify(map));
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

  function renderSubKey(slot, posName, dimmed = false, showFullRememberedText = false) {
    if (!slot) {
      return `<div class="jp-petal-empty jp-petal-${posName}" aria-hidden="true"></div>`;
    }
    const isRemembered = Boolean(learnedMap[slot.char]);
    return `
      <div
        class="jp-petal-key jp-petal-${posName} ${isRemembered ? 'is-learned' : 'needs-practice'} ${dimmed ? 'is-dimmed-key' : ''}"
        data-char="${slot.char}"
      >
        <button
          type="button"
          class="jp-petal-practice-mini"
          data-practice-char="${slot.char}"
          title="Practice writing ${slot.char}"
        >✍️</button>
        <span class="jp-petal-glyph">${slot.char}</span>
        <span class="jp-petal-romaji">${slot.romaji}</span>
        <label
          class="key-remembered-checkbox ${isRemembered ? 'is-remembered' : 'is-needs-practice'}"
          title="${isRemembered ? 'Remembered — uncheck if needs practice' : 'Check when remembered'}"
        >
          <input type="checkbox" data-check-char="${slot.char}" ${isRemembered ? 'checked' : ''} />
          <span class="${showFullRememberedText ? 'key-rem-text-full' : 'key-rem-text-adaptive'}">Remembered</span>
        </label>
      </div>
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
            <button
              type="button"
              class="jp-cluster-toggle-all"
              data-cluster-chars="${slots.map(s => s.char).join(',')}"
              title="${allClusterLearned ? 'Mark group as Needs Practice' : 'Mark entire key group as Remembered'}"
            >
              ${allClusterLearned ? '✓ All' : `${learnedInCluster}/${slots.length} ✓`}
            </button>
          </div>

          <div class="jp-cross-5grid">
            ${renderSubKey(cluster.up, 'up', dimmed, false)}
            ${renderSubKey(cluster.left, 'left', dimmed, false)}
            ${renderSubKey(cluster.center, 'center', dimmed, false)}
            ${renderSubKey(cluster.right, 'right', dimmed, false)}
            ${renderSubKey(cluster.down, 'down', dimmed, false)}
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
              <p class="jp-focus-card-subtitle">Tap any key or checkbox to mark as Remembered</p>
            </div>
            <div class="jp-focus-card-actions">
              <button
                type="button"
                class="jp-cluster-toggle-all"
                data-cluster-chars="${slots.map(s => s.char).join(',')}"
              >
                ${allClusterLearned ? '✓ All Remembered' : `${learnedInCluster}/${slots.length} Remembered`}
              </button>
              <button type="button" class="jp-focus-close-btn" id="jp-focus-close-btn" aria-label="Close">✕</button>
            </div>
          </div>

          <div class="jp-cross-5grid jp-focus-cross-grid">
            ${renderSubKey(cluster.up, 'up', dimmed, true)}
            ${renderSubKey(cluster.left, 'left', dimmed, true)}
            ${renderSubKey(cluster.center, 'center', dimmed, true)}
            ${renderSubKey(cluster.right, 'right', dimmed, true)}
            ${renderSubKey(cluster.down, 'down', dimmed, true)}
          </div>
        </div>
      </div>
    `;
  }

  function renderPage() {
    const counts = getCounts();

    // Resolve the 9 keys on the grid based on activeModifier ('basic' | 'dakuten' | 'handakuten')
    const displayedNineClusters = kbData.basic.map(baseCluster => resolveClusterForBaseCol(baseCluster.col));

    container.innerHTML = `
      <div class="script-info-page">
        <!-- Expanded 9-Key Mobile Flick Keyboard (Single Card) -->
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
                  <span class="mod-count">${counts.basicLearned}/${counts.basicTotal}</span>
                </button>
                <button
                  type="button"
                  class="jp-mod-key-btn ${activeModifier === 'dakuten' ? 'is-active' : ''}"
                  data-jp-mod="dakuten"
                >
                  <span class="mod-glyph">゛</span>
                  <span class="mod-title">Dakuten</span>
                  <span class="mod-count">${counts.dakutenLearned}/${counts.dakutenTotal}</span>
                </button>
                <button
                  type="button"
                  class="jp-mod-key-btn ${activeModifier === 'handakuten' ? 'is-active' : ''}"
                  data-jp-mod="handakuten"
                >
                  <span class="mod-glyph">゜</span>
                  <span class="mod-title">Handakuten</span>
                  <span class="mod-count">${counts.handakutenLearned}/${counts.handakutenTotal}</span>
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

        ${renderFocusedClusterModal()}
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

    // Remembered checkbox on each key
    container.querySelectorAll('.key-remembered-checkbox').forEach(lbl => {
      lbl.addEventListener('click', (e) => e.stopPropagation());
    });
    container.querySelectorAll('input[data-check-char]').forEach(input => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleCharLearned(input.getAttribute('data-check-char'));
      });
    });

    // Direct ✍️ mini button on each key
    container.querySelectorAll('[data-practice-char]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        jumpToPractice(btn.getAttribute('data-practice-char'));
      });
    });

    // Clicking the key card itself also toggles Remembered
    container.querySelectorAll('.jp-petal-key').forEach(card => {
      card.addEventListener('click', () => {
        const ch = card.getAttribute('data-char');
        toggleCharLearned(ch);
      });
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

  renderPage();
}

// ============================================================================
// 4. `/scripts/khmer` — Interactive Khmer Phone Keyboard & Remembered Checklist
//    - Pressing `⇧ Shift` changes the keyboard between Layer 1 and Layer 2
//    - Pressing `្ Coeng` changes the keyboard to Subscript Consonants (`្ក`..`្វ`)
//    - Pressing `ឥឦឧ Indep. & Compound Vowels` switches to the 19 extra vowel keys
//    - Every key has a dedicated `✓ Remembered / ○ Needs Practice` button
// ============================================================================

function renderKhmerKeyboardChecklistScreen(container) {
  let learnedMap = loadLearnedMap('khmer');
  const allChars = KHMER_SECTIONS.flatMap(s => s.characters);
  let isShifted = false;
  let isCoeng = false;
  let isExtraVowelsLayer = false;

  // Build the 4th bottom row on the main keyboard with the layer switcher key (`ឥឦឧ`)
  const extraLayerRows = [
    ['ឥ', 'ឦ', 'ឧ', 'ឨ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ'],
    ['ឯ', 'ឰ', 'ឱ', 'ឳ', 'ុំ', 'ុះ', 'ាំ', 'េះ', 'ោះ'],
    ['SHIFT_KEY', null, null, null, null, null, null, null, null, 'EXTRA_KEY']
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
    }
    trackEvent('jump_to_script_char', { scriptId: 'khmer', char: charStr });
    navigate('/scripts/khmer/practice');
  }

  function getLayerCounts() {
    const l1 = KHMER_KEYBOARD_ROWS.layer1.flat().filter(k => k && !k.endsWith('_KEY'));
    const l2 = KHMER_KEYBOARD_ROWS.layer2.flat().filter(k => k && !k.endsWith('_KEY'));
    const c1 = KHMER_KEYBOARD_ROWS.coengLayer1.flat().filter(k => k && !k.endsWith('_KEY'));
    const c2 = KHMER_KEYBOARD_ROWS.coengLayer2.flat().filter(k => k && !k.endsWith('_KEY'));
    const ex = [... new Set([...KHMER_KEYBOARD_ROWS.compoundVowels, ...KHMER_KEYBOARD_ROWS.independentVowels])];
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

  function renderKhmerKeyCard(keyToken, layerStats) {
    if (!keyToken) {
      return `<div class="khmer-kb-key is-placeholder" aria-hidden="true"></div>`;
    }

    if (keyToken === 'SHIFT_KEY') {
      const targetDone = isCoeng
        ? (isShifted ? layerStats.c1Done : layerStats.c2Done)
        : (isShifted ? layerStats.l1Done : layerStats.l2Done);
      const targetTotal = isCoeng
        ? (isShifted ? layerStats.c1.length : layerStats.c2.length)
        : (isShifted ? layerStats.l1.length : layerStats.l2.length);
      return `
        <button
          type="button"
          class="khmer-kb-key is-modifier-key ${isShifted ? 'is-active' : ''}"
          data-kb-action="shift"
          title="Tap to toggle Shift Layer (⇧)"
        >
          <span class="khmer-key-mod-icon">⇧ ${isShifted ? 'ON' : 'Shift'}</span>
          <span class="khmer-key-mod-label">${isShifted ? 'Back to Layer 1' : 'View Shifted Keys'}</span>
          <span class="khmer-key-mod-hint">${targetDone}/${targetTotal} Remembered</span>
        </button>
      `;
    }

    if (keyToken === 'COENG_KEY') {
      return `
        <button
          type="button"
          class="khmer-kb-key is-coeng-key ${isCoeng ? 'is-active' : ''}"
          data-kb-action="coeng"
          title="Tap to toggle Subscript Consonants (្ Coeng) on the keyboard"
        >
          <span class="khmer-key-mod-icon">្ ${isCoeng ? 'ON' : ''}</span>
          <span class="khmer-key-mod-label">Subscripts (Coeng)</span>
          <span class="khmer-key-mod-hint">${layerStats.coengDone}/${layerStats.coengAll.length} Remembered</span>
        </button>
      `;
    }

    if (keyToken === 'EXTRA_KEY') {
      return `
        <button
          type="button"
          class="khmer-kb-key is-modifier-key ${isExtraVowelsLayer ? 'is-active' : ''}"
          data-kb-action="extra"
          title="Toggle Independent Vowels & Compound Vowels layer"
        >
          <span class="khmer-key-mod-icon">${isExtraVowelsLayer ? '⌨️ Back' : 'ឥឦឧ'}</span>
          <span class="khmer-key-mod-label">${isExtraVowelsLayer ? 'Main Keyboard' : 'Indep. Vowels'}</span>
          <span class="khmer-key-mod-hint">${layerStats.exDone}/${layerStats.ex.length} Remembered</span>
        </button>
      `;
    }

    const meta = KHMER_CHAR_LOOKUP[keyToken];
    if (!meta) return '';

    const isRemembered = Boolean(learnedMap[keyToken]);
    const displayGlyph = meta.displayChar || (meta.type === 'vowel' ? `◌${keyToken}` : keyToken);

    let detailsHtml = '';
    if (meta.type === 'consonant' || meta.type === 'subscript') {
      detailsHtml = `
        <div class="khmer-key-top-badges">
          <span class="khmer-key-series series-${meta.series.toLowerCase()}">${meta.series}-Series</span>
          ${meta.sub ? `<span class="khmer-key-corner-sub" title="Shift pair: ${meta.sub}">⇧${meta.sub}</span>` : ''}
        </div>
        <div class="khmer-key-glyph">${displayGlyph}</div>
        <div class="khmer-key-romaji">${meta.romaji}</div>
      `;
    } else if (meta.type === 'vowel') {
      detailsHtml = `
        <div class="khmer-key-top-badges">
          <span class="khmer-key-series is-vowel-badge">Vowel</span>
          ${meta.combo ? `<span class="khmer-key-corner-sub">${meta.combo}</span>` : (meta.sub ? `<span class="khmer-key-corner-sub">⇧${meta.sub}</span>` : '')}
        </div>
        <div class="khmer-key-glyph">${displayGlyph}</div>
        <div class="khmer-key-romaji">${meta.romaji}</div>
        <div class="khmer-key-ao-forms">
          <span class="ao-pill series-a" title="A-Series form & romanisation">${meta.aForm} <em>${meta.aRom}</em></span>
          <span class="ao-pill series-o" title="O-Series form & romanisation">${meta.oForm} <em>${meta.oRom}</em></span>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="khmer-key-top-badges">
          <span class="khmer-key-series is-indep-badge">Indep.</span>
          ${meta.sub ? `<span class="khmer-key-corner-sub">${meta.sub}</span>` : ''}
        </div>
        <div class="khmer-key-glyph">${displayGlyph}</div>
        <div class="khmer-key-romaji">${meta.romaji}</div>
        <div class="khmer-key-note">${meta.note || ''}</div>
      `;
    }

    return `
      <div
        class="khmer-kb-key is-${meta.type} ${isRemembered ? 'is-learned' : 'needs-practice'}"
        data-char="${keyToken}"
      >
        <button
          type="button"
          class="jp-petal-practice-mini"
          data-practice-char="${keyToken}"
          title="Practice writing ${displayGlyph}"
        >✍️</button>
        ${detailsHtml}
        <label
          class="key-remembered-checkbox ${isRemembered ? 'is-remembered' : 'is-needs-practice'}"
          title="${isRemembered ? 'Remembered — uncheck if needs practice' : 'Check when remembered'}"
        >
          <input type="checkbox" data-check-char="${keyToken}" ${isRemembered ? 'checked' : ''} />
          <span>Remembered</span>
        </label>
      </div>
    `;
  }

  function getActiveRows() {
    if (isExtraVowelsLayer) {
      return extraLayerRows;
    }
    if (isCoeng) {
      return isShifted ? KHMER_KEYBOARD_ROWS.coengLayer2 : KHMER_KEYBOARD_ROWS.coengLayer1;
    }
    return isShifted ? KHMER_KEYBOARD_ROWS.layer2 : KHMER_KEYBOARD_ROWS.layer1;
  }

  function getActiveLayerTitle() {
    if (isExtraVowelsLayer) {
      return '🏛️ Independent Vowels & Compound Dependent Vowels Layer';
    }
    if (isCoeng) {
      return isShifted
        ? '្ + ⇧ Subscript Consonants — Shifted Layer 2 (Coeng)'
        : '្ Subscript Consonants — Default Layer 1 (Coeng)';
    }
    return isShifted
      ? '⇧ Phone Keyboard — Layer 2 (Shifted Keys)'
      : '📱 Phone Keyboard — Layer 1 (Default Keys)';
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

    const activeRows = getActiveRows();
    const activeLayerChars = activeRows.flat().filter(k => k && !k.endsWith('_KEY'));
    const activeLayerDone = activeLayerChars.filter(c => learnedMap[c]).length;

    container.innerHTML = `
      <div class="script-info-page">
        <!-- Hero Banner -->
        <div class="script-info-hero">
          <div class="script-info-hero-main">
            <div class="screen-lang-tag">
              <span>🇰🇭</span>
              <span>អក្សរខ្មែរ · Interactive Phone Keyboard & Remembered Checklist</span>
            </div>
            <h1 class="screen-title">Khmer Keyboard & Checklist</h1>
            <p class="screen-subtitle">
              Tap <strong>⇧ Shift</strong>, <strong>្ Coeng (Subscripts)</strong>, or <strong>ឥឦឧ Indep. Vowels</strong> on the keyboard below to switch layers just like on a phone. Consonants show their romanisation and series; vowels show their <strong>A-Series (ក)</strong> and <strong>O-Series (គ)</strong> forms. Check the <strong>Remembered</strong> checkbox on each key to track what needs practice.
            </p>
          </div>

          <div class="script-info-cta-card">
            <div class="script-info-cta-stat">
              <span><strong>${learnedTotal}</strong> Remembered</span>
              <span><strong>${needsPracticeCount}</strong> Need Practice</span>
            </div>
            <div class="script-hub-progress-track">
              <div class="script-hub-progress-fill" style="width: ${Math.max(pct, 3)}%"></div>
            </div>
            <div class="script-section-mini-pills">
              ${KHMER_SECTIONS.map(sec => {
                const secLearned = sec.characters.filter(c => learnedMap[c.char]).length;
                return `<span>${sec.shortName}: <strong>${secLearned}/${sec.characters.length}</strong></span>`;
              }).join('')}
            </div>
            <a href="/scripts/khmer/practice" class="btn btn-primary script-info-practice-btn">
              ✍️ Practice ${needsPracticeCount > 0 ? `${needsPracticeCount} Remaining` : 'All'} Characters →
            </a>
          </div>
        </div>

        <!-- Interactive Khmer Phone Keyboard -->
        <section class="script-info-section">
          <div class="script-info-section-header">
            <div>
              <h2 class="script-info-section-title">${getActiveLayerTitle()}</h2>
              <p class="script-info-section-desc">
                Tap <strong>⇧ Shift</strong> or <strong>្ Subscripts</strong> right on the keyboard (or use the layer bar) to flip the keys. Every key has its own <strong>Remembered</strong> checkbox.
              </p>
            </div>
            <div class="script-header-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="toggleActiveLayerBtn">
                ${activeLayerDone}/${activeLayerChars.length} Remembered · Toggle Layer
              </button>
            </div>
          </div>

          <!-- Quick Layer Switcher Bar (synced with the keyboard modifier keys) -->
          <div class="script-checklist-toolbar" style="padding: 0.55rem 0.85rem;">
            <div class="script-kb-layer-tabs" style="flex-wrap: wrap;">
              <button
                type="button"
                class="script-kb-tab ${!isShifted && !isCoeng && !isExtraVowelsLayer ? 'active' : ''}"
                data-preset="l1"
              >
                Layer 1 Default (${layerStats.l1Done}/${layerStats.l1.length})
              </button>
              <button
                type="button"
                class="script-kb-tab ${isShifted && !isCoeng && !isExtraVowelsLayer ? 'active' : ''}"
                data-preset="l2"
              >
                ⇧ Layer 2 Shift (${layerStats.l2Done}/${layerStats.l2.length})
              </button>
              <button
                type="button"
                class="script-kb-tab ${isCoeng && !isShifted && !isExtraVowelsLayer ? 'active' : ''}"
                data-preset="c1"
              >
                ្ Subscripts 1 (${layerStats.c1Done}/${layerStats.c1.length})
              </button>
              <button
                type="button"
                class="script-kb-tab ${isCoeng && isShifted && !isExtraVowelsLayer ? 'active' : ''}"
                data-preset="c2"
              >
                ្ + ⇧ Subscripts 2 (${layerStats.c2Done}/${layerStats.c2.length})
              </button>
              <button
                type="button"
                class="script-kb-tab ${isExtraVowelsLayer ? 'active' : ''}"
                data-preset="extra"
              >
                ឥឦឧ Indep. & Compound Vowels (${layerStats.exDone}/${layerStats.ex.length})
              </button>
            </div>

            <div class="script-toolbar-right">
              <span class="script-legend-item"><span class="script-series-badge series-a">A</span> A-Series (â)</span>
              <span class="script-legend-item"><span class="script-series-badge series-o">O</span> O-Series (ô)</span>
            </div>
          </div>

          <!-- Live Phone Keyboard Grid -->
          <div class="khmer-kb-rows-container">
            ${activeRows.map(row => `
              <div class="khmer-kb-row">
                ${row.map(token => renderKhmerKeyCard(token, layerStats)).join('')}
              </div>
            `).join('')}

            <!-- Bottom Keyboard Control Row (Indep/Compound Vowels Key + Spacebar Info + Coeng Key + Shift Key) -->
            <div class="khmer-kb-bottom-bar">
              <button
                type="button"
                class="khmer-kb-mod-pill ${isExtraVowelsLayer ? 'is-active' : ''}"
                data-kb-action="extra"
              >
                <span>ឥឦឧ / ុំ</span>
                <span>Indep. & Compound Vowels (${layerStats.exDone}/${layerStats.ex.length})</span>
              </button>

              <button
                type="button"
                class="khmer-kb-mod-pill ${isCoeng ? 'is-active' : ''}"
                data-kb-action="coeng"
              >
                <span>្ Coeng</span>
                <span>Subscript Consonants (${layerStats.coengDone}/${layerStats.coengAll.length})</span>
              </button>

              <button
                type="button"
                class="khmer-kb-mod-pill ${isShifted ? 'is-active' : ''}"
                data-kb-action="shift"
              >
                <span>⇧ Shift</span>
                <span>${isShifted ? 'Shifted (Layer 2)' : 'Default (Layer 1)'}</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    `;

    // Bind modifier keys on keyboard (⇧ Shift, ្ Coeng, ឥឦឧ Extra)
    container.querySelectorAll('[data-kb-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const act = btn.getAttribute('data-kb-action');
        if (act === 'shift') {
          isExtraVowelsLayer = false;
          isShifted = !isShifted;
        } else if (act === 'coeng') {
          isExtraVowelsLayer = false;
          isCoeng = !isCoeng;
        } else if (act === 'extra') {
          isExtraVowelsLayer = !isExtraVowelsLayer;
        }
        renderPage();
      });
    });

    // Bind top preset tabs
    container.querySelectorAll('[data-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-preset');
        if (p === 'l1') { isExtraVowelsLayer = false; isCoeng = false; isShifted = false; }
        else if (p === 'l2') { isExtraVowelsLayer = false; isCoeng = false; isShifted = true; }
        else if (p === 'c1') { isExtraVowelsLayer = false; isCoeng = true; isShifted = false; }
        else if (p === 'c2') { isExtraVowelsLayer = false; isCoeng = true; isShifted = true; }
        else if (p === 'extra') { isExtraVowelsLayer = true; }
        renderPage();
      });
    });

    // Bind Remembered checkbox on each key
    container.querySelectorAll('.key-remembered-checkbox').forEach(lbl => {
      lbl.addEventListener('click', (e) => e.stopPropagation());
    });
    container.querySelectorAll('input[data-check-char]').forEach(input => {
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        toggleCharLearned(input.getAttribute('data-check-char'));
      });
    });

    // Bind ✍️ practice mini button on each key
    container.querySelectorAll('[data-practice-char]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        jumpToPractice(btn.getAttribute('data-practice-char'));
      });
    });

    // Clicking the key card itself also toggles Remembered
    container.querySelectorAll('.khmer-kb-key[data-char]').forEach(card => {
      card.addEventListener('click', () => {
        toggleCharLearned(card.getAttribute('data-char'));
      });
    });

    // Toggle all keys on active layer
    container.querySelector('#toggleActiveLayerBtn')?.addEventListener('click', () => {
      toggleGroupLearned(activeLayerChars);
    });

    autoTranslateUi(container);
  }

  renderPage();
}
