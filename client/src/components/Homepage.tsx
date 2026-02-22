import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw, ChevronDown } from 'lucide-react';

const DURATIONS = [15, 30, 60] as const;
const WORDS_PER_PAGE = 40;

const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'fil', label: 'Filipino' },
  { id: 'es', label: 'Spanish' },
  { id: 'fr', label: 'French' },
  { id: 'de', label: 'German' },
  { id: 'pt', label: 'Portuguese' },
  { id: 'id', label: 'Indonesian' },
  { id: 'hi', label: 'Hindi' },
  { id: 'ja', label: 'Japanese' },
  { id: 'ko', label: 'Korean' },
  { id: 'zh', label: 'Chinese' },
] as const;

async function fetchWords(lang: string, punctuation: boolean, count = 120): Promise<string[]> {
  try {
    const url = `/api/words?lang=${lang}&punctuation=${punctuation}&count=${count}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.words ?? [];
  } catch {
    return [];
  }
}

export default function Homepage() {
  const [words, setWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');
  const [punctuation, setPunctuation] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [wordHadErrors, setWordHadErrors] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const [duration, setDuration] = useState<number>(30);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTimeUp = hasStarted && timeLeft <= 0;
  const isDone = words.length > 0 && (currentWordIndex >= words.length || isTimeUp);
  const currentWord = !isDone && words.length > 0 ? words[currentWordIndex] : '';

  const page = Math.floor(currentWordIndex / WORDS_PER_PAGE);
  const pageStart = page * WORDS_PER_PAGE;
  const visibleWords = words.slice(pageStart, Math.min(pageStart + WORDS_PER_PAGE, words.length));
  const completedOnPage = Math.min(currentWordIndex - pageStart, visibleWords.length);
  const upcomingOnPage = visibleWords.slice(completedOnPage + 1);

  const expectedChar = !isDone
    ? input.length < currentWord.length ? currentWord[input.length] : ' '
    : '';

  const elapsedSeconds = hasStarted ? duration - timeLeft : 0;
  const wpm = elapsedSeconds > 0 ? Math.round((currentWordIndex / elapsedSeconds) * 60) : 0;
  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0;

  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  // Close lang menu on outside click
  useEffect(() => {
    function close(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node))
        setLangMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Fetch words on mount and when language/punctuation changes (only pre-start)
  const loadWords = useCallback(async () => {
    setLoading(true);
    const fetched = await fetchWords(language, punctuation);
    setWords(fetched);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [language, punctuation]);

  useEffect(() => {
    if (!hasStarted) loadWords();
  }, [loadWords, hasStarted]);

  // Timer
  const timerActive = isRunning && timeLeft > 0;
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setIsRunning(false); return 0; }
        return t - 1;
      });
    }, 1000);
    timerRef.current = id;
    return () => clearInterval(id);
  }, [timerActive]);

  function selectDuration(d: number) {
    if (hasStarted) return;
    setDuration(d);
    setTimeLeft(d);
  }

  const resetTest = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentWordIndex(0);
    setInput('');
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setWordHadErrors([]);
    setTimeLeft(duration);
    setIsRunning(false);
    setHasStarted(false);
    setLoading(true);
    const fetched = await fetchWords(language, punctuation);
    setWords(fetched);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [duration, language, punctuation]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isDone || loading) return;

    if (!hasStarted && e.key.length === 1) {
      setHasStarted(true);
      setIsRunning(true);
    }

    if (e.key === ' ') {
      if (input.length >= currentWord.length) {
        e.preventDefault();
        const hadErrors = input !== currentWord;
        setWordHadErrors((prev) => [...prev, hadErrors]);
        setCurrentWordIndex((i) => i + 1);
        setInput(input.slice(currentWord.length));
      }
      return;
    }

    if (e.key === 'Backspace' && input.length > 0) {
      const pos = input.length - 1;
      const wasCorrect = pos < currentWord.length && input[pos] === currentWord[pos];
      if (wasCorrect) setCorrectKeystrokes((c) => Math.max(0, c - 1));
      else setIncorrectKeystrokes((c) => Math.max(0, c - 1));
      return;
    }

    if (e.key.length !== 1) return;
    if (input.length >= currentWord.length) return;
    if (e.key === expectedChar) setCorrectKeystrokes((c) => c + 1);
    else setIncorrectKeystrokes((c) => c + 1);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      if (typedWord.length >= currentWord.length) {
        const typedForThisWord = typedWord.slice(0, currentWord.length);
        setWordHadErrors((prev) => [...prev, typedForThisWord !== currentWord]);
        setCurrentWordIndex((i) => i + 1);
        setInput(typedWord.length > currentWord.length ? typedWord.slice(currentWord.length) : '');
        return;
      }
      setInput(value.trim());
      return;
    }
    const wordPartCorrect = value.length > currentWord.length && value.slice(0, currentWord.length) === currentWord;
    setInput(wordPartCorrect || value.length <= currentWord.length ? value : value.slice(0, currentWord.length));
  }

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function refocus() {
      if (document.activeElement !== inputRef.current && !isDone)
        inputRef.current?.focus();
    }
    document.addEventListener('keydown', refocus);
    return () => document.removeEventListener('keydown', refocus);
  }, [isDone]);

  function focusInput() { inputRef.current?.focus(); }

  return (
    <div className="flex-1 min-h-0 flex flex-col text-foreground overflow-hidden" onClick={focusInput}>
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-6 py-8 overflow-auto">

        {/* Controls — pre-start */}
        <div className="flex flex-col items-center gap-3 mb-8 shrink-0" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); inputRef.current?.focus(); }}>
          {!hasStarted ? (
            <>
              {/* Language + punctuation row */}
              <div className="flex items-center gap-3">
                <div className="relative" ref={langMenuRef}>
                  <button
                    onClick={() => setLangMenuOpen((o) => !o)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted/40 px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {currentLang.label}
                    <ChevronDown className="size-3.5" />
                  </button>
                  {langMenuOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 w-40 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.id}
                          className={`flex w-full items-center rounded-md px-3 py-1.5 text-sm transition-colors ${
                            lang.id === language
                              ? 'bg-accent text-accent-foreground font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                          onClick={() => { setLanguage(lang.id); setLangMenuOpen(false); }}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setPunctuation((p) => !p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    punctuation
                      ? 'bg-foreground text-background'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Punctuation
                </button>
              </div>

              {/* Duration pills */}
              <div className="flex items-center gap-1.5 rounded-full bg-muted/40 p-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => selectDuration(d)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full tabular-nums transition-colors ${
                      d === duration
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </>
          ) : !isDone ? (
            <span className="text-4xl font-bold tabular-nums text-primary">{timeLeft}</span>
          ) : null}
        </div>

        {/* Word display */}
        <div className="w-full font-mono text-lg sm:text-xl md:text-2xl leading-relaxed text-muted-foreground/60 select-none tracking-wide text-justify">
          {loading ? (
            <p className="text-center text-muted-foreground/40 animate-pulse">Loading words...</p>
          ) : (
            <>
              {visibleWords.slice(0, completedOnPage).map((word, i) => (
                <span key={pageStart + i}>
                  <span className={wordHadErrors[pageStart + i] ? 'text-red-500/80 dark:text-red-400/80' : 'text-foreground/80'}>
                    {word}
                  </span>{' '}
                </span>
              ))}

              {!isDone && (
                <>
                  <span className="inline">
                    {currentWord.split('').map((char, j) => {
                      if (j < input.length) {
                        const correct = input[j] === char;
                        return (
                          <span key={j} className={correct ? 'text-foreground' : 'text-red-500 dark:text-red-400'}>
                            {char}
                          </span>
                        );
                      }
                      if (j === input.length) {
                        return (
                          <span key={j} className="text-foreground border-b-2 border-primary">
                            {char}
                          </span>
                        );
                      }
                      return <span key={j}>{char}</span>;
                    })}
                    {input.length === currentWord.length && (
                      <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px animate-pulse" aria-hidden />
                    )}
                    {input.length > currentWord.length && input.slice(0, currentWord.length) === currentWord && (
                      <>
                        <span className="text-red-500 dark:text-red-400">{input.slice(currentWord.length)}</span>
                        <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px animate-pulse" aria-hidden />
                      </>
                    )}
                  </span>{' '}
                  <span>{upcomingOnPage.join(' ')}</span>
                </>
              )}

              {isDone && upcomingOnPage.length > 0 && (
                <span>{upcomingOnPage.join(' ')}</span>
              )}
            </>
          )}
        </div>

        {/* Stats bar */}
        <div className="mt-8 shrink-0" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); inputRef.current?.focus(); }}>
          {isDone ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold tabular-nums text-primary">{wpm}</span>
                <span className="text-sm text-muted-foreground">wpm</span>
              </div>
              <div className="flex items-center gap-6 text-sm tabular-nums">
                <span className="text-muted-foreground">{accuracy}% accuracy</span>
                <span className="text-muted-foreground">{currentWordIndex} words</span>
                <span className="text-muted-foreground">{elapsedSeconds}s</span>
              </div>
              <button
                onClick={resetTest}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-4" /> Try again
              </button>
            </div>
          ) : hasStarted ? (
            <div className="flex items-center gap-4">
              <span className="text-xs tabular-nums text-muted-foreground">
                <span className="text-foreground font-medium">{correctKeystrokes}</span>
                <span className="text-muted-foreground/50"> / </span>
                <span className="text-red-500/80 dark:text-red-400/80 font-medium">{incorrectKeystrokes}</span>
                {totalKeystrokes > 0 && <span className="ml-2 text-muted-foreground/60">{accuracy}%</span>}
              </span>
              <button onClick={resetTest} className="text-muted-foreground/50 hover:text-foreground transition-colors" aria-label="Restart">
                <RotateCcw className="size-3.5" />
              </button>
            </div>
          ) : !loading ? (
            <p className="text-muted-foreground/40 text-sm">Start typing to begin</p>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDone || loading}
          className="absolute inset-0 w-full opacity-0 pointer-events-none cursor-default font-mono text-base outline-none"
          aria-label="Type the words above"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          tabIndex={0}
        />
      </main>
    </div>
  );
}
