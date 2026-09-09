import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

const Checkbox = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }
>(function Checkbox({ label, className = "", ...props }, ref) {
  return (
    <label className={`flex cursor-pointer items-start gap-2.5 text-sm select-none ${className}`}>
      <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input ref={ref} type="checkbox" className="peer absolute inset-0 opacity-0" {...props} />
        <span className="pointer-events-none absolute inset-0 rounded-md border-2 border-hairline bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent-soft" />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none relative h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100"
        >
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{label}</span>
    </label>
  );
});

export default Checkbox;
