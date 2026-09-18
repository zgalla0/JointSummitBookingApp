"use client";

import { useState } from "react";
import Card from "./ui/Card";
import { FAQ_CATEGORIES, type FaqBlock, type FaqListItem } from "@/lib/faq-data";

function FaqListItemView({ item }: { item: FaqListItem }) {
  const text = typeof item === "string" ? item : item.text;
  const emphasize = typeof item === "object" && "emphasize" in item;
  const sublist = typeof item === "object" && "sublist" in item ? item.sublist : null;
  return (
    <li className={emphasize ? "font-bold text-foreground" : ""}>
      {text}
      {sublist && (
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {sublist.map((subItem, i) => (
            <li key={i}>{subItem}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Supports simple **bold** spans within a paragraph's text, since FaqBlock's
// "p" type is otherwise a plain string - matches the markdown-style
// emphasis authors already write in faq-data.ts source text.
function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function FaqBlockView({ block }: { block: FaqBlock }) {
  if (block.type === "p") {
    return <p className="text-sm text-muted">{renderInlineMarkdown(block.text)}</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
      {block.items.map((item, i) => (
        <FaqListItemView key={i} item={item} />
      ))}
    </ul>
  );
}

function FaqQuestionRow({ question, blocks }: { question: string; blocks: FaqBlock[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-hairline py-3 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 text-left text-sm font-semibold text-foreground"
        aria-expanded={open}
      >
        {question}
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="mt-3 space-y-3">{blocks.map((block, i) => <FaqBlockView key={i} block={block} />)}</div>}
    </div>
  );
}

/** Grouped, collapsible FAQ shown at the bottom of the main booking page -
 *  general pre-trip reference content (expenses, dress code, documents,
 *  etc.), separate from the admin-editable "Event info, Q&A, and timing"
 *  Reference card above it, which covers per-summit logistics instead. */
export default function FaqSection() {
  return (
    <div className="space-y-6">
      <div className="animate-in space-y-1">
        <p className="eyebrow">FAQ</p>
        <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
      </div>

      <div className="space-y-4">
        {FAQ_CATEGORIES.map((category) => (
          <Card key={category.title} title={category.title}>
            <div>
              {category.questions.map((q) => (
                <FaqQuestionRow key={q.question} question={q.question} blocks={q.blocks} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
