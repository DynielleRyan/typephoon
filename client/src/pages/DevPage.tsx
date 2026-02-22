import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Square } from 'lucide-react';

export default function DevPage() {
  const [codeText, setCodeText] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [typedChars, setTypedChars] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const typingRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const isActive = sourceText.length > 0;
  const isDone = isActive && typedChars.length >= sourceText.length;
  const charIndex = typedChars.length;

  const totalKeystrokes = correctCount + incorrectCount;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctCount / totalKeystrokes) * 100) : 0;

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [charIndex]);

  function toggleStartStop() {
    if (isActive) {
      setSourceText('');
      setTypedChars('');
      setCorrectCount(0);
      setIncorrectCount(0);
      setHasStarted(false);
    } else {
      const trimmed = codeText.trimEnd();
      if (!trimmed) return;
      setSourceText(trimmed);
      setTypedChars('');
      setCorrectCount(0);
      setIncorrectCount(0);
      setHasStarted(false);
      setTimeout(() => typingRef.current?.focus(), 50);
    }
  }

  const resetTest = useCallback(() => {
    setTypedChars('');
    setCorrectCount(0);
    setIncorrectCount(0);
    setHasStarted(false);
    setTimeout(() => typingRef.current?.focus(), 50);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (isDone || !isActive) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (typedChars.length === 0) return;
      const removedPos = typedChars.length - 1;
      const wasCorrect = typedChars[removedPos] === sourceText[removedPos];
      if (wasCorrect) setCorrectCount((c) => Math.max(0, c - 1));
      else setIncorrectCount((c) => Math.max(0, c - 1));
      setTypedChars((prev) => prev.slice(0, -1));
      return;
    }

    let typed: string | null = null;
    if (e.key === 'Enter') {
      typed = '\n';
    } else if (e.key === 'Tab') {
      typed = '\t';
    } else if (e.key.length === 1) {
      typed = e.key;
    }

    if (typed === null) return;
    e.preventDefault();

    if (!hasStarted) setHasStarted(true);

    const expected = sourceText[charIndex];
    if (typed === expected) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);
    setTypedChars((prev) => prev + typed);
  }

  useEffect(() => {
    if (isActive && !isDone) typingRef.current?.focus();
  }, [isActive, isDone]);

  useEffect(() => {
    function refocus() {
      if (isActive && !isDone && document.activeElement !== typingRef.current)
        typingRef.current?.focus();
    }
    document.addEventListener('click', refocus);
    return () => document.removeEventListener('click', refocus);
  }, [isActive, isDone]);

  function renderSourceText() {
    const chars: React.ReactNode[] = [];
    for (let i = 0; i < sourceText.length; i++) {
      const ch = sourceText[i];
      const display = ch === '\n' ? '\n' : ch === '\t' ? '\t' : ch;

      if (i < typedChars.length) {
        const correct = typedChars[i] === ch;
        chars.push(
          <span key={i} className={correct ? 'text-emerald-700 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>
            {display}
          </span>
        );
      } else if (i === typedChars.length) {
        chars.push(
          <span key={i} ref={cursorRef} className="text-foreground border-b-2 border-primary bg-primary/20">
            {ch === '\n' ? <span className="inline-block w-1">{' '}</span> : display}
          </span>
        );
        if (ch === '\n') chars.push(<br key={`br-${i}`} />);
      } else {
        chars.push(
          <span key={i} className="text-muted-foreground/70">
            {display}
          </span>
        );
      }
    }
    return chars;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col text-foreground overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4 sm:p-5 md:p-6">

        {/* Left panel — code editor */}
        <div className="relative flex w-full md:w-1/2 min-h-[200px]">
          <textarea
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            disabled={isActive}
            placeholder={`Paste your code here...\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}`}
            spellCheck={false}
            className="w-full h-full p-4 pb-14 rounded-lg border border-border bg-card text-foreground text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground/50 whitespace-pre disabled:opacity-60"
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center">
            <button
              onClick={toggleStartStop}
              disabled={!isActive && !codeText.trim()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                isActive
                  ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:bg-red-500/15 dark:hover:bg-red-500/25'
                  : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25'
              }`}
            >
              {isActive ? <><Square className="size-2.5 fill-current" /> Stop</> : <><Play className="size-2.5 fill-current" /> Start</>}
            </button>

            {isActive && (
              <Button variant="ghost" size="icon-sm" onClick={resetTest} aria-label="Restart"
                className="ml-auto text-muted-foreground hover:text-foreground">
                <RotateCcw className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right panel — typing area */}
        <div
          ref={typingRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative flex flex-col w-full md:w-1/2 min-h-[200px] rounded-lg border border-border bg-muted/20 p-4 overflow-auto focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          {!isActive ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground/50 text-sm">Your code will appear here</p>
            </div>
          ) : (
            <>
              <pre className="font-mono text-sm leading-relaxed select-none whitespace-pre-wrap wrap-break-word">
                {renderSourceText()}
                {isDone && (
                  <span className="inline-block w-0.5 h-4 bg-primary align-middle ml-px" aria-hidden />
                )}
              </pre>

              {hasStarted && (
                <div className="mt-auto pt-3 flex items-center justify-center gap-4 text-xs tabular-nums shrink-0">
                  <span className="text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{correctCount}</span>
                    {' / '}
                    <span className="text-red-600 dark:text-red-400 font-medium">{incorrectCount}</span>
                  </span>
                  {totalKeystrokes > 0 && (
                    <span className="text-muted-foreground/70">{accuracy}% accuracy</span>
                  )}
                  {isDone && (
                    <span className="text-primary font-medium">Complete</span>
                  )}
                </div>
              )}

              {!hasStarted && (
                <p className="mt-auto pt-3 text-muted-foreground/50 text-xs text-center shrink-0">Start typing to begin</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
