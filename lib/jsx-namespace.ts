import type { VNode, Child } from "./types";

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
