import { isObservable, Observable, BehaviorSubject } from "rxjs";
import type { Child, VNode, Props } from "../types.ts";

export const ForTag = Symbol("For");

export type ForProps<T = unknown> = Props & {
  each: Observable<T[]>;
  fallback?: Child;
  children:
    | ((item: T, index: Observable<number>) => Child)
    | ((item: T, index: Observable<number>) => Child)[];
};

export function For<T>(props: {
  each: Observable<T[]>;
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
  ) => void,
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
        renderChild(props.fallback, fragment, fallbackDisposers, effectiveNs);
        fallbackNodes = Array.from(fragment.childNodes);
        endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      }
      return;
    }

    clearFallback();

    for (const item of map.keys()) {
      if (!arr.includes(item)) {
        const cached = map.get(item);
        if (!cached) continue;
        cached.disposers.forEach((fn) => fn());
        cached.nodes.forEach((node) => {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        cached.index$.complete();
        map.delete(item);
      }
    }

    let insertPoint: Node = endAnchor;

    for (let i = arr.length - 1; i >= 0; i--) {
      const item = arr[i];

      if (!map.has(item)) {
        const fragment = document.createDocumentFragment();
        const itemDisposers: (() => void)[] = [];
        const index$ = new BehaviorSubject(i);
        const childFn = Array.isArray(props.children)
          ? props.children[0]
          : props.children;
        if (typeof childFn !== "function") continue;
        const childVNode = childFn(item, index$.asObservable());
        renderChild(childVNode, fragment, itemDisposers, effectiveNs);

        const nodes = Array.from(fragment.childNodes);

        insertPoint.parentNode!.insertBefore(fragment, insertPoint);
        map.set(item, { nodes, disposers: itemDisposers, index$ });

        if (nodes.length > 0 && nodes[0]) {
          insertPoint = nodes[0];
        }
      } else {
        const cached = map.get(item);

        if (!cached) continue;
        cached.index$.next(i);
        cached.nodes.forEach((node: Node) =>
          insertPoint.parentNode!.insertBefore(node, insertPoint),
        );
        if (cached.nodes.length > 0 && cached.nodes[0]) {
          insertPoint = cached.nodes[0];
        }
      }
    }
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
