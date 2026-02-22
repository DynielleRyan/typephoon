import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const INITIAL_WORDS = [
  "apple", "beach", "cloud", "dance", "eagle",
  "flame", "grape", "heart", "image", "jolly",
  "koala", "lemon", "mango", "night", "ocean",
  "pearl", "queen", "rain", "storm", "tiger",
  "umbra", "violet", "whale", "xenon", "yacht",
  "zebra", "breeze", "crystal", "dream", "ember",
  "forest", "glacier", "horizon", "island", "jungle",
  "knight", "legend", "meadow", "nebula", "orchid",
  "phoenix", "quartz", "river", "sunset", "thunder",
  "unicorn", "volcano", "willow", "xylophone", "yonder"
];

const WORDS_PER_PAGE = 35;
const TEST_MODES = ["Punctuation","Language", "Developer", "custom"] as const;
const DURATION_OPTIONS = [15, 30, 60] as const;

export default function Homepage() {
  const [words, setWords] = useState(INITIAL_WORDS);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [wordHadErrors, setWordHadErrors] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const incorrectAtWordStartRef = useRef(0);

  // Mode + duration state
  const [activeMode, setActiveMode] = useState<(typeof TEST_MODES)[number]>('time');
  const [duration, setDuration] = useState(30);

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTimeUp = hasStarted && timeLeft <= 0;
  const isDone = currentWordIndex >= words.length || isTimeUp;
  const currentWord = !isDone ? words[currentWordIndex] : '';

  // Pagination
  const page = Math.floor(currentWordIndex / WORDS_PER_PAGE);
  const pageStart = page * WORDS_PER_PAGE;
  const visibleWords = words.slice(pageStart, Math.min(pageStart + WORDS_PER_PAGE, words.length));
  const completedOnPage = Math.min(currentWordIndex - pageStart, visibleWords.length);
  const upcomingOnPage = visibleWords.slice(completedOnPage + 1);
  const expectedChar = !isDone
    ? input.length < currentWord.length
      ? currentWord[input.length]
      : ' '
    : '';

  // WPM: words completed / (elapsed time in minutes)
  const elapsedSeconds = hasStarted ? duration - timeLeft : 0;
  const wpm = elapsedSeconds > 0 ? Math.round((currentWordIndex / elapsedSeconds) * 60) : 0;

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft > 0]);

  function selectDuration(d: number) {
    if (hasStarted) return;
    setDuration(d);
    setTimeLeft(d);
  }

  function startTimer() {
    if (!hasStarted) {
      setHasStarted(true);
      setIsRunning(true);
    }
  }

  const resetTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentWordIndex(0);
    setInput('');
    setCorrectKeystrokes(0);
    setIncorrectKeystrokes(0);
    setWordHadErrors([]);
    setTimeLeft(duration);
    setIsRunning(false);
    setHasStarted(false);
    incorrectAtWordStartRef.current = 0;
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [duration]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isDone) return;

    // Start timer on first real keypress
    if (!hasStarted && e.key.length === 1) {
      startTimer();
    }

    // Space: advance to next word when length is reached
    if (e.key === ' ') {
      if (input.length >= currentWord.length) {
        e.preventDefault();
        // Mark wrong only if final typed word doesn't match (backspace corrections count as correct)
        const hadErrors = input !== currentWord;
        setWordHadErrors((prev) => [...prev, hadErrors]);
        incorrectAtWordStartRef.current = incorrectKeystrokes;
        setCurrentWordIndex((i) => i + 1);
        // Carry extra characters to the next word (wrong key becomes start of next word)
        setInput(input.slice(currentWord.length));
      }
      return;
    }

    // Backspace: undo the count for the character being removed so re-typing doesn't double-count
    if (e.key === 'Backspace' && input.length > 0) {
      const pos = input.length - 1;
      const charRemoved = input[pos];
      const wasCorrect = pos < currentWord.length && charRemoved === currentWord[pos];
      if (wasCorrect) {
        setCorrectKeystrokes((c) => Math.max(0, c - 1));
      } else {
        setIncorrectKeystrokes((c) => Math.max(0, c - 1));
      }
      return;
    }

    if (e.key.length !== 1) return;
    // Only count keystrokes that advance the cursor; ignore repeat/overflow chars so counters stay correct
    if (input.length >= currentWord.length) return;
    if (e.key === expectedChar) {
      setCorrectKeystrokes((c) => c + 1);
    } else {
      setIncorrectKeystrokes((c) => c + 1);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;

    if (value.endsWith(' ')) {
      const typedWord = value.trim();
      // Advance when word length is reached (space pressed), regardless of correct/wrong chars
      if (typedWord.length >= currentWord.length) {
        // Mark wrong only if final typed word doesn't match (backspace corrections count as correct)
        const typedForThisWord = typedWord.slice(0, currentWord.length);
        const hadErrors = typedForThisWord !== currentWord;
        setWordHadErrors((prev) => [...prev, hadErrors]);
        incorrectAtWordStartRef.current = incorrectKeystrokes;
        setCurrentWordIndex((i) => i + 1);
        // Carry extra characters to the next word
        setInput(typedWord.length > currentWord.length ? typedWord.slice(currentWord.length) : '');
        return;
      }
      // Not enough characters yet: don't accept the space
      setInput(value.trim());
      return;
    }

    // Allow overflow only when the word part is correct (extra chars become start of next word)
    const wordPartCorrect = value.length > currentWord.length && value.slice(0, currentWord.length) === currentWord;
    setInput(wordPartCorrect || value.length <= currentWord.length ? value : value.slice(0, currentWord.length));
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleGlobalKeyDown() {
      if (document.activeElement !== inputRef.current && !isDone) {
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isDone]);

  function focusInput() {
    inputRef.current?.focus();
  }

  const totalKeystrokes = correctKeystrokes + incorrectKeystrokes;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 0;

  return (
    <div
      className="flex-1 min-h-0 flex flex-col text-foreground overflow-hidden"
      onClick={focusInput}
    >
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 overflow-auto">

        {/* Timer countdown — only while typing */}
        {hasStarted && !isDone && (
          <p className="font-mono text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 shrink-0 tabular-nums text-primary">
            {timeLeft}
          </p>
        )}

        {/* Test mode + duration selector + prompt — only before the test starts */}
        {!hasStarted && (
          <>
            <div className="flex flex-col items-center gap-3 mb-4 sm:mb-6 shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/30">
                {TEST_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setActiveMode(mode)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md capitalize transition-colors ${
                      mode === activeMode
                        ? 'text-foreground bg-accent/50'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {activeMode === 'time' && (
                <div className="flex items-center gap-2">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => selectDuration(d)}
                      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors tabular-nums ${
                        d === duration
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6 text-center w-full max-w-4xl shrink-0">
              Start typing to begin
            </p>
          </>
        )}

        {/* Typing area — always visible */}
        <div className="w-full max-w-4xl font-mono text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-muted-foreground/90 select-none tracking-wide text-justify hyphens-auto">
          {/* This page: completed words */}
          {visibleWords.slice(0, completedOnPage).map((word, i) => (
            <span key={pageStart + i}>
              <span className={wordHadErrors[pageStart + i] ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>
                    {word}
                  </span>
              {' '}
            </span>
          ))}
          {/* Current word: per-character */}
          {!isDone && (
            <>
              <span className="inline">
                {currentWord.split('').map((char, j) => {
                  if (j < input.length) {
                    const correct = input[j] === char;
                    return (
                      <span key={j} className={correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                        {char}
                      </span>
                    );
                  }
                  if (j === input.length) {
                    return (
                      <span key={j} className="text-foreground border-b-2 border-primary bg-primary/20">
                        {char}
                      </span>
                    );
                  }
                  return (
                    <span key={j} className="text-muted-foreground/90">{char}</span>
                  );
                })}
                {input.length === currentWord.length && (
                  <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px" aria-hidden />
                )}
                {input.length > currentWord.length && input.slice(0, currentWord.length) === currentWord && (
                  <>
                    <span className="text-red-600 dark:text-red-400">{input.slice(currentWord.length)}</span>
                    <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px" aria-hidden />
                  </>
                )}
              </span>
              {' '}
              {upcomingOnPage.join(' ')}
            </>
          )}
          {/* When done, show the remaining upcoming words as muted */}
          {isDone && upcomingOnPage.length > 0 && (
            <span>{upcomingOnPage.join(' ')}</span>
          )}
        </div>

        {/* Restart + live stats while typing */}
        {hasStarted && !isDone && (
          <div className="flex items-center justify-center gap-4 mt-3 sm:mt-4 shrink-0" onClick={(e) => e.stopPropagation()}>
            <p className="text-muted-foreground text-xs sm:text-sm tabular-nums">
              {correctKeystrokes}<span className="text-emerald-600 dark:text-emerald-400">/</span>{incorrectKeystrokes}
              {totalKeystrokes > 0 && <span className="ml-1.5 text-muted-foreground/70">({accuracy}%)</span>}
            </p>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetTest}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Restart test"
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>
        )}

        {/* Restart hint before typing */}
        {!hasStarted && (
          <p className="text-muted-foreground text-xs sm:text-sm mt-2 sm:mt-3 text-center shrink-0 tabular-nums">
            Correct: {correctKeystrokes} · Incorrect: {incorrectKeystrokes}
          </p>
        )}

        {/* Results modal */}
        <Dialog open={isDone} onOpenChange={(open) => { if (!open) resetTest(); }}>
          <DialogContent showCloseButton={false} className="sm:max-w-sm gap-0 p-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Hero stat */}
            <div className="flex flex-col items-center gap-1 pt-8 pb-6 bg-primary/5">
              <span className="text-5xl sm:text-6xl font-bold tabular-nums text-primary">{wpm}</span>
              <span className="text-sm font-medium text-muted-foreground">words per minute</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
              <div className="flex flex-col items-center gap-0.5 py-4">
                <span className="text-lg font-semibold tabular-nums text-foreground">{accuracy}%</span>
                <span className="text-[11px] text-muted-foreground">accuracy</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 py-4">
                <span className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{correctKeystrokes}</span>
                <span className="text-[11px] text-muted-foreground">correct</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 py-4">
                <span className="text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">{incorrectKeystrokes}</span>
                <span className="text-[11px] text-muted-foreground">incorrect</span>
              </div>
            </div>

            {/* Summary + action */}
            <div className="flex flex-col gap-3 p-5 pt-4 border-t border-border">
              <p className="text-center text-xs text-muted-foreground">
                {currentWordIndex} words · {elapsedSeconds}s · {isTimeUp ? "time's up" : 'complete'}
              </p>
              <Button onClick={resetTest} size="lg" className="w-full gap-2">
                <RotateCcw className="size-4" />
                Try again
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isDone}
          className="absolute inset-0 w-full opacity-0 cursor-default font-mono text-base sm:text-lg outline-none"
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