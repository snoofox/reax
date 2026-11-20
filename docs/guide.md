# Reax Guide

This guide covers how to build applications with Reax, from basic reactivity to complex state and async data pipelines.

---

## 1. Components & Reactivity

### The Component Model

In Reax, **a component is a setup function that runs once when mounted**. It constructs the real DOM elements, sets up reactive subscriptions, and never runs again.

```tsx
import { signal } from "@snoofox/reax";

export function Counter() {
  const count = signal(0);

  // This line runs ONCE on mount:
  console.log("Component mounted");

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

Because the function body never re-runs:
- You never need `useCallback` or `useMemo`.
- Closures and callbacks never go stale.
- You can place signals, subscriptions, or helper functions anywhere.

---

### Signals

Signals are writable reactive cells.

```ts
import { signal } from "@snoofox/reax";

const count = signal(0);

// Read current value synchronously:
console.log(count()); // 0

// Write directly:
count(10);

// Update based on previous value:
count((prev) => prev + 1);
```

#### Deduplication & Custom Equality

By default, signals compare incoming values using `Object.is`. If you pass a value that is strictly equal, the signal will not emit and no DOM updates occur.

```ts
// Custom comparator for objects or coordinates:
const pos = signal(
  { x: 0, y: 0 },
  { equals: (prev, next) => prev.x === next.x && prev.y === next.y }
);

// Disable deduplication (useful for event triggers):
const trigger = signal(null, { equals: false });
```

---

### Derived State with `computed`

Use `computed` whenever a value depends on other signals.

#### Auto-Tracking

When given a function with zero arguments, `computed` automatically tracks any signal read during execution:

```tsx
import { signal, computed } from "@snoofox/reax";

const first = signal("Ada");
const last = signal("Lovelace");

const fullName = computed(() => `${first()} ${last()}`);
```

#### Dynamic Dependency Resolution

If your computation contains conditional branches, `computed` updates its subscriptions dynamically on every evaluation:

```tsx
const showEmail = signal(false);
const email = signal("ada@example.com");
const phone = signal("555-0100");

const contact = computed(() => {
  return showEmail() ? email() : phone();
});
```

When `showEmail` is `false`, `contact` only tracks `showEmail` and `phone`. Updates to `email` will not trigger recalculations. When it switches to `true`, it automatically drops `phone` and subscribes to `email`.

#### Explicit Mapping

You can also derive state explicitly from one or more Observables:

```tsx
// Single source:
const double = computed(count, (c) => c * 2);

// Multi-source:
const greeting = computed([first, last], ([f, l]) => `Hello, ${f} ${l}!`);
```

---

## 2. Component Props

When passing reactive data to child components, **pass the signal or Observable itself**, rather than calling it:

```tsx
// Evaluates count() in the parent once and passes a static number:
<Child count={count()} />

// Passes the reactive signal reference directly:
<Child count={count} />
```

Inside the child component:

```tsx
import { type Signal } from "@snoofox/reax";

interface ChildProps {
  count: Signal<number>;
}

function Child({ count }: ChildProps) {
  return <p>Current count: {count}</p>;
}
```

---

## 3. Working with Forms & Inputs

Because Reax binds signals directly to DOM elements, handling form inputs is straightforward:

```tsx
import { signal } from "@snoofox/reax";

export function FormExample() {
  const text = signal("");
  const agreed = signal(false);

  return (
    <form onSubmit={(e: Event) => e.preventDefault()}>
      {/* Controlled text input */}
      <input
        value={text}
        onInput={(e: Event) => text((e.target as HTMLInputElement).value)}
        placeholder="Type something..."
      />

      {/* Controlled checkbox */}
      <label>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e: Event) => agreed((e.target as HTMLInputElement).checked)}
        />
        I agree to the terms
      </label>

      <p>Preview: {text}</p>
    </form>
  );
}
```

---

## 4. DOM Access with `ref`

When you need direct access to a native DOM node (e.g. to call `.focus()`, `.scrollIntoView()`, or measure an element):

```tsx
import { onMount } from "@snoofox/reax";

export function AutoFocusInput() {
  let inputEl: HTMLInputElement | null = null;

  onMount(() => {
    inputEl?.focus();
  });

  return <input ref={(el) => (inputEl = el)} placeholder="Focused on load" />;
}
```

`ref` also supports object refs `{ current: HTMLElement | null }`. When the element is unmounted, Reax automatically calls the ref callback with `null`.

---

## 5. Control Flow

Because component bodies run only once, standard JavaScript `if` statements and `array.map()` inside the body only execute at mount time. Reax provides declarative components for dynamic branches.

### `<Show>`

Mounts or unmounts a DOM branch based on a condition:

```tsx
import { Show, signal } from "@snoofox/reax";

function AuthBar() {
  const user = signal<{ name: string } | null>(null);

  return (
    <Show
      when={user}
      fallback={<button onClick={() => user({ name: "snoofox" })}>Log In</button>}
    >
      <div>
        <span>Welcome back!</span>
        <button onClick={() => user(null)}>Log Out</button>
      </div>
    </Show>
  );
}
```

When switching branches, Reax automatically disposes of all subscriptions and DOM elements from the old branch.

### Keyed `<For>`

Renders an array with keyed in-place DOM reuse:

```tsx
import { For, signal } from "@snoofox/reax";

interface Todo {
  id: number;
  text: string;
}

