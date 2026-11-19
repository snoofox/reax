import type { Tag, VNode, Child } from "./types.ts";
import type { IntrinsicElements } from "./jsx-types.ts";

export const Fragment = Symbol.for("reax.fragment");
export type { IntrinsicElements };

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

export namespace JSX {
  export type Element = VNode;
  export interface ElementClass {
    render(): Child;
  }
  export interface ElementChildrenAttribute {
    children: {};
  }
  export type IntrinsicElements = import("./jsx-types.ts").IntrinsicElements;
}
