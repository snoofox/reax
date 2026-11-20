import { isObservable } from "rxjs";
import { runCleanups } from "./utils";

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

export function createElementWithNS(tag: string, ns?: string): Element {
  if (tag === "svg" || ns === SVG_NS) return document.createElementNS(SVG_NS, tag);
  if (tag === "math" || ns === MATHML_NS) return document.createElementNS(MATHML_NS, tag);
  return document.createElement(tag);
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
    if (teardowns) teardowns.push(() => (ref as (node: Element | null) => void)(null));
    return;
  }
  if (ref != null && typeof ref === "object") {
    if ("set" in ref && typeof (ref as { set: unknown }).set === "function") {
      (ref as { set(node: Element): void }).set(el);
      if (teardowns) {
        teardowns.push(() => (ref as { set(node: Element | null): void }).set(null));
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

  const str =
    typeof val === "number" && !UNITLESS_PROPERTIES.has(prop)
      ? `${val}px`
      : String(val);

  if (prop.startsWith("--")) {
    el.style.setProperty(prop, str);
  } else if (prop in el.style) {
    (el.style as unknown as Record<string, string>)[prop] = str;
  } else {
    el.style.setProperty(toKebabCase(prop), str);
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
    const nextKeys = new Set(Object.keys(val as Record<string, unknown>));
    const prevKeys = prevStyleKeysMap.get(el);

    if (prevKeys) {
      for (const k of prevKeys) {
        if (!nextKeys.has(k)) {
          el.style.removeProperty(k.startsWith("--") ? k : toKebabCase(k));
        }
      }
    }
    prevStyleKeysMap.set(el, nextKeys);

    for (const [prop, propVal] of Object.entries(
      val as Record<string, unknown>,
    )) {
      if (isObservable(propVal)) {
        const sub = propVal.subscribe((v) => applyStyleProp(el, prop, v));
        if (teardowns) teardowns.push(() => sub.unsubscribe());
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

function applyBooleanState(
  el: Element,
  key: string,
  prop: string,
  val: unknown,
): void {
  const bool = Boolean(val);
  const record = el as unknown as Record<string, unknown>;
  if (record[prop] !== bool) record[prop] = bool;
  if (bool) el.setAttribute(key, "");
  else el.removeAttribute(key);
}

export function applyAttributeOrProperty(
  el: Element,
  key: string,
  val: unknown,
  teardowns?: (() => void)[],
): void {
  if (key === "className") key = "class";

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
    const str = val == null ? "" : String(val);
    if (el.value !== str) el.value = str;
    return;
  }

  if (key === "checked" && el instanceof HTMLInputElement) {
    applyBooleanState(el, key, "checked", val);
    return;
  }

  if (key === "selected" && el instanceof HTMLOptionElement) {
    applyBooleanState(el, key, "selected", val);
    return;
  }

  if (key === "muted" && el instanceof HTMLMediaElement) {
    applyBooleanState(el, key, "muted", val);
    return;
  }

  if (typeof val === "boolean") {
    if (val) el.setAttribute(key, "");
    else el.removeAttribute(key);
    if (!(el instanceof SVGElement) && key in el) {
      try {
        (el as unknown as Record<string, unknown>)[key] = val;
      } catch {}
    }
    return;
  }

  if (val == null) {
    el.removeAttribute(key);
    return;
  }

  el.setAttribute(key, String(val));
}

const prevClassListKeysMap = new WeakMap<Element, Set<string>>();

export function applyClassList(
  el: Element,
  val: unknown,
  teardowns?: (() => void)[],
): void {
  const prevClasses = prevClassListKeysMap.get(el);

  if (val == null || typeof val !== "object") {
    if (prevClasses) {
      for (const name of prevClasses) {
        el.classList.remove(name);
      }
      prevClassListKeysMap.delete(el);
    }
    return;
  }

  const currentClasses = new Set<string>();

  for (const [cls, boolOrObs] of Object.entries(
    val as Record<string, unknown>,
  )) {
    const classNames = cls.trim().split(/\s+/).filter(Boolean);
    if (classNames.length === 0) continue;

    for (const name of classNames) {
      currentClasses.add(name);
    }

    if (isObservable(boolOrObs)) {
      const sub = boolOrObs.subscribe((active) => {
        const bool = Boolean(active);
        for (const name of classNames) {
          el.classList.toggle(name, bool);
        }
      });
      if (teardowns) teardowns.push(() => sub.unsubscribe());
    } else {
      const bool = Boolean(boolOrObs);
      for (const name of classNames) {
        el.classList.toggle(name, bool);
      }
    }
  }

  if (prevClasses) {
    for (const name of prevClasses) {
      if (!currentClasses.has(name)) {
        el.classList.remove(name);
      }
    }
  }
  prevClassListKeysMap.set(el, currentClasses);
}

export function setProp(
  el: Element,
  key: string,
  val: unknown,
  teardowns?: (() => void)[],
  onError?: ((err: unknown) => void) | null,
): void {
  if (key === "children" || key === "__self" || key === "__source") return;

  if (key === "ref") {
    applyRef(el, val, teardowns);
    return;
  }

  if (key === "classList") {
    if (isObservable(val)) {
      let currentTeardowns: (() => void)[] = [];
      const sub = val.subscribe({
        next: (nextObj) => {
          runCleanups(currentTeardowns);
          currentTeardowns = [];
          applyClassList(el, nextObj, currentTeardowns);
        },
        error: (err) => {
          if (onError) onError(err);
          else console.error(`[reax] Unhandled observable error in prop "classList":`, err);
        },
      });
      if (teardowns) {
        teardowns.push(() => {
          sub.unsubscribe();
          runCleanups(currentTeardowns);
        });
      }
      return;
    }
    applyClassList(el, val, teardowns);
    return;
  }

  if (key === "style" && isObservable(val)) {
    let currentTeardowns: (() => void)[] = [];
    const sub = val.subscribe({
      next: (nextStyle) => {
        runCleanups(currentTeardowns);
        currentTeardowns = [];
        applyStyle(el, nextStyle, currentTeardowns);
      },
      error: (err) => {
        if (onError) onError(err);
        else console.error(`[reax] Unhandled observable error in prop "style":`, err);
      },
    });
    if (teardowns) {
      teardowns.push(() => {
        sub.unsubscribe();
        runCleanups(currentTeardowns);
      });
    }
    return;
  }

  if (/^on[A-Z]/.test(key)) {
    const eventName = key.slice(2).toLowerCase();
    if (typeof val === "function" && !isObservable(val)) {
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
      const sub = val.subscribe({
        next: (next) => {
          currentHandler =
            typeof next === "function" ? (next as (e: Event) => void) : null;
        },
        error: (err) => {
          if (onError) onError(err);
          else console.error(`[reax] Unhandled observable error in event "${key}":`, err);
        },
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
    const sub = val.subscribe({
      next: (next) => {
        applyAttributeOrProperty(el, key, next, teardowns);
      },
      error: (err) => {
        if (onError) onError(err);
        else console.error(`[reax] Unhandled observable error in prop "${key}":`, err);
      },
    });
    if (teardowns) teardowns.push(() => sub.unsubscribe());
    return;
  }

  applyAttributeOrProperty(el, key, val, teardowns);
}
