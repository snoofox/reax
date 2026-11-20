# Reax

A fine-grained reactive UI library powered by RxJS.

```tsx
import { render, signal, computed, For } from "reaxjs";

function App() {
  const count = signal(0);
  const double = computed(() => count() * 2);
  const items = signal(["Coffee", "Code", "Repeat"]);

  return (
    <main>
      <h1>Count: {count}</h1>
      <p>Double: {double}</p>
      <button onClick={() => count((c) => c + 1)}>+1</button>

      <ul>
        <For each={items}>
          {(item) => <li>{item}</li>}
        </For>
      </ul>
    </main>
  );
}

render(<App />, document.getElementById("root")!);
```

---

## Overview

Reax provides declarative UI with fine-grained reactivity using standard JSX and RxJS.

Unlike Virtual DOM libraries where component functions re-evaluate on every state change, a Reax component function runs **once** during initialization to instantiate real DOM nodes. Dynamic expressions within JSX bind directly to RxJS Observables, updating only the specific text nodes or attributes that depend on that state.

- **No Virtual DOM**: Updates bypass tree reconciliation and mutate targeted DOM nodes directly.
- **No Compiler Required**: Operates using standard automatic JSX (`react-jsx`), compatible with Vite, TypeScript, and esbuild without custom plugins.
- **RxJS Native**: State cells are standard Observables, allowing direct composition with operators like `map`, `filter`, `debounceTime`, and `switchMap`.

---

## Getting Started

### Using the Starter Template

Scaffold a pre-configured project using degit:

```bash
npx degit snoofox/reax/template my-app
cd my-app
pnpm install
pnpm dev
```

### Adding to an Existing Project

Install the package:

```bash
pnpm add reaxjs
```

Configure `tsconfig.json` to use Reax's JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "reaxjs"
  }
}
```

If using Vite, configure `jsxImportSource` in `vite.config.ts`:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "reaxjs",
  },
});
```

---

## Execution Model

In Reax, a component function acts as a setup routine rather than a render loop.

```tsx
function Counter() {
  const count = signal(0);

  // Executes once during initialization, then never again!
  console.log("Component mounted");

  return (
    <button onClick={() => count((c) => c + 1)}>
      {count}
    </button>
  );
}
```

When the button is clicked, `count` emits a new value directly to the text node inside the button. The `Counter` function is not re-invoked, local variables are not reallocated, and closures do not capture stale state.

### Key Conceptual Differences

Because components execute only once:

- **Derived State**: Plain variables evaluated in the component body do not recalculate on state changes. Use `computed` to define reactive derivations.
- **Control Flow**: Standard JavaScript statements (`if/else`, ternary operators, `array.map()`) evaluate once during setup. Use control flow components (`<Show>`, `<For>`, `<Switch>`) to maintain reactivity across state updates.
- **Passing Props**: Pass signals or Observables by reference rather than reading their values at the call site.

---

## Core Primitives

### `signal(initialValue, options?)`

Defines a writable reactive state cell.

```ts
const count = signal(0);

count();           // Synchronous read: 0
count(5);          // Direct write
count((c) => c + 1); // Functional update
```

Signals deduplicate updates using `Object.is` by default. Custom comparators can be provided via `options.equals`, or deduplication can be disabled by passing `{ equals: false }`.

### `computed(fn, options?)`

Defines a read-only derived signal with automatic dependency tracking.

```ts
const first = signal("Ada");
const last = signal("Lovelace");

const fullName = computed(() => `${first()} ${last()}`);
```

Dependencies are tracked dynamically. If conditional logic branches, `computed` unsubscribes from inactive dependencies to prevent unnecessary computations and memory leaks.

### Control Flow Components

- **`<Show when={condition} fallback={...}>`**: Conditionally renders children or a fallback branch based on an Observable or static condition.
- **`<For each={array$} by="id">`**: Keyed list rendering that reconciles existing DOM nodes in-place during additions, removals, and reordering.
- **`<Switch>` & `<Match when={condition}>`**: Evaluates conditions in sequence and renders the first matching case.
- **`<ErrorBoundary fallback={(err, reset) => ...}>`**: Intercepts both synchronous render exceptions and asynchronous stream errors, providing a recovery callback.

### Context API

Provides scoped state across component hierarchies without manual prop passing.

```tsx
const ThemeContext = createContext("light");

function App() {
  return (
    <ThemeContext.Provider value="dark">
      <Child />
    </ThemeContext.Provider>
  );
}

function Child() {
  const theme = useContext(ThemeContext);
  return <div class={theme}>Content</div>;
}
```

### Dynamic Styling & Attributes

- **`classList`**: Accepts an object of class names mapped to booleans or boolean Observables, with support for space-separated token keys.
- **`style`**: Supports style strings or style objects with automatic unit conversions and CSS variable support.
- **`ref`**: Accepts callback refs or object refs for direct access to underlying native DOM elements.

---

## Documentation

- [Guide](file:///home/arch/projects/reax/docs/guide.md) — Comprehensive guide covering forms, asynchronous pipelines, and architecture patterns.
- [API Reference](file:///home/arch/projects/reax/docs/api-reference.md) — Complete TypeScript signatures and parameter specifications.

---

## License

MIT © snoofox
