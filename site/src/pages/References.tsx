import { DocsLayout } from "../components/DocsLayout";
import { CodeBlock } from "../components/CodeBlock";

const nav = [
  { id: "reactivity", label: "Reactivity" },
  { id: "rendering", label: "Rendering & lifecycle" },
  { id: "control-flow", label: "Control flow" },
  { id: "context", label: "Context" },
  { id: "dom", label: "DOM attributes" },
  { id: "rxjs", label: "Re-exported RxJS" },
];

export function References() {
  return (
    <DocsLayout
      eyebrow="Reference"
      title="References"
      description="Complete technical reference for all functions, components, props, and types exported by @snoofox/reax."
      basePath="#/references"
      nav={nav}
    >
      <section class="api-group" id="reactivity">
        <div class="api-group-head">
          <span class="api-group-index">01</span>
          <h2>Reactivity</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="signal">
              <code>{"signal<T>(initialValue, options?): Signal<T>"}</code>
            </h3>
            <span class="api-badge">function</span>
          </div>
          <p>
            Creates a writable reactive cell. Values are deduplicated with <code>Object.is</code> by default; pass <code>{"{ equals: false }"}</code> to emit on every write or a custom comparator for objects and coordinates.
          </p>
          <CodeBlock
            code={`import { signal, type Signal, type SignalOptions } from "@snoofox/reax";

const count = signal(0);
const pos = signal(
  { x: 0, y: 0 },
  { equals: (prev, next) => prev.x === next.x && prev.y === next.y }
);`}
            title="signal"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="computed">
              <code>computed(getter, options?)</code>
            </h3>
            <span class="api-badge">function</span>
          </div>
          <p>
            Creates a read-only derived signal. It auto-tracks every signal read during execution, and dynamically subscribes or unsubscribes when conditional branches change.
          </p>
          <CodeBlock
            code={`import { signal, computed } from "@snoofox/reax";

const first = signal("Ada");
const last = signal("Lovelace");
const fullName = computed(() => \`\${first()} \${last()}\`);

// Single source:
const double = computed(count, (c) => c * 2);

// Multi-source:
const greeting = computed([first, last], ([f, l]) => \`Hello, \${f} \${l}!\`);`}
            title="computed"
          />
        </article>
      </section>

      <section class="api-group" id="rendering">
        <div class="api-group-head">
          <span class="api-group-index">02</span>
          <h2>Rendering &amp; lifecycle</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="render">
              <code>{"render(element, container): Cleanup"}</code>
            </h3>
            <span class="api-badge">function</span>
          </div>
          <p>
            Mounts a Reax component tree into a DOM container. The returned cleanup function removes the created DOM nodes, unsubscribes active streams, and triggers <code>onUnmount</code> callbacks.
          </p>
          <CodeBlock
            code={`import { render } from "@snoofox/reax";

const unmount = render(<App />, document.getElementById("root")!);

// Cleanup:
unmount();`}
            title="render"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="on-mount">
              <code>{"onMount(callback)"}</code>
            </h3>
            <span class="api-badge">hook</span>
          </div>
          <p>
            Runs immediately after the component's DOM elements are attached to the document. The callback can return a teardown function.
          </p>
          <CodeBlock
            code={`import { onMount } from "@snoofox/reax";

onMount(() => {
  const id = setInterval(() => console.log("tick"), 1000);
  return () => clearInterval(id);
});`}
            title="onMount"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="on-unmount">
              <code>{"onUnmount(callback)"}</code>
            </h3>
            <span class="api-badge">hook</span>
          </div>
          <p>
            Registers a teardown callback that runs when the component is removed from the DOM.
          </p>
          <CodeBlock
            code={`import { onUnmount } from "@snoofox/reax";

onUnmount(() => {
  console.log("Component unmounted");
});`}
            title="onUnmount"
          />
        </article>
      </section>

      <section class="api-group" id="control-flow">
        <div class="api-group-head">
          <span class="api-group-index">03</span>
          <h2>Control flow</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="show">
              <code>{"<Show when={condition} fallback={...}>"}</code>
            </h3>
            <span class="api-badge">component</span>
          </div>
          <p>
            Conditionally mounts a DOM branch based on an Observable or static condition. Switching branches disposes the old subscriptions and elements.
          </p>
          <CodeBlock
            code={`<Show when={isLoggedIn} fallback={<Login />}>
  <Dashboard />
</Show>`}
            title="<Show>"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="for">
              <code>{`<For each={array$} by="id">`}</code>
            </h3>
            <span class="api-badge">component</span>
          </div>
          <p>
            Renders an array with keyed, in-place DOM reuse. Reordering, sorting, or filtering moves existing nodes instead of recreating them, preserving focus and scroll position.
          </p>
          <CodeBlock
            code={`<For each={todos} by="id" fallback={<p>No tasks left!</p>}>
  {(todo, index$) => (
    <li>#{index$} - {todo.text}</li>
  )}
</For>`}
            title="<For>"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="switch">
              <code>{"<Switch>"}</code> and <code>{"<Match>"}</code>
            </h3>
            <span class="api-badge">component</span>
          </div>
          <p>
            Evaluates <code>Match</code> branches in order and mounts the first one whose <code>when</code> condition is truthy. If none match, it mounts the <code>fallback</code>.
          </p>
          <CodeBlock
            code={`<Switch fallback={<p>Default fallback</p>}>
  <Match when={computed(() => tab() === "home")}>
    <Home />
  </Match>
  <Match when={computed(() => tab() === "settings")}>
    <Settings />
  </Match>
</Switch>`}
            title="<Switch> & <Match>"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="error-boundary">
              <code>{"<ErrorBoundary fallback={...}>"}</code>
            </h3>
            <span class="api-badge">component</span>
          </div>
          <p>
            Intercepts synchronous render exceptions and asynchronous stream errors. The fallback receives the error and a <code>reset</code> callback that remounts the children.
          </p>
          <CodeBlock
            code={`<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <p>Error: {String(error)}</p>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <App />
</ErrorBoundary>`}
            title="<ErrorBoundary>"
          />
        </article>
      </section>

      <section class="api-group" id="context">
        <div class="api-group-head">
          <span class="api-group-index">04</span>
          <h2>Context</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="create-context">
              <code>{"createContext<T>(defaultValue?): Context<T>"}</code>
            </h3>
            <span class="api-badge">function</span>
          </div>
          <p>
            Creates a scoped context object with a <code>Provider</code> component. Pass signals or Observables by reference rather than reading their values at the call site.
          </p>
          <CodeBlock
            code={`import { createContext, signal, type Signal } from "@snoofox/reax";

interface UserContextType {
  user: Signal<{ name: string } | null>;
  logout: () => void;
}

export const UserContext = createContext<UserContextType>();`}
            title="createContext"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="use-context">
              <code>{"useContext<T>(context): T"}</code>
            </h3>
            <span class="api-badge">hook</span>
          </div>
          <p>
            Reads the nearest value from an ancestor <code>Context.Provider</code>. If no provider exists, it returns the <code>defaultValue</code>.
          </p>
          <CodeBlock
            code={`import { useContext } from "@snoofox/reax";
import { UserContext } from "./user-context";

function UserBadge() {
  const { user, logout } = useContext(UserContext);
  return <button onClick={logout}>Log out</button>;
}`}
            title="useContext"
          />
        </article>
      </section>

      <section class="api-group" id="dom">
        <div class="api-group-head">
          <span class="api-group-index">05</span>
          <h2>DOM attributes</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="class-list">
              <code>classList</code>
            </h3>
            <span class="api-badge">prop</span>
          </div>
          <p>
            Toggles classes with an object of class names mapped to booleans or boolean Observables. Space-separated token keys are split automatically.
          </p>
          <CodeBlock
            code={`<button
  classList={{
    "btn": true,
    "btn-active": isActive,
    "px-4 py-2 font-bold": true,
  }}
>
  Save
</button>`}
            title="classList"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="style">
              <code>style</code>
            </h3>
            <span class="api-badge">prop</span>
          </div>
          <p>
            Accepts style strings or style objects. Numbers get <code>px</code> appended except for unitless properties, and values can be reactive Observables or CSS variables.
          </p>
          <CodeBlock
            code={`<div
  style={{
    display: "flex",
    width: 200,
    opacity: opacity$,
    "--theme-color": "#3b82f6",
  }}
/>`}
            title="style"
          />
        </article>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="ref">
              <code>ref</code>
            </h3>
            <span class="api-badge">prop</span>
          </div>
          <p>
            Captures the underlying native DOM element with a callback ref or an object ref. Callback refs are called with <code>null</code> on unmount.
          </p>
          <CodeBlock
            code={`let inputEl: HTMLInputElement | null = null;

<input ref={(el) => (inputEl = el)} />`}
            title="ref"
          />
        </article>
      </section>

      <section class="api-group" id="rxjs">
        <div class="api-group-head">
          <span class="api-group-index">06</span>
          <h2>Re-exported RxJS</h2>
        </div>

        <article class="api-entry">
          <div class="api-entry-head">
            <h3 id="rxjs-exports">
              <code>Observable, Subject, operators</code>
            </h3>
            <span class="api-badge">exports</span>
          </div>
          <p>
            Reax re-exports all RxJS primitives and operators. You do not need to install or import from <code>rxjs</code> separately.
          </p>
          <CodeBlock
            code={`import {
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
} from "@snoofox/reax";`}
            title="RxJS"
          />
        </article>
      </section>
    </DocsLayout>
  );
}

export const ApiReference = References;
