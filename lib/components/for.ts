import { isObservable, of, Observable, BehaviorSubject } from "rxjs";
import type { Child, VNode, Props, RenderChild } from "../types";
import { flushMounts } from "../dom/render";
import { getActiveCleanups, setActiveCleanups } from "../reactivity/scope";
import { clearBetween, runCleanups } from "../dom/utils";

export const ForTag = Symbol("For");

export type KeyFn<T> = (item: T, index: number) => unknown;

export type ForProps<T = unknown> = Props & {
  each: Observable<T[]> | T[];
  by?: KeyFn<T> | (T extends object ? keyof T : never) | string;
  fallback?: Child;
  children: (item: T, index: Observable<number>) => Child;
};

export function For<T>(props: {
  each: Observable<T[]> | T[];
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
  by: KeyFn<T> | string | number | symbol | undefined,
  item: T,
  index: number,
): unknown {
  if (by === undefined) return item;
  if (typeof by === "function") return by(item, index);
  if (item != null && typeof item === "object") {
    return (item as Record<PropertyKey, unknown>)[by as PropertyKey];
  }
  return item;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Compares items by their own enumerable properties so keyed rows keep their
 * DOM nodes when the item is replaced with an equivalent value. Nested values
 * are compared by reference, which is conservative: a new nested reference
 * re-renders the row even if its content is unchanged. Non-plain objects
 * (Date, Map, class instances) are compared by identity only.
 */
function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!Object.is(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}

export function renderFor(
  vnode: VNode & { props: ForProps<unknown> },
  container: Element | DocumentFragment | Node,
  teardowns: (() => void)[] | undefined,
  effectiveNs: string | undefined,
  renderChild: RenderChild,
  errorHandler?: ((err: unknown) => void) | null,
  context?: Map<symbol, unknown>,
): void {
  const props = vnode.props;
  const each = isObservable(props.each) ? props.each : of(props.each);

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
    runCleanups(fallbackDisposers);
    fallbackDisposers = [];
    fallbackNodes.forEach((node) => {
      if (node.parentNode) node.parentNode.removeChild(node);
    });
    fallbackNodes = [];
  };

  const sub = each.subscribe({
    next: (arr) => {
      if (!arr || arr.length === 0) {
        for (const cached of map.values()) {
          runCleanups(cached.disposers);
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
            context,
          );
          fallbackNodes = Array.from(fragment.childNodes);
          endAnchor.parentNode!.insertBefore(fragment, endAnchor);
        }
        flushMounts();
        return;
      }

      clearFallback();

      const keys = new Array<unknown>(arr.length);
      const newKeys = new Set<unknown>();
      for (let i = 0; i < arr.length; i++) {
        const key = resolveKey(props.by as KeyFn<unknown>, arr[i], i);
        keys[i] = key;
        newKeys.add(key);
      }

      for (const key of map.keys()) {
        if (!newKeys.has(key)) {
          const cached = map.get(key);
          if (!cached) continue;
          runCleanups(cached.disposers);
          cached.nodes.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node);
          });
          cached.index$.complete();
          map.delete(key);
        }
      }

      const childFn = props.children;

      let insertPoint: Node = endAnchor;

      for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];
        const key = keys[i];
        const cached = map.get(key);

        if (!cached) {
          if (typeof childFn !== "function") continue;
          const fragment = document.createDocumentFragment();
          const itemDisposers: (() => void)[] = [];
          const index$ = new BehaviorSubject(i);
          const prevCleanups = getActiveCleanups();
          setActiveCleanups(itemDisposers);
          let childVNode: Child;
          try {
            childVNode = childFn(item, index$.asObservable());
          } finally {
            setActiveCleanups(prevCleanups);
          }
          renderChild(
            childVNode,
            fragment,
            itemDisposers,
            effectiveNs,
            errorHandler,
            context,
          );

          const nodes = Array.from(fragment.childNodes);

          insertPoint.parentNode!.insertBefore(fragment, insertPoint);
          map.set(key, { item, nodes, disposers: itemDisposers, index$ });

          if (nodes.length > 0 && nodes[0]) {
            insertPoint = nodes[0];
          }
        } else if (!shallowEqual(cached.item, item)) {
          if (typeof childFn !== "function") continue;
          runCleanups(cached.disposers);
          cached.nodes.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node);
          });
          cached.index$.next(i);

          const fragment = document.createDocumentFragment();
          const itemDisposers: (() => void)[] = [];
          const prevCleanups = getActiveCleanups();
          setActiveCleanups(itemDisposers);
          let childVNode: Child;
          try {
            childVNode = childFn(item, cached.index$.asObservable());
          } finally {
            setActiveCleanups(prevCleanups);
          }
          renderChild(
            childVNode,
            fragment,
            itemDisposers,
            effectiveNs,
            errorHandler,
            context,
          );

          const nodes = Array.from(fragment.childNodes);

          insertPoint.parentNode!.insertBefore(fragment, insertPoint);
          cached.item = item;
          cached.nodes = nodes;
          cached.disposers = itemDisposers;

          if (nodes.length > 0 && nodes[0]) {
            insertPoint = nodes[0];
          }
        } else {
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
    },
    error: (err) => {
      if (errorHandler) errorHandler(err);
      else console.error("[reax] Unhandled observable error in <For>:", err);
    },
  });

  if (teardowns) {
    teardowns.push(() => {
      sub.unsubscribe();
      clearFallback();
      for (const cached of map.values()) {
        runCleanups(cached.disposers);
        cached.index$.complete();
      }
      clearBetween(startAnchor, endAnchor);
    });
  }
}
