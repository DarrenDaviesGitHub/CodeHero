import type { Language } from './logic/keywords';
import type { SessionSnapshot } from './logic/session';

export interface StartOptions {
  readonly languages: readonly Language[];
}

export interface GameOverSummary extends SessionSnapshot {
  readonly durationSeconds: number;
}

export interface GameEvents {
  start: StartOptions;
  pause: void;
  resume: void;
  quit: void;
  ready: void;
  hud: SessionSnapshot;
  levelUp: number;
  gameOver: GameOverSummary;
}

type Handler<T> = (payload: T) => void;

export class EventBus<E extends object> {
  private readonly handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) this.handlers.set(event, (set = new Set()));
    set.add(handler as Handler<never>);
    return () => set.delete(handler as Handler<never>);
  }

  emit<K extends keyof E>(event: K, ...payload: E[K] extends void ? [] : [E[K]]): void {
    for (const h of this.handlers.get(event) ?? []) (h as Handler<E[K] | undefined>)(payload[0]);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const gameBus = new EventBus<GameEvents>();
