import { isObservable } from "rxjs";
import type { Child } from "../types.ts";
import { Fragment } from "../jsx-runtime.ts";
import {
  SVG_NS,
  MATHML_NS,
  createElementWithNS,
  setProp,
} from "./props.ts";
import { isShowNode, renderShow } from "../components/show.ts";
import { isForNode, renderFor } from "../components/for.ts";
import { isSwitchNode, renderSwitch } from "../components/switch.ts";

let _mounts: (() => void)[] = [];
let _unmounts: (() => void)[] | null = null;
let _depth = 0;

export function onMount(fn: () => void): void {
  if (_depth === 0) {
    console.warn("[reax] onMount called outside a component. Ignoring.");
    return;
  }
  _mounts.push(fn);
}

export function onUnmount(fn: () => void): void {
  if (_unmounts === null) {
    console.warn(
      "[reax] onUnmount called outside a dynamic reactive scope (<Show>, <For>, <Switch>). Root components never unmount.",
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
      _render(child, container, teardowns, effectiveNs);
    }
    return;
  }

  if (isObservable(vnode)) {
    const node = document.createTextNode("");
    const sub = vnode.subscribe((next) => (node.nodeValue = formatText(next)));
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
      _render(child, container, teardowns, effectiveNs);
    }
    return;
  }

  if (isShowNode(vnode)) {
    renderShow(vnode, container, teardowns, effectiveNs, _render);
    return;
  }

  if (isForNode(vnode)) {
    renderFor(vnode, container, teardowns, effectiveNs, _render);
    return;
  }

  if (isSwitchNode(vnode)) {
    renderSwitch(vnode, container, teardowns, effectiveNs, _render);
    return;
  }

  if (typeof vnode.tag === "function") {
    const prev = _unmounts;
    _unmounts = teardowns ?? null;
    try {
      _render(vnode.tag(vnode.props), container, teardowns, effectiveNs);
    } finally {
      _unmounts = prev;
    }
    return;
  }

  if (typeof vnode.tag !== "string") return;
  const el = createElementWithNS(vnode.tag, effectiveNs);
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
    setProp(el, key, val, teardowns);
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
    _render(child, el, teardowns, childNs);
  }

  container.appendChild(el);
}

export function render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
): void {
  const isRoot = _depth === 0;
  _depth++;

  try {
    _render(vnode, container);
  } finally {
    _depth--;
  }

  if (isRoot) {
    const mounts = _mounts.splice(0);
    if (mounts.length > 0) {
      queueMicrotask(() => {
        for (const fn of mounts) fn();
      });
    }
  }
}
