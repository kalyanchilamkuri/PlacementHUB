'use client';

import { Moon, Sun } from 'lucide-react';

/**
 * The theme lives on <html data-theme>, so this button owns no React state —
 * CSS picks the right icon and label, and there is nothing to hydrate.
 */
export function ThemeToggle() {
  const flip = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('iiitl-theme', next);
    } catch {
      // Private browsing; the choice just will not persist.
    }
  };

  return (
    <button
      onClick={flip}
      className="grid size-9 place-items-center rounded-[10px] border border-line text-muted transition-colors hover:border-blue hover:text-blue"
    >
      <Sun size={18} className="when-dark" aria-hidden />
      <Moon size={18} className="when-light" aria-hidden />
      <span className="sr-only when-dark">Switch to the light theme</span>
      <span className="sr-only when-light">Switch to the dark theme</span>
    </button>
  );
}
