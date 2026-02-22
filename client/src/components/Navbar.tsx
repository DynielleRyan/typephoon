import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';
import { User, Sun, Moon } from 'lucide-react';
import WhirlwindLogo from '@/components/WhirlwindLogo';

const NAV_LINKS = [
  { to: '/', label: 'Practice' },
  { to: '/notes', label: 'Notebook' },
  { to: '/dev', label: 'Code' },
] as const;

export default function Navbar() {
  const { pathname } = useLocation();
  const { isDark, toggle } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="border-b border-border/40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-foreground/90">
            <WhirlwindLogo showText className="h-6 sm:h-7 w-auto" />
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  pathname === to
                    ? 'text-foreground bg-accent/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Account"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <User className="size-5" />
            </Button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-lg border border-border bg-popover p-3 shadow-lg">
                <p className="text-xs text-muted-foreground text-center">Work in progress</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
