import type { Child, VNode, Props } from "../types";
import { flushMounts } from "../dom/render";

export const ErrorBoundaryTag = Symbol("ErrorBoundary");

export type ErrorBoundaryProps = Props & {
  fallback: Child | ((err: unknown, reset: () => void) => Child);
};

export function ErrorBoundary(props: ErrorBoundaryProps): VNode {
  return { tag: ErrorBoundaryTag, props };
}

export function isErrorBoundaryNode(
  vnode: VNode,
): vnode is VNode & { props: ErrorBoundaryProps } {
  return vnode.tag === ErrorBoundaryTag;
}

export function renderErrorBoundary(
  vnode: VNode & { props: ErrorBoundaryProps },
  container: Element | DocumentFragment | Node,
  teardowns: (() => void)[] | undefined,
  effectiveNs: string | undefined,
  renderChild: (
    child: Child,
    container: Element | DocumentFragment | Node,
    teardowns?: (() => void)[],
    ns?: string,
    errorHandler?: ((err: unknown) => void) | null,
  ) => void,
  parentErrorHandler?: ((err: unknown) => void) | null,
): void {
  const startAnchor = document.createComment("error-boundary-start");
  const endAnchor = document.createComment("error-boundary-end");
  container.appendChild(startAnchor);
  container.appendChild(endAnchor);

  let activeDisposers: (() => void)[] = [];
  let isHandled = false;

  const clearBetween = () => {
    activeDisposers.forEach((fn) => fn());
    activeDisposers = [];
    if (startAnchor.parentNode) {
      while (
        startAnchor.nextSibling &&
        startAnchor.nextSibling !== endAnchor
      ) {
        startAnchor.parentNode.removeChild(startAnchor.nextSibling);
      }
    }
  };

  const handleError = (err: unknown) => {
    if (isHandled) return;
    isHandled = true;

    clearBetween();

    const reset = () => {
      isHandled = false;
      renderContent();
    };

    const fallbackChild =
      typeof vnode.props.fallback === "function"
        ? (vnode.props.fallback as (e: unknown, r: () => void) => Child)(
            err,
            reset,
          )
        : vnode.props.fallback;

    const fragment = document.createDocumentFragment();
    renderChild(
      fallbackChild,
      fragment,
      activeDisposers,
      effectiveNs,
      parentErrorHandler,
    );
    endAnchor.parentNode!.insertBefore(fragment, endAnchor);
    flushMounts();
  };

  const renderContent = () => {
    clearBetween();
    try {
      const fragment = document.createDocumentFragment();
      renderChild(
        vnode.props.children as Child,
        fragment,
        activeDisposers,
        effectiveNs,
        handleError,
      );
      endAnchor.parentNode!.insertBefore(fragment, endAnchor);
      flushMounts();
    } catch (err) {
      handleError(err);
    }
  };

  renderContent();

  if (teardowns) {
    teardowns.push(() => {
      clearBetween();
    });
  }
}
