import { signal, computed } from "@snoofox/reax";
import { CodeBlock } from "./CodeBlock";

export function CounterPreview() {
  const count = signal(0);
  const double = computed(() => count() * 2);

  const counterCode = `const count = signal(0);
const double = computed(() => count() * 2);

return (
  <div class="counter">
    <button onClick={() => count(c => c - 1)}>-</button>
    <span>{count}</span>
    <button onClick={() => count(c => c + 1)}>+</button>
    <p>Double: {double}</p>
  </div>
);`;

  return (
    <div class="interactive-preview-card">
      <div class="preview-split-grid">
        {/* Left Pane: Live Component */}
        <div class="preview-live-pane">
          <div class="code-frame-header">
            <span class="code-frame-title font-mono text-xs text-cyan font-semibold">Live Preview</span>
            <button
              type="button"
              onClick={() => count(0)}
              class="code-copy-btn"
            >
              Reset
            </button>
          </div>

          <div class="preview-live-stage">
            <div class="counter-display-row">
              <button
                type="button"
                onClick={() => count((c) => c - 1)}
                class="counter-btn"
                aria-label="Decrement"
              >
                -
              </button>

              <div class="counter-val">
                {count}
              </div>

              <button
                type="button"
                onClick={() => count((c) => c + 1)}
                class="counter-btn"
                aria-label="Increment"
              >
                +
              </button>
            </div>

            <div class="counter-computed-pill">
              <span class="text-muted">Computed double:</span>
              <span class="counter-computed-val">{double}</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Code */}
        <div class="preview-code-pane">
          <CodeBlock code={counterCode} language="tsx" title="Counter.tsx" />
        </div>
      </div>
    </div>
  );
}
