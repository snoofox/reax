import { DocsLayout } from "../components/DocsLayout";
import { CodeBlock } from "../components/CodeBlock";

const nav = [
  { id: "components", label: "How components work" },
  { id: "signals", label: "1. Signals" },
  { id: "derived", label: "2. Derived values" },
  { id: "control-flow", label: "3. Control flow" },
  { id: "classes", label: "4. Dynamic classes" },
  { id: "context", label: "5. Context" },
  { id: "rxjs", label: "6. RxJS operators" },
];

export function Guide() {
  const signalSnippet = `import { signal } from "@snoofox/reax";

const count = signal(0);

// Read current value
console.log(count()); // 0

// Set value directly
count(5);

// Update using previous value
count(c => c + 1);`;

  const computedSnippet = `import { signal, computed } from "@snoofox/reax";

const count = signal(3);
const double = computed(() => count() * 2);

console.log(double()); // 6

count(10);
console.log(double()); // 20`;

  const controlFlowSnippet = `import { signal, computed, Show, For, Switch, Match } from "@snoofox/reax";

function UserList() {
  const isLoggedIn = signal(true);
  const users = signal(["Alice", "Bob", "Charlie"]);
  const role = signal<"admin" | "user" | "guest">("admin");

  return (
    <div>
      {/* Show / hide */}
      <Show when={isLoggedIn} fallback={<p>Please log in.</p>}>
        <p>Welcome back!</p>
      </Show>

      {/* Keyed list */}
      <ul>
        <For each={users}>
          {(name) => <li>User: {name}</li>}
        </For>
      </ul>

      {/* Pattern matching */}
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

function ToggleButton() {
  const active = signal(false);
  const inactive = computed(() => !active());

  return (
    <button
      onClick={() => active(a => !a)}
      classList={{
        "btn-base": true,
        "bg-green-500 text-white": active,
        "bg-gray-200 text-gray-800": inactive,
      }}
    >
      Toggle
    </button>
  );
}`;

  const contextSnippet = `import { createContext, useContext, signal } from "@snoofox/reax";

interface ThemeContextType {
  dark: () => boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>();

function App() {
  const dark = signal(true);
  const toggle = () => dark(d => !d);

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

function SearchInput() {
  const query = signal("");

  const debounced = query.pipe(
    debounceTime(300),
    distinctUntilChanged()
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

  return (
    <DocsLayout
      eyebrow="Guide"
      title="Guide"
      description="How to build interfaces with Reax."
      basePath="#/guide"
      nav={nav}
    >
      <h2 id="components">How components work</h2>
      <p>
        A component runs once when it mounts. It creates DOM elements, sets up signal subscriptions, and finishes.
      </p>
      <p>
        Because the component function never re-runs, you never need <code>useCallback</code> or <code>useMemo</code>, and closures never go stale. When a signal updates, only the elements listening to that signal change.
      </p>

      <h2 id="signals">1. Signals</h2>
      <p>
        Signals hold reactive state. Read them by calling <code>count()</code>, or update them by passing a value:
      </p>
      <CodeBlock code={signalSnippet} title="signal.ts" />

      <h2 id="derived">2. Derived values</h2>
      <p>
        Use <code>computed</code> for values that depend on other signals. It tracks whatever you read inside the function:
      </p>
      <CodeBlock code={computedSnippet} title="computed.ts" />

      <h2 id="control-flow">3. Conditional rendering and lists</h2>
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
    </DocsLayout>
  );
}
