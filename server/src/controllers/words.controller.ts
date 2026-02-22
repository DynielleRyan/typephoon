import { Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPPORTED_LANGUAGES: Record<string, string> = {
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

const wordCache = new Map<string, string[]>();

function loadWords(lang: string): string[] | null {
  if (wordCache.has(lang)) return wordCache.get(lang)!;

  if (!/^[a-z]{2,4}$/.test(lang)) return null;
  const filePath = join(__dirname, '..', '..', '..', 'data', 'words', `${lang}.json`);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const words: string[] = JSON.parse(raw);
    const unique = [...new Set(words.filter((w) => typeof w === 'string' && w.length > 0))];
    wordCache.set(lang, unique);
    return unique;
  } catch {
    return null;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom(pool: string[], count: number): string[] {
  const result: string[] = [];
  const shuffled = shuffle(pool);
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}

const SENTENCE_ENDERS = ['.', '.', '.', '?', '!'];
const MID_PUNCTUATION = [',', ',', ';', ':'];

function applyPunctuation(words: string[]): string[] {
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

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word[0].toUpperCase() + word.slice(1);
}

export function getLanguages(_req: Request, res: Response) {
  res.json({ languages: SUPPORTED_LANGUAGES });
}

export function getWords(req: Request, res: Response) {
  try {
    const lang = typeof req.query.lang === 'string' ? req.query.lang.toLowerCase().trim() : 'en';
    const punctuation = req.query.punctuation === 'true';
    const rawCount = parseInt(req.query.count as string, 10);
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

    res.json({ words, language: lang, punctuation, count: words.length });
  } catch (err) {
    console.error('getWords error:', err);
    res.status(500).json({ error: 'Failed to generate words' });
  }
}
