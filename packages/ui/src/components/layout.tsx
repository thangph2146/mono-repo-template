import { cn } from "../lib/utils";
import {
  type ContainerMaxWidth,
  containerMaxWidthClass,
} from "../lib/layout-shell";

export type { ContainerMaxWidth } from "../lib/layout-shell";

/** Tailwind không quét `gap-${n}` — phải map đủ chuỗi literal. */
const STACK_GAP_CLASS = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
} as const;

const GRID_GAP_CLASS = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;

// ── Page shell ───────────────────────────────────────────────
export function Page({
  children,
  className,
  as = "main",
}: {
  children: React.ReactNode;
  className?: string;
  /** `div` khi layout cha đã có `<main>` (vd. AdminShell). */
  as?: "main" | "div";
}) {
  if (as === "div") {
    return (
      <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
        {children}
      </div>
    );
  }
  return (
    <main className={cn("flex min-h-screen flex-col", className)}>
      {children}
    </main>
  );
}

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col p-4 sm:p-6 md:p-12 lg:p-16 space-y-8 md:space-y-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageSection({
  children,
  className,
  max = "7xl",
}: {
  children: React.ReactNode;
  className?: string;
  max?: ContainerMaxWidth;
}) {
  return (
    <section
      className={cn("mx-auto w-full p-4", containerMaxWidthClass(max), className)}
    >
      {children}
    </section>
  );
}

// ── Hero block ───────────────────────────────────────────────
export function Hero({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center space-y-5 max-w-4xl mx-auto w-full", className)}>
      {children}
    </div>
  );
}

// ── Container (max-width) ───────────────────────────────────
export function Container({
  children,
  className,
  max = "7xl",
}: {
  children: React.ReactNode;
  className?: string;
  max?: ContainerMaxWidth;
}) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        containerMaxWidthClass(max),
        className,
      )}
    >
      {children}
    </div>
  );
}

// ── Stack (flex gap) ────────────────────────────────────────
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col";
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
}

export function Stack({
  direction = "col",
  gap = 4,
  align,
  justify,
  wrap,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        STACK_GAP_CLASS[gap],
        align &&
        {
          start: "items-start",
          center: "items-center",
          end: "items-end",
          stretch: "items-stretch",
        }[align],
        justify &&
        {
          start: "justify-start",
          center: "justify-center",
          end: "justify-end",
          between: "justify-between",
        }[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Grid ───────────────────────────────────────────────────
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8;
}

export function Grid({
  cols = 1,
  gap = 4,
  className,
  children,
  ...props
}: GridProps) {
  const colsClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6",
  };
  return (
    <div
      className={cn("grid", colsClass[cols], GRID_GAP_CLASS[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Section divider ──────────────────────────────────────────
export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-border" />
      {label && (
        <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
