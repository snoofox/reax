import type { VNode, Child } from "./lib/types.ts";
import type { IntrinsicElements as ReaxIntrinsicElements } from "./lib/jsx-types.ts";

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass {
      render(): Child;
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicElements extends ReaxIntrinsicElements {}
  }
}
