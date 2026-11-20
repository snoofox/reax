# API Reference

Complete TypeScript reference for all functions, components, props, and types exported by `@snoofox/reax`.

---

## Reactivity

### `signal<T>(initialValue: T, options?: SignalOptions<T>): Signal<T>`

Creates a writable reactive cell.

```ts
import { signal, type Signal, type SignalOptions } from "@snoofox/reax";

const count = signal(0);
```

#### Parameters
- `initialValue: T`: The initial value.
- `options?: SignalOptions<T>`:
  - `equals?: false | ((prev: T, next: T) => boolean)`
    - Defaults to `Object.is`.
    - If `false`, deduplication is disabled and the signal emits on every write.
    - If a function is provided, it receives `(prev, next)` and emits only when it returns `false`.

#### Methods on `Signal<T>`
- **Read**: `count()` returns the current value `T`.
- **Write**: `count(nextValue)` sets the value directly.
- **Update**: `count((prev: T) => nextValue)` updates based on the previous value.
- **Stream**: `Signal<T>` implements RxJS `Observable<T>`. Supports `.pipe()`, `.subscribe()`, and direct embedding in JSX.

---

### `computed`

Creates a read-only derived signal. Updates only when upstream dependencies emit new values.

```ts
// 1. Auto-tracking (Dynamic Dependency Tracking)
function computed<T>(
  getter: () => T,
  options?: SignalOptions<T>
): ReadonlySignal<T>;

// 2. Single-source mapping
function computed<T, R>(
  source: Observable<T>,
  mapFn: (value: T) => R,
  options?: SignalOptions<R>
): ReadonlySignal<R>;

// 3. Multi-source combination
function computed<T extends readonly Observable<unknown>[], R>(
  sources: [...T],
  mapFn: (...values: any[]) => R,
  options?: SignalOptions<R>
): ReadonlySignal<R>;
```

#### Returns
- `ReadonlySignal<T>`:
  - **Read**: `fn()` returns the current computed value.
  - **Stream**: Implements RxJS `Observable<T>`.

---

## Rendering & Lifecycle

### `render(vnode: JSXNode, container: ParentNode): Cleanup`

Mounts a Reax component tree into a DOM container element.

```ts
import { render } from "@snoofox/reax";

const cleanup = render(<App />, document.getElementById("root")!);
```

- Mounts the component synchronously.
- Returns a `Cleanup` function `() => void`. Calling it tears down the entire tree: removes all created DOM nodes, unsubscribes all active stream subscriptions, and triggers `onUnmount` callbacks.

---

### `onMount(fn: () => void | Cleanup): void`

Registers a callback that runs immediately after the component's DOM elements are attached to the document.

```ts
import { onMount } from "@snoofox/reax";

onMount(() => {
  console.log("DOM nodes mounted");

  // Optional: return a teardown function
  return () => {
    console.log("Cleanup from mount");
  };
});
```

---

### `onUnmount(fn: Cleanup): void`

Registers a teardown callback that runs when the component is removed from the DOM.

```ts
import { onUnmount } from "@snoofox/reax";

onUnmount(() => {
  console.log("Component unmounted");
});
```

---

## Control Flow Components

### `<Show>`

Conditionally mounts a DOM branch based on an Observable or static condition.

```tsx
interface ShowProps {
  when: Observable<any> | any;
  fallback?: JSXNode;
  children: JSXNode;
}

<Show when={isLoggedIn$} fallback={<Login />}>
  <Dashboard />
</Show>
```

- When `when` is truthy, renders `children`.
- When `when` is falsy (`false`, `null`, `undefined`, `0`, `""`), renders `fallback`.
- Automatically disposes internal subscriptions and elements when switching branches.

---

### `<For>`

Renders an array with keyed DOM element reuse.

```tsx
type KeyFn<T> = (item: T, index: number) => unknown;

interface ForProps<T> {
  each: Observable<T[]> | T[];
  by?: KeyFn<T> | (T extends object ? keyof T : never) | string;
  fallback?: JSXNode;
  children: (item: T, index$: Observable<number>) => JSXNode;
}

<For each={items$} by="id" fallback={<p>No items</p>}>
  {(item, index$) => (
    <li>#{index$} - {item.name}</li>
  )}
</For>
```

