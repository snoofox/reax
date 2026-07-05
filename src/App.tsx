import { signal } from "../lib/index.ts";

export const App = () => {
  const [count$, setCount, getCount] = signal(0);

  return (
    <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
      <h1>Simple Counter</h1>
      <p style="font-size: 24px; font-weight: bold;">Count: {count$}</p>
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button
          onClick={() => setCount(getCount() - 1)}
          style="padding: 8px 16px; font-size: 16px; cursor: pointer;"
        >
          - Decrement
        </button>
        <button
          onClick={() => setCount(getCount() + 1)}
          style="padding: 8px 16px; font-size: 16px; cursor: pointer;"
        >
          + Increment
        </button>
      </div>
    </div>
  );
};
