import type { Child, VNode, Props } from "./types";

export const ProviderTag = Symbol("Provider");

export interface Context<T> {
  id: symbol;
  defaultValue: T | undefined;
  Provider: (props: { value: T; children?: Child }) => VNode;
}

export type ProviderProps<T = unknown> = Props & {
  value: T;
  contextId: symbol;
};

export function isProviderNode(
  vnode: VNode,
): vnode is VNode & { props: ProviderProps } {
  return vnode.tag === ProviderTag;
}

let _activeContext: Map<symbol, unknown> | null = null;

export function getActiveContext(): Map<symbol, unknown> | null {
  return _activeContext;
}

export function setActiveContext(
  context: Map<symbol, unknown> | null,
): void {
  _activeContext = context;
}

export function createContext<T>(defaultValue?: T): Context<T> {
  const id = Symbol("Context");

  const context: Context<T> = {
    id,
    defaultValue,
    Provider(props: { value: T; children?: Child }): VNode {
      return {
        tag: ProviderTag,
        props: {
          ...props,
          contextId: id,
        },
      };
    },
  };

  return context;
}

export function useContext<T>(context: Context<T>): T {
  if (_activeContext && _activeContext.has(context.id)) {
    return _activeContext.get(context.id) as T;
  }
  return context.defaultValue as T;
}
