import { Fragment } from "./jsx-runtime";
import type { Tag, VNode, Child, Component } from "./types";
import type { IntrinsicElements } from "./jsx-types";

export { Fragment };
export type { IntrinsicElements };
export type { JSX } from "./jsx-namespace";

export function jsxDEV<P>(
  tag: Component<P>,
  props: (P & { children?: Child }) | null,
  key?: unknown,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  self?: unknown,
): VNode;
export function jsxDEV(
  tag: string | symbol,
  props: Record<string, unknown> | null,
  key?: unknown,
  _isStaticChildren?: boolean,
  source?: { fileName: string; lineNumber: number; columnNumber: number },
  self?: unknown,
): VNode;
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
