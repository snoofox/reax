import type { Observable } from "rxjs";
import type { Cleanup } from "./reactivity/scope";
export type {
  Signal,
  ReadonlySignal,
  SignalOptions,
} from "./reactivity/signal";
export type { ErrorBoundaryProps } from "./components/error-boundary";
export type { Context } from "./context";
export type { Cleanup } from "./reactivity/scope";

export type Props = {
  children?: unknown;
  [key: string]: unknown;
};

export type Component<P = Props> = (props: P) => Child;
export type ComponentProps<C> = C extends Component<infer P> ? P : never;

export type Tag = string | symbol | Component;

export interface VNode {
  tag: Tag;
  props: Props;
  key?: unknown;
}

export type Child =
  | VNode
  | Observable<unknown>
  | string
  | number
  | boolean
  | null
  | undefined
  | Child[];

export type RenderChild = (
  child: Child,
  container: Element | DocumentFragment | Node,
  teardowns?: Cleanup[],
  ns?: string,
  errorHandler?: ((err: unknown) => void) | null,
  context?: Map<symbol, unknown>,
) => void;
