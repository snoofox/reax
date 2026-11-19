import { isObservable, Observable } from "rxjs";
import type { Child, VNode, Props } from "../types";
import { flushMounts } from "../dom/render";

export const ShowTag = Symbol("Show");

export type ShowProps = Props & {
  when: Observable<boolean>;
  fallback?: Child;
};

export function Show(props: ShowProps): VNode {
  return { tag: ShowTag, props };
}

export function isShowNode(
  vnode: VNode,
): vnode is VNode & { props: ShowProps } {
  return vnode.tag === ShowTag;
}

export function renderShow(
  vnode: VNode & { props: ShowProps },
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
  if (!isObservable(vnode.props.when)) return;

  const startAnchor = document.createComment("show-start");
  const endAnchor = document.createComment("show-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  let currentBranch: boolean | null = null;
  let disposers: (() => void)[] = [];

  const sub = vnode.props.when.subscribe((next) => {
    const nextBranch = Boolean(next);
    if (currentBranch === nextBranch) return;
    currentBranch = nextBranch;

    disposers.forEach((fn) => fn());
    disposers = [];

    if (startAnchor.parentNode) {
      while (
        startAnchor.nextSibling &&
        startAnchor.nextSibling !== endAnchor
      ) {
        startAnchor.parentNode.removeChild(startAnchor.nextSibling);
      }
    }

    const fragment = document.createDocumentFragment();

    if (nextBranch) {
      renderChild(vnode.props.children as Child, fragment, disposers, effectiveNs);
    } else if (vnode.props.fallback !== undefined) {
      renderChild(vnode.props.fallback, fragment, disposers, effectiveNs);
    }

    endAnchor.parentNode!.insertBefore(fragment, endAnchor);
    flushMounts();
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
}
