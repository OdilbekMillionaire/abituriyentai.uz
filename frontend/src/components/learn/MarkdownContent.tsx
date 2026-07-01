"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang";

interface MarkdownContentProps {
  content: string;
  className?: string;
  accentColor?: "blue" | "green" | "orange";
}

const ACCENT = {
  blue:   { border: "border-blue-400",   bg: "bg-blue-50",   text: "text-blue-800",  heading: "text-blue-900",  dot: "bg-blue-500",  num: "bg-blue-600"   },
  green:  { border: "border-green-400",  bg: "bg-green-50",  text: "text-green-800", heading: "text-green-900", dot: "bg-green-500", num: "bg-green-600"  },
  orange: { border: "border-orange-400", bg: "bg-orange-50", text: "text-orange-800",heading: "text-orange-900",dot: "bg-orange-500",num: "bg-orange-600" },
};

export function MarkdownContent({
  content,
  className,
  accentColor = "blue",
}: MarkdownContentProps) {
  const ac = ACCENT[accentColor];
  const { tr } = useLang();

  // Counter for h2 sections — used to number sections visually
  let h2Count = 0;

  return (
    <div className={cn("text-slate-700 leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ── H1: Page title (rarely used inside content) ──────────────────
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold text-slate-900 mb-4 pb-2 border-b-2 border-slate-200">
              {children}
            </h1>
          ),

          // ── H2: Main sections — numbered with subject color ──────────────
          h2: ({ children }) => {
            h2Count++;
            const num = h2Count;
            return (
              <div className={`flex items-start gap-3 mt-8 mb-4 p-3 rounded-xl ${ac.bg} border-l-4 ${ac.border}`}>
                <span className={`shrink-0 mt-0.5 w-7 h-7 rounded-full ${ac.num} text-white text-xs font-bold flex items-center justify-center`}>
                  {num}
                </span>
                <h2 className={`text-lg font-bold ${ac.heading} leading-snug`}>
                  {children}
                </h2>
              </div>
            );
          },

          // ── H3: Subsections ──────────────────────────────────────────────
          h3: ({ children }) => (
            <div className="flex items-center gap-2 mt-5 mb-2">
              <span className={`w-2 h-5 rounded-sm ${ac.dot}`} />
              <h3 className="text-base font-semibold text-slate-800">{children}</h3>
            </div>
          ),

          // ── H4: Minor headings ───────────────────────────────────────────
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mt-4 mb-1">
              {children}
            </h4>
          ),

          // ── Paragraph ────────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="text-slate-700 leading-relaxed my-3">{children}</p>
          ),

          // ── Blockquote → tip/callout box ─────────────────────────────────
          blockquote: ({ children }) => (
            <div className={`my-4 rounded-xl border ${ac.border} ${ac.bg} overflow-hidden`}>
              <div className={`flex items-center gap-2 px-4 py-2 border-b ${ac.border}`}>
                <span className="text-base">💡</span>
                <span className={`text-xs font-semibold uppercase tracking-wider ${ac.text}`}>
                  {tr("note")}
                </span>
              </div>
              <div className={`px-4 py-3 text-sm ${ac.text}`}>{children}</div>
            </div>
          ),

          // ── Horizontal rule → section divider ────────────────────────────
          hr: () => (
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className={`w-2 h-2 rounded-full ${ac.dot}`} />
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          ),

          // ── Code → inline formula pill ────────────────────────────────────
          code: ({ className: codeClass, children, ...props }: any) => {
            const isInline = !codeClass;
            if (isInline) {
              return (
                <code
                  className={`${ac.bg} ${ac.text} px-1.5 py-0.5 rounded text-sm font-mono font-semibold border ${ac.border}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className={`my-4 rounded-xl overflow-hidden`}>
                <div className={`flex items-center gap-2 px-4 py-2 ${ac.bg} border-b ${ac.border}`}>
                  <span className="text-sm">📐</span>
                  <span className={`text-xs font-semibold ${ac.text}`}>Formula / Kod</span>
                </div>
                <div className="bg-slate-900 text-slate-100 p-4 overflow-x-auto">
                  <code className="font-mono text-sm" {...props}>{children}</code>
                </div>
              </pre>
            );
          },

          // ── Table → styled with colored header ────────────────────────────
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`${ac.bg}`}>{children}</thead>
          ),
          th: ({ children }) => (
            <th className={`px-4 py-2.5 text-left font-semibold ${ac.text} border-b ${ac.border} text-xs uppercase tracking-wide`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 border-b border-slate-100 text-slate-700">
              {children}
            </td>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100 [&>tr:hover]:bg-slate-50 [&>tr]:transition-colors">
              {children}
            </tbody>
          ),

          // ── Unordered list ────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="my-3 space-y-1.5 pl-2">{children}</ul>
          ),
          li: ({ children, ...props }) => {
            // Detect if inside ol by checking parent — simplified: always use dot
            return (
              <li className="flex items-start gap-2.5 text-slate-700">
                <span className={`shrink-0 mt-2 w-1.5 h-1.5 rounded-full ${ac.dot}`} />
                <span className="flex-1 leading-relaxed">{children}</span>
              </li>
            );
          },

          // ── Ordered list ──────────────────────────────────────────────────
          ol: ({ children }) => (
            <ol className="my-3 space-y-2 pl-2 list-none counter-reset-[item]">
              {children}
            </ol>
          ),

          // ── Strong / Bold ─────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className={`font-bold ${ac.heading}`}>{children}</strong>
          ),

          // ── Links ─────────────────────────────────────────────────────────
          a: ({ href, children }) => (
            <a href={href} className={`${ac.text} underline underline-offset-2 hover:opacity-80`}>
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Utility: estimate reading time ────────────────────────────────────────────
export function estimateReadingTime(markdown: string): number {
  const words = markdown.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

// ── Utility: extract headings for TOC ────────────────────────────────────────
export function extractHeadings(markdown: string): { level: number; text: string; id: string }[] {
  const lines = markdown.split("\n");
  const headings: { level: number; text: string; id: string }[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF]/g, "-");
      headings.push({ level, text, id });
    }
  }
  return headings.filter((h) => h.level <= 3);
}
