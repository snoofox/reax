import { combineLatest, of, Observable, isObservable } from "rxjs";
import type { Child, VNode, Props, RenderChild } from "../types";
import { flushMounts } from "../dom/render";
import { clearBetween, runCleanups } from "../dom/utils";
import { getActiveContext, setActiveContext } from "../context";
import {
  getActiveCleanups,
  setActiveCleanups,
  getActiveErrorHandler,
  setActiveErrorHandler,
} from "../reactivity/scope";

export const SwitchTag = Symbol("Switch");
export const MatchTag = Symbol("Match");

export type SwitchProps = Props & {
  fallback?: Child;
};

export type MatchProps = Props & {
  when: Observable<boolean> | boolean;
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
  renderChild: RenderChild,
  errorHandler?: ((err: unknown) => void) | null,
  context?: Map<symbol, unknown>,
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

  const matchCleanups: (() => void)[] = [];
  for (const childNode of vnodes) {
    const prevCleanups = getActiveCleanups();
    setActiveCleanups(matchCleanups);
    let match: Child = null;
    let failed = false;
    try {
      if (typeof childNode.tag === "function") {
        const prevContext = getActiveContext();
        const prevErrorHandler = getActiveErrorHandler();
        setActiveContext(context ?? null);
        setActiveErrorHandler(errorHandler ?? null);
        try {
          match = childNode.tag(childNode.props);
        } finally {
          setActiveContext(prevContext);
          setActiveErrorHandler(prevErrorHandler);
        }
      } else {
        match = childNode;
      }
    } catch (err) {
      failed = true;
      if (errorHandler) errorHandler(err);
      else throw err;
    } finally {
      setActiveCleanups(prevCleanups);
    }
    if (failed) continue;

    if (match === null || typeof match !== "object" || !("tag" in match)) {
      continue;
    }
    const matchNode = match as VNode;
    if (!isMatchNode(matchNode)) continue;

    const when = isObservable(matchNode.props.when)
      ? matchNode.props.when
      : of(matchNode.props.when);
    subs.push({ match: matchNode, when });
  }

  if (subs.length === 0) {
    runCleanups(matchCleanups);
    if (vnode.props.fallback !== undefined) {
      renderChild(
        vnode.props.fallback,
        container,
        teardowns,
        effectiveNs,
        errorHandler,
        context,
      );
    }
    return;
  }

  const startAnchor = document.createComment("switch-start");
  const endAnchor = document.createComment("switch-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  const map = new Map<number, { nodes: Node[]; disposers: (() => void)[] }>();
  const sub = combineLatest(subs.map((s) => s.when)).subscribe({
    next: (arr) => {
      const index = arr.findIndex((x) => Boolean(x));

      for (const [key, value] of map) {
        if (key !== index) {
          runCleanups(value.disposers);
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
            errorHandler,
            context,
          );
        }
      } else if (vnode.props.fallback !== undefined) {
        renderChild(
          vnode.props.fallback,
          fragment,
          disposers,
          effectiveNs,
          errorHandler,
          context,
        );
      }

      const nodes = Array.from(fragment.childNodes);
      endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      map.set(index, { nodes, disposers });
      flushMounts();
    },
    error: (err) => {
      if (errorHandler) errorHandler(err);
      else console.error("[reax] Unhandled observable error in <Switch>:", err);
    },
  });

  if (teardowns) {
    teardowns.push(() => {
      sub.unsubscribe();
      runCleanups(matchCleanups);
      for (const value of map.values()) {
        runCleanups(value.disposers);
      }
      clearBetween(startAnchor, endAnchor);
    });
  }
}
