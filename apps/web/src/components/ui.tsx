import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "inverse-outline";

const variants: Record<Variant, string> = {
  primary: "bg-rbc text-white hover:bg-deep shadow-[0_6px_16px_-8px_rgba(0,45,100,0.6)]",
  secondary: "border border-rbc text-rbc hover:bg-sky",
  ghost: "text-rbc hover:bg-sky",
  inverse: "bg-white text-rbc hover:bg-sky shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]",
  "inverse-outline": "border border-white/70 text-white hover:bg-white/10",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "md" | "lg" | "sm" }) {
  const sizes = { sm: "px-3.5 py-1.5 text-sm", md: "px-5 py-2.5 text-[15px]", lg: "px-7 py-3.5 text-base" };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${sizes[size]} ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}

export function OptionTile({
  active,
  icon,
  title,
  caption,
  onClick,
  testId,
  className = "",
}: {
  active: boolean;
  icon?: ReactNode;
  title: string;
  caption?: string;
  onClick: () => void;
  testId?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`group relative flex min-h-[72px] items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 ${
        active ? "border-rbc bg-sky" : "border-line bg-white hover:border-rbc/50 hover:bg-sky/40"
      } ${className}`}
    >
      {icon ? <span className={`shrink-0 ${active ? "text-rbc" : "text-muted"}`}>{icon}</span> : null}
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug text-ink">{title}</span>
        {caption ? <span className="mt-0.5 block text-sm leading-snug text-muted">{caption}</span> : null}
      </span>
      <span
        aria-hidden
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-rbc bg-rbc" : "border-line"}`}
      >
        {active ? <Check className="h-3 w-3 text-white" /> : null}
      </span>
    </button>
  );
}

export function Chip({ active, children, onClick, testId }: { active: boolean; children: ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${active ? "border-rbc bg-rbc text-white" : "border-line bg-white text-ink hover:border-rbc/50"}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-white ${className}`}>{children}</div>;
}

export function Disclosure({
  title,
  children,
  testId,
  defaultOpen = false,
}: {
  title: ReactNode;
  children: ReactNode;
  testId?: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className="group rounded-2xl border border-line bg-white open:shadow-[0_12px_30px_-20px_rgba(0,45,100,0.45)]" data-testid={testId} open={defaultOpen}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 font-semibold text-ink">
        <span>{title}</span>
        <Chevron className="h-5 w-5 shrink-0 text-rbc transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="border-t border-line px-5 py-4">{children}</div>
    </details>
  );
}

export function Check({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
