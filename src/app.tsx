import { map } from "rxjs";
import { signal, Show } from "reax";

export const App = () => {
  const tab$ = signal<"counter" | "profile" | "settings">("counter");
  const count$ = signal(0);
  const name$ = signal("Ash");
  const notif$ = signal(false);

  const isCounter$ = tab$.pipe(map((t) => t === "counter"));
  const isProfile$ = tab$.pipe(map((t) => t === "profile"));
  const isSettings$ = tab$.pipe(map((t) => t === "settings"));

  return (
    <div style="max-width: 480px; margin: 64px auto; padding: 0 24px; font-family: system-ui, sans-serif; color: #111;">

      {/* Header */}
      <div style="margin-bottom: 40px;">
        <h1 style="font-size: 18px; font-weight: 600; margin: 0;">reax</h1>
        <p style="margin: 4px 0 0; font-size: 13px; color: #888;">reactive ui, no diffing</p>
      </div>

      {/* Notification */}
      <Show when={notif$}>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #166534; margin-bottom: 20px; display: flex; justify-content: space-between;">
          <span>Settings saved.</span>
          <button onClick={() => notif$.set(false)} style="background: none; border: none; cursor: pointer; color: #166534; padding: 0;">✕</button>
        </div>
      </Show>

      {/* Tabs */}
      <div style="display: flex; gap: 20px; border-bottom: 1px solid #eee; margin-bottom: 32px;">
        {(["counter", "profile", "settings"] as const).map((t) => (
          <button
            onClick={() => tab$.set(t)}
            style="background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 0; font-size: 14px; color: #888; cursor: pointer; text-transform: capitalize;"
          >
            {t}
          </button>
        ))}
      </div>

      {/* Counter */}
      <Show when={isCounter$}>
        <div>
          <div style="font-size: 64px; font-weight: 700; letter-spacing: -2px; line-height: 1;">{count$}</div>
          <div style="display: flex; gap: 8px; margin-top: 24px;">
            <button
              onClick={() => count$.set(count$.value - 1)}
              style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 16px;"
            >−</button>
            <button
              onClick={() => count$.set(count$.value + 1)}
              style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 16px;"
            >+</button>
            <button
              onClick={() => count$.set(0)}
              style="padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; background: none; cursor: pointer; font-size: 13px; color: #888; margin-left: auto;"
            >reset</button>
          </div>
        </div>
      </Show>

      {/* Profile */}
      <Show when={isProfile$}>
        <div>
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #111; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
            {name$.pipe(map((n) => n[0]?.toUpperCase() ?? "?"))}
          </div>
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 500;">{name$}</p>
          <p style="margin: 0; font-size: 13px; color: #888;">member since 2026</p>
          <input
            style="margin-top: 20px; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; width: 100%; box-sizing: border-box;"
            placeholder="Change name..."
            onInput={(e: Event) => name$.set((e.target as HTMLInputElement).value || name$.value)}
          />
        </div>
      </Show>

      {/* Settings */}
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
          <button
            onClick={() => notif$.set(true)}
            style="margin-top: 8px; padding: 10px; border: 1px solid #111; border-radius: 6px; background: #111; color: white; font-size: 13px; cursor: pointer; font-weight: 500;"
          >
            Save settings
          </button>
        </div>
      </Show>

    </div>
  );
};
