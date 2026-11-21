import { render, Switch, Match, map } from "@snoofox/reax";
import { currentRoute } from "./router";
import { Home } from "./pages/Home";
import { Docs } from "./pages/Docs";
import { Integrations } from "./pages/Integrations";
import { References } from "./pages/References";
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
      <Match when={currentRoute.pipe(map((r) => r.startsWith("/docs")))}>
        <Docs />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r.startsWith("/integrations")))}>
        <Integrations />
      </Match>
      <Match when={currentRoute.pipe(map((r) => r.startsWith("/references")))}>
        <References />
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
