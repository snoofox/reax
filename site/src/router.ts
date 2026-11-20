import { signal } from "@snoofox/reax";

const routeTitles: Record<string, string> = {
  "/": "Reax: The power of RxJS with the syntax of React",
  "/guide": "Guide | Reax",
  "/api": "API Reference | Reax",
  "/showcase/speed": "10,000 Rows Benchmark | Reax",
  "/showcase/dashboard": "Live Telemetry Showcase | Reax",
  "/showcase/kanban": "Kanban Board Showcase | Reax",
};

function getHashRoute(): string {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === "") return "/";
  return hash.startsWith("/") ? hash : `/${hash}`;
}

function updateTitle(route: string) {
  document.title = routeTitles[route] || "Reax: The power of RxJS with the syntax of React";
}

const initialRoute = getHashRoute();
export const currentRoute = signal<string>(initialRoute);
updateTitle(initialRoute);

window.addEventListener("hashchange", () => {
  const route = getHashRoute();
  currentRoute(route);
  updateTitle(route);
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
});

export function navigate(to: string) {
  const normalized = to.startsWith("/") ? to : `/${to}`;
  window.location.hash = normalized;
}
