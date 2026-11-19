import type { Observable } from "rxjs";
export type { Signal, SignalOptions } from "./reactivity/signal";

export type Props = {
  children?: unknown;
  [key: string]: unknown;
};

export type Component = (props: Props) => Child;

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
