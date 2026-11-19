import { describe, it, expect, beforeEach } from "vitest";
import { render, signal } from "reax";

describe("DOM Rendering", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  });

  describe("Children & Text", () => {
    it("renders static text and numbers", () => {
      render(<div>Hello World 42</div>, container);
      expect(container.innerHTML).toBe("<div>Hello World 42</div>");
    });

    it("omits null, undefined, and booleans in children", () => {
      render(
        <div>
          {null}
          {undefined}
          {true}
          {false}
          <span>Visible</span>
        </div>,
        container,
      );
      expect(container.innerHTML).toBe("<div><span>Visible</span></div>");
    });

    it("renders reactive signal text and updates in-place", () => {
      const count = signal(0);
      render(<span>{count}</span>, container);

      const span = container.querySelector("span")!;
      expect(span.textContent).toBe("0");

      const textNode = span.firstChild;

      count(1);
      expect(span.textContent).toBe("1");
      expect(span.firstChild).toBe(textNode); // Identical text node updated in-place

      count(42);
      expect(span.textContent).toBe("42");
      expect(span.firstChild).toBe(textNode);
    });

    it("renders fragments without wrapper elements", () => {
      render(
        <div>
          <>
            <span>A</span>
            <span>B</span>
          </>
        </div>,
        container,
      );
      expect(container.innerHTML).toBe("<div><span>A</span><span>B</span></div>");
    });
  });

  describe("Attributes & Properties", () => {
    it("normalizes className to class attribute", () => {
      render(<div className="btn primary" />, container);
      const div = container.querySelector("div")!;
      expect(div.getAttribute("class")).toBe("btn primary");
    });

    it("binds reactive class attribute", () => {
      const cls = signal("active");
      render(<div class={cls} />, container);

      const div = container.querySelector("div")!;
      expect(div.getAttribute("class")).toBe("active");

      cls("inactive");
      expect(div.getAttribute("class")).toBe("inactive");
    });

    it("handles boolean attributes properly", () => {
      const disabled = signal(false);
      render(<button disabled={disabled}>Click</button>, container);

      const btn = container.querySelector("button")!;
      expect(btn.hasAttribute("disabled")).toBe(false);
      expect(btn.disabled).toBe(false);

      disabled(true);
      expect(btn.hasAttribute("disabled")).toBe(true);
      expect(btn.disabled).toBe(true);

      disabled(false);
      expect(btn.hasAttribute("disabled")).toBe(false);
      expect(btn.disabled).toBe(false);
    });

    it("synchronizes controlled input values live", () => {
      const text = signal("initial");
      render(<input value={text} />, container);

      const input = container.querySelector("input")!;
      expect(input.value).toBe("initial");

      text("updated");
      expect(input.value).toBe("updated");
    });

    it("synchronizes checkbox checked property live", () => {
      const checked = signal(false);
      render(<input type="checkbox" checked={checked} />, container);

      const input = container.querySelector("input")!;
      expect(input.checked).toBe(false);
      expect(input.hasAttribute("checked")).toBe(false);

      checked(true);
      expect(input.checked).toBe(true);
      expect(input.hasAttribute("checked")).toBe(true);

      checked(false);
      expect(input.checked).toBe(false);
      expect(input.hasAttribute("checked")).toBe(false);
    });
  });

  describe("Styles", () => {
    it("applies style objects with unitless number conversions and custom properties", () => {
      render(
        <div
          style={{
            color: "red",
            fontSize: 16,
            opacity: 0.5,
            "--custom-var": "4px",
          }}
        />,
        container,
      );

      const div = container.querySelector("div")!;
      expect(div.style.color).toBe("red");
      expect(div.style.fontSize).toBe("16px");
      expect(div.style.opacity).toBe("0.5");
      expect(div.style.getPropertyValue("--custom-var")).toBe("4px");
    });

    it("diffs and updates reactive style properties", () => {
      const color = signal("blue");
      render(<div style={{ color }} />, container);

      const div = container.querySelector("div")!;
      expect(div.style.color).toBe("blue");

      color("green");
      expect(div.style.color).toBe("green");
    });
  });

  describe("Events & Refs", () => {
    it("attaches event listeners and handles clicks", () => {
      let clicked = 0;
      render(<button onClick={() => clicked++}>Click</button>, container);

      const btn = container.querySelector("button")!;
      btn.dispatchEvent(new MouseEvent("click"));
      expect(clicked).toBe(1);

      btn.dispatchEvent(new MouseEvent("click"));
      expect(clicked).toBe(2);
    });

    it("supports callback refs", () => {
      let refNode: HTMLButtonElement | null = null;
      render(<button ref={(el) => (refNode = el as HTMLButtonElement)}>Ref</button>, container);

      expect(refNode).toBeInstanceOf(HTMLButtonElement);
      expect(refNode).toBe(container.querySelector("button"));
    });

    it("supports object refs with current property", () => {
      const myRef = { current: null as HTMLDivElement | null };
      render(<div ref={myRef}>Box</div>, container);

      expect(myRef.current).toBe(container.querySelector("div"));
    });
  });

  describe("Namespaces (SVG & MathML)", () => {
    it("creates SVG elements with correct SVG namespace", () => {
      render(
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" />
        </svg>,
        container,
      );

      const svg = container.querySelector("svg")!;
      const circle = container.querySelector("circle")!;

      expect(svg.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(circle.namespaceURI).toBe("http://www.w3.org/2000/svg");
    });

    it("resets child namespace back to HTML inside foreignObject", () => {
      render(
        <svg>
          <foreignObject>
            <div id="html-div">Hello</div>
          </foreignObject>
        </svg>,
        container,
      );

      const foreignObject = container.querySelector("foreignObject")!;
      const htmlDiv = container.querySelector("#html-div")!;

      expect(foreignObject.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(htmlDiv.namespaceURI).toBe("http://www.w3.org/1999/xhtml");
    });

    it("creates MathML elements with correct MathML namespace", () => {
      render(
        <math>
          <mi>x</mi>
        </math>,
        container,
      );

      const math = container.querySelector("math")!;
      const mi = container.querySelector("mi")!;

      expect(math.namespaceURI).toBe("http://www.w3.org/1998/Math/MathML");
      expect(mi.namespaceURI).toBe("http://www.w3.org/1998/Math/MathML");
    });
  });
});
