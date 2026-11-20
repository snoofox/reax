import { signal } from "@snoofox/reax";

function getHashRoute(): string {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === "") return "/";
  return hash.startsWith("/") ? hash : `/${hash}`;
}

export const currentRoute = signal<string>(getHashRoute());

window.addEventListener("hashchange", () => {
  currentRoute(getHashRoute());
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
});

export function navigate(to: string) {
  const normalized = to.startsWith("/") ? to : `/${to}`;
  window.location.hash = normalized;
}
