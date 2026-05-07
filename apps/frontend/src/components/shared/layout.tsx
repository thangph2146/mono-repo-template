import { cn } from "@/lib/utils";

// ── Page shell ───────────────────────────────────────────────
export function Page({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex flex-col min-h-screen", className)}>
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
        "flex-1 flex flex-col p-6 md:p-16 space-y-12",
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("w-full mx-auto max-w-7xl", className)}>{children}</section>
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
  max?:
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "full";
}) {
  const widths: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    "8xl": "max-w-[1440px]",
    full: "max-w-full",
  };
  return (
    <div className={cn("w-full mx-auto", widths[max], className)}>
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
        `gap-${gap}`,
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
      className={cn("grid", colsClass[cols], `gap-${gap}`, className)}
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
