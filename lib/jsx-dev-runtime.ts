import { Fragment } from "./jsx-runtime";
import type { Tag, VNode, Child } from "./types";
import type { IntrinsicElements } from "./jsx-types";

export { Fragment };
export type { IntrinsicElements };

export function jsxDEV(
  tag: Tag,
  props: Record<string, unknown> | null,
  key?: unknown,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  self?: unknown,
): VNode {
  const { children, ...rest } = props ?? {};
  return {
    tag,
    props: {
      ...rest,
      children: children as Child,
      __source: source,
      __self: self,
    },
    key,
  };
}

export namespace JSX {
  export type Element = VNode;
  export interface ElementClass {
    render(): Child;
  }
  export interface ElementChildrenAttribute {
    children: {};
  }
  export type IntrinsicElements = import("./jsx-types").IntrinsicElements;
}
