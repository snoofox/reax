import { Show } from "../lib/core.ts";
import { signal } from "../lib/index.ts";

export const App = () => {
  const [count$, setCount, getCount] = signal(0);
  const [isLoggedIn$, setIsLoggedIn, getIsLoggedIn] = signal(false);

  return (
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1>Counter</h1>
      <p style="font-size: 24px; font-weight: bold;">Count: {count$}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <Show when={isLoggedIn$}>
          <button
            onClick={() => setCount(getCount() - 1)}
            style="padding: 8px 16px; font-size: 16px; cursor: pointer;"
          >
            - Decrement
          </button>
        </Show>
        <button
          onClick={() => setIsLoggedIn(!getIsLoggedIn())}
          style="padding: 8px 16px; font-size: 16px; cursor: pointer;"
        >
          + Increment
        </button>
      </div>
    </div>
  );
};
