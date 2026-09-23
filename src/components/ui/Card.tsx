import type { ReactNode, Ref } from "react";

export default function Card({
  eyebrow,
  title,
  children,
  className = "",
  containerRef,
}: {
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  className?: string;
  /** Attached to the outer section - lets a caller scroll this specific
   *  card into view (e.g. a newly-revealed gated section) without Card
   *  needing to know why. */
  containerRef?: Ref<HTMLElement>;
}) {
  return (
    <section
      ref={containerRef}
      className={`animate-in rounded-2xl bg-surface p-5 shadow-[0_1px_2px_rgba(42,36,32,0.04),0_8px_24px_rgba(42,36,32,0.06)] sm:p-6 ${className}`}
    >
      {(eyebrow || title) && (
        <div className="mb-4 space-y-1">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
        </div>
      )}
      {children}
    </section>
  );
}
