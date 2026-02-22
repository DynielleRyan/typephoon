import { Github, Linkedin, Briefcase } from 'lucide-react';

const SOCIALS = [
  { href: 'https://github.com/DynielleRyan', icon: Github, label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/dynielle-ryan-1a4267250/', icon: Linkedin, label: 'LinkedIn' },
  { href: 'https://github.com/DynielleRyan', icon: Briefcase, label: 'Portfolio' },
] as const;

export default function Footer() {
  return (
    <footer className="py-3 px-6 border-t border-border/40 grid grid-cols-3 items-center">
      <span className="text-muted-foreground/60 text-xs tracking-wide">
        typephoon@kicest
      </span>

      <span className="text-muted-foreground/60 text-xs tracking-wide text-center">
        &copy; {new Date().getFullYear()} All rights reserved.
      </span>

      <div className="flex items-center gap-3 justify-end">
        {SOCIALS.map(({ href, icon: Icon, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </footer>
  );
}
