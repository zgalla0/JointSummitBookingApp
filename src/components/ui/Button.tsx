import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-dark hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-accent-soft text-accent-dark hover:bg-accent-soft/70 hover:scale-[1.02] active:scale-[0.98]",
  ghost: "text-muted hover:text-foreground hover:bg-black/[0.03]",
  // Same dark slate as the check-out tile in the stay-dates calendar, so
  // the submit button reads as a distinct, weightier final action - lights
  // up to the ordinary accent color (the primary variant's own resting
  // color) on hover, rather than darkening further like primary does.
  dark: "bg-slate-700 text-white shadow-sm hover:bg-accent hover:scale-[1.02] active:scale-[0.98]",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
