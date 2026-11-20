import { signal, computed, For } from "@snoofox/reax";

export function App() {
  const count = signal(0);
  const double = computed(() => count() * 2);
  const todos = signal(["Learn Reax", "Build an app"]);
  const input = signal("");

  const addTodo = () => {
    const text = input().trim();
    if (!text) return;
    todos((prev) => [...prev, text]);
    input("");
  };

  return (
    <div style="max-width: 420px; margin: 40px auto; font-family: system-ui, sans-serif;">
      <h1>Hello Reax</h1>

      <div style="margin-bottom: 24px;">
        <p>Count: {count} · Double: {double}</p>
        <button onClick={() => count((c) => c + 1)}>+1</button>
        <button onClick={() => count(0)} style="margin-left: 8px;">Reset</button>
      </div>

      <div>
        <h3>Todos</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input
            value={input}
            onInput={(e: Event) => input((e.target as HTMLInputElement).value)}
            onKeyDown={(e: KeyboardEvent) => e.key === "Enter" && addTodo()}
            placeholder="New todo..."
          />
          <button onClick={addTodo}>Add</button>
        </div>

        <ul>
          <For each={todos}>
            {(todo) => <li>{todo}</li>}
          </For>
        </ul>
      </div>
    </div>
  );
}
