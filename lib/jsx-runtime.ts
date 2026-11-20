import type { Tag, VNode, Child, Component } from "./types";
import type { IntrinsicElements } from "./jsx-types";

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
  const { children, ...rest } = props ?? {};
  return {
    tag,
    props: {
      ...rest,
      children: children as Child,
    },
    key,
  };
}

export const jsxs = jsx;
