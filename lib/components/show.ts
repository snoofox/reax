import { isObservable, of, Observable } from "rxjs";
import type { Child, VNode, Props, RenderChild } from "../types";
import { flushMounts } from "../dom/render";
import { clearBetween, runCleanups } from "../dom/utils";

export const ShowTag = Symbol("Show");

export type ShowProps = Props & {
  when: Observable<boolean> | boolean;
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
  renderChild: RenderChild,
  errorHandler?: ((err: unknown) => void) | null,
  context?: Map<symbol, unknown>,
): void {
  const when = isObservable(vnode.props.when)
    ? vnode.props.when
    : of(vnode.props.when);

  const startAnchor = document.createComment("show-start");
  const endAnchor = document.createComment("show-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  let currentBranch: boolean | null = null;
  let disposers: (() => void)[] = [];

  const sub = when.subscribe({
    next: (next) => {
      const nextBranch = Boolean(next);
      if (currentBranch === nextBranch) return;
      currentBranch = nextBranch;

      runCleanups(disposers);
      disposers = [];
      clearBetween(startAnchor, endAnchor);

      const fragment = document.createDocumentFragment();

      if (nextBranch) {
        renderChild(
          vnode.props.children as Child,
          fragment,
          disposers,
          effectiveNs,
          errorHandler,
          context,
        );
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

      endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      flushMounts();
    },
    error: (err) => {
      if (errorHandler) errorHandler(err);
      else console.error("[reax] Unhandled observable error in <Show>:", err);
    },
  });

  if (teardowns) {
    teardowns.push(() => {
      sub.unsubscribe();
      runCleanups(disposers);
      clearBetween(startAnchor, endAnchor);
    });
  }
}
