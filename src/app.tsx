import { map } from "rxjs";
import { signal, Show, For } from "reax";

type Todo = { id: number; text: string; done: boolean };
type User = { id: number; name: string };

export const App = () => {
  const tab$ = signal<"counter" | "tasks" | "team" | "settings">("tasks");
  const count$ = signal(0);
  const notif$ = signal(false);

  const todos$ = signal<Todo[]>([
    { id: 1, text: "Buy groceries", done: false },
    { id: 2, text: "Write reax framework", done: true }
  ]);
  
  const users$ = signal<User[]>([
    { id: 1, name: "Ash" },
    { id: 2, name: "Misty" }
  ]);

  const newTodo$ = signal("");
  const newUser$ = signal("");

  const isCounter$ = tab$.pipe(map(t => t === "counter"));
  const isTasks$ = tab$.pipe(map(t => t === "tasks"));
  const isTeam$ = tab$.pipe(map(t => t === "team"));
  const isSettings$ = tab$.pipe(map(t => t === "settings"));

  const addTodo = () => {
    if (!newTodo$.value.trim()) return;
    todos$.set([...todos$.value, { id: Date.now(), text: newTodo$.value, done: false }]);
    newTodo$.set("");
  };

  const toggleTodo = (id: number) => {
    todos$.set(todos$.value.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const removeTodo = (id: number) => {
    todos$.set(todos$.value.filter(t => t.id !== id));
  };

  const addUser = () => {
    if (!newUser$.value.trim()) return;
    users$.set([...users$.value, { id: Date.now(), name: newUser$.value }]);
    newUser$.set("");
  };

  const removeUser = (id: number) => {
    users$.set(users$.value.filter(u => u.id !== id));
  };

  return (
    <div style="max-width: 480px; margin: 64px auto; padding: 0 24px; font-family: system-ui, sans-serif; color: #111;">

      <div style="margin-bottom: 40px;">
        <h1 style="font-size: 18px; font-weight: 600; margin: 0;">reax</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #888;">reactive ui, no diffing</p>
      </div>

      <Show when={notif$}>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #166534; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <span>Settings saved.</span>
          <button onClick={() => notif$.set(false)} style="background: none; border: none; cursor: pointer; color: #166534; padding: 0;">✕</button>
        </div>
      </Show>

      <div style="display: flex; gap: 20px; border-bottom: 1px solid #eee; margin-bottom: 32px;">
        {(["counter", "tasks", "team", "settings"] as const).map((t) => (
          <button
            onClick={() => tab$.set(t)}
            style="background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 0; font-size: 14px; color: #888; cursor: pointer; text-transform: capitalize;"
          >
            {t}
          </button>
        ))}
      </div>

      <Show when={isCounter$}>
        <div>
          <div style="font-size: 64px; font-weight: 700; letter-spacing: -2px; line-height: 1;">{count$}</div>
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button onClick={() => count$.set(count$.value - 1)} style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 16px;">−</button>
            <button onClick={() => count$.set(count$.value + 1)} style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 16px;">+</button>
            <button onClick={() => count$.set(0)} style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 13px; color: #888; margin-left: auto;">reset</button>
          </div>
        </div>
      </Show>

      <Show when={isTasks$}>
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 24px;">
            <input 
              value={newTodo$} 
              onInput={(e: Event) => newTodo$.set((e.target as HTMLInputElement).value)}
              onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && addTodo()}
              placeholder="What needs to be done?"
              style="flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none;"
            />
            <button onClick={addTodo} style="padding: 0 16px; background: #111; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">Add</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <For each={todos$}>
              {(todo: Todo) => {
                const isDone$ = todos$.pipe(map(ts => ts.find(t => t.id === todo.id)?.done ?? false));
                return (
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fafafa; border: 1px solid #eee; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <button 
                        onClick={() => toggleTodo(todo.id)}
                        style="width: 18px; height: 18px; border-radius: 4px; border: 1px solid #ccc; background: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;"
                      >
                        <Show when={isDone$}>
                          <div style="width: 10px; height: 10px; background: #111; border-radius: 2px;" />
                        </Show>
                      </button>
                      <span style="font-size: 14px; color: #333;">{todo.text}</span>
                    </div>
                    <button onClick={() => removeTodo(todo.id)} style="background: none; border: none; color: #999; cursor: pointer; font-size: 12px; padding: 4px;">✕</button>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>

      <Show when={isTeam$}>
        <div>
          <div style="display: flex; gap: 8px; margin-bottom: 24px;">
            <input 
              value={newUser$} 
              onInput={(e: Event) => newUser$.set((e.target as HTMLInputElement).value)}
              onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && addUser()}
              placeholder="Invite member..."
              style="flex: 1; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; outline: none;"
            />
            <button onClick={addUser} style="padding: 0 16px; background: #111; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">Invite</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <For each={users$}>
              {(user: User) => (
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border: 1px solid #eee; border-radius: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: #111; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600;">
                      {user.name[0]?.toUpperCase()}
                    </div>
                    <span style="font-size: 14px; font-weight: 500; color: #111;">{user.name}</span>
                  </div>
                  <button onClick={() => removeUser(user.id)} style="background: none; border: none; color: #999; cursor: pointer; font-size: 12px; padding: 4px;">Remove</button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={isSettings$}>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          {([
            ["Compact mode", "Reduce spacing and size"],
            ["Analytics", "Send anonymous usage data"],
            ["Notifications", "Get update alerts"],
          ] as const).map(([label, desc]) => (
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5;">
              <div>
                <div style="font-size: 14px; font-weight: 500;">{label}</div>
                <div style="font-size: 12px; color: #888; margin-top: 2px;">{desc}</div>
              </div>
              <div style="width: 36px; height: 20px; background: #ddd; border-radius: 999px; cursor: pointer;" />
            </div>
          ))}
          <button onClick={() => notif$.set(true)} style="margin-top: 8px; padding: 10px; border: 1px solid #111; border-radius: 6px; background: #111; color: white; font-size: 13px; cursor: pointer; font-weight: 500;">
            Save settings
          </button>
        </div>
      </Show>

    </div>
  );
};
