// DOM & Mounting
export { render, onMount, onUnmount } from "./dom/render.ts";

// Control Flow Components
export { Show } from "./components/show.ts";
export { For } from "./components/for.ts";
export { Switch, Match } from "./components/switch.ts";

// Reactivity
export { signal, type Signal } from "./reactivity/signal.ts";
export { effect } from "./reactivity/effect.ts";
export * from "rxjs";

// Automatic JSX & Fragment
export { jsx, jsxs, Fragment } from "./jsx-runtime.ts";
export { jsxDEV } from "./jsx-dev-runtime.ts";

// Types
export type * from "./types.ts";
export type * from "./jsx-types.ts";
