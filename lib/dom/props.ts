import { isObservable } from "rxjs";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const MATHML_NS = "http://www.w3.org/1998/Math/MathML";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

const UNITLESS_PROPERTIES = new Set<string>([
  "animationIterationCount",
  "aspectRatio",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridArea",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "fontWeight",
  "lineClamp",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
]);

export function createElementWithNS(tag: string, currentNs?: string): Element {
  if (tag === "svg") {
    return document.createElementNS(SVG_NS, tag);
  }
  if (tag === "math") {
    return document.createElementNS(MATHML_NS, tag);
  }
  if (currentNs === SVG_NS) {
    return document.createElementNS(SVG_NS, tag);
  }
  if (currentNs === MATHML_NS) {
    return document.createElementNS(MATHML_NS, tag);
  }
  return document.createElement(tag);
}

function isUnitlessNumber(name: string): boolean {
  return UNITLESS_PROPERTIES.has(name);
}

function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function applyRef(
  el: Element,
  ref: unknown,
  teardowns?: (() => void)[],
): void {
  if (typeof ref === "function") {
    (ref as (node: Element) => void)(el);
    if (teardowns) {
      teardowns.push(() => (ref as (node: Element | null) => void)(null));
    }
  } else if (ref != null && typeof ref === "object") {
    if ("set" in ref && typeof (ref as { set: unknown }).set === "function") {
      (ref as { set(node: Element): void }).set(el);
      if (teardowns) {
        teardowns.push(() =>
          (ref as { set(node: Element | null): void }).set(null),
        );
      }
    } else if ("current" in ref) {
      (ref as { current: unknown }).current = el;
      if (teardowns) {
        teardowns.push(() => {
          (ref as { current: unknown }).current = null;
        });
      }
    }
  }
}

export function applyStyleProp(
  el: HTMLElement | SVGElement,
  prop: string,
  val: unknown,
): void {
  if (val == null || val === false) {
    el.style.removeProperty(prop.startsWith("--") ? prop : toKebabCase(prop));
    return;
  }

  const strVal =
    typeof val === "number" && !isUnitlessNumber(prop)
      ? `${val}px`
      : String(val);

  if (prop.startsWith("--")) {
    el.style.setProperty(prop, strVal);
  } else if (prop in el.style) {
    (el.style as unknown as Record<string, string>)[prop] = strVal;
  } else {
    el.style.setProperty(toKebabCase(prop), strVal);
  }
}

const prevStyleKeysMap = new WeakMap<Element, Set<string>>();

export function applyStyle(
  el: Element,
  val: unknown,
  teardowns?: (() => void)[],
): void {
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return;

  if (typeof val === "string") {
    prevStyleKeysMap.delete(el);
    el.setAttribute("style", val);
    return;
  }

  if (val != null && typeof val === "object") {
    const currentKeys = new Set(Object.keys(val as Record<string, unknown>));
    const prevKeys = prevStyleKeysMap.get(el);

    if (prevKeys) {
      for (const key of prevKeys) {
        if (!currentKeys.has(key)) {
          el.style.removeProperty(
            key.startsWith("--") ? key : toKebabCase(key),
          );
        }
      }
    }
    prevStyleKeysMap.set(el, currentKeys);

    for (const [prop, propVal] of Object.entries(
      val as Record<string, unknown>,
    )) {
      if (isObservable(propVal)) {
        const sub = propVal.subscribe((v) => {
          applyStyleProp(el, prop, v);
        });
        if (teardowns) {
          teardowns.push(() => sub.unsubscribe());
        }
      } else {
        applyStyleProp(el, prop, propVal);
      }
    }
    return;
  }

  if (val == null) {
    prevStyleKeysMap.delete(el);
    el.removeAttribute("style");
  }
}

