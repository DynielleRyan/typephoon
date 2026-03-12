const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

const SUPPORTED_LANGUAGES = {
  en: 'English',
  fil: 'Filipino',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  id: 'Indonesian',
  hi: 'Hindi',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese',
};

const MAX_COUNT = 200;
const MIN_COUNT = 10;
const DEFAULT_COUNT = 100;

// Fallback so Practice works without word files in repo
const FALLBACK_WORDS = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
];

const wordCache = new Map();

function loadWords(lang) {
  if (wordCache.has(lang)) return wordCache.get(lang);
  if (!/^[a-z]{2,4}$/.test(lang)) return null;

  const base = join(process.cwd(), 'server', 'data', 'words');
  const filePath = join(base, `${lang}.json`);
  if (!existsSync(filePath)) {
    if (lang === 'en') {
      wordCache.set(lang, FALLBACK_WORDS);
      return FALLBACK_WORDS;
    }
    return null;
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const words = JSON.parse(raw);
    const unique = [...new Set(words.filter((w) => typeof w === 'string' && w.length > 0))];
    wordCache.set(lang, unique);
    return unique;
  } catch {
    return null;
  }
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(pool, count) {
  const result = [];
  const shuffled = shuffle(pool);
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

const SENTENCE_ENDERS = ['.', '.', '.', '?', '!'];
const MID_PUNCTUATION = [',', ',', ';', ':'];

function capitalize(word) {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1);
}

function applyPunctuation(words) {
  if (words.length === 0) return words;
  const result = [...words];
  let sentenceLen = 0;
  const nextSentenceBreak = () => 4 + Math.floor(Math.random() * 8);
  let breakAt = nextSentenceBreak();
  result[0] = capitalize(result[0]);

  for (let i = 0; i < result.length; i++) {
    sentenceLen++;
    if (sentenceLen >= breakAt && i < result.length - 1) {
      const ender = SENTENCE_ENDERS[Math.floor(Math.random() * SENTENCE_ENDERS.length)];
      result[i] = result[i] + ender;
      result[i + 1] = capitalize(result[i + 1]);
      sentenceLen = 0;
      breakAt = nextSentenceBreak();
      continue;
    }
    if (sentenceLen > 2 && Math.random() < 0.12 && i < result.length - 1) {
      const mid = MID_PUNCTUATION[Math.floor(Math.random() * MID_PUNCTUATION.length)];
      result[i] = result[i] + mid;
    }
  }
  const last = result[result.length - 1];
  if (!/[.?!]$/.test(last)) {
    result[result.length - 1] = last + '.';
  }
  return result;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const lang = (typeof req.query.lang === 'string' ? req.query.lang.toLowerCase().trim() : 'en') || 'en';
    const punctuation = req.query.punctuation === 'true';
    const rawCount = parseInt(req.query.count, 10);
    const count = Number.isFinite(rawCount)
      ? Math.min(MAX_COUNT, Math.max(MIN_COUNT, rawCount))
      : DEFAULT_COUNT;

    if (!SUPPORTED_LANGUAGES[lang]) {
      res.status(400).json({
        error: 'Unsupported language',
        supported: Object.keys(SUPPORTED_LANGUAGES),
      });
      return;
    }

    const pool = loadWords(lang);
    if (!pool || pool.length === 0) {
      res.status(500).json({ error: 'Word list unavailable' });
      return;
    }

    let words = pickRandom(pool, count);
    if (punctuation) words = applyPunctuation(words);

    res.status(200).json({ words, language: lang, punctuation, count: words.length });
  } catch (err) {
    console.error('getWords error:', err);
    res.status(500).json({ error: 'Failed to generate words' });
  }
};
