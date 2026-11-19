import type { Observable } from "rxjs";
import type { Child } from "./types";

export type Reactive<T> = T | Observable<T>;

export type RefCallback<T> = (instance: T | null) => void;
export interface RefObject<T> {
  current: T | null;
}
export interface SignalRef<T> {
  set(value: T | null): void;
}
export type Ref<T> = RefCallback<T> | RefObject<T> | SignalRef<T>;

export type StyleProp =
  | string
  | { [key: string]: Reactive<string | number | boolean | null | undefined> };

export type ClassListProp = Record<
  string,
  boolean | undefined | null | Observable<boolean | undefined | null>
>;

export interface DOMAttributes<T = Element> {
  children?: Child;
  key?: unknown;
  ref?: Ref<T>;
  classList?: Reactive<ClassListProp>;
  dangerouslySetInnerHTML?: { __html: unknown };
  innerHTML?: Reactive<string>;

  onAbort?: (e: UIEvent) => void;
  onAnimationEnd?: (e: AnimationEvent) => void;
  onAnimationIteration?: (e: AnimationEvent) => void;
  onAnimationStart?: (e: AnimationEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onChange?: (e: Event) => void;
  onClick?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onDblClick?: (e: MouseEvent) => void;
  onDrag?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
  onDragEnter?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
  onDragOver?: (e: DragEvent) => void;
  onDragStart?: (e: DragEvent) => void;
  onDrop?: (e: DragEvent) => void;
  onError?: (e: UIEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onInput?: (e: Event) => void;
  onInvalid?: (e: Event) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onMouseMove?: (e: MouseEvent) => void;
  onMouseOut?: (e: MouseEvent) => void;
  onMouseOver?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onPointerCancel?: (e: PointerEvent) => void;
  onReset?: (e: Event) => void;
  onScroll?: (e: UIEvent) => void;
  onSubmit?: (e: Event) => void;
  onTouchCancel?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTransitionEnd?: (e: TransitionEvent) => void;
  onWheel?: (e: WheelEvent) => void;
}

export interface HTMLAttributes<T = HTMLElement> extends DOMAttributes<T> {
  id?: Reactive<string>;
  class?: Reactive<string | boolean>;
  className?: Reactive<string | boolean>;
  style?: Reactive<StyleProp>;
  title?: Reactive<string>;
  role?: Reactive<string>;
  tabIndex?: Reactive<number>;
  hidden?: Reactive<boolean>;
  dir?: Reactive<"ltr" | "rtl" | "auto">;
  lang?: Reactive<string>;
  accessKey?: Reactive<string>;
  draggable?: Reactive<boolean>;
  spellCheck?: Reactive<boolean>;
  contentEditable?: Reactive<boolean | "true" | "false">;
  [key: `data-${string}`]: unknown;
  [key: `aria-${string}`]: unknown;
}

export interface ButtonHTMLAttributes extends HTMLAttributes {
  autoFocus?: Reactive<boolean>;
  disabled?: Reactive<boolean>;
  form?: Reactive<string>;
  formAction?: Reactive<string>;
  name?: Reactive<string>;
  type?: Reactive<"submit" | "reset" | "button">;
  value?: Reactive<string | number>;
}

export interface InputHTMLAttributes extends HTMLAttributes {
  accept?: Reactive<string>;
  alt?: Reactive<string>;
  autoComplete?: Reactive<string>;
  autoFocus?: Reactive<boolean>;
  checked?: Reactive<boolean>;
  disabled?: Reactive<boolean>;
  form?: Reactive<string>;
  height?: Reactive<number | string>;
  max?: Reactive<number | string>;
  maxLength?: Reactive<number>;
  min?: Reactive<number | string>;
  minLength?: Reactive<number>;
  multiple?: Reactive<boolean>;
  name?: Reactive<string>;
  pattern?: Reactive<string>;
  placeholder?: Reactive<string>;
  readOnly?: Reactive<boolean>;
  required?: Reactive<boolean>;
  size?: Reactive<number>;
  src?: Reactive<string>;
  step?: Reactive<number | string>;
  type?: Reactive<string>;
  value?: Reactive<string | number | boolean>;
  width?: Reactive<number | string>;
}

export interface AnchorHTMLAttributes extends HTMLAttributes {
  download?: Reactive<unknown>;
  href?: Reactive<string>;
  hrefLang?: Reactive<string>;
  media?: Reactive<string>;
  ping?: Reactive<string>;
  rel?: Reactive<string>;
  target?: Reactive<"_blank" | "_self" | "_parent" | "_top" | string>;
  type?: Reactive<string>;
}

export interface FormHTMLAttributes extends HTMLAttributes {
  acceptCharset?: Reactive<string>;
  action?: Reactive<string>;
  autoComplete?: Reactive<string>;
  encType?: Reactive<string>;
  method?: Reactive<"get" | "post" | "dialog">;
  name?: Reactive<string>;
  noValidate?: Reactive<boolean>;
  target?: Reactive<string>;
}

export interface TextareaHTMLAttributes extends HTMLAttributes {
  autoFocus?: Reactive<boolean>;
  cols?: Reactive<number>;
  disabled?: Reactive<boolean>;
  form?: Reactive<string>;
  maxLength?: Reactive<number>;
  minLength?: Reactive<number>;
  name?: Reactive<string>;
  placeholder?: Reactive<string>;
  readOnly?: Reactive<boolean>;
  required?: Reactive<boolean>;
  rows?: Reactive<number>;
  value?: Reactive<string | number>;
  wrap?: Reactive<string>;
}

export interface SelectHTMLAttributes extends HTMLAttributes {
  autoFocus?: Reactive<boolean>;
  disabled?: Reactive<boolean>;
  form?: Reactive<string>;
  multiple?: Reactive<boolean>;
  name?: Reactive<string>;
  required?: Reactive<boolean>;
  size?: Reactive<number>;
  value?: Reactive<string | number>;
}

export interface OptionHTMLAttributes extends HTMLAttributes {
  disabled?: Reactive<boolean>;
  label?: Reactive<string>;
  selected?: Reactive<boolean>;
  value?: Reactive<string | number>;
}

export interface ImgHTMLAttributes extends HTMLAttributes {
  alt?: Reactive<string>;
  crossOrigin?: Reactive<"anonymous" | "use-credentials" | "">;
  decoding?: Reactive<"async" | "auto" | "sync">;
  height?: Reactive<number | string>;
  loading?: Reactive<"eager" | "lazy">;
  src?: Reactive<string>;
  srcSet?: Reactive<string>;
  width?: Reactive<number | string>;
}

export interface MediaHTMLAttributes<T = HTMLMediaElement> extends HTMLAttributes<T> {
  autoPlay?: Reactive<boolean>;
  controls?: Reactive<boolean>;
  crossOrigin?: Reactive<"anonymous" | "use-credentials" | "">;
  loop?: Reactive<boolean>;
  muted?: Reactive<boolean>;
  preload?: Reactive<"none" | "metadata" | "auto" | "">;
  src?: Reactive<string>;
}

export interface SVGAttributes<T = SVGElement> extends DOMAttributes<T> {
  id?: Reactive<string>;
  class?: Reactive<string | boolean>;
  className?: Reactive<string | boolean>;
  style?: Reactive<StyleProp>;
  viewBox?: Reactive<string>;
  fill?: Reactive<string>;
  stroke?: Reactive<string>;
  strokeWidth?: Reactive<number | string>;
  "stroke-width"?: Reactive<number | string>;
  strokeDasharray?: Reactive<number | string>;
  "stroke-dasharray"?: Reactive<number | string>;
  d?: Reactive<string>;
  cx?: Reactive<number | string>;
  cy?: Reactive<number | string>;
  r?: Reactive<number | string>;
  rx?: Reactive<number | string>;
  ry?: Reactive<number | string>;
  x?: Reactive<number | string>;
  y?: Reactive<number | string>;
  x1?: Reactive<number | string>;
  y1?: Reactive<number | string>;
  x2?: Reactive<number | string>;
  y2?: Reactive<number | string>;
  width?: Reactive<number | string>;
  height?: Reactive<number | string>;
  xmlns?: Reactive<string>;
  xlinkHref?: Reactive<string>;
  "xlink:href"?: Reactive<string>;
  transform?: Reactive<string>;
  points?: Reactive<string>;
  opacity?: Reactive<number | string>;
}

export interface IntrinsicElements {
  a: AnchorHTMLAttributes;
  abbr: HTMLAttributes;
  address: HTMLAttributes;
  area: HTMLAttributes;
  article: HTMLAttributes;
  aside: HTMLAttributes;
  audio: MediaHTMLAttributes;
  b: HTMLAttributes;
  base: HTMLAttributes;
  bdi: HTMLAttributes;
  bdo: HTMLAttributes;
  blockquote: HTMLAttributes;
  body: HTMLAttributes;
  br: HTMLAttributes;
  button: ButtonHTMLAttributes;
  canvas: HTMLAttributes;
  caption: HTMLAttributes;
  cite: HTMLAttributes;
  code: HTMLAttributes;
  col: HTMLAttributes;
  colgroup: HTMLAttributes;
  data: HTMLAttributes;
  datalist: HTMLAttributes;
  dd: HTMLAttributes;
  del: HTMLAttributes;
  details: HTMLAttributes;
  dfn: HTMLAttributes;
  dialog: HTMLAttributes;
  div: HTMLAttributes;
  dl: HTMLAttributes;
  dt: HTMLAttributes;
  em: HTMLAttributes;
  embed: HTMLAttributes;
  fieldset: HTMLAttributes;
  figcaption: HTMLAttributes;
  figure: HTMLAttributes;
  footer: HTMLAttributes;
  form: FormHTMLAttributes;
  h1: HTMLAttributes;
  h2: HTMLAttributes;
  h3: HTMLAttributes;
  h4: HTMLAttributes;
  h5: HTMLAttributes;
  h6: HTMLAttributes;
  head: HTMLAttributes;
  header: HTMLAttributes;
  hgroup: HTMLAttributes;
  hr: HTMLAttributes;
  html: HTMLAttributes;
  i: HTMLAttributes;
  iframe: HTMLAttributes;
  img: ImgHTMLAttributes;
  input: InputHTMLAttributes;
  ins: HTMLAttributes;
  kbd: HTMLAttributes;
  label: HTMLAttributes;
  legend: HTMLAttributes;
  li: HTMLAttributes;
  link: HTMLAttributes;
  main: HTMLAttributes;
  map: HTMLAttributes;
  mark: HTMLAttributes;
  menu: HTMLAttributes;
  meta: HTMLAttributes;
  meter: HTMLAttributes;
  nav: HTMLAttributes;
  noscript: HTMLAttributes;
  object: HTMLAttributes;
  ol: HTMLAttributes;
  optgroup: HTMLAttributes;
  option: OptionHTMLAttributes;
  output: HTMLAttributes;
  p: HTMLAttributes;
  picture: HTMLAttributes;
  pre: HTMLAttributes;
  progress: HTMLAttributes;
  q: HTMLAttributes;
  rp: HTMLAttributes;
  rt: HTMLAttributes;
  ruby: HTMLAttributes;
  s: HTMLAttributes;
  samp: HTMLAttributes;
  script: HTMLAttributes;
  search: HTMLAttributes;
  section: HTMLAttributes;
  select: SelectHTMLAttributes;
  slot: HTMLAttributes;
  small: HTMLAttributes;
  source: HTMLAttributes;
  span: HTMLAttributes;
  strong: HTMLAttributes;
  style: HTMLAttributes;
  sub: HTMLAttributes;
  summary: HTMLAttributes;
  sup: HTMLAttributes;
  table: HTMLAttributes;
  tbody: HTMLAttributes;
  td: HTMLAttributes;
  template: HTMLAttributes;
  textarea: TextareaHTMLAttributes;
  tfoot: HTMLAttributes;
  th: HTMLAttributes;
  thead: HTMLAttributes;
  time: HTMLAttributes;
  title: HTMLAttributes;
  tr: HTMLAttributes;
  track: HTMLAttributes;
  u: HTMLAttributes;
  ul: HTMLAttributes;
  var: HTMLAttributes;
  video: MediaHTMLAttributes;
  wbr: HTMLAttributes;

  svg: SVGAttributes;
  path: SVGAttributes;
  circle: SVGAttributes;
  rect: SVGAttributes;
  line: SVGAttributes;
  g: SVGAttributes;
  polyline: SVGAttributes;
  polygon: SVGAttributes;
  text: SVGAttributes;
  tspan: SVGAttributes;
  defs: SVGAttributes;
  use: SVGAttributes;
  symbol: SVGAttributes;
  clipPath: SVGAttributes;
  linearGradient: SVGAttributes;
  radialGradient: SVGAttributes;
  stop: SVGAttributes;
  mask: SVGAttributes;
  pattern: SVGAttributes;
  image: SVGAttributes;
  foreignObject: SVGAttributes;

  math: DOMAttributes;
  mi: DOMAttributes;
  mo: DOMAttributes;
  mn: DOMAttributes;
  ms: DOMAttributes;
  mrow: DOMAttributes;
  mfrac: DOMAttributes;
  msqrt: DOMAttributes;
  mroot: DOMAttributes;
}
