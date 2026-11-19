import { isObservable, Observable, combineLatest, BehaviorSubject } from "rxjs";
import type { Child, VNode, Tag, Props } from "./types.ts";

export const Fragment = Symbol("Fragment");

const ShowTag = Symbol("Show");
export function Show(props: Props & { when: Observable<boolean> }): VNode {
  return { tag: ShowTag, props };
}
function isShowNode(vnode: VNode): vnode is VNode & { props: { when: Observable<boolean>; children?: Child | Child[] } } {
  return vnode.tag === ShowTag;
}

const ForTag = Symbol("For");
export function For<T>(props: {
  each: Observable<T[]>;
  children: (item: T, index: Observable<number>) => Child;
}): VNode {
  return { tag: ForTag, props };
}
function isForNode(vnode: VNode): vnode is VNode & {
  props: {
    each: Observable<unknown[]>;
    children:
      | ((item: unknown, index: Observable<number>) => Child)
      | ((item: unknown, index: Observable<number>) => Child)[];
  };
} {
  return vnode.tag === ForTag;
}

const SwitchTag = Symbol("Switch");
export function Switch(props: Props & { fallback?: Child }): VNode {
  return { tag: SwitchTag, props };
}
function isSwitchNode(vnode: VNode): vnode is VNode & { props: { fallback?: Child; children?: unknown } } {
  return vnode.tag === SwitchTag;
}

const MatchTag = Symbol("Match");
export function Match(props: Props & { when: Observable<boolean> }): VNode {
  return { tag: MatchTag, props };
}
function isMatchNode(vnode: VNode): vnode is VNode & { props: { when: Observable<boolean>; children?: Child | Child[] } } {
  return vnode.tag === MatchTag;
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
      children: children.filter((c): c is Child => c != null),
    },
  };
}

let _mounts: (() => void)[] = [];
let _unmounts: (() => void)[] | null = null;
let _depth = 0;

export function onMount(fn: () => void) {
  if (_depth === 0) {
    console.warn("[reax] onMount called outside a component. Ignoring.");
    return;
  }
  _mounts.push(fn);
}

export function onUnmount(fn: () => void) {
  if (_unmounts === null) {
    console.warn("[reax] onUnmount called outside a component. Ignoring.");
    return;
  }
  _unmounts.push(fn);
}

