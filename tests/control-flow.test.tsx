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
      expect(refNode).toBeNull();
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
      expect(container.querySelector("#A")).toBe(spanA);
      expect(container.querySelector("#B")).toBe(spanB);
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

    describe("keyed by prop", () => {
      it("preserves DOM nodes across immutable object updates using by function", () => {
        type Todo = { id: number; title: string };
        const todos = signal<Todo[]>([
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
        ]);

        render(
          <ul>
            <For each={todos} by={(t) => t.id}>
              {(todo, index$) => (
                <li id={`todo-${todo.id}`}>
                  {todo.title} ({index$})
                </li>
              )}
            </For>
          </ul>,
          container,
        );

        const node1 = container.querySelector("#todo-1")!;
        const node2 = container.querySelector("#todo-2")!;
        expect(node1).toBeDefined();
        expect(node2).toBeDefined();

        todos([
          { id: 1, title: "Task 1" },
          { id: 2, title: "Task 2" },
          { id: 3, title: "Task 3" },
        ]);

        expect(container.querySelector("#todo-1")).toBe(node1);
        expect(container.querySelector("#todo-2")).toBe(node2);
        expect(container.querySelector("#todo-3")).toBeDefined();
      });

      it("supports string property name key with by='id'", () => {
        type User = { id: string; name: string };
        const users = signal<User[]>([
          { id: "u1", name: "Alice" },
          { id: "u2", name: "Bob" },
        ]);

        render(
          <div>
            <For each={users} by="id">
              {(u, idx$) => (
                <div id={u.id}>
                  {u.name}-{idx$}
                </div>
              )}
            </For>
          </div>,
          container,
        );

        const aliceNode = container.querySelector("#u1")!;
        const bobNode = container.querySelector("#u2")!;

        users([
          { id: "u2", name: "Bob" },
          { id: "u1", name: "Alice" },
        ]);

        expect(container.querySelector("#u1")).toBe(aliceNode);
        expect(container.querySelector("#u2")).toBe(bobNode);
        expect(aliceNode.textContent).toBe("Alice-1");
        expect(bobNode.textContent).toBe("Bob-0");
      });
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
