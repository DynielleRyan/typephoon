import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  RotateCcw, Play, Square, Bold, Italic, ChevronDown, List, ListOrdered, Code, Minus,
} from 'lucide-react';

// --- Markdown parsing ---

interface Segment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

interface ParsedLine {
  segments: Segment[];
  heading?: 1 | 2 | 3 | 4 | 5 | 6;
  bullet?: boolean;
  numbered?: number;
  hr?: boolean;
}

function parseInline(raw: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(raw)) !== null) {
    if (m.index > last) segments.push({ text: raw.slice(last, m.index) });
    if (m[2]) segments.push({ text: m[2], bold: true, italic: true });
    else if (m[3]) segments.push({ text: m[3], bold: true });
    else if (m[4]) segments.push({ text: m[4], italic: true });
    else if (m[5]) segments.push({ text: m[5], code: true });
    last = m.index + m[0].length;
  }
  if (last < raw.length) segments.push({ text: raw.slice(last) });
  if (segments.length === 0) segments.push({ text: '' });
  return segments;
}

function parseMarkdown(source: string): ParsedLine[] {
  return source.split('\n').map((raw) => {
    if (/^---+$/.test(raw.trim())) return { segments: [{ text: '---' }], hr: true };
    const heading = raw.match(/^(#{1,6}) (.+)/);
    if (heading) {
      const level = heading[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      return { segments: parseInline(heading[2]), heading: level };
    }
    const bullet = raw.match(/^[-*] (.+)/);
    if (bullet) return { segments: parseInline(bullet[1]), bullet: true };
    const numbered = raw.match(/^(\d+)\. (.+)/);
    if (numbered) return { segments: parseInline(numbered[2]), numbered: parseInt(numbered[1]) };
    return { segments: parseInline(raw) };
  });
}

function normalizeTypeable(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ');
}

function plainTextFromLines(lines: ParsedLine[]): string {
  const raw = lines.map((line) => {
    const prefix = line.bullet ? '- ' : line.numbered ? `${line.numbered}. ` : '';
    return prefix + line.segments.map((s) => s.text).join('');
  }).join('\n');
  return normalizeTypeable(raw);
}

// --- Toolbar helper ---

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  setText: (v: string) => void,
) {
  const { selectionStart: s, selectionEnd: e, value } = textarea;
  const selected = value.slice(s, e);
  const newVal = value.slice(0, s) + before + selected + after + value.slice(e);
  setText(newVal);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.selectionStart = s + before.length;
    textarea.selectionEnd = e + before.length;
  });
}

function prefixLine(
  textarea: HTMLTextAreaElement,
  prefix: string,
  setText: (v: string) => void,
) {
  const { selectionStart: s, value } = textarea;
  const lineStart = value.lastIndexOf('\n', s - 1) + 1;
  const newVal = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setText(newVal);
  requestAnimationFrame(() => {
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = s + prefix.length;
  });
}

// --- Component ---

