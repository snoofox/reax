import { BehaviorSubject, Observable } from "rxjs";

export type Signal<T> = Observable<T> & {
  get value(): T;
  set(v: T): void;
};

export function signal<T>(initial: T): Signal<T> {
  const subject = new BehaviorSubject<T>(initial);
  const observable = subject.asObservable();

  const sig = Object.defineProperties(observable, {
    value: {
      get(): T {
        return subject.value;
      },
      enumerable: true,
      configurable: true,
    },
    set: {
      value(v: T): void {
        subject.next(v);
      },
      writable: false,
      enumerable: true,
      configurable: true,
    },
  });

  return sig as unknown as Signal<T>;
}
