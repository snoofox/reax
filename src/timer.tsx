import { signal, onMount, onUnmount } from "reax";

export const Timer = () => {
  const ticks$ = signal(0);
  const status$ = signal("waiting...");

  let id: ReturnType<typeof setInterval>;

  onMount(() => {
    console.log("Timer mounted — starting interval");
    status$.set("mounted");
    id = setInterval(() => {
      ticks$.set(ticks$.value + 1);
    }, 1000);
  });

  onUnmount(() => {
    console.log("Timer unmounted — interval cleared");
    clearInterval(id);
  });

  return (
    <div>
      <div style="display: flex; gap: 8px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-family: monospace; padding: 3px 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; color: #166534;">
          onMount → {status$}
        </div>
        <div style="font-size: 12px; font-family: monospace; padding: 3px 8px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; color: #888;">
          onUnmount → switch tabs
        </div>
      </div>
      <div style="display: flex; align-items: baseline; gap: 8px;">
        <div style="font-size: 64px; font-weight: 700; letter-spacing: -2px; line-height: 1; font-variant-numeric: tabular-nums;">
          {ticks$}
        </div>
        <div style="font-size: 14px; color: #888;">seconds</div>
      </div>
      <div style="margin-top: 16px; font-size: 12px; color: #aaa;">
        Watch the console when switching tabs.
      </div>
    </div>
  );
};
