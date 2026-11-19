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

let _mounts: (() => void)[] = [];
let _unmounts: (() => void)[] | null = null;

export function onMount(fn: () => void): void {
  _mounts.push(fn);
}

export function flushMounts(): void {
  if (_mounts.length === 0) return;
  const fns = _mounts.splice(0);
  for (const fn of fns) fn();
}

export function onUnmount(fn: () => void): void {
  if (_unmounts === null) {
    console.warn(
      "[reax] onUnmount called outside a dynamic reactive scope.",
    );
    return;
  }
  _unmounts.push(fn);
}

function formatText(value: unknown): string {
  if (value == null || typeof value === "boolean") return "";
  return String(value);
}

export function _render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
  teardowns?: (() => void)[],
  currentNs?: string,
  errorHandler?: ((err: unknown) => void) | null,
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
      _render(child, container, teardowns, effectiveNs, errorHandler);
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
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      _render(child, container, teardowns, effectiveNs, errorHandler);
    }
    return;
  }

  if (isShowNode(vnode)) {
    renderShow(vnode, container, teardowns, effectiveNs, _render, errorHandler);
    return;
  }

  if (isForNode(vnode)) {
    renderFor(vnode, container, teardowns, effectiveNs, _render, errorHandler);
    return;
  }

  if (isSwitchNode(vnode)) {
    renderSwitch(vnode, container, teardowns, effectiveNs, _render, errorHandler);
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
    );
    return;
  }

  if (typeof vnode.tag === "function") {
    const prev = _unmounts;
    _unmounts = teardowns ?? null;
    try {
      const child = vnode.tag(vnode.props);
      _render(child, container, teardowns, effectiveNs, errorHandler);
    } catch (err) {
      if (errorHandler) {
        errorHandler(err);
        return;
      }
      throw err;
    } finally {
      _unmounts = prev;
    }
    return;
  }

  if (typeof vnode.tag !== "string") return;
  const el = createElementWithNS(vnode.tag, effectiveNs);
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
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

  const children = Array.isArray(vnode.props.children)
    ? vnode.props.children
    : [vnode.props.children];

  for (const child of children) {
    _render(child, el, teardowns, childNs, errorHandler);
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
