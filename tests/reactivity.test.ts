import { describe, it, expect, vi } from "vitest";
import { signal, effect, map, combineLatest, isObservable } from "reax";

describe("signal", () => {
  it("initializes with initial value and reads synchronously", () => {
    const count = signal(0);
    expect(count()).toBe(0);
    expect(count.value).toBe(0);
  });

  it("updates value when called with next value", () => {
    const count = signal(10);
    count(20);
    expect(count()).toBe(20);
    expect(count.value).toBe(20);
  });

  it("updates value using an updater function", () => {
    const count = signal(5);
    count((prev) => prev * 3);
    expect(count()).toBe(15);
  });

  it("is recognized as an RxJS Observable", () => {
    const text = signal("hello");
    expect(isObservable(text)).toBe(true);
  });

  it("emits synchronous current value on subscribe and notifies on subsequent updates", () => {
    const count = signal(1);
    const emissions: number[] = [];

    const sub = count.subscribe((val) => emissions.push(val));
    expect(emissions).toEqual([1]);

    count(2);
    count(3);
    expect(emissions).toEqual([1, 2, 3]);

    sub.unsubscribe();
    count(4);
    expect(emissions).toEqual([1, 2, 3]);
  });

  it("pipes with RxJS operators natively", () => {
    const count = signal(2);
    const doubled$ = count.pipe(map((n) => n * 2));
    const emissions: number[] = [];

    doubled$.subscribe((v) => emissions.push(v));
    expect(emissions).toEqual([4]);

    count(5);
    expect(emissions).toEqual([4, 10]);
  });

  it("combines with other signals using combineLatest", () => {
    const first = signal("John");
    const last = signal("Doe");
    const full$ = combineLatest([first, last]).pipe(
      map(([f, l]) => `${f} ${l}`),
    );

    let current = "";
    full$.subscribe((name) => (current = name));
    expect(current).toBe("John Doe");

    first("Jane");
    expect(current).toBe("Jane Doe");

    last("Smith");
    expect(current).toBe("Jane Smith");
  });
});

describe("effect", () => {
  it("executes immediately with initial dependency values", () => {
    const a = signal(1);
    const b = signal(2);
    const fn = vi.fn();

    effect(fn, [a, b]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(1, 2);
  });

  it("re-runs when any dependency updates", () => {
    const count = signal(0);
    let captured = -1;

    effect((c) => {
      captured = c;
    }, [count]);

    expect(captured).toBe(0);

    count(10);
    expect(captured).toBe(10);

    count(20);
    expect(captured).toBe(20);
  });

  it("stops receiving updates after unsubscribe", () => {
    const count = signal(1);
    let captured = 0;

    const sub = effect((c) => {
      captured = c;
    }, [count]);

    expect(captured).toBe(1);

    count(2);
    expect(captured).toBe(2);

    sub.unsubscribe();
    count(3);
    expect(captured).toBe(2);
  });
});
