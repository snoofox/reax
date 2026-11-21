import { DocsLayout } from "../components/DocsLayout";
import { CodeBlock } from "../components/CodeBlock";

const nav = [
  { id: "starter", label: "Quick Start" },
  { id: "components", label: "How components work" },
  { id: "signals", label: "1. Signals" },
  { id: "derived", label: "2. Derived values" },
  { id: "control-flow", label: "3. Control flow" },
  { id: "classes", label: "4. Dynamic classes" },
  { id: "context", label: "5. Context" },
  { id: "rxjs", label: "6. RxJS operators" },
  { id: "lifecycle", label: "7. Lifecycle & cleanup" },
];

export function Docs() {
  const scaffoldSnippet = `npx degit snoofox/reax/template my-app
cd my-app
pnpm install
pnpm dev`;

  const existingProjectSnippet = `pnpm add @snoofox/reax`;

  const viteConfigSnippet = `import { defineConfig } from "vite";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@snoofox/reax",
  },
});`;

  const signalSnippet = `import { signal } from "@snoofox/reax";

const count = signal(0);

console.log(count()); // 0
count(5);
count((c) => c + 1);

const pos = signal(
  { x: 0, y: 0 },
  { equals: (prev, next) => prev.x === next.x && prev.y === next.y }
);`;

  const computedSnippet = `import { signal, computed } from "@snoofox/reax";

const count = signal(3);
const double = computed(() => count() * 2);

console.log(double()); // 6
count(10);
console.log(double()); // 20

const first = signal("Ada");
const last = signal("Lovelace");
const fullName = computed([first, last], ([f, l]) => \`\${f} \${l}\`);`;

  const controlFlowSnippet = `import { signal, computed, Show, For, Switch, Match } from "@snoofox/reax";

export function UserDashboard() {
  const isLoggedIn = signal(true);
  const users = signal(["Alice", "Bob", "Charlie"]);
  const role = signal<"admin" | "user" | "guest">("admin");

  return (
    <div>
      <Show when={isLoggedIn} fallback={<p>Please log in.</p>}>
        <p>Welcome back!</p>
      </Show>

      <ul>
        <For each={users}>
          {(name) => <li>User: {name}</li>}
        </For>
      </ul>

      <Switch fallback={<p>Standard user interface</p>}>
        <Match when={computed(() => role() === "admin")}>
          <p>Admin Panel</p>
        </Match>
        <Match when={computed(() => role() === "guest")}>
          <p>Guest Mode</p>
        </Match>
      </Switch>
    </div>
  );
}`;

  const classListSnippet = `import { signal, computed } from "@snoofox/reax";

export function ToggleButton() {
  const active = signal(false);

  return (
    <button
      onClick={() => active((a) => !a)}
      classList={{
        "btn-base": true,
        "btn-active": active,
        "btn-inactive": computed(() => !active()),
      }}
    >
      Toggle
    </button>
  );
}`;

  const contextSnippet = `import { createContext, useContext, signal, type Signal } from "@snoofox/reax";

interface ThemeContextType {
  dark: Signal<boolean>;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

export function App() {
  const dark = signal(true);
  const toggle = () => dark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      <ChildComponent />
    </ThemeContext.Provider>
  );
}

function ChildComponent() {
  const theme = useContext(ThemeContext);
  return (
    <button onClick={theme.toggle}>
      Toggle Theme
    </button>
  );
}`;

  const rxjsSnippet = `import { signal, debounceTime, distinctUntilChanged } from "@snoofox/reax";

export function SearchInput() {
  const query = signal("");

  const debounced = query.pipe(
    debounceTime(300),
    distinctUntilChanged(),
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onInput={(e) => query((e.target as HTMLInputElement).value)}
      />
      <p>Instant: {query}</p>
      <p>Debounced: {debounced}</p>
    </div>
  );
}`;

  const lifecycleSnippet = `import { onMount, onUnmount } from "@snoofox/reax";

export function WindowWatcher() {
  onMount(() => {
    const handleResize = () => console.log(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  });

  onUnmount(() => {
    console.log("Component unmounted");
  });

  return <div />;
}`;

  return (
    <DocsLayout
      eyebrow="Documentation"
      title="Documentation"
      description="How to build interfaces with Reax."
      basePath="#/docs"
      nav={nav}
    >
      <h2 id="starter">Quick Start</h2>
      <p>
        Scaffold a new project in seconds using the official Reax starter template:
      </p>
      <CodeBlock code={scaffoldSnippet} language="bash" title="Terminal" />

      <p>
        Or add Reax to an existing Vite application:
      </p>
      <CodeBlock code={existingProjectSnippet} language="bash" title="Terminal" />

      <p>
        In your <code>vite.config.ts</code>, configure JSX to use Reax:
      </p>
      <CodeBlock code={viteConfigSnippet} title="vite.config.ts" />

      <h2 id="components">How components work</h2>
      <p>
        A component runs once when it mounts. It creates native DOM elements, sets up signal subscriptions, and finishes.
      </p>
      <p>
        Because component functions never re-run, you never need <code>useCallback</code> or <code>useMemo</code>, and closures never go stale. When a signal updates, only the specific DOM nodes listening to that signal change.
      </p>

      <h2 id="signals">1. Signals</h2>
      <p>
        Signals hold reactive state. Read them by calling <code>count()</code>, update them directly with <code>count(5)</code>, or pass an updater function:
      </p>
      <CodeBlock code={signalSnippet} title="signals.ts" />

      <h2 id="derived">2. Derived values</h2>
      <p>
        Use <code>computed</code> for values that depend on other signals. It automatically tracks any signal read inside the getter function:
      </p>
      <CodeBlock code={computedSnippet} title="computed.ts" />

      <h2 id="control-flow">3. Control flow</h2>
      <p>
        Regular <code>if</code> statements and <code>array.map()</code> evaluate once at mount. Use <code>Show</code>, <code>For</code>, and <code>Switch</code> to keep DOM elements reactive:
      </p>
      <CodeBlock code={controlFlowSnippet} title="control-flow.tsx" />

      <h2 id="classes">4. Dynamic classes</h2>
      <p>
        Use <code>classList</code> to toggle classes with booleans or signals:
      </p>
      <CodeBlock code={classListSnippet} title="classList.tsx" />

      <h2 id="context">5. Context</h2>
      <p>
        Pass signals down the component tree without passing props through every level:
      </p>
      <CodeBlock code={contextSnippet} title="context.tsx" />

      <h2 id="rxjs">6. RxJS operators</h2>
      <p>
        Signals inherit from <code>Observable</code>, so you can pipe them directly through operators:
      </p>
      <CodeBlock code={rxjsSnippet} title="rxjs.tsx" />

      <h2 id="lifecycle">7. Lifecycle &amp; cleanup</h2>
      <p>
        Side effects that need physical DOM access can be registered with <code>onMount</code> and <code>onUnmount</code>. Any subscriptions or class binders created inside components are automatically disposed when the component unmounts.
      </p>
      <CodeBlock code={lifecycleSnippet} title="lifecycle.tsx" />
    </DocsLayout>
  );
}
