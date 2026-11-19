import { combineLatest, Observable, isObservable } from "rxjs";
import type { Child, VNode, Props } from "../types";
import { flushMounts } from "../dom/render";

export const SwitchTag = Symbol("Switch");
export const MatchTag = Symbol("Match");

export type SwitchProps = Props & {
  fallback?: Child;
};

export type MatchProps = Props & {
  when: Observable<boolean>;
};

export function Switch(props: SwitchProps): VNode {
  return { tag: SwitchTag, props };
}

export function Match(props: MatchProps): VNode {
  return { tag: MatchTag, props };
}

export function isSwitchNode(
  vnode: VNode,
): vnode is VNode & { props: SwitchProps } {
  return vnode.tag === SwitchTag;
}

export function isMatchNode(
  vnode: VNode,
): vnode is VNode & { props: MatchProps } {
  return vnode.tag === MatchTag;
}

export function renderSwitch(
  vnode: VNode & { props: SwitchProps },
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
      vnodes.push(c as VNode);
    }
  }
  if (vnodes.length === 0) return;

  const subs: {
    match: VNode & { props: MatchProps };
    when: Observable<boolean>;
  }[] = [];

  for (const childNode of vnodes) {
    const match =
      typeof childNode.tag === "function"
        ? childNode.tag(childNode.props)
        : childNode;
    if (match === null || typeof match !== "object" || !("tag" in match)) {
      continue;
    }
    if (!isMatchNode(match)) continue;

    const when = match.props.when;
    if (!isObservable(when)) continue;
    subs.push({ match, when });
  }

  const startAnchor = document.createComment("switch-start");
  const endAnchor = document.createComment("switch-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  const map = new Map<number, { nodes: Node[]; disposers: (() => void)[] }>();
  const sub = combineLatest(subs.map((s) => s.when)).subscribe((arr) => {
    const index = arr.findIndex((x) => x === true);

    for (const [key, value] of map) {
      if (key !== index) {
        value.disposers.forEach((fn) => fn());
        value.nodes.forEach((node) => {
          if (node.parentNode) node.parentNode.removeChild(node);
        });
        map.delete(key);
      }
    }
    if (map.has(index)) return;

    const fragment = document.createDocumentFragment();
    const disposers: (() => void)[] = [];

    if (index !== -1) {
      const matchEntry = subs[index];
      if (matchEntry) {
        renderChild(
          matchEntry.match.props.children as Child,
          fragment,
          disposers,
          effectiveNs,
        );
      }
    } else if (vnode.props.fallback !== undefined) {
      renderChild(vnode.props.fallback, fragment, disposers, effectiveNs);
    }

    const nodes = Array.from(fragment.childNodes);
    endAnchor.parentNode!.insertBefore(fragment, endAnchor);
    map.set(index, { nodes, disposers });
    flushMounts();
  });

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
}
