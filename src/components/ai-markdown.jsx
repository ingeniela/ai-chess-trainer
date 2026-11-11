import ReactMarkdown from "react-markdown";

/**
 * react-markdown v10 no longer passes an `inline` prop to `code`, so inline
 * spans are detected by the absence of a language class and of line breaks.
 * @param {{ className?: string, children?: import("react").ReactNode }} props - Code element props
 * @returns {boolean} Whether the code element is inline
 */
const isInlineCode = ({ className, children }) =>
  !className?.includes("language-") && !String(children ?? "").includes("\n");

const MARKDOWN_COMPONENTS = {
  h1: ({ children, node: _node, ...properties }) => (
    <h1 className="text-base font-semibold" {...properties}>
      {children}
    </h1>
  ),
  h2: ({ children, node: _node, ...properties }) => (
    <h2 className="mt-3 text-sm font-semibold first:mt-0" {...properties}>
      {children}
    </h2>
  ),
  h3: ({ children, node: _node, ...properties }) => (
    <h3
      className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0"
      {...properties}
    >
      {children}
    </h3>
  ),
  p: ({ children, node: _node, ...properties }) => (
    <p className="mb-2 last:mb-0" {...properties}>
      {children}
    </p>
  ),
  ul: ({ children, node: _node, ...properties }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0" {...properties}>
      {children}
    </ul>
  ),
  ol: ({ children, node: _node, ...properties }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0" {...properties}>
      {children}
    </ol>
  ),
  li: ({ children, node: _node, ...properties }) => (
    <li className="leading-relaxed" {...properties}>
      {children}
    </li>
  ),
  pre: ({ children, node: _node, ...properties }) => (
    <pre className="mb-2 last:mb-0" {...properties}>
      {children}
    </pre>
  ),
  code: ({ className, children, node: _node, ...properties }) =>
    isInlineCode({ className, children }) ? (
      <code
        className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.92em] dark:bg-white/10"
        {...properties}
      >
        {children}
      </code>
    ) : (
      <code
        className={`block overflow-x-auto rounded-md bg-black/10 p-3 font-mono text-xs dark:bg-black/30 ${className || ""}`}
        {...properties}
      >
        {children}
      </code>
    ),
  strong: ({ children, node: _node, ...properties }) => (
    <strong className="font-semibold" {...properties}>
      {children}
    </strong>
  ),
  a: ({ children, node: _node, ...properties }) => (
    <a
      className="text-cyan-700 underline underline-offset-2 dark:text-cyan-300"
      rel="noreferrer noopener"
      target="_blank"
      {...properties}
    >
      {children}
    </a>
  ),
};

/**
 * Renders AI coach replies as safe Markdown (raw HTML is skipped).
 * @param {{ children: string }} props - Markdown source
 * @returns {import("react").JSX.Element} Rendered markdown
 */
const AiMarkdown = ({ children }) => (
  <div className="max-w-none whitespace-normal text-sm">
    <ReactMarkdown components={MARKDOWN_COMPONENTS} skipHtml>
      {children}
    </ReactMarkdown>
  </div>
);

export default AiMarkdown;
