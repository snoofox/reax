import { BehaviorSubject, Observable } from "rxjs";

export type SignalOptions<T> = {
  equals?: false | ((prev: T, next: T) => boolean);
};

export type Signal<T> = Observable<T> & {
  (): T;
  (next: T | ((prev: T) => T)): void;
  readonly value: T;
};

export function signal<T>(initial: T, options?: SignalOptions<T>): Signal<T> {
  const subj = new BehaviorSubject<T>(initial);
  const equals =
    options?.equals === false
      ? null
      : typeof options?.equals === "function"
        ? options.equals
        : Object.is;

  function sig(next?: T | ((prev: T) => T)): T | void {
    if (arguments.length === 0) return subj.value;
    const val =
      typeof next === "function"
        ? (next as (prev: T) => T)(subj.value)
        : next;
    if (equals && equals(subj.value, val as T)) return;
    subj.next(val as T);
  }

  Object.setPrototypeOf(sig, Observable.prototype);
  (sig as unknown as Record<string, unknown>).source = subj;

  Object.defineProperty(sig, "value", {
    get: () => subj.value,
    enumerable: true,
  });

  return sig as unknown as Signal<T>;
}
