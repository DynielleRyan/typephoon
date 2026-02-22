import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Play, Square, ChevronDown } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++' },
  { id: 'csharp', label: 'C#' },
  { id: 'go', label: 'Go' },
  { id: 'rust', label: 'Rust' },
  { id: 'css', label: 'CSS' },
  { id: 'sql', label: 'SQL' },
  { id: 'bash', label: 'Bash' },
  { id: 'json', label: 'JSON' },
  { id: 'markup', label: 'HTML' },
] as const;

const TOKEN_COLORS: Record<string, string> = {
  keyword:       'text-purple-500 dark:text-purple-400',
  builtin:       'text-purple-500 dark:text-purple-400',
  'class-name':  'text-cyan-600 dark:text-cyan-400',
  function:      'text-blue-600 dark:text-blue-400',
  string:        'text-emerald-600 dark:text-emerald-400',
  'template-string': 'text-emerald-600 dark:text-emerald-400',
  number:        'text-amber-600 dark:text-amber-400',
  boolean:       'text-amber-600 dark:text-amber-400',
  comment:       'text-muted-foreground/50 italic',
  operator:      'text-pink-500 dark:text-pink-400',
  punctuation:   'text-muted-foreground/80',
  'attr-name':   'text-amber-600 dark:text-amber-400',
  'attr-value':  'text-emerald-600 dark:text-emerald-400',
  tag:           'text-red-500 dark:text-red-400',
  selector:      'text-purple-500 dark:text-purple-400',
  property:      'text-blue-600 dark:text-blue-400',
  regex:         'text-amber-600 dark:text-amber-400',
  constant:      'text-amber-600 dark:text-amber-400',
  parameter:     'text-orange-500 dark:text-orange-400',
};

function buildSyntaxMap(code: string, langId: string): string[] {
  const grammar = Prism.languages[langId];
  if (!grammar) return Array(code.length).fill('');

  const map: string[] = [];
  const tokens = Prism.tokenize(code, grammar);

  function walk(items: Array<string | Prism.Token>) {
    for (const item of items) {
      if (typeof item === 'string') {
        for (let i = 0; i < item.length; i++) map.push('');
      } else {
        const cls = TOKEN_COLORS[item.type] ?? '';
        if (typeof item.content === 'string') {
          for (let i = 0; i < item.content.length; i++) map.push(cls);
        } else if (Array.isArray(item.content)) {
          const before = map.length;
          walk(item.content);
          if (cls) {
            for (let i = before; i < map.length; i++) {
              if (!map[i]) map[i] = cls;
            }
          }
        }
      }
    }
  }
  walk(tokens);
  return map;
}

export default function DevPage() {
  const [codeText, setCodeText] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [typedChars, setTypedChars] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const typingRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const isActive = sourceText.length > 0;
  const isDone = isActive && typedChars.length >= sourceText.length;
  const charIndex = typedChars.length;
  const totalKeystrokes = correctCount + incorrectCount;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctCount / totalKeystrokes) * 100) : 0;

  const syntaxMap = useMemo(
    () => isActive ? buildSyntaxMap(sourceText, language) : [],
    [sourceText, language, isActive],
  );

  useEffect(() => {
    if (cursorRef.current)
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [charIndex]);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node))
        setLangMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

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
    if (e.key === 'Enter') typed = '\n';
    else if (e.key === 'Tab') typed = '\t';
    else if (e.key.length === 1) typed = e.key;
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
      const syntaxCls = syntaxMap[i] || '';

      if (i < typedChars.length) {
        const correct = typedChars[i] === ch;
        chars.push(
          <span key={i} className={correct
            ? `text-emerald-700 dark:text-emerald-400`
            : 'bg-red-500/20 text-red-600 dark:text-red-400'
          }>
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
          <span key={i} className={syntaxCls || 'text-muted-foreground/70'}>
            {display}
          </span>
        );
      }
    }
    return chars;
  }

  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  return (
    <div className="flex-1 min-h-0 flex flex-col text-foreground overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4 sm:p-5 md:p-6">

        {/* Left panel */}
        <div className="relative flex flex-col w-full md:w-1/2 min-h-0 flex-1 rounded-lg border border-border bg-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
            {/* Language picker */}
            <div className="relative" ref={langMenuRef}>
              <button
                onClick={() => setLangMenuOpen((o) => !o)}
                disabled={isActive}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {currentLang.label}
                <ChevronDown className="size-3" />
              </button>
              {langMenuOpen && !isActive && (
                <div className="absolute top-full left-0 mt-1 z-50 w-36 max-h-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      className={`flex w-full items-center rounded-sm px-2 py-1.5 text-xs transition-colors ${
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

            <div className="flex-1" />

            {isActive && (
              <button onClick={resetTest} aria-label="Restart"
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors">
                <RotateCcw className="size-3.5" />
              </button>
            )}

            <button
              onClick={toggleStartStop}
              disabled={!isActive && !codeText.trim()}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                isActive
                  ? 'bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400 dark:bg-red-500/15 dark:hover:bg-red-500/25'
                  : 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25'
              }`}
            >
              {isActive ? <><Square className="size-2.5 fill-current" /> Stop</> : <><Play className="size-2.5 fill-current" /> Start</>}
            </button>
          </div>

          {/* Textarea */}
          <textarea
            value={codeText}
            onChange={(e) => setCodeText(e.target.value)}
            disabled={isActive}
            placeholder={`Paste your code here...\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}`}
            spellCheck={false}
            className="flex-1 p-4 text-foreground text-sm font-mono leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40 bg-transparent whitespace-pre disabled:opacity-60"
          />
        </div>

        {/* Right panel — typing area */}
        <div
          ref={typingRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="relative flex flex-col w-full md:w-1/2 min-h-[200px] flex-1 rounded-lg border border-border bg-muted/20 p-4 overflow-auto focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          {!isActive ? (
            <div className="flex-1 min-h-0 flex items-center justify-center text-center px-2">
              <p className="text-muted-foreground/50 text-sm">Your code will appear here with syntax highlighting</p>
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

      <blockquote className="px-6 py-3 text-center">
        <p className="text-muted-foreground/40 text-xs italic leading-relaxed max-w-xl mx-auto">
          "Developing a strong mind-muscle connection with the hands through repeatedly writing or typing concepts enhances retention and supports more effective learning."
        </p>
        <footer className="mt-1 text-muted-foreground/30 text-[10px]">— Ma'am P.</footer>
      </blockquote>
    </div>
  );
}
