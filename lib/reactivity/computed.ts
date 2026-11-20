import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  isObservable,
  map,
} from "rxjs";
import {
  getActiveListener,
  setActiveListener,
  type ReadonlySignal,
  type SignalOptions,
} from "./signal";

function areSetsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

export function computed<T>(
  fn: () => T,
  options?: SignalOptions<T>,
): ReadonlySignal<T>;

export function computed<T, R>(
  source: Observable<T>,
  fn: (val: T) => R,
  options?: SignalOptions<R>,
): ReadonlySignal<R>;

export function computed<T extends readonly unknown[], R>(
  sources: [...{ [K in keyof T]: Observable<T[K]> }],
  fn: (values: T) => R,
  options?: SignalOptions<R>,
): ReadonlySignal<R>;

export function computed<T>(
  source: Observable<T>,
  options?: SignalOptions<T>,
): ReadonlySignal<T>;

export function computed<T>(...args: unknown[]): ReadonlySignal<T> {
  if (typeof args[0] === "function" && !isObservable(args[0])) {
    const computeFn = args[0] as () => T;
    const options = args[1] as SignalOptions<T> | undefined;
    const equals =
      options?.equals === false
        ? null
        : typeof options?.equals === "function"
          ? options.equals
          : Object.is;

    let currentDeps = new Set<Observable<unknown>>();
    let depSub: Subscription | null = null;
    let isEvaluating = false;

    const initialDeps = new Set<Observable<unknown>>();
    const prevListener = getActiveListener();
    setActiveListener(initialDeps);
    let initialValue: T;
    try {
      initialValue = computeFn();
    } finally {
      setActiveListener(prevListener);
    }

    const subj = new BehaviorSubject<T>(initialValue);

    function updateSubscriptions(nextDeps: Set<Observable<unknown>>) {
      if (areSetsEqual(currentDeps, nextDeps)) return;
      currentDeps = nextDeps;

      if (depSub) {
        depSub.unsubscribe();
        depSub = null;
      }

      if (nextDeps.size === 0) return;

      const sub = new Subscription();
      for (const dep of nextDeps) {
        let isSync = true;
        sub.add(
          dep.subscribe({
            next: () => {
              if (isSync) return;
              evaluate();
            },
          }),
        );
        isSync = false;
      }
      depSub = sub;
    }

    function evaluate() {
      if (isEvaluating) return;
      isEvaluating = true;
      const nextDeps = new Set<Observable<unknown>>();
      const prev = getActiveListener();
      setActiveListener(nextDeps);
      let val: T;
      try {
        val = computeFn();
      } finally {
        setActiveListener(prev);
        isEvaluating = false;
      }

      updateSubscriptions(nextDeps);

      if (equals && equals(subj.value, val)) return;
      subj.next(val);
    }

    updateSubscriptions(initialDeps);

    function sig(): T {
      const listener = getActiveListener();
      if (listener) {
        listener.add(sig as unknown as Observable<unknown>);
      }
      return subj.value;
    }

    Object.setPrototypeOf(sig, Observable.prototype);
    (sig as unknown as Record<string, unknown>).source = subj;

    Object.defineProperty(sig, "value", {
      get: () => subj.value,
      enumerable: true,
    });

    return sig as unknown as ReadonlySignal<T>;
  }

  let stream$: Observable<T>;
  let initialValue: T | undefined;
  let options: SignalOptions<T> | undefined;

  if (isObservable(args[0])) {
    if (typeof args[1] === "function") {
      const source = args[0] as Observable<unknown>;
      const mapper = args[1] as (val: unknown) => T;
      options = args[2] as SignalOptions<T> | undefined;

      stream$ = source.pipe(map((val) => mapper(val)));
    } else {
      stream$ = args[0] as Observable<T>;
      options = args[1] as SignalOptions<T> | undefined;
    }
  } else if (Array.isArray(args[0])) {
    const sources = args[0] as Observable<unknown>[];
    const mapper = args[1] as (values: unknown[]) => T;
    options = args[2] as SignalOptions<T> | undefined;

    stream$ = combineLatest(sources).pipe(map((vals) => mapper(vals)));
  } else {
    throw new Error("[reax] Invalid arguments passed to computed()");
  }

  const equals =
    options?.equals === false
      ? null
      : typeof options?.equals === "function"
        ? options.equals
        : Object.is;

  let firstVal: T = initialValue as T;
  let subj: BehaviorSubject<T>;

  stream$.subscribe((next) => {
    if (!subj) {
      firstVal = next;
    } else {
      if (equals && equals(subj.value, next)) return;
      subj.next(next);
    }
  });

  subj = new BehaviorSubject<T>(firstVal);

  function sig(): T {
    const listener = getActiveListener();
    if (listener) {
      listener.add(sig as unknown as Observable<unknown>);
    }
    return subj.value;
  }

  Object.setPrototypeOf(sig, Observable.prototype);
  (sig as unknown as Record<string, unknown>).source = subj;

  Object.defineProperty(sig, "value", {
    get: () => subj.value,
    enumerable: true,
  });

  return sig as unknown as ReadonlySignal<T>;
}
