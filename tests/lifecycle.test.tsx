import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, signal, onMount, onUnmount, Show } from "reax";

describe("Lifecycle Hooks", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  });

  describe("onMount", () => {
    it("runs once immediately after the tree is mounted into DOM", () => {
      let mounted = 0;
      let isAttached = false;

      const Component = () => {
        onMount(() => {
          mounted++;
          isAttached = container.contains(container.querySelector("#target"));
        });
        return <div id="target">Mounted Target</div>;
      };

      render(<Component />, container);
      expect(mounted).toBe(1);
      expect(isAttached).toBe(true);
    });

    it("does not re-run onMount when signals update", () => {
      let mountCount = 0;
      const count = signal(0);

      const Counter = () => {
        onMount(() => {
          mountCount++;
        });
        return <div>{count}</div>;
      };

      render(<Counter />, container);
      expect(mountCount).toBe(1);

      count(1);
      count(2);
      expect(mountCount).toBe(1);
    });
  });

  describe("onUnmount", () => {
    it("executes cleanup inside dynamic reactive scope (<Show>) when torn down", () => {
      const isVisible = signal(true);
      let unmounted = 0;

      const DynamicChild = () => {
        onUnmount(() => {
          unmounted++;
        });
        return <div>Child</div>;
      };

      render(
        <Show when={isVisible}>
          <DynamicChild />
        </Show>,
        container,
      );

      expect(unmounted).toBe(0);

      isVisible(false);
      expect(unmounted).toBe(1);

      isVisible(true);
      expect(unmounted).toBe(1);

      isVisible(false);
      expect(unmounted).toBe(2);
    });

    it("warns when onUnmount is registered outside dynamic reactive scope (root never unmounts)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const RootComponent = () => {
        onUnmount(() => {});
        return <div>Root</div>;
      };

      render(<RootComponent />, container);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("onUnmount called outside a dynamic reactive scope"),
      );

      warnSpy.mockRestore();
    });
  });
});
