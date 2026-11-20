import { isObservable } from "rxjs";
import type { Child } from "../types";
import { Fragment } from "../jsx-runtime";
import {
  SVG_NS,
  MATHML_NS,
  createElementWithNS,
  setProp,
} from "./props";
import { isShowNode, renderShow } from "../components/show";
import { isForNode, renderFor } from "../components/for";
import { isSwitchNode, renderSwitch } from "../components/switch";
import {
  isErrorBoundaryNode,
  renderErrorBoundary,
} from "../components/error-boundary";
import {
  isProviderNode,
  getActiveContext,
  setActiveContext,
} from "../context";
import {
  getActiveCleanups,
  setActiveCleanups,
  getActiveErrorHandler,
  setActiveErrorHandler,
  type Cleanup,
} from "../reactivity/scope";

type MountEntry = {
  fn: () => void | Cleanup;
  cleanups: Cleanup[] | null;
};

let _mounts: MountEntry[] = [];

export function onMount(fn: () => void | Cleanup): void {
  _mounts.push({ fn, cleanups: getActiveCleanups() });
}

export function flushMounts(): void {
  if (_mounts.length === 0) return;
  const entries = _mounts.splice(0);
  for (const { fn, cleanups } of entries) {
    try {
      const cleanup = fn();
      if (typeof cleanup === "function" && cleanups) {
        cleanups.push(cleanup);
      }
    } catch (err) {
      console.error("[reax] onMount error:", err);
    }
  }
}

export function onUnmount(fn: Cleanup): void {
  const cleanups = getActiveCleanups();
  if (cleanups === null) {
    console.warn(
      "[reax] onUnmount called outside a dynamic reactive scope.",
    );
    return;
  }
  cleanups.push(fn);
}

function formatText(value: unknown): string {
  if (value == null || typeof value === "boolean") return "";
  return String(value);
}

function toChildArray(children: unknown): Child[] {
  return Array.isArray(children) ? children : [children as Child];
}

export function _render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
  teardowns?: (() => void)[],
  currentNs?: string,
  errorHandler?: ((err: unknown) => void) | null,
  context?: Map<symbol, unknown>,
): void {
  if (vnode == null || typeof vnode === "boolean") return;

  const isForeignContainer =
    container instanceof Element &&
    (container.tagName.toLowerCase() === "foreignobject" ||
      container.tagName.toLowerCase() === "annotation-xml");

  const effectiveNs =
    currentNs ??
    (!isForeignContainer &&
    container instanceof Element &&
    (container.namespaceURI === SVG_NS || container.namespaceURI === MATHML_NS)
      ? container.namespaceURI
      : undefined);

  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      _render(child, container, teardowns, effectiveNs, errorHandler, context);
    }
    return;
  }

  if (isObservable(vnode)) {
    const node = document.createTextNode("");
    const sub = vnode.subscribe({
      next: (next) => (node.nodeValue = formatText(next)),
      error: (err) => {
        if (errorHandler) errorHandler(err);
        else console.error("[reax] Unhandled observable error:", err);
      },
    });
    if (teardowns) teardowns.push(() => sub.unsubscribe());
    container.appendChild(node);
    return;
  }

  if (typeof vnode !== "object") {
    container.appendChild(document.createTextNode(formatText(vnode)));
    return;
  }

  if (vnode.tag === Fragment) {
    const children = toChildArray(vnode.props.children);
    for (const child of children) {
      _render(child, container, teardowns, effectiveNs, errorHandler, context);
    }
    return;
  }

  if (isProviderNode(vnode)) {
    const nextContext = new Map(context);
    nextContext.set(vnode.props.contextId, vnode.props.value);
    const children = toChildArray(vnode.props.children);
    for (const child of children) {
      _render(
        child,
        container,
        teardowns,
        effectiveNs,
        errorHandler,
        nextContext,
      );
    }
    return;
  }

  if (isShowNode(vnode)) {
    renderShow(
      vnode,
      container,
      teardowns,
      effectiveNs,
      _render,
      errorHandler,
      context,
    );
    return;
  }

  if (isForNode(vnode)) {
    renderFor(
      vnode,
      container,
      teardowns,
      effectiveNs,
      _render,
      errorHandler,
      context,
    );
    return;
  }

  if (isSwitchNode(vnode)) {
    renderSwitch(
      vnode,
      container,
      teardowns,
      effectiveNs,
      _render,
      errorHandler,
      context,
    );
    return;
  }

  if (isErrorBoundaryNode(vnode)) {
    renderErrorBoundary(
      vnode,
      container,
      teardowns,
      effectiveNs,
      _render,
      errorHandler,
      context,
    );
    return;
  }

  if (typeof vnode.tag === "function") {
    const prevContext = getActiveContext();
    setActiveContext(context ?? null);
    const prevCleanups = getActiveCleanups();
    setActiveCleanups(teardowns ?? null);
    const prevErrorHandler = getActiveErrorHandler();
    setActiveErrorHandler(errorHandler ?? null);
    try {
      const child = vnode.tag(vnode.props);
      if (child instanceof Promise) {
        console.warn(
          "[reax] Async components are not supported; returning a Promise renders nothing.",
        );
        return;
      }
      _render(child, container, teardowns, effectiveNs, errorHandler, context);
    } catch (err) {
      if (errorHandler) {
        errorHandler(err);
        return;
      }
      throw err;
    } finally {
      setActiveCleanups(prevCleanups);
      setActiveContext(prevContext);
      setActiveErrorHandler(prevErrorHandler);
    }
    return;
  }

  if (typeof vnode.tag !== "string") return;
  const el = createElementWithNS(vnode.tag, effectiveNs);
  const deferValue = vnode.tag === "select" || vnode.tag === "textarea";
  const deferredValue: [string, unknown][] = [];
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
    if (deferValue && key === "value") {
      deferredValue.push([key, val]);
      continue;
    }
    setProp(el, key, val, teardowns, errorHandler);
  }

  const childNs =
    vnode.tag === "svg"
      ? SVG_NS
      : vnode.tag === "math"
        ? MATHML_NS
        : vnode.tag === "foreignObject" || vnode.tag === "annotation-xml"
          ? undefined
          : effectiveNs;

  const children = toChildArray(vnode.props.children);

  for (const child of children) {
    _render(child, el, teardowns, childNs, errorHandler, context);
  }

  for (const [key, val] of deferredValue) {
    setProp(el, key, val, teardowns, errorHandler);
  }

  container.appendChild(el);
}

export function render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
): void {
  _render(vnode, container);
  flushMounts();
}
