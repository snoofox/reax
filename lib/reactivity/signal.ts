import { BehaviorSubject, Observable } from "rxjs";

let _activeListener: Set<Observable<unknown>> | null = null;

export function getActiveListener(): Set<Observable<unknown>> | null {
  return _activeListener;
}

export function setActiveListener(
  listener: Set<Observable<unknown>> | null,
): void {
  _activeListener = listener;
}

export type SignalOptions<T> = {
  equals?: false | ((prev: T, next: T) => boolean);
};

export type ReadonlySignal<T> = Observable<T> & {
  (): T;
  readonly value: T;
};

export type Signal<T> = Observable<T> & {
  (): T;
  (next: T | ((prev: T) => T)): void;
  readonly value: T;
};

export function attachSignal<T, A extends unknown[], R>(
  sig: (...args: A) => R,
  subj: BehaviorSubject<T>,
): ((...args: A) => R) & ReadonlySignal<T> {
  Object.setPrototypeOf(sig, Observable.prototype);
  (sig as unknown as Record<string, unknown>).source = subj;

  Object.defineProperty(sig, "value", {
    get: () => subj.value,
    enumerable: true,
  });

  return sig as unknown as ((...args: A) => R) & ReadonlySignal<T>;
}

export function signal<T>(initial: T, options?: SignalOptions<T>): Signal<T> {
  const subj = new BehaviorSubject<T>(initial);
  const equals =
    options?.equals === false
      ? null
      : typeof options?.equals === "function"
        ? options.equals
        : Object.is;

  function sig(next?: T | ((prev: T) => T)): T | void {
    if (arguments.length === 0) {
      if (_activeListener) {
        _activeListener.add(sig as unknown as Observable<unknown>);
      }
      return subj.value;
    }
    const val =
      typeof next === "function"
        ? (next as (prev: T) => T)(subj.value)
        : next;
    if (equals && equals(subj.value, val as T)) return;
    subj.next(val as T);
  }

  return attachSignal(sig, subj) as unknown as Signal<T>;
}
