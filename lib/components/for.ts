import { isObservable, Observable, BehaviorSubject } from "rxjs";
import type { Child, VNode, Props } from "../types";
import { flushMounts } from "../dom/render";

export const ForTag = Symbol("For");

export type KeyFn<T> = (item: T, index: number) => unknown;

export type ForProps<T = unknown> = Props & {
  each: Observable<T[]>;
  by?: KeyFn<T> | (T extends object ? keyof T : never) | string;
  fallback?: Child;
  children:
    | ((item: T, index: Observable<number>) => Child)
    | ((item: T, index: Observable<number>) => Child)[];
};

export function For<T>(props: {
  each: Observable<T[]>;
  by?: KeyFn<T> | (T extends object ? keyof T : never) | string;
  fallback?: Child;
  children: (item: T, index: Observable<number>) => Child;
}): VNode {
  return { tag: ForTag, props: props as Props };
}

export function isForNode(
  vnode: VNode,
): vnode is VNode & { props: ForProps<unknown> } {
  return vnode.tag === ForTag;
}

function resolveKey<T>(
  by: KeyFn<T> | string | undefined,
  item: T,
  index: number,
): unknown {
  if (typeof by === "function") return by(item, index);
  if (typeof by === "string" && item != null && typeof item === "object") {
    return (item as Record<string, unknown>)[by];
  }
  return item;
}

export function renderFor(
  vnode: VNode & { props: ForProps<unknown> },
  container: Element | DocumentFragment | Node,
  teardowns: (() => void)[] | undefined,
  effectiveNs: string | undefined,
  renderChild: (
    child: Child,
    container: Element | DocumentFragment | Node,
    teardowns?: (() => void)[],
    ns?: string,
    errorHandler?: ((err: unknown) => void) | null,
  ) => void,
  errorHandler?: ((err: unknown) => void) | null,
): void {
  const props = vnode.props;
  if (!isObservable(props.each)) return;

  const startAnchor = document.createComment("for-start");
  const endAnchor = document.createComment("for-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  const map = new Map<
    unknown,
    {
      item: unknown;
      nodes: Node[];
      disposers: (() => void)[];
      index$: BehaviorSubject<number>;
    }
  >();

  let fallbackNodes: Node[] = [];
  let fallbackDisposers: (() => void)[] = [];

  const clearFallback = () => {
    fallbackDisposers.forEach((fn) => fn());
    fallbackDisposers = [];
    fallbackNodes.forEach((node) => {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
    fallbackNodes = [];
  };

  const sub = props.each.subscribe((arr) => {
    if (!arr || arr.length === 0) {
      for (const cached of map.values()) {
        cached.disposers.forEach((fn) => fn());
        cached.nodes.forEach((node) => {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        cached.index$.complete();
      }
      map.clear();

      if (props.fallback !== undefined && fallbackNodes.length === 0) {
        const fragment = document.createDocumentFragment();
        renderChild(
          props.fallback,
          fragment,
          fallbackDisposers,
          effectiveNs,
          errorHandler,
        );
        fallbackNodes = Array.from(fragment.childNodes);
        endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      }
      return;
    }

    clearFallback();

    const newKeys = new Set<unknown>();
    for (let i = 0; i < arr.length; i++) {
      newKeys.add(resolveKey(props.by as KeyFn<unknown>, arr[i], i));
    }

    for (const key of map.keys()) {
      if (!newKeys.has(key)) {
        const cached = map.get(key);
        if (!cached) continue;
        cached.disposers.forEach((fn) => fn());
        cached.nodes.forEach((node) => {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        cached.index$.complete();
        map.delete(key);
      }
    }

    let insertPoint: Node = endAnchor;

    for (let i = arr.length - 1; i >= 0; i--) {
      const item = arr[i];
      const key = resolveKey(props.by as KeyFn<unknown>, item, i);

      if (!map.has(key)) {
        const fragment = document.createDocumentFragment();
        const itemDisposers: (() => void)[] = [];
        const index$ = new BehaviorSubject(i);
        const childFn = Array.isArray(props.children)
          ? props.children[0]
          : props.children;
        if (typeof childFn !== "function") continue;
        const childVNode = childFn(item, index$.asObservable());
        renderChild(
          childVNode,
          fragment,
          itemDisposers,
          effectiveNs,
          errorHandler,
        );

        const nodes = Array.from(fragment.childNodes);

        insertPoint.parentNode!.insertBefore(fragment, insertPoint);
        map.set(key, { item, nodes, disposers: itemDisposers, index$ });

        if (nodes.length > 0 && nodes[0]) {
          insertPoint = nodes[0];
        }
      } else {
        const cached = map.get(key);
        if (!cached) continue;
        cached.item = item;
        cached.index$.next(i);
        cached.nodes.forEach((node: Node) =>
          insertPoint.parentNode!.insertBefore(node, insertPoint),
        );
        if (cached.nodes.length > 0 && cached.nodes[0]) {
          insertPoint = cached.nodes[0];
        }
      }
    }
    flushMounts();
  });

  if (teardowns) {
    teardowns.push(() => {
      sub.unsubscribe();
      clearFallback();
      for (const cached of map.values()) {
        cached.disposers.forEach((fn: () => void) => fn());
        cached.index$.complete();
      }
      if (startAnchor.parentNode) {
        while (
          startAnchor.nextSibling &&
          startAnchor.nextSibling !== endAnchor
        ) {
          startAnchor.parentNode.removeChild(startAnchor.nextSibling);
        }
      }
    });
  }
}
