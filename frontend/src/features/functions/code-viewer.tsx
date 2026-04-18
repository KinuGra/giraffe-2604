import { functionCode } from "@/lib/mock-data";
import { FileText } from "lucide-react";

export function CodeViewer() {
  const lines = functionCode.split("\n");

  return (
    <div className="flex flex-col rounded-lg border bg-panel-2 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b px-3 py-2 bg-panel">
        <div className="flex items-center gap-2 text-sm">
          <FileText className="size-3.5 text-muted-foreground" />
          <span className="font-medium">index.ts</span>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          TypeScript &middot; Deno
        </span>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto">
        <pre className="text-[12px] font-mono leading-[1.7]">
          <code>
            <table className="border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr
                    key={`${i}:${line.slice(0, 20)}`}
                    className="hover:bg-muted/30"
                  >
                    <td className="sticky left-0 select-none text-right pr-4 pl-3 text-muted-foreground/50 bg-panel-2 w-[1%] whitespace-nowrap">
                      {i + 1}
                    </td>
                    <td className="pr-4 whitespace-pre">
                      <CodeLine text={line} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </code>
        </pre>
      </div>
    </div>
  );
}

function CodeLine({ text }: { text: string }) {
  // Simple syntax highlighting
  const trimmed = text.trimStart();

  if (trimmed.startsWith("//")) {
    return <span className="text-muted-foreground italic">{text}</span>;
  }

  // Tokenize the line
  const tokens: { text: string; className?: string }[] = [];
  const keywords =
    /\b(import|from|export|const|let|var|function|await|async|return|new|if|else|for|in|of|default|throw|try|catch|serve|type|interface)\b/g;
  const strings = /('[^']*'|"[^"]*"|`[^`]*`)/g;
  const literals = /\b(true|false|null|undefined)\b/g;

  // Simple approach: highlight strings first, then keywords in non-string segments
  const remaining = text;
  const result: React.ReactNode[] = [];
  let key = 0;

  // Split by strings
  const stringPattern = /('[^']*'|"[^"]*"|`[^`]*`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = stringPattern.exec(remaining);

  while (match !== null) {
    if (match.index > lastIndex) {
      result.push(
        <HighlightKeywords
          key={key++}
          text={remaining.slice(lastIndex, match.index)}
        />,
      );
    }
    result.push(
      <span key={key++} className="text-brand-300">
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
    match = stringPattern.exec(remaining);
  }

  if (lastIndex < remaining.length) {
    result.push(
      <HighlightKeywords key={key++} text={remaining.slice(lastIndex)} />,
    );
  }

  if (result.length === 0) {
    result.push(<span key={0}>{text}</span>);
  }

  return <>{result}</>;
}

function HighlightKeywords({ text }: { text: string }) {
  const keywordPattern =
    /\b(import|from|export|const|let|var|function|await|async|return|new|if|else|for|in|of|default|throw|try|catch|serve|type|interface)\b/g;
  const literalPattern = /\b(true|false|null|undefined)\b/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Combine keyword and literal patterns
  const combined =
    /\b(import|from|export|const|let|var|function|await|async|return|new|if|else|for|in|of|default|throw|try|catch|serve|type|interface|true|false|null|undefined)\b/g;
  const keywords = new Set([
    "import",
    "from",
    "export",
    "const",
    "let",
    "var",
    "function",
    "await",
    "async",
    "return",
    "new",
    "if",
    "else",
    "for",
    "in",
    "of",
    "default",
    "throw",
    "try",
    "catch",
    "serve",
    "type",
    "interface",
  ]);

  let match: RegExpExecArray | null = combined.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    const isKeyword = keywords.has(match[0]);
    parts.push(
      <span
        key={key++}
        className={isKeyword ? "text-violet-400" : "text-amber-400"}
      >
        {match[0]}
      </span>,
    );
    lastIndex = match.index + match[0].length;
    match = combined.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}
