import { combineLatest, Observable, Subscription } from "rxjs";

export function effect<T extends readonly unknown[]>(
  fn: (...args: T) => void,
  deps: [...{ [K in keyof T]: Observable<T[K]> }],
): Subscription {
  return combineLatest(deps).subscribe((values) =>
    fn(...(values as unknown as T)),
  );
}
