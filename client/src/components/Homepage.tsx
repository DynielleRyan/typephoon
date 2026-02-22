import { useState, useRef, useEffect } from 'react';

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

export default function Homepage() {
  const [words, setWords] = useState(INITIAL_WORDS);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState('');
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [incorrectKeystrokes, setIncorrectKeystrokes] = useState(0);
  const [wordHadErrors, setWordHadErrors] = useState<boolean[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const incorrectAtWordStartRef = useRef(0);

  const isDone = currentWordIndex >= words.length;
  const currentWord = !isDone ? words[currentWordIndex] : '';

  // Pagination: show one fixed page of words; only change when moving to next page
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isDone) return;

    // Space: advance to next word when length is reached (so one tap works even when word is wrong)
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

  return (
    <div
      className="dark flex-1 min-h-0 flex flex-col text-foreground overflow-hidden"
      onClick={focusInput}
    >
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center w-full px-4 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 overflow-auto">
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-3 sm:mb-4 md:mb-6 text-center w-full max-w-4xl shrink-0">
          Click or press any key to focus
        </p>

        <div className="w-full max-w-4xl font-mono text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed text-muted-foreground/90 select-none tracking-wide text-justify hyphens-auto">
          {!isDone ? (
            <>
              {/* This page: completed words (fixed list, doesn't change until next page) */}
              {visibleWords.slice(0, completedOnPage).map((word, i) => (
                <span key={pageStart + i}>
                  <span className={wordHadErrors[pageStart + i] ? 'text-red-500' : 'text-emerald-600/90'}>
                    {word}
                  </span>
                  {' '}
                </span>
              ))}
              {/* Current word: per-character correct / wrong / next / untyped */}
              <span className="inline">
                {currentWord.split('').map((char, j) => {
                  if (j < input.length) {
                    const correct = input[j] === char;
                    return (
                      <span
                        key={j}
                        className={correct ? 'text-emerald-600/90' : 'text-red-500'}
                      >
                        {char}
                      </span>
                    );
                  }
                  if (j === input.length) {
                    return (
                      <span
                        key={j}
                        className="text-foreground border-b-2 border-primary bg-primary/20"
                      >
                        {char}
                      </span>
                    );
                  }
                  return (
                    <span key={j} className="text-muted-foreground/90">
                      {char}
                    </span>
                  );
                })}
                {/* Persistent cursor at end of word when fully filled */}
                {input.length === currentWord.length && (
                  <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px" aria-hidden />
                )}
                {/* Overflow (extra chars after correct word) — shown in red, will become next word's input on space */}
                {input.length > currentWord.length && input.slice(0, currentWord.length) === currentWord && (
                  <>
                    <span className="text-red-500">{input.slice(currentWord.length)}</span>
                    <span className="inline-block w-0.5 h-6 bg-primary align-middle ml-px" aria-hidden />
                  </>
                )}
              </span>
              {' '}
              {upcomingOnPage.join(' ')}
            </>
          ) : (
            <>
              {visibleWords.map((word, i) => (
                <span key={pageStart + i}>
                  <span className={wordHadErrors[pageStart + i] ? 'text-red-500' : 'text-emerald-600/90'}>
                    {word}
                  </span>
                  {' '}
                </span>
              ))}
              <span className="text-foreground">Done! You typed all {words.length} words.</span>
            </>
          )}
        </div>

        <p className="text-muted-foreground text-xs sm:text-sm mt-2 sm:mt-3 md:mt-4 text-center w-full max-w-4xl shrink-0">
          Correct: {correctKeystrokes} · Incorrect: {incorrectKeystrokes}
          {correctKeystrokes + incorrectKeystrokes > 0 && (
            <> · Accuracy: {Math.round((correctKeystrokes / (correctKeystrokes + incorrectKeystrokes)) * 100)}%</>
          )}
        </p>

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