export function applyAttributeOrProperty(
  el: Element,
  key: string,
  val: unknown,
  teardowns?: (() => void)[],
): void {
  if (key === "className") {
    key = "class";
  }

  if (key === "style") {
    applyStyle(el, val, teardowns);
    return;
  }

  if (
    key === "dangerouslySetInnerHTML" &&
    val != null &&
    typeof val === "object" &&
    "__html" in val
  ) {
    el.innerHTML = String((val as { __html: unknown }).__html ?? "");
    return;
  }

  if (key === "innerHTML") {
    el.innerHTML = val == null ? "" : String(val);
    return;
  }

  if (key === "xlinkHref" || key === "xlink:href") {
    el.setAttributeNS(XLINK_NS, "xlink:href", String(val));
    return;
  }

  if (
    key === "value" &&
    (el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement ||
      el instanceof HTMLSelectElement)
  ) {
    const strVal = val == null ? "" : String(val);
    if (el.value !== strVal) {
      el.value = strVal;
    }
    return;
  }

  if (key === "checked" && el instanceof HTMLInputElement) {
    const boolVal = Boolean(val);
    if (el.checked !== boolVal) {
      el.checked = boolVal;
    }
    if (boolVal) {
      el.setAttribute("checked", "");
    } else {
      el.removeAttribute("checked");
    }
    return;
  }

  if (key === "selected" && el instanceof HTMLOptionElement) {
    const boolVal = Boolean(val);
    el.selected = boolVal;
    if (boolVal) {
      el.setAttribute("selected", "");
    } else {
      el.removeAttribute("selected");
    }
    return;
  }

  if (key === "muted" && el instanceof HTMLMediaElement) {
    const boolVal = Boolean(val);
    el.muted = boolVal;
    if (boolVal) {
      el.setAttribute("muted", "");
    } else {
      el.removeAttribute("muted");
    }
    return;
  }

  if (typeof val === "boolean") {
    if (val) {
      el.setAttribute(key, "");
      if (!(el instanceof SVGElement) && key in el) {
        try {
          (el as unknown as Record<string, unknown>)[key] = true;
        } catch {
          // Ignore read-only properties
        }
      }
    } else {
      el.removeAttribute(key);
      if (!(el instanceof SVGElement) && key in el) {
        try {
          (el as unknown as Record<string, unknown>)[key] = false;
        } catch {
          // Ignore read-only properties
        }
      }
    }
    return;
  }

  if (val == null) {
    el.removeAttribute(key);
    return;
  }

  el.setAttribute(key, String(val));
}

export function setProp(
  el: Element,
  key: string,
  val: unknown,
  teardowns?: (() => void)[],
): void {
  if (key === "children" || key === "__self" || key === "__source") return;

  if (key === "ref") {
    applyRef(el, val, teardowns);
    return;
  }

  if (key.startsWith("on")) {
    const eventName = key.slice(2).toLowerCase();
    if (typeof val === "function") {
      const handler = val as (e: Event) => void;
      el.addEventListener(eventName, handler);
      if (teardowns) {
        teardowns.push(() => el.removeEventListener(eventName, handler));
      }
      return;
    }
    if (isObservable(val)) {
      let currentHandler: ((e: Event) => void) | null = null;
      const listener = (e: Event) => {
        if (currentHandler) currentHandler(e);
      };
      el.addEventListener(eventName, listener);
      const sub = val.subscribe((next) => {
        currentHandler =
          typeof next === "function" ? (next as (e: Event) => void) : null;
      });
      if (teardowns) {
        teardowns.push(() => {
          sub.unsubscribe();
          el.removeEventListener(eventName, listener);
        });
      }
      return;
    }
  }

  if (isObservable(val)) {
    const sub = val.subscribe((next) => {
      applyAttributeOrProperty(el, key, next, teardowns);
    });
    if (teardowns) {
      teardowns.push(() => sub.unsubscribe());
    }
    return;
  }

  applyAttributeOrProperty(el, key, val, teardowns);
}
