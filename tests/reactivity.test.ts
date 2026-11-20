import { describe, it, expect } from "vitest";
import {
  signal,
  computed,
  map,
  combineLatest,
  isObservable,
  Subject,
} from "reax";

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

  describe("deduplication & equality", () => {
    it("does not emit when next value is identical by Object.is", () => {
      const count = signal(0);
      const emissions: number[] = [];
      count.subscribe((v) => emissions.push(v));

      count(0);
      count(0);
      expect(emissions).toEqual([0]);

      count(1);
      count(1);
      expect(emissions).toEqual([0, 1]);
    });

    it("treats NaN as equal using Object.is", () => {
      const num = signal(NaN);
      const emissions: number[] = [];
      num.subscribe((v) => emissions.push(v));

      num(NaN);
      expect(emissions).toEqual([NaN]);
    });

    it("allows bypassing deduplication with equals: false", () => {
      const count = signal(0, { equals: false });
      const emissions: number[] = [];
      count.subscribe((v) => emissions.push(v));

      count(0);
      count(0);
      expect(emissions).toEqual([0, 0, 0]);
    });

    it("supports custom comparator function", () => {
      type User = { id: number; name: string };
      const user = signal<User>(
        { id: 1, name: "Alice" },
        { equals: (prev, next) => prev.id === next.id },
      );
      const emissions: User[] = [];
      user.subscribe((v) => emissions.push(v));

      user({ id: 1, name: "Alice Updated" });
      expect(emissions.length).toBe(1);

      user({ id: 2, name: "Bob" });
      expect(emissions.length).toBe(2);
      expect(emissions[1].name).toBe("Bob");
    });
  });
});

describe("computed", () => {
  it("derives value synchronously from a zero-arg getter", () => {
    const count = signal(2);
    const doubled = computed(() => count() * 2);

    expect(doubled()).toBe(4);
    expect(doubled.value).toBe(4);
    expect(isObservable(doubled)).toBe(true);

    count(5);
    expect(doubled()).toBe(10);
    expect(doubled.value).toBe(10);
  });

  it("auto-tracks multiple signal dependencies", () => {
    const first = signal("John");
    const last = signal("Doe");
    const full = computed(() => `${first()} ${last()}`);

    expect(full()).toBe("John Doe");

    first("Jane");
    expect(full()).toBe("Jane Doe");

    last("Smith");
    expect(full()).toBe("Jane Smith");
  });

  it("supports chaining multiple computed signals", () => {
    const num = signal(2);
    const double = computed(() => num() * 2);
    const quad = computed(() => double() * 2);

    expect(double()).toBe(4);
    expect(quad()).toBe(8);

    num(3);
    expect(double()).toBe(6);
    expect(quad()).toBe(12);
  });

  it("supports explicit single observable source and mapper", () => {
    const count = signal(10);
    const halved = computed(count, (c) => c / 2);

    expect(halved()).toBe(5);
    count(20);
    expect(halved()).toBe(10);
  });

  it("supports explicit array of observables and mapper", () => {
    const a = signal(2);
    const b = signal(3);
    const sum = computed([a, b], ([x, y]) => x + y);

    expect(sum()).toBe(5);
    a(10);
    expect(sum()).toBe(13);
    b(20);
    expect(sum()).toBe(30);
  });

  it("starts as undefined for a source that has not emitted yet", () => {
    const source = new Subject<number>();
    const doubled = computed(source, (n) => n * 2);

    expect(doubled()).toBeUndefined();
    source.next(21);
    expect(doubled()).toBe(42);
  });

  it("deduplicates emissions when derived output does not change", () => {
    const count = signal(1);
    const isOdd = computed(() => count() % 2 === 1);
    const emissions: boolean[] = [];

    isOdd.subscribe((v) => emissions.push(v));
    expect(emissions).toEqual([true]);

    count(3);
    count(5);
    expect(emissions).toEqual([true]);

    count(4);
    expect(emissions).toEqual([true, false]);
  });

  it("dynamically updates dependencies when conditional branch changes", () => {
    const showA = signal(true);
    const a = signal("A1");
    const b = signal("B1");

    const text = computed(() => (showA() ? a() : b()));
    expect(text()).toBe("A1");

    a("A2");
    expect(text()).toBe("A2");

    showA(false);
    expect(text()).toBe("B1");

    b("B2");
    expect(text()).toBe("B2");

    a("A3");
    expect(text()).toBe("B2");

    showA(true);
    expect(text()).toBe("A3");
  });

  it("stops listening to stale dependencies after switching branches", () => {
    const cond = signal(true);
    const a = signal(1);
    const b = signal(10);
    let runs = 0;

    const res = computed(() => {
      runs++;
      return cond() ? a() : b();
    });

    expect(runs).toBe(1);
    expect(res()).toBe(1);

    cond(false);
    expect(runs).toBe(2);
    expect(res()).toBe(10);

    a(2);
    a(3);
    expect(runs).toBe(2);
    expect(res()).toBe(10);

    b(20);
    expect(runs).toBe(3);
    expect(res()).toBe(20);
  });
});
