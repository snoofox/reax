import { signal, computed } from "@snoofox/reax";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CounterPreview } from "../components/CounterPreview";

export function Home() {
  const copied = signal(false);
  const copyLabel = computed(() => (copied() ? "Copied" : "Copy"));

  const copyQuickstart = () => {
    navigator.clipboard.writeText("pnpm add @snoofox/reax").then(() => {
      copied(true);
      setTimeout(() => copied(false), 1500);
    });
  };

  return (
    <div class="page-container">
      <Header />
      <div class="page page--home">
        <header id="frontpage">
          <h1>Reax</h1>
          <p class="tagline">The power of RxJS with the syntax of React.</p>
          <p class="hero-lead">
            A fine-grained reactive UI library where components run once on mount, and signals stream updates directly to DOM nodes without re-renders or virtual DOM diffs.
          </p>

          <div class="quickstart-bar">
            <code>pnpm add @snoofox/reax</code>
            <button onClick={copyQuickstart} class="quickstart-copy">
              {copyLabel}
            </button>
          </div>
        </header>

        <main id="main-content">
          <CounterPreview />

          <section class="section arch-section" aria-labelledby="architecture-title">
            <div class="arch-layout">
              <div class="arch-intro">
                <span class="arch-kicker">Architecture &amp; Design</span>
                <h2 id="architecture-title" class="arch-title">
                  Reactivity without reconcilers.
                </h2>
                <p class="arch-lead">
                  Reax treats your user interface as a direct subscriber to reactive streams. Instead of diffing virtual DOM trees on every state change, components run once during setup to wire signals directly to native DOM nodes.
                </p>
              </div>

              <div class="arch-pillars">
                <div class="arch-pillar">
                  <span class="arch-pillar-num">01</span>
                  <div>
                    <h3>RxJS Native Signals</h3>
                    <p>
                      Signals are BehaviorSubjects underneath. Operators like <code>debounceTime</code>, <code>distinctUntilChanged</code>, and <code>map</code> compose state without external wrappers or boilerplate.
                    </p>
                  </div>
                </div>

                <div class="arch-pillar">
                  <span class="arch-pillar-num">02</span>
                  <div>
                    <h3>Direct DOM Binding</h3>
                    <p>
                      When a signal emits, updates write straight to the target text node or element property. The enclosing component function never re-runs, preserving local scope and DOM focus.
                    </p>
                  </div>
                </div>

                <div class="arch-pillar">
                  <span class="arch-pillar-num">03</span>
                  <div>
                    <h3>Automatic Lifecycle Cleanup</h3>
                    <p>
                      RxJS streams are notoriously prone to memory leaks if unsubscriptions are missed. Reax automatically ties subscription lifetimes to the DOM hierarchy. When elements or branches unmount, all active streams, listeners, and effects tear down cleanly with zero manual boilerplate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="section" aria-labelledby="showcases-title">
            <div class="section-heading">
              <h2 id="showcases-title">Showcases</h2>
            </div>

            <div class="showcases-grid">
              <a href="#/showcase/speed" class="showcase-card">
                <span class="showcase-meta">PERFORMANCE</span>
                <h3>10,000 Rows</h3>
                <p>Test DOM creation and mutation speed across thousands of items.</p>
              </a>

              <a href="#/showcase/dashboard" class="showcase-card">
                <span class="showcase-meta">REALTIME</span>
                <h3>Live Telemetry</h3>
                <p>Real-time SVG charts and log streams updated over RxJS pipes.</p>
              </a>

              <a href="#/showcase/kanban" class="showcase-card">
                <span class="showcase-meta">STATE</span>
                <h3>Kanban Board</h3>
                <p>Drag tasks between columns with keyed list reuse and live counts.</p>
              </a>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
