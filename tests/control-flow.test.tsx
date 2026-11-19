import { describe, it, expect, beforeEach } from "vitest";
import { render, signal, Show, For, Switch, Match, map } from "reax";

describe("Control Flow Components", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  });

  describe("<Show>", () => {
    it("renders children when condition is truthy", () => {
      const show = signal(true);
      render(
        <Show when={show} fallback={<span>Fallback</span>}>
          <div>Visible Content</div>
        </Show>,
        container,
      );

      expect(container.textContent).toBe("Visible Content");
      expect(container.querySelector("span")).toBeNull();
    });

    it("renders fallback when condition is falsy", () => {
      const show = signal(false);
      render(
        <Show when={show} fallback={<span>Fallback</span>}>
          <div>Visible Content</div>
        </Show>,
        container,
      );

      expect(container.textContent).toBe("Fallback");
      expect(container.querySelector("div")).toBeNull();
    });

    it("toggles dynamically between content and fallback", () => {
      const show = signal(false);
      render(
        <Show when={show} fallback={<p>Empty</p>}>
          <h1>Content</h1>
        </Show>,
        container,
      );

      expect(container.querySelector("p")?.textContent).toBe("Empty");
      expect(container.querySelector("h1")).toBeNull();

      show(true);
      expect(container.querySelector("h1")?.textContent).toBe("Content");
      expect(container.querySelector("p")).toBeNull();

      show(false);
      expect(container.querySelector("p")?.textContent).toBe("Empty");
      expect(container.querySelector("h1")).toBeNull();
    });

    it("cleans up event listeners and teardowns when condition becomes falsy", () => {
      const show = signal(true);
      let clicked = 0;
      let refNode: HTMLButtonElement | null = null;

      render(
        <Show when={show}>
          <button
            ref={(el) => (refNode = el as HTMLButtonElement)}
            onClick={() => clicked++}
          >
            Click
          </button>
        </Show>,
        container,
      );

      const btn = container.querySelector("button")!;
      expect(refNode).toBe(btn);

      btn.dispatchEvent(new MouseEvent("click"));
      expect(clicked).toBe(1);

      show(false);
      expect(refNode).toBeNull(); // Callback ref called with null on unmount
      expect(container.querySelector("button")).toBeNull();
    });
  });

  describe("<For>", () => {
    it("renders array items with item value and reactive index", () => {
      const items = signal(["Apple", "Banana", "Cherry"]);
      render(
        <ul>
          <For each={items}>
            {(item, index$) => (
              <li>
                {index$}: {item}
              </li>
            )}
          </For>
        </ul>,
        container,
      );

      const lis = container.querySelectorAll("li");
      expect(lis.length).toBe(3);
      expect(lis[0].textContent).toBe("0: Apple");
      expect(lis[1].textContent).toBe("1: Banana");
      expect(lis[2].textContent).toBe("2: Cherry");
    });

    it("renders fallback when list is empty", () => {
      const items = signal<string[]>([]);
      render(
        <div>
          <For each={items} fallback={<span>No items</span>}>
            {(item) => <p>{item}</p>}
          </For>
        </div>,
        container,
      );

      expect(container.querySelector("span")?.textContent).toBe("No items");

      items(["Item 1"]);
      expect(container.querySelector("span")).toBeNull();
      expect(container.querySelector("p")?.textContent).toBe("Item 1");

      items([]);
      expect(container.querySelector("span")?.textContent).toBe("No items");
    });

    it("appends and removes items without remounting unchanged items", () => {
      const items = signal(["A", "B"]);
      render(
        <div>
          <For each={items}>{(item) => <span id={item}>{item}</span>}</For>
        </div>,
        container,
      );

      const spanA = container.querySelector("#A")!;
      const spanB = container.querySelector("#B")!;
      expect(spanA).toBeDefined();
      expect(spanB).toBeDefined();

      items(["A", "B", "C"]);
      expect(container.querySelector("#A")).toBe(spanA); // Preserved DOM node
      expect(container.querySelector("#B")).toBe(spanB); // Preserved DOM node
      expect(container.querySelector("#C")?.textContent).toBe("C");

      items(["B", "C"]);
      expect(container.querySelector("#A")).toBeNull();
      expect(container.querySelector("#B")).toBe(spanB);
    });

    it("updates index$ observable when items are reordered", () => {
      const items = signal(["First", "Second"]);
      render(
        <div>
          <For each={items}>
            {(item, index$) => (
              <div id={item}>
                {item}-{index$}
              </div>
            )}
          </For>
        </div>,
        container,
      );

      expect(container.querySelector("#First")?.textContent).toBe("First-0");
      expect(container.querySelector("#Second")?.textContent).toBe("Second-1");

      items(["Second", "First"]);
      expect(container.querySelector("#Second")?.textContent).toBe("Second-0");
      expect(container.querySelector("#First")?.textContent).toBe("First-1");
    });
  });

  describe("<Switch> & <Match>", () => {
    it("renders the first matching <Match> branch", () => {
      const status = signal<"loading" | "error" | "success">("loading");
      const isLoading$ = status.pipe(map((s) => s === "loading"));
      const isError$ = status.pipe(map((s) => s === "error"));
      const isSuccess$ = status.pipe(map((s) => s === "success"));

      render(
        <Switch fallback={<div>Idle</div>}>
          <Match when={isLoading$}>
            <div id="loading">Loading...</div>
          </Match>
          <Match when={isError$}>
            <div id="error">Error!</div>
          </Match>
          <Match when={isSuccess$}>
            <div id="success">Success!</div>
          </Match>
        </Switch>,
        container,
      );

      expect(container.querySelector("#loading")?.textContent).toBe("Loading...");
      expect(container.querySelector("#error")).toBeNull();
      expect(container.querySelector("#success")).toBeNull();

      status("success");
      expect(container.querySelector("#loading")).toBeNull();
      expect(container.querySelector("#success")?.textContent).toBe("Success!");

      status("error");
      expect(container.querySelector("#error")?.textContent).toBe("Error!");
      expect(container.querySelector("#success")).toBeNull();
    });

    it("renders fallback when no match is true", () => {
      const showA = signal(false);
      const showB = signal(false);

      render(
        <Switch fallback={<div id="fallback">No match</div>}>
          <Match when={showA}>
            <div id="a">A</div>
          </Match>
          <Match when={showB}>
            <div id="b">B</div>
          </Match>
        </Switch>,
        container,
      );

      expect(container.querySelector("#fallback")?.textContent).toBe("No match");

      showB(true);
      expect(container.querySelector("#fallback")).toBeNull();
      expect(container.querySelector("#b")?.textContent).toBe("B");
    });
  });
});
