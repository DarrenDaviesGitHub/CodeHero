import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function KeyCap({ children }: { children: ReactNode }) {
  return <kbd className="keycap">{children}</kbd>;
}

/**
 * The game is driven by the keyboard, so mouse clicks must never leave a
 * button focused (Enter/Space would then trigger it a second time).
 */
export function NoFocusButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} {...props} />;
}
