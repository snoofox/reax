import type { VNode, Child } from "./lib/types";
import type { IntrinsicElements as ReaxIntrinsicElements } from "./lib/jsx-types";

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
