import type { VNode } from "./lib/types.ts";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    interface Element extends VNode {}
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}
