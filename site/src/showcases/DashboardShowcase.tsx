import { signal, map, combineLatest, For, onMount, onUnmount } from "@snoofox/reax";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

interface LogEvent {
  id: number;
  time: string;
  level: "info" | "warn" | "error";
  message: string;
}

export function DashboardShowcase() {
  const isStreaming = signal(true);
  const cpuLoad = signal(34);
  const memoryUsed = signal(62);
  const activeSockets = signal(1420);
  const networkRate = signal(8.4);
  const history = signal<number[]>([32, 35, 30, 42, 45, 38, 48, 52, 49, 41, 39, 44, 46, 50, 47, 43, 38, 36, 34]);
  const logs = signal<LogEvent[]>([
    { id: 1, time: "12:00:01", level: "info", message: "Telemetry pipeline connected" },
    { id: 2, time: "12:00:02", level: "info", message: "Worker thread pool initialized" },
    { id: 3, time: "12:00:04", level: "warn", message: "Connection burst: 1,400 clients" },
  ]);
  const filterLevel = signal<"all" | "info" | "warn" | "error">("all");

  let timerId: any = null;
  let eventSeq = 4;

  const startStream = () => {
    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (!isStreaming()) return;

      const nextCpu = Math.min(95, Math.max(15, Math.round(cpuLoad() + (Math.random() * 12 - 6))));
      const nextMem = Math.min(92, Math.max(40, Math.round(memoryUsed() + (Math.random() * 4 - 2))));
      const nextRate = Math.round((networkRate() + (Math.random() * 2 - 1)) * 10) / 10;
      const nextSockets = Math.max(800, activeSockets() + Math.round(Math.random() * 20 - 10));

      cpuLoad(nextCpu);
      memoryUsed(nextMem);
      networkRate(nextRate);
      activeSockets(nextSockets);

      history((prev) => [...prev.slice(1), nextCpu]);

      if (Math.random() > 0.6) {
        const levels: ("info" | "warn" | "error")[] = ["info", "info", "warn", "error"];
        const selected = levels[Math.floor(Math.random() * levels.length)];
        const messages = {
          info: ["Heartbeat ACK received", "Cache hit ratio 98.4%", "Stream buffer flushed"],
          warn: ["GC pause 12ms", "Socket buffer 72% full", "Network latency spike"],
          error: ["Dropped packet in socket pipe", "Timeout on worker heartbeat", "Rate limit triggered"],
        };
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
        const msg = messages[selected][Math.floor(Math.random() * messages[selected].length)];

        logs((prev) => [{ id: eventSeq++, time: timeStr, level: selected, message: msg }, ...prev.slice(0, 19)]);
      }
    }, 1000);
  };

  onMount(() => {
    startStream();
  });

  onUnmount(() => {
    if (timerId) clearInterval(timerId);
  });

  const svgPath$ = history.pipe(
    map((pts) => {
      const width = 500;
      const height = 100;
      const step = width / (pts.length - 1);
      let d = `M 0 ${height - (pts[0] / 100) * height}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${i * step} ${height - (pts[i] / 100) * height}`;
      }
      return d;
    })
  );

  const svgArea$ = history.pipe(
    map((pts) => {
      const width = 500;
      const height = 100;
      const step = width / (pts.length - 1);
      let d = `M 0 ${height - (pts[0] / 100) * height}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${i * step} ${height - (pts[i] / 100) * height}`;
      }
      d += ` L ${width} ${height} L 0 ${height} Z`;
      return d;
    })
  );

  const filteredLogs$ = combineLatest([logs, filterLevel]).pipe(
    map(([allLogs, lvl]) => (lvl === "all" ? allLogs : allLogs.filter((e) => e.level === lvl)))
  );

  const streamStatus$ = isStreaming.pipe(map((s) => (s ? "STREAMING" : "PAUSED")));
  const streamBtn$ = isStreaming.pipe(map((s) => (s ? "Pause" : "Resume")));
  const cpuWidth$ = cpuLoad.pipe(map((c) => `width: ${c}%`));
  const memWidth$ = memoryUsed.pipe(map((m) => `width: ${m}%`));

  return (
    <div class="page-container">
      <Header />
      <div class="page page--wide">
        <header class="page-header">
          <h1>Real-Time Telemetry</h1>
          <p class="tagline">Streaming SVG charts and metrics updated over RxJS pipes.</p>
        </header>

        {/* Toolbar */}
        <div class="showcase-toolbar">
          <div class="showcase-toolbar-group">
            <button onClick={() => isStreaming((s) => !s)} class="btn btn-secondary text-xs">
              {streamBtn$}
            </button>
          </div>

          <div class="showcase-toolbar-stats">
            <span class="status-indicator"></span>
            <span>Status: <strong class="text-cyan">{streamStatus$}</strong></span>
          </div>
        </div>

        {/* Metric Cards */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div class="metric-card">
            <div class="metric-label">CPU LOAD</div>
            <div class="metric-val text-cyan">
              <span>{cpuLoad}</span>%
            </div>
            <div class="metric-bar">
              <div class="metric-fill metric-fill--cyan" style={cpuWidth$}></div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">THROUGHPUT</div>
            <div class="metric-val">
              <span>{networkRate}</span> <span class="text-xs text-muted">MB/s</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill metric-fill--crimson" style={memWidth$}></div>
            </div>
          </div>
        </div>

        {/* Live Sparkline Area Chart */}
        <div class="chart-container my-6">
          <div class="chart-header">
            <span class="chart-title font-mono text-xs text-muted">CPU UTILIZATION STREAM</span>
          </div>
          <div class="chart-svg-wrap">
            <svg viewBox="0 0 500 100" class="w-full h-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#5dd2e4" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#5dd2e4" stop-opacity="0.0" />
                </linearGradient>
              </defs>
              <path d={svgArea$} fill="url(#chartGrad)" />
              <path d={svgPath$} fill="none" stroke="#5dd2e4" stroke-width="2" />
            </svg>
          </div>
        </div>

        {/* Live Events Stream */}
        <div class="events-container my-6">
          <div class="events-header">
            <span class="events-title">Live Event Stream</span>
          </div>

          <div class="events-list">
            <For each={logs}>
              {(item) => {
                const badgeClass = `event-badge event-badge--${item.level}`;
                return (
                  <div class="event-row">
                    <span class="event-time">{item.time}</span>
                    <span class={badgeClass}>{item.level}</span>
                    <span class="event-msg">{item.message}</span>
                  </div>
                );
              }}
            </For>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
