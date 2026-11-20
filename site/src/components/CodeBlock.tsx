import { signal, computed } from "@snoofox/reax";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-bash";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = "tsx", title }: CodeBlockProps) {
  const copied = signal(false);
  const copyLabel = computed(() => (copied() ? "Copied" : "Copy"));

  const grammar = Prism.languages[language] || Prism.languages.tsx || Prism.languages.javascript;
  const highlighted = Prism.highlight(code.trim(), grammar, language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim()).then(() => {
      copied(true);
      setTimeout(() => copied(false), 1500);
    });
  };

  return (
    <div class="code-frame">
      <div class="code-frame-header">
        <span class="code-frame-title">{title || language}</span>
        <button onClick={handleCopy} class="code-copy-btn">
          {copyLabel}
        </button>
      </div>
      <pre class="code-frame-pre">
        <code class={`language-${language}`} innerHTML={highlighted} />
      </pre>
    </div>
  );
}
