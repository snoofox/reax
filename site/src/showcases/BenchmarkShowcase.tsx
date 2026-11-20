import { signal, computed, For, Show, onMount, onUnmount } from "@snoofox/reax";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

interface RowItem {
  id: number;
  label: ReturnType<typeof signal<string>>;
  selected: ReturnType<typeof signal<boolean>>;
}

let nextId = 1;

const ADJECTIVES = ["pretty", "large", "big", "small", "tall", "short", "long", "handsome", "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "fast", "fine", "good"];
const COLOURS = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "amber", "cyan", "crimson", "indigo"];
const NOUNS = ["apple", "table", "chair", "house", "bbq", "desk", "car", "pony", "cup", "bird", "monster", "stream", "signal", "node"];

function buildRows(count: number): RowItem[] {
  const rows: RowItem[] = [];
  for (let i = 0; i < count; i++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const col = COLOURS[Math.floor(Math.random() * COLOURS.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    rows.push({
      id: nextId++,
      label: signal(`${adj} ${col} ${noun}`),
      selected: signal(false),
    });
  }
  return rows;
}

export function BenchmarkShowcase() {
  const rows = signal<RowItem[]>([]);
  const lastDuration = signal<number | null>(null);
  const fps = signal<number>(60);
  const selectedCount = signal<number>(0);
  const latencyHistory = signal<number[]>([12, 18, 14, 22, 16, 28, 19, 15]);

  let frameCount = 0;
  let lastTime = performance.now();
  let animId: number;

  onMount(() => {
    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        fps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
  });

  onUnmount(() => {
    cancelAnimationFrame(animId);
  });

  const recordLatency = (dur: number) => {
    lastDuration(dur);
    const hist = [...latencyHistory(), dur].slice(-16);
    latencyHistory(hist);
  };

  const createRows = (count: number) => {
    const start = performance.now();
    rows(buildRows(count));
    const dur = Math.round((performance.now() - start) * 10) / 10;
    recordLatency(dur);
  };

  const updateEvery10th = () => {
    const start = performance.now();
    const current = rows();
    for (let i = 0; i < current.length; i += 10) {
      current[i].label((l) => `${l} !!!`);
    }
    const dur = Math.round((performance.now() - start) * 10) / 10;
    recordLatency(dur);
  };

  const clearAll = () => {
    const start = performance.now();
    rows([]);
    selectedCount(0);
    const dur = Math.round((performance.now() - start) * 10) / 10;
    recordLatency(dur);
  };

  const toggleSelect = (row: RowItem) => {
    const next = !row.selected();
    row.selected(next);
    selectedCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
  };

  const totalRowCount$ = computed(() => rows().length);
  const hasRows$ = computed(() => rows().length > 0);
  const lastDuration$ = computed(() => (lastDuration() !== null ? `${lastDuration()}ms` : "-"));
  const estimatedMemory$ = computed(() => `${Math.round(rows().length * 0.12 * 10) / 10} MB`);

  const sparklinePoints$ = computed(() => {
    const data = latencyHistory();
    if (data.length === 0) return "";
    const max = Math.max(...data, 40);
    const step = 280 / (data.length - 1 || 1);
    return data
      .map((val, i) => `${i * step},${40 - (val / max) * 35}`)
      .join(" ");
  });

  return (
    <div class="page-container">
      <Header />
      <div class="page page--wide">
        <header class="page-header">
          <h1>10,000 Rows Benchmark</h1>
          <p class="tagline">Direct DOM creation and mutation speed across 10,000 items.</p>
        </header>

        {/* Action Controls & Metrics */}
        <div class="showcase-toolbar">
          <div class="showcase-toolbar-group">
            <button onClick={() => createRows(10000)} class="btn btn-primary text-xs font-semibold">
              ⚡ Render 10,000 Rows
            </button>
            <button onClick={updateEvery10th} class="btn btn-secondary text-xs">
              Mutate Rows
            </button>
            <button onClick={clearAll} class="btn btn-ghost text-xs text-crimson hover:text-white">
              Clear
            </button>
          </div>

          <div class="showcase-toolbar-stats">
            <span>Nodes: <strong class="text-white">{totalRowCount$}</strong></span>
            <span>Render: <strong class="text-cyan">{lastDuration$}</strong></span>
          </div>
        </div>

        {/* Rows Table */}
        <div class="benchmark-table-container">
          <Show
            when={hasRows$}
            fallback={
              <div class="benchmark-empty">
                Click <b>⚡ Render 10,000 Rows</b> to mount nodes.
              </div>
            }
          >
            <table class="benchmark-table">
              <thead>
                <tr>
                  <th style="width: 100px;">ID</th>
                  <th>Label</th>
                  <th style="width: 140px; text-align: right;">Selection</th>
                </tr>
              </thead>
              <tbody>
                <For each={rows}>
                  {(row) => {
                    const rowClass$ = computed(() => (row.selected() ? "row-selected" : ""));
                    const btnLabel$ = computed(() => (row.selected() ? "Selected" : "Select"));

                    return (
                      <tr class={rowClass$}>
                        <td class="cell-id">#{row.id}</td>
                        <td class="cell-label">{row.label}</td>
                        <td class="cell-action">
                          <button onClick={() => toggleSelect(row)} class="btn-table">
                            {btnLabel$}
                          </button>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </Show>
        </div>

        <Footer />
      </div>
    </div>
  );
}