function TodoList() {
  const todos = signal<Todo[]>([
    { id: 1, text: "Write docs" },
    { id: 2, text: "Build app" },
  ]);

  return (
    <For each={todos} by="id" fallback={<p>No tasks left!</p>}>
      {(todo, index$) => (
        <li>
          <span>#{index$} - {todo.text}</span>
          <button onClick={() => todos((t) => t.filter((x) => x.id !== todo.id))}>
            Delete
          </button>
        </li>
      )}
    </For>
  );
}
```

- **`by="id"`**: When the array is reordered, sorted, or filtered, Reax moves the existing DOM elements in-place instead of destroying and recreating them. This keeps input focus, scroll position, and CSS transitions intact.
- **`index$`**: Passed as an `Observable<number>`. When an item shifts position, only the `#` text node updates.

### `<Switch>` and `<Match>`

Pattern match between multiple states:

```tsx
import { Switch, Match, signal, computed } from "@snoofox/reax";

type State = "idle" | "loading" | "success" | "error";

function View() {
  const state = signal<State>("idle");

  return (
    <Switch fallback={<p>Ready to start.</p>}>
      <Match when={computed(() => state() === "loading")}>
        <p>Loading data...</p>
      </Match>
      <Match when={computed(() => state() === "error")}>
        <p>An error occurred.</p>
      </Match>
      <Match when={computed(() => state() === "success")}>
        <p>Loaded successfully!</p>
      </Match>
    </Switch>
  );
}
```

### `<ErrorBoundary>`

Catches both synchronous component exceptions and asynchronous stream errors:

```tsx
import { ErrorBoundary } from "@snoofox/reax";

function App() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div class="error-card">
          <h3>Something broke</h3>
          <p>{String(error)}</p>
          <button onClick={reset}>Retry</button>
        </div>
      )}
    >
      <Widget />
    </ErrorBoundary>
  );
}
```

---

## 6. Context API

Share state across deeply nested components without passing props through intermediate layers.

### Step 1: Create the Context

```ts
import { createContext, signal, type Signal } from "@snoofox/reax";

interface UserContextType {
  user: Signal<{ name: string } | null>;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>();
```

### Step 2: Provide the Value

```tsx
import { UserContext } from "./user-context";

export function App() {
  const user = signal<{ name: string } | null>({ name: "snoofox" });
  const logout = () => user(null);

  return (
    <UserContext.Provider value={{ user, logout }}>
      <Navbar />
      <MainContent />
    </UserContext.Provider>
  );
}
```

### Step 3: Consume in Any Child

```tsx
import { useContext } from "@snoofox/reax";
import { UserContext } from "./user-context";

export function UserBadge() {
  const { user, logout } = useContext(UserContext);

  return (
    <div>
      <span>Signed in as: {computed(() => user()?.name ?? "Guest")}</span>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}
```

---

## 7. DOM & Styling

### `classList`

Toggle classes using an object with boolean values or boolean signals:

```tsx
const isActive = signal(true);
const isPending = signal(false);

<button
  classList={{
    "btn": true,
    "btn-active": isActive,
    "btn-pending": isPending,
    "px-4 py-2 font-bold": true, // Multi-token classes are automatically supported
  }}
>
  Save
</button>
```

### Inline Styles

Accepts style strings or style objects with automatic pixel units and CSS variable support:

```tsx
const opacity = signal(0.9);

<div
  style={{
    display: "flex",
    width: 300,            // Automatically converted to "300px"
    zIndex: 10,            // Unitless property kept as 10
    opacity: opacity,      // Bound to reactive stream
    "--primary": "#3b82f6", // CSS variable
  }}
/>
```

### SVG Support

SVG elements and attributes (`viewBox`, `strokeWidth`, `xmlns`) work with automatic namespace resolution:

```tsx
<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
</svg>
```

---

## 8. Lifecycle Hooks

### `onMount`

Runs immediately after the component's elements are inserted into the DOM:

```tsx
import { onMount } from "@snoofox/reax";

onMount(() => {
  const id = setInterval(() => console.log("tick"), 1000);

  // Return a teardown callback for cleanup:
  return () => clearInterval(id);
});
```

### `onUnmount`

Runs when the component is removed from the DOM:

```tsx
import { onUnmount } from "@snoofox/reax";

onUnmount(() => {
  console.log("Component unmounted");
});
```

---

## 9. Async & RxJS Recipes

Because every signal is an RxJS Observable, complex asynchronous logic requires zero external libraries.

### Debounced Live Search

```tsx
import { signal, debounceTime, distinctUntilChanged, switchMap } from "@snoofox/reax";

export function LiveSearch() {
  const query = signal("");

  const results$ = query.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((q) => {
      if (!q.trim()) return Promise.resolve([]);
      return fetch(`/api/search?q=${encodeURIComponent(q)}`).then((r) => r.json());
    })
  );

  return (
    <div>
      <input
        value={query}
        onInput={(e: Event) => query((e.target as HTMLInputElement).value)}
        placeholder="Search..."
      />
      <div>{results$}</div>
    </div>
  );
}
```

### Polling / Interval Stream

```tsx
import { interval, map } from "@snoofox/reax";

export function Clock() {
  const time$ = interval(1000).pipe(
    map(() => new Date().toLocaleTimeString())
  );

  return <div>Current time: {time$}</div>;
}
```
