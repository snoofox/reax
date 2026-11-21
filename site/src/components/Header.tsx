import { signal, computed, Show } from "@snoofox/reax";
import { currentRoute } from "../router";

export function Header() {
  const isShowcasesOpen = signal(false);

  const isDocs$ = computed(() =>
    currentRoute().startsWith("/docs") ? "active" : ""
  );
  const isIntegrations$ = computed(() =>
    currentRoute().startsWith("/integrations") ? "active" : ""
  );
  const isReferences$ = computed(() =>
    currentRoute().startsWith("/references") ? "active" : ""
  );
  const isShowcase$ = computed(() =>
    currentRoute().startsWith("/showcase") ? "active" : ""
  );

  return (
    <>
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <header id="site-header">
        <div class="header-inner">
          <nav aria-label="Main navigation">
            <a href="#/" class="brand-title">
              REAX
              <img src="./favicon.png" alt="Reax icon" class="brand-icon" />
            </a>

            <ul class="nav-links">
              <li>
                <a href="#/docs" class={isDocs$}>Docs</a>
              </li>
              <li>
                <a href="#/integrations" class={isIntegrations$}>Integrations</a>
              </li>
              <li>
                <a href="#/references" class={isReferences$}>References</a>
              </li>
              <li class="nav-dropdown">
                <button
                  type="button"
                  class={computed(() => `nav-dropdown-btn ${isShowcase$()}`)}
                  onClick={() => isShowcasesOpen((v) => !v)}
                  aria-expanded={isShowcasesOpen}
                >
                  Showcases <span class="dropdown-chevron">▾</span>
                </button>
                <Show when={isShowcasesOpen}>
                  <div class="dropdown-backdrop" onClick={() => isShowcasesOpen(false)} />
                  <div class="dropdown-menu" onClick={() => isShowcasesOpen(false)}>
                    <a href="#/showcase/speed" class="dropdown-item">
                      <span class="dropdown-title">10,000 Rows</span>
                      <span class="dropdown-desc">DOM creation and update speed</span>
                    </a>
                    <a href="#/showcase/dashboard" class="dropdown-item">
                      <span class="dropdown-title">Live Telemetry</span>
                      <span class="dropdown-desc">SVG charts and streaming metrics</span>
                    </a>
                    <a href="#/showcase/kanban" class="dropdown-item">
                      <span class="dropdown-title">Kanban Board</span>
                      <span class="dropdown-desc">Drag-and-drop tasks with keyed list reuse</span>
                    </a>
                  </div>
                </Show>
              </li>
              <li>
                <a
                  href="https://github.com/snoofox/reax"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="github-link"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <div class="site-banner" aria-hidden="true"></div>
    </>
  );
}
