import type { JSX as ReaxJSX } from "./lib/jsx-namespace";

declare global {
  namespace JSX {
    interface Element extends ReaxJSX.Element {}
    interface ElementClass extends ReaxJSX.ElementClass {}
    interface ElementChildrenAttribute extends ReaxJSX.ElementChildrenAttribute {}
    interface IntrinsicElements extends ReaxJSX.IntrinsicElements {}
  }
}
