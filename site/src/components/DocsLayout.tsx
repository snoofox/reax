import type { Child } from "@snoofox/reax";
import { Header } from "./Header";
import { Footer } from "./Footer";

export interface DocsNavItem {
  id: string;
  label: string;
}

interface DocsLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  basePath: string;
  nav: DocsNavItem[];
  children?: Child;
}

export function DocsLayout({
  eyebrow,
  title,
  description,
  basePath,
  nav,
  children,
}: DocsLayoutProps) {
  const jumpTo = (id: string) => (event: MouseEvent) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div class="page-container">
      <Header />
      <div class="page page--docs">
        <main id="main-content" class="docs-layout">
          <aside class="docs-sidebar" aria-label="On this page">
            <p class="docs-sidebar-label">On this page</p>
            <ul class="docs-nav">
              {nav.map((item) => (
                <li>
                  <a href={`${basePath}#${item.id}`} onClick={jumpTo(item.id)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div class="docs-sidebar-note">
              <span>Package</span>
              <code>@snoofox/reax</code>
            </div>
          </aside>

          <article class="docs-main">
            <header class="article-header">
              <span class="article-eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p class="article-description">{description}</p>
            </header>

            <div class="prose-content">{children}</div>
          </article>
        </main>

        <Footer />
      </div>
    </div>
  );
}
