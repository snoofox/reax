import { describe, it, expect, beforeEach } from "vitest";
import {
  render,
  signal,
  createContext,
  useContext,
  Show,
  For,
} from "reax";

describe("Context API", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    return () => {
      container.remove();
    };
  });

  it("provides and consumes context value in child components", () => {
    const ThemeContext = createContext("light");

    const Child = () => {
      const theme = useContext(ThemeContext);
      return <div id="theme">{theme}</div>;
    };

    render(
      <ThemeContext.Provider value="dark">
        <Child />
      </ThemeContext.Provider>,
      container,
    );

    expect(container.querySelector("#theme")?.textContent).toBe("dark");
  });

  it("returns default value when no Provider is present", () => {
    const LocaleContext = createContext("en-US");

    const Child = () => {
      const locale = useContext(LocaleContext);
      return <div id="locale">{locale}</div>;
    };

    render(<Child />, container);
    expect(container.querySelector("#locale")?.textContent).toBe("en-US");
  });

  it("handles nested providers shadowing outer context", () => {
    const ColorContext = createContext("black");

    const Display = () => {
      const color = useContext(ColorContext);
      return <span>{color}</span>;
    };

    render(
      <ColorContext.Provider value="red">
        <div id="outer">
          <Display />
        </div>
        <ColorContext.Provider value="blue">
          <div id="inner">
            <Display />
          </div>
        </ColorContext.Provider>
        <div id="outer-again">
          <Display />
        </div>
      </ColorContext.Provider>,
      container,
    );

    expect(container.querySelector("#outer")?.textContent).toBe("red");
    expect(container.querySelector("#inner")?.textContent).toBe("blue");
    expect(container.querySelector("#outer-again")?.textContent).toBe("red");
  });

  it("supports multiple distinct contexts simultaneously", () => {
    const UserContext = createContext<{ name: string }>({ name: "Guest" });
    const RoleContext = createContext("viewer");

    const Profile = () => {
      const user = useContext(UserContext);
      const role = useContext(RoleContext);
      return (
        <div id="profile">
          {user.name} ({role})
        </div>
      );
    };

    render(
      <UserContext.Provider value={{ name: "Ashwin" }}>
        <RoleContext.Provider value="admin">
          <Profile />
        </RoleContext.Provider>
      </UserContext.Provider>,
      container,
    );

    expect(container.querySelector("#profile")?.textContent).toBe(
      "Ashwin (admin)",
    );
  });

  it("passes reactive signals through context", () => {
    const CounterContext = createContext<ReturnType<typeof signal<number>>>(
      signal(0),
    );

    const Display = () => {
      const count = useContext(CounterContext);
      return <span id="count">{count}</span>;
    };

    const count = signal(5);

    render(
      <CounterContext.Provider value={count}>
        <Display />
      </CounterContext.Provider>,
      container,
    );

    expect(container.querySelector("#count")?.textContent).toBe("5");

    count(15);
    expect(container.querySelector("#count")?.textContent).toBe("15");
  });

  it("preserves context inside dynamic <Show> branches", () => {
    const AuthContext = createContext("unauthenticated");
    const isVisible = signal(false);

    const Secret = () => {
      const auth = useContext(AuthContext);
      return <div id="secret">{auth}</div>;
    };

    render(
      <AuthContext.Provider value="authenticated">
        <Show when={isVisible}>
          <Secret />
        </Show>
      </AuthContext.Provider>,
      container,
    );

    expect(container.querySelector("#secret")).toBeNull();

    isVisible(true);
    expect(container.querySelector("#secret")?.textContent).toBe(
      "authenticated",
    );
  });

  it("preserves context inside dynamic <For> list items", () => {
    const PrefixContext = createContext("Item");
    const items = signal([1, 2]);

    const ListItem = (props: { val: number }) => {
      const prefix = useContext(PrefixContext);
      return <li>{prefix}-{props.val}</li>;
    };

    render(
      <PrefixContext.Provider value="Row">
        <ul>
          <For each={items}>
            {(item) => <ListItem val={item} />}
          </For>
        </ul>
      </PrefixContext.Provider>,
      container,
    );

    const lis = container.querySelectorAll("li");
    expect(lis.length).toBe(2);
    expect(lis[0].textContent).toBe("Row-1");
    expect(lis[1].textContent).toBe("Row-2");
  });
});
