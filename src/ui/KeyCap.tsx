import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function KeyCap({ children }: { children: ReactNode }) {
  return <kbd className="keycap">{children}</kbd>;
}

export function NoFocusButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} {...props} />;
}
