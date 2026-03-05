import ReactMarkdown from "react-markdown";

export function DashboardMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1 first:mt-0">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="text-sm list-disc pl-5 mb-3 space-y-1 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="text-sm list-decimal pl-5 mb-3 space-y-1 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border pl-4 text-muted-foreground italic my-3">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-border/50 my-4" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
