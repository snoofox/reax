import { render, Switch, Match, map } from "@snoofox/reax";
import { currentRoute } from "./router";
import { Home } from "./pages/Home";
import { Guide } from "./pages/Guide";
import { ApiReference } from "./pages/ApiReference";
import { BenchmarkShowcase } from "./showcases/BenchmarkShowcase";
import { DashboardShowcase } from "./showcases/DashboardShowcase";
import { KanbanShowcase } from "./showcases/KanbanShowcase";
import "./styles/index.css";

function App() {
  return (
    <Switch fallback={<Home />}>
      <Match when={currentRoute.pipe(map((r) => r === "/" || r === ""))}>
        <Home />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r.startsWith("/guide")))}>
        <Guide />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r.startsWith("/api")))}>
        <ApiReference />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r === "/showcase/speed"))}>
        <BenchmarkShowcase />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r === "/showcase/dashboard"))}>
        <DashboardShowcase />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r === "/showcase/kanban"))}>
        <KanbanShowcase />
      </Match>
    </Switch>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  render(<App />, rootEl);
}