function _render(
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

  if (isShowNode(vnode)) {
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

        endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      } else if (!next && mounted) {
        mounted = false;
        disposers.forEach((fn) => fn());
        disposers = [];

        while (
          startAnchor.nextSibling &&
          startAnchor.nextSibling !== endAnchor
        ) {
          startAnchor.parentNode?.removeChild(startAnchor.nextSibling);
        }
      }
    });

    if (teardowns) {
      teardowns.push(() => {
        sub.unsubscribe();
        disposers.forEach((fn) => fn());
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
    return;
  }

  if (isForNode(vnode)) {
    const props = vnode.props;
    if (!isObservable(props.each)) return;
    const startAnchor = document.createComment("for-start");
    const endAnchor = document.createComment("for-end");
    container.appendChild(startAnchor);
    container.appendChild(endAnchor);

    const map = new Map<
      unknown,
      { nodes: Node[]; disposers: (() => void)[]; index$: BehaviorSubject<number> }
    >();

    const sub = props.each.subscribe((arr) => {
      for (const item of map.keys()) {
        if (!arr.includes(item)) {
          const cached = map.get(item);
          if (!cached) continue;
          cached.disposers.forEach((fn) => fn());
          cached.nodes.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node);
          });
          map.delete(item);
        }
      }

      let insertPoint: Node = endAnchor;

      for (let i = arr.length - 1; i >= 0; i--) {
        const item = arr[i];

        if (!map.has(item)) {
          const fragment = document.createDocumentFragment();
          const itemDisposers: (() => void)[] = [];
          const index$ = new BehaviorSubject(i)
          const childFn = Array.isArray(props.children) ? props.children[0] : props.children;
          if (typeof childFn !== "function") continue;
          const childVNode = childFn(item, index$.asObservable());
          render(childVNode, fragment, itemDisposers);

          const nodes = Array.from(fragment.childNodes);

          insertPoint.parentNode!.insertBefore(fragment, insertPoint);
          map.set(item, { nodes, disposers: itemDisposers, index$ });

          insertPoint = nodes[0];
        } else {
          const cached = map.get(item)

          if (!cached) return
          cached.index$.next(i)
          cached.nodes.forEach((node: Node) =>
            insertPoint.parentNode!.insertBefore(node, insertPoint),
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
          cached.index$.complete()
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
    return;
  }

  if (isSwitchNode(vnode)) {
    const rawChildren = vnode.props.children;
    const child = Array.isArray(rawChildren)
      ? rawChildren
      : rawChildren != null
        ? [rawChildren]
        : [];
    if (child.length === 0) return;

    const vnodes: VNode[] = [];
    for (const c of child) {
      if (c !== null && typeof c === "object" && "tag" in c) {
        vnodes.push(c);
      }
    }
    if (vnodes.length === 0) return;

    const subs: { match: VNode & { props: { when: Observable<boolean>; children?: Child | Child[] } }; when: Observable<boolean> }[] = [];

    for (const childNode of vnodes) {
      const match = typeof childNode.tag === "function" ? childNode.tag(childNode.props) : childNode;
      if (match === null || typeof match !== "object" || !("tag" in match)) continue;
      if (!isMatchNode(match)) continue;

      const when = match.props.when;
      if (!isObservable(when)) continue;
      subs.push({ match, when });
    }

    const startAnchor = document.createComment("switch-start");
    const endAnchor = document.createComment("switch-end");
    container.appendChild(startAnchor);
    container.appendChild(endAnchor);

    const map = new Map<number, { nodes: Node[], disposers: (() => void)[] }>()
    const sub = combineLatest(subs.map((sub) => sub.when)).subscribe((arr) => {
      const index = arr.findIndex(x => x === true);

      for (const [key, value] of map) {
        if (key !== index) {
          value.disposers.forEach((fn) => fn())
          value.nodes.forEach((node) => {
            if (node.parentNode) node.parentNode.removeChild(node);
          })
          map.delete(key)
        }
      }
      if (map.has(index)) return;

      const fragment = document.createDocumentFragment();
      let disposers: (() => void)[] = []

      if (index !== -1) {
        const match = subs[index].match;
        render(match.props.children, fragment, disposers);
      } else if (vnode.props.fallback !== undefined) {
        render(vnode.props.fallback, fragment, disposers);
      }

      const nodes = Array.from(fragment.childNodes)
      endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      map.set(index, { nodes, disposers })
    })

    if (teardowns) {
      teardowns.push(() => {
        sub.unsubscribe();
        for (const value of map.values()) {
          value.disposers.forEach((fn) => fn());
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
    return;
  }

  if (typeof vnode.tag === "function") {
    const prev = _unmounts;
    _unmounts = teardowns ?? [];
    try {
      render(vnode.tag(vnode.props), container, _unmounts);
    } finally {
      _unmounts = prev;
    }
    return;
  }

  if (typeof vnode.tag !== "string") return;
  const el = document.createElement(vnode.tag);
  for (const [key, val] of Object.entries(vnode.props ?? {})) {
    if (key === "children" || key === "__self" || key === "__source") continue;
    if (key.startsWith("on") && typeof val === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), (e) => val(e));
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

export function render(
  vnode: Child,
  container: Element | DocumentFragment | Node,
  teardowns?: (() => void)[]) {
  const root = _depth === 0;
  _depth++;

  try {
    _render(vnode, container, teardowns);
  } finally {
    _depth--;
  }

  if (root) {
    const mounts = _mounts.splice(0);
    if (mounts.length > 0) {
      queueMicrotask(() => {
        for (const fn of mounts) fn();
      });
    }
  }
}