export default function NotesPage() {
  const [noteText, setNoteText] = useState('');
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [plainSource, setPlainSource] = useState('');
  const [typedChars, setTypedChars] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  const isActive = plainSource.length > 0;
  const isDone = isActive && typedChars.length >= plainSource.length;
  const charIndex = typedChars.length;

  const totalKeystrokes = correctCount + incorrectCount;
  const accuracy = totalKeystrokes > 0 ? Math.round((correctCount / totalKeystrokes) * 100) : 0;

  useEffect(() => {
    if (cursorRef.current)
      cursorRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [charIndex]);

  function toggleStartStop() {
    if (isActive) {
      setLines([]);
      setPlainSource('');
      setTypedChars('');
      setCorrectCount(0);
      setIncorrectCount(0);
      setHasStarted(false);
      textareaRef.current?.focus();
    } else {
      const trimmed = noteText.trimEnd();
      if (!trimmed) return;
      const parsed = parseMarkdown(trimmed);
      setLines(parsed);
      setPlainSource(plainTextFromLines(parsed));
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
      const pos = typedChars.length - 1;
      const wasCorrect = typedChars[pos] === plainSource[pos];
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

    const expected = plainSource[charIndex];
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

  // Render formatted text with per-character typing state
  function renderTypingArea() {
    const nodes: React.ReactNode[] = [];
    let globalIdx = 0;

    lines.forEach((line, lineIdx) => {
      if (lineIdx > 0) {
        // Render the newline character
        const ch = '\n';
        const i = globalIdx++;
        if (i < typedChars.length) {
          nodes.push(<span key={`nl-${i}`} className={typedChars[i] === ch ? 'text-emerald-700 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}>{'\n'}</span>);
        } else if (i === typedChars.length) {
          nodes.push(<span key={`nl-${i}`} ref={cursorRef} className="text-foreground border-b-2 border-primary bg-primary/20"><span className="inline-block w-1">{' '}</span></span>);
          nodes.push(<br key={`br-${i}`} />);
        } else {
          nodes.push(<span key={`nl-${i}`} className="text-muted-foreground/70">{'\n'}</span>);
        }
      }

      // Line wrapper with formatting classes
      const headingClasses: Record<number, string> = {
        1: 'text-2xl font-bold',
        2: 'text-xl font-bold',
        3: 'text-lg font-semibold',
        4: 'text-base font-semibold',
        5: 'text-sm font-semibold',
        6: 'text-xs font-semibold uppercase tracking-wide',
      };
      const headingClass = line.heading ? headingClasses[line.heading] ?? '' : '';
      const linePrefix = line.bullet ? '- ' : line.numbered ? `${line.numbered}. ` : '';

      const lineChars: React.ReactNode[] = [];

      // Render prefix (bullet / number)
      for (const prefixChar of linePrefix) {
        const i = globalIdx++;
        lineChars.push(renderChar(i, prefixChar, {}));
      }

      // Render segments
      for (const seg of line.segments) {
        for (const ch of seg.text) {
          const i = globalIdx++;
          lineChars.push(renderChar(i, ch, seg));
        }
      }

      if (line.hr) {
        nodes.push(<span key={`line-${lineIdx}`} className="block border-b border-border my-1">{lineChars}</span>);
      } else {
        nodes.push(<span key={`line-${lineIdx}`} className={`${headingClass}`}>{lineChars}</span>);
      }
    });

    return nodes;
  }

  function renderChar(i: number, ch: string, seg: Partial<Segment>) {
    const fmtClass = [
      seg.bold ? 'font-bold' : '',
      seg.italic ? 'italic' : '',
      seg.code ? 'bg-muted/60 px-0.5 rounded-sm font-mono' : '',
    ].filter(Boolean).join(' ');

    if (i < typedChars.length) {
      const correct = typedChars[i] === plainSource[i];
      return (
        <span key={i} className={`${fmtClass} ${correct ? 'text-emerald-700 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
          {ch}
        </span>
      );
    }
    if (i === typedChars.length) {
      return (
        <span key={i} ref={cursorRef} className={`${fmtClass} text-foreground border-b-2 border-primary bg-primary/20`}>
          {ch}
        </span>
      );
    }
    return (
      <span key={i} className={`${fmtClass} text-muted-foreground/70`}>
        {ch}
      </span>
    );
  }

  const [headingOpen, setHeadingOpen] = useState(false);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node))
        setHeadingOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const ta = textareaRef.current;

  return (
    <div className="flex-1 min-h-0 flex flex-col text-foreground overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 p-4 sm:p-5 md:p-6">

        {/* Left panel — editor with toolbar */}
        <div className="flex flex-col w-full md:w-1/2 min-h-[200px] rounded-lg border border-border bg-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/30 shrink-0 flex-wrap">
            <Button variant="ghost" size="icon-xs" aria-label="Bold" disabled={isActive}
              onClick={() => ta && wrapSelection(ta, '**', '**', setNoteText)}>
              <Bold className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Italic" disabled={isActive}
              onClick={() => ta && wrapSelection(ta, '*', '*', setNoteText)}>
              <Italic className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Code" disabled={isActive}
              onClick={() => ta && wrapSelection(ta, '`', '`', setNoteText)}>
              <Code className="size-3.5" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <div className="relative" ref={headingMenuRef}>
              <Button variant="ghost" size="xs" aria-label="Heading" disabled={isActive}
                onClick={() => setHeadingOpen((o) => !o)}
                className="gap-0.5 px-1.5 text-xs font-semibold">
                H<ChevronDown className="size-2.5" />
              </Button>
              {headingOpen && !isActive && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-40 rounded-md border border-border bg-popover p-1 shadow-md">
                  {([1, 2, 3, 4, 5, 6] as const).map((level) => (
                    <button
                      key={level}
                      className="flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left hover:bg-accent hover:text-accent-foreground transition-colors whitespace-nowrap"
                      onClick={() => {
                        if (ta) prefixLine(ta, '#'.repeat(level) + ' ', setNoteText);
                        setHeadingOpen(false);
                      }}
                    >
                      <span className="text-muted-foreground text-xs font-mono w-5 shrink-0">H{level}</span>
                      <span className={
                        level === 1 ? 'text-base font-bold' :
                        level === 2 ? 'text-sm font-bold' :
                        level === 3 ? 'text-sm font-semibold' :
                        level === 4 ? 'text-xs font-semibold' :
                        level === 5 ? 'text-xs font-medium' :
                        'text-xs font-medium text-muted-foreground'
                      }>
                        Heading {level}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon-xs" aria-label="Bullet list" disabled={isActive}
              onClick={() => ta && prefixLine(ta, '- ', setNoteText)}>
              <List className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Numbered list" disabled={isActive}
              onClick={() => ta && prefixLine(ta, '1. ', setNoteText)}>
              <ListOrdered className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label="Horizontal rule" disabled={isActive}
              onClick={() => ta && prefixLine(ta, '---\n', setNoteText)}>
              <Minus className="size-3.5" />
            </Button>

            <div className="flex-1" />

            {isActive && (
              <Button variant="ghost" size="icon-xs" onClick={resetTest} aria-label="Restart"
                className="text-muted-foreground hover:text-foreground mr-2">
                <RotateCcw className="size-3" />
              </Button>
            )}

            <button
              onClick={toggleStartStop}
              disabled={!isActive && !noteText.trim()}
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
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={"Write your notes here...\n\nUse **bold**, *italic*, `code`\n# Heading\n- Bullet point\n1. Numbered list"}
            className="flex-1 p-4 text-foreground text-sm font-mono leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/40 bg-transparent whitespace-pre"
          />
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
              <p className="text-muted-foreground/50 text-sm">Your formatted text will appear here</p>
            </div>
          ) : (
            <>
              <div className="text-sm leading-relaxed select-none whitespace-pre-wrap wrap-break-word">
                {renderTypingArea()}
                {isDone && (
                  <span className="inline-block w-0.5 h-4 bg-primary align-middle ml-px" aria-hidden />
                )}
              </div>

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
