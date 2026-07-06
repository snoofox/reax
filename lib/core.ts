import { isObservable, Observable } from "rxjs";
import type { Child, VNode, Tag, Props } from "./types.ts";

export const Fragment = Symbol("Fragment");

const ShowTag = Symbol("Show");
export function Show(props: Props & { when: Observable<boolean> }): VNode {
  return { tag: ShowTag, props };
}

const ForTag = Symbol("For");
export function For<T>(props: {
  each: Observable<T[]>;
  children: (item: T, index: number) => Child;
}): VNode {
  return { tag: ForTag, props: props as unknown as Props };
}

export function h(
  tag: Tag,
  props: Record<string, unknown> | null,
  ...children: Child[]
): VNode {
  return {
    tag,
    props: {
      ...props,
      children: children.filter((c) => c != null) as Child[],
    },
  };
}

export function render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
  teardowns?: (() => void)[],
): void {
  if (vnode == null || typeof vnode === "boolean") return;

  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      render(child, container, teardowns);
    }
    return;
  }

  if (isObservable(vnode)) {
    const node = document.createTextNode("");
    const sub = vnode.subscribe((next) => (node.nodeValue = String(next)));
    if (teardowns) teardowns.push(() => sub.unsubscribe());
    container.appendChild(node);
    return;
  }

  if (typeof vnode !== "object") {
    container.appendChild(document.createTextNode(String(vnode)));
    return;
  }

  if (vnode.tag === Fragment) {
    const children = Array.isArray(vnode.props.children)
      ? vnode.props.children
      : [vnode.props.children];
    for (const child of children) {
      render(child, container, teardowns);
    }
    return;
  }

  if (vnode.tag === ShowTag) {
    if (!isObservable(vnode.props.when)) return;
    const startAnchor = document.createComment("show-start");
    const endAnchor = document.createComment("show-end");
    container.appendChild(startAnchor);
    container.appendChild(endAnchor);

    let mounted = false;
    let disposers: (() => void)[] = [];

    const sub = vnode.props.when.subscribe((next) => {
      if (next && !mounted) {
        mounted = true;
        const fragment = document.createDocumentFragment();
        render(vnode.props.children, fragment, disposers);

        container.insertBefore(fragment, endAnchor);
      } else if (!next && mounted) {
        mounted = false;
        disposers.forEach((fn) => fn());
        disposers = [];

        while (
          startAnchor.nextSibling &&
          startAnchor.nextSibling !== endAnchor
        ) {
          container.removeChild(startAnchor.nextSibling);
        }
      }
    });

    if (teardowns) {
      teardowns.push(() => {
        sub.unsubscribe();
        disposers.forEach((fn) => fn());
      });
    }
    return;
  }

  if (vnode.tag === ForTag) {
    type ForProps = {
      each: Observable<unknown[]>;
      children: ((item: unknown, index: number) => Child)[];
    };
    const props = vnode.props as unknown as ForProps;
    if (!isObservable(props.each)) return;
    const startAnchor = document.createComment("for-start");
    const endAnchor = document.createComment("for-end");
    container.appendChild(startAnchor);
    container.appendChild(endAnchor);

    const map = new Map<
      unknown,
      { nodes: Node[]; disposers: (() => void)[] }
    >();

    const sub = props.each.subscribe((arr) => {
      for (const item of map.keys()) {
        if (!arr.includes(item)) {
          const cached = map.get(item)!;
          cached.disposers.forEach((fn) => fn());
          cached.nodes.forEach((node) => container.removeChild(node));
          map.delete(item);
        }
      }

      let insertPoint: Node = endAnchor;

      for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];

        if (!map.has(item)) {
          const fragment = document.createDocumentFragment();
          const itemDisposers: (() => void)[] = [];

          const childVNode = props.children[0](item, i);
          render(childVNode, fragment, itemDisposers);

          const nodes = Array.from(fragment.childNodes);

          container.insertBefore(fragment, insertPoint);
          map.set(item, { nodes, disposers: itemDisposers });

          insertPoint = nodes[0];
        } else {
          const cached = map.get(item) as {
            nodes: Node[];
            disposers: (() => void)[];
          };
          cached.nodes.forEach((node: Node) =>
            container.insertBefore(node, insertPoint),
          );
          insertPoint = cached.nodes[0];
        }
      }
    });

    if (teardowns) {
      teardowns.push(() => {
        sub.unsubscribe();
        for (const cached of map.values()) {
          cached.disposers.forEach((fn: () => void) => fn());
        }
      });
    }
    return;
  }

  if (typeof vnode.tag === "function") {
    render(vnode.tag(vnode.props), container, teardowns);
    return;
  }

  const el = document.createElement(vnode.tag as string);
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
    if (key === "children" || key === "__self" || key === "__source") continue;
    if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val as EventListener);
    } else if (isObservable(val)) {
      const sub = val.subscribe((next) => el.setAttribute(key, String(next)));
      if (teardowns) teardowns.push(() => sub.unsubscribe());
    } else {
      el.setAttribute(key, String(val));
    }
  }

  const children = Array.isArray(vnode.props.children)
    ? vnode.props.children
    : [vnode.props.children];

  for (const child of children) {
    render(child, el, teardowns);
  }

  container.appendChild(el);
}
