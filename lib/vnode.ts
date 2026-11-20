import type { Tag, VNode, Child } from "./types";

export function createVNode(
  tag: Tag,
  props: Record<string, unknown> | null,
  key?: unknown,
  extra?: Record<string, unknown>,
): VNode {
  const { children, ...rest } = props ?? {};
  return {
    tag,
    props: {
      ...rest,
      ...extra,
      children: children as Child,
    },
    key,
  };
}
