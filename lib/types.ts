import type { Observable } from "rxjs";

export type Props = Record<string, unknown> & { children?: Child | Child[] };

export type Component = (props: Props) => Child;

export type Tag = string | symbol | Component;

export interface VNode {
  tag: Tag;
  props: Props;
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
