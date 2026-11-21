import { DocsLayout } from "../components/DocsLayout";
import { CodeBlock } from "../components/CodeBlock";

const nav = [
  { id: "tailwind", label: "Tailwind CSS" },
  { id: "tanstack-query", label: "TanStack Query" },
];

export function Integrations() {
  const tailwindSetupSnippet = `pnpm add -D tailwindcss @tailwindcss/vite`;

  const tailwindViteSnippet = `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "@snoofox/reax",
  },
});`;

  const tailwindComponentSnippet = `import { signal, computed } from "@snoofox/reax";

export function StatusBadge() {
  const isOnline = signal(true);

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-xl">
      <span
        classList={{
          "px-2.5 py-1 text-xs font-semibold rounded-full": true,
          "bg-emerald-500/20 text-emerald-400": isOnline,
          "bg-rose-500/20 text-rose-400": computed([isOnline], (v) => !v),
        }}
      >
        {computed([isOnline], (v) => (v ? "Connected" : "Disconnected"))}
      </span>

      <button
        onClick={() => isOnline((v) => !v)}
        className="px-3 py-1 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
      >
        Toggle
      </button>
    </div>
  );
}`;

  const querySetupSnippet = `pnpm add @tanstack/query-core`;

  const queryAdapterSnippet = `import {
  QueryClient,
  QueryObserver,
  type QueryObserverOptions,
  type QueryObserverResult,
} from "@tanstack/query-core";
import {
  createContext,
  useContext,
  signal,
  computed,
  onUnmount,
} from "@snoofox/reax";

const QueryClientContext = createContext<QueryClient | undefined>(undefined);

export function QueryClientProvider(props: { client: QueryClient; children: unknown }) {
  return QueryClientContext.Provider({ value: props.client, children: props.children });
}

export function useQueryClient(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) throw new Error("QueryClientProvider not found");
  return client;
}

export function createQuery<TData = unknown, TError = Error>(
  options: QueryObserverOptions<TData, TError>,
  queryClient?: QueryClient,
) {
  const client = queryClient ?? useQueryClient();
  const observer = new QueryObserver(client, client.defaultQueryOptions(options));

  const result$ = signal<QueryObserverResult<TData, TError>>(observer.getCurrentResult());
  const unsubscribe = observer.subscribe((next) => result$.set(next));

  onUnmount(() => unsubscribe());

  return {
    result$,
    data$: computed([result$], (r) => r.data),
    isLoading$: computed([result$], (r) => r.isLoading),
    isError$: computed([result$], (r) => r.isError),
    error$: computed([result$], (r) => r.error),
    refetch: () => observer.refetch(),
  };
}`;

  const queryUsageSnippet = `import { Show, For } from "@snoofox/reax";
import { createQuery } from "./query";

interface User {
  id: number;
  name: string;
}

export function UsersList() {
  const query = createQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => fetch("/api/users").then((res) => res.json()),
  });

  return (
    <div>
      <Show when={query.isLoading$}>
        <p>Loading...</p>
      </Show>

      <Show when={query.data$}>
        {(users) => (
          <ul>
            <For each={users}>
              {(user) => <li>{user.name}</li>}
            </For>
          </ul>
        )}
      </Show>
    </div>
  );
}`;

  return (
    <DocsLayout
      eyebrow="Ecosystem"
      title="Integrations"
      description="Recipes and patterns for connecting external tools and libraries to Reax."
      basePath="#/integrations"
      nav={nav}
    >
      <h2 id="tailwind">Tailwind CSS</h2>
      <p>
        Reax outputs real DOM nodes without virtual DOM wrappers, so Tailwind CSS works natively. Install Tailwind v4 with the Vite plugin:
      </p>
      <CodeBlock code={tailwindSetupSnippet} language="bash" title="Terminal" />

      <p>
        Register the plugin in your <code>vite.config.ts</code>:
      </p>
      <CodeBlock code={tailwindViteSnippet} title="vite.config.ts" />

      <p>
        Add <code>@import "tailwindcss";</code> to your stylesheet, then use static classes, dynamic classes with <code>computed</code>, or reactive <code>classList</code> bindings:
      </p>
      <CodeBlock code={tailwindComponentSnippet} title="StatusBadge.tsx" />

      <h2 id="tanstack-query">TanStack Query</h2>
      <p>
        Connect <code>@tanstack/query-core</code> to Reax with a lightweight observer bridge that maps query updates to signals and cleans up on unmount:
      </p>
      <CodeBlock code={querySetupSnippet} language="bash" title="Terminal" />
      <CodeBlock code={queryAdapterSnippet} title="query.ts" />

      <p>
        Consume queries in your components using <code>Show</code> and <code>For</code>:
      </p>
      <CodeBlock code={queryUsageSnippet} title="UsersList.tsx" />
    </DocsLayout>
  );
}
