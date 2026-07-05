import { isObservable, Observable } from "rxjs";
import type { Child, VNode, Tag } from "./types.ts";

export const Fragment = Symbol("Fragment");
export const Show = Symbol("Show");

export function h(
  tag: Tag,
  props: Record<string, unknown> | null,
  ...children: Child[]
): VNode {
  return {
    tag,
    props: {
      ...props,
      children: (children as any[])
        .flat(Infinity)
        .filter((c) => c != null) as Child[],
    },
  };
}

export function render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
): void {
  if (vnode == null || typeof vnode === "boolean") return;

  if (Array.isArray(vnode)) {
    for (const child of vnode) {
      render(child, container);
    }
    return;
  }

  if (isObservable(vnode)) {
    const node = document.createTextNode("");
    vnode.subscribe((next) => (node.nodeValue = String(next)));
    container.appendChild(node);
    return;
  }

  if (typeof vnode !== "object") {
    container.appendChild(document.createTextNode(String(vnode)));
    return;
  }

  if (vnode.tag === Fragment) {
    for (const child of vnode.props.children ?? []) {
      render(child, container);
    }
    return;
  }

  if (vnode.tag === Show) {
    if (!isObservable(vnode.props.when)) return;
    const startAnchor = document.createComment("<!-- show-start -->");
    const endAnchor = document.createComment("<!-- show-end -->");
    container.appendChild(startAnchor);
    container.appendChild(endAnchor);

    vnode.props.when.subscribe((next) => {
      if (next) {
        const fragment = document.createDocumentFragment();
        render(vnode.props.children, fragment);

        container.insertBefore(fragment, endAnchor);
      } else {
        while (
          startAnchor.nextSibling &&
          startAnchor.nextSibling !== endAnchor
        ) {
          container.removeChild(startAnchor.nextSibling);
        }
      }
    });
    return;
  }

  if (typeof vnode.tag === "function") {
    render(vnode.tag(vnode.props), container);
    return;
  }

  const el = document.createElement(vnode.tag as string);
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
    if (key === "children" || key === "__self" || key === "__source") continue;
    if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), val as EventListener);
    } else if (isObservable(val)) {
      val.subscribe((next) => el.setAttribute(key, String(next)));
    } else {
      el.setAttribute(key, String(val));
    }
  }
  for (const child of vnode.props.children ?? []) {
    render(child, el);
  }
  container.appendChild(el);
}
