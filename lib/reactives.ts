import { BehaviorSubject, combineLatest, Observable, Subscription } from "rxjs";

export type Signal<T> = Observable<T> & {
  get value(): T;
  set(v: T): void;
};

export function signal<T>(initial: T): Signal<T> {
  const $ = new BehaviorSubject<T>(initial);
  const obs = $.asObservable() as any;

  Object.defineProperty(obs, "value", {
    get: () => $.value,
  });
  obs.set = (v: T) => $.next(v);

  return obs as Signal<T>;
}

export function effect<T extends unknown[]>(
  fn: (...args: T) => void,
  deps: [...{ [K in keyof T]: Observable<T[K]> }],
): Subscription {
  return combineLatest(deps).subscribe((values) =>
    fn(...(values as unknown as T)),
  );
}
