import type { Tag, VNode, Child, Component } from "./types";
import type { IntrinsicElements } from "./jsx-types";
import { createVNode } from "./vnode";

export const Fragment = Symbol.for("reax.fragment");
export type { IntrinsicElements };
export type { JSX } from "./jsx-namespace";

export function jsx<P>(
  tag: Component<P>,
  props: (P & { children?: Child }) | null,
  key?: unknown,
): VNode;
export function jsx(
  tag: string | symbol,
  props: Record<string, unknown> | null,
  key?: unknown,
): VNode;
export function jsx(
  tag: Tag,
  props: Record<string, unknown> | null,
  key?: unknown,
): VNode {
  return createVNode(tag, props, key);
}

export const jsxs = jsx;
