import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Settings, User } from "lucide-react";

const TEST_MODES = ["time", "words", "quote", "zen", "custom"] as const;

const Navbar = () => {
    return(
        <>
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
<div className="flex items-center gap-8">
  <a href="/" className="text-xl font-semibold tracking-tight text-foreground hover:text-foreground/90">
    Typephoon
  </a>
  <nav className="flex items-center gap-1" aria-label="Test mode">
    {TEST_MODES.map((mode) => (
      <button
        key={mode}
        type="button"
        className={cn(
          "px-3 py-2 text-sm font-medium rounded-md capitalize transition-colors",
          mode === "time"
            ? "text-foreground bg-accent/50"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
        )}
      >
        {mode}
      </button>
    ))}
  </nav>
</div>
<div className="flex items-center gap-1">
  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Account">
    <User className="size-5" />
  </Button>
  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Settings">
    <Settings className="size-5" />
  </Button>
</div>
</header>
</>
    )
}

export default Navbar;
