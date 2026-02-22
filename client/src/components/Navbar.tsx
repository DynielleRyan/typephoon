import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User, Sun, Moon } from "lucide-react";

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const NAV_LINKS = [
  { to: "/", label: "Type" },
  { to: "/notes", label: "Notes" },
  { to: "/dev", label: "Dev" },
] as const;

const Navbar = ({ isDark, onToggleTheme }: NavbarProps) => {
    const { pathname } = useLocation();

    return(
      <header className="border-b border-border/40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg sm:text-xl font-semibold tracking-tight text-foreground hover:text-foreground/90">
              Typephoon
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    pathname === to
                      ? "text-foreground bg-accent/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
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
              onClick={onToggleTheme}
            >
              {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Account">
              <User className="size-5" />
            </Button>
          </div>
        </div>
      </header>
    )
}

export default Navbar;