#### The `by` Key
- **String**: `by="id"` accesses `item.id`.
- **Function**: `by={(item, index) => item.uuid}`.
- **Omitted**: Defaults to index-based reconciliation.
- **`index$`**: Passed to children as an `Observable<number>` so position shifts do not recreate the child element.

---

### `<Switch>` & `<Match>`

Pattern-matching control flow for multi-state conditions.

```tsx
interface SwitchProps {
  fallback?: JSXNode;
  children: JSXNode | JSXNode[];
}

interface MatchProps {
  when: Observable<boolean> | boolean;
  children: JSXNode;
}

<Switch fallback={<p>Default fallback</p>}>
  <Match when={computed(() => tab() === "home")}>
    <Home />
  </Match>
  <Match when={computed(() => tab() === "settings")}>
    <Settings />
  </Match>
</Switch>
```

- Evaluates `<Match>` branches in order; mounts the first one whose `when` condition is truthy.
- If none match, mounts `fallback`.

---

### `<ErrorBoundary>`

Intercepts errors thrown during component rendering and errors emitted by reactive streams.

```tsx
interface ErrorBoundaryProps {
  fallback: JSXNode | ((error: unknown, reset: () => void) => JSXNode);
  children: JSXNode;
}

<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {String(error)}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>
```

- Catches synchronous exceptions thrown during child initialization.
- Catches asynchronous stream failures (`subscriber.error(...)`).
- Calling `reset()` clears the error and attempts to remount children.

---

## Context API

### `createContext<T>(defaultValue?: T): Context<T>`

Creates a scoped context object.

```ts
interface Context<T> {
  id: symbol;
  defaultValue: T | undefined;
  Provider: (props: { value: T; children?: JSXNode }) => JSXNode;
}

const ThemeContext = createContext<"light" | "dark">("light");
```

---

### `useContext<T>(context: Context<T>): T`

Reads the nearest value from an ancestor `<Context.Provider>`. If no provider exists, returns `defaultValue`.

```tsx
function Child() {
  const theme = useContext(ThemeContext);
  return <div class={theme}>Content</div>;
}
```

---

## DOM Attributes & Props

Reax binds standard HTML and SVG attributes directly to native DOM elements.

### `classList`
Solid-style reactive class toggling. Accepts an object where keys are class names and values are booleans or boolean Observables:

```tsx
<div
  classList={{
    "btn": true,
    "btn-active": isActive$,
    "px-4 py-2 font-bold": true, // Space-separated tokens are automatically split
  }}
/>
```

### `style`
Accepts standard CSS strings or style objects:
- Numbers automatically get `px` appended (except for unitless CSS properties like `zIndex`, `opacity`, `flex`, etc.).
- CSS variables are supported: `{ "--theme-color": color$ }`.
- Property values can be reactive `Observable` streams.

```tsx
<div
  style={{
    display: "flex",
    opacity: opacity$, // Reactive stream
    zIndex: 10,        // Unitless property preserved as 10
    width: 200,        // Converted to "200px"
  }}
/>
```

### `ref`
Captures the underlying native DOM element:
- **Callback ref**: `ref={(el) => (myElement = el)}` (called with `null` on unmount).
- **Object ref**: `ref={myRef}` with a `.current` property or `.set()` method.

```tsx
let inputEl: HTMLInputElement | null = null;

<input ref={(el) => (inputEl = el)} />
```

### `dangerouslySetInnerHTML`
Sets raw HTML content:

```tsx
<div dangerouslySetInnerHTML={{ __html: "<p>Raw HTML</p>" }} />
```

### Event Handlers
All standard `on<Event>` handlers are supported (`onClick`, `onInput`, `onChange`, `onKeyDown`, etc.). Handlers receive standard native browser events.

---

## Re-exported RxJS

Reax re-exports all RxJS primitives and operators. You do not need to install or import from `rxjs` separately:

```ts
import {
  Observable,
  Subject,
  BehaviorSubject,
  map,
  filter,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  combineLatest,
  merge,
  fromEvent,
  interval,
} from "@snoofox/reax";
```
