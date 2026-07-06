import { isObservable, Observable } from "rxjs";
import type { Child, VNode, Tag, Props } from "./types.ts";

export const Fragment = Symbol("Fragment");

const ShowTag = Symbol("Show");
export function Show(props: Props & { when: Observable<boolean> }): VNode {
  return { tag: ShowTag, props };
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
