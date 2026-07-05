import { BehaviorSubject, combineLatest, Observable, Subscription } from "rxjs";

export function signal<T>(
  initial: T,
): [Observable<T>, (v: T) => void, () => T] {
  const $ = new BehaviorSubject<T>(initial);
  return [$.asObservable(), (v: T) => $.next(v), () => $.value];
}

export function effect<T extends unknown[]>(
  fn: (...args: T) => void,
  deps: [...{ [K in keyof T]: Observable<T[K]> }],
): Subscription {
  return combineLatest(deps).subscribe((values) =>
    fn(...(values as unknown as T)),
  );
}
