"use client";

import { cn } from "../lib/utils";
import { useTextSize } from "./text-size-provider";

type TextSize = "sm" | "base" | "lg";

// ── Heading ─────────────────────────────────────────────────
interface HeadingProps extends React.HTMLAttributes<HTMLElement> {
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "display" | "section" | "title" | "body" | "label";
  color?: "default" | "primary" | "muted";
  align?: "left" | "center" | "right";
}

const headingSizeMap: Record<
  NonNullable<HeadingProps["size"]>,
  Record<TextSize, string>
> = {
  display: {
    sm: "text-[clamp(2rem,4vw+0.5rem,3.5rem)] leading-[1.2] font-extrabold tracking-tight",
    base: "text-[clamp(2rem,4vw+1rem,4rem)] leading-[1.1] font-black tracking-tighter",
    lg: "text-[clamp(2.5rem,5vw+1rem,4.5rem)] leading-[1.1] font-black tracking-tighter",
  },
  section: {
    sm: "text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] leading-[1.3] font-bold tracking-tight",
    base: "text-[clamp(1.5rem,3vw+0.5rem,2.5rem)] leading-[1.2] font-extrabold tracking-tight",
    lg: "text-[clamp(1.75rem,4vw+0.5rem,3rem)] leading-[1.1] font-black tracking-tight",
  },
  title: {
    sm: "text-[clamp(1.125rem,1.5vw+0.5rem,1.5rem)] leading-[1.4] font-semibold",
    base: "text-[clamp(1.125rem,1.5vw+0.5rem,1.5rem)] leading-[1.3] font-bold",
    lg: "text-[clamp(1.25rem,2vw+0.5rem,1.75rem)] leading-[1.3] font-bold",
  },
  body: {
    sm: "text-[clamp(1rem,0.5vw+0.75rem,1.125rem)] font-medium",
    base: "text-[clamp(0.9375rem,0.4vw+0.7rem,1.0625rem)] font-medium",
    lg: "text-[clamp(1rem,0.5vw+0.8rem,1.125rem)] font-medium",
  },
  label: {
    sm: "text-[clamp(0.75rem,0.2vw+0.55rem,0.875rem)] font-medium uppercase tracking-[0.02em]",
    base: "text-[clamp(0.75rem,0.2vw+0.55rem,0.875rem)] font-medium uppercase tracking-[0.02em]",
    lg: "text-[clamp(0.8125rem,0.2vw+0.6rem,0.9375rem)] font-medium uppercase tracking-[0.02em]",
  },
};

export function Heading({
  as: Tag = "h2",
  size = "title",
  color = "default",
  align = "left",
  className,
  children,
  ...props
}: HeadingProps) {
  const { size: textSize } = useTextSize();

  const colorStyles: Record<string, string> = {
    default: "text-foreground",
    primary: "text-primary",
    muted: "text-muted-foreground",
  };

  const alignStyles: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Tag
      className={cn(
        headingSizeMap[size][textSize],
        colorStyles[color],
        alignStyles[align],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ── Text ───────────────────────────────────────────────────
interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "body" | "muted" | "lead" | "small" | "caption" | "label";
  align?: "left" | "center" | "right";
  maxWidth?: boolean;
}

const textVariantMap: Record<
  NonNullable<TextProps["variant"]>,
  Record<TextSize, string>
> = {
  body: {
    sm: "text-[clamp(0.875rem,0.3vw+0.65rem,1rem)] text-foreground",
    base: "text-[clamp(0.9375rem,0.4vw+0.65rem,1.0625rem)] text-foreground",
    lg: "text-[clamp(1rem,0.5vw+0.75rem,1.125rem)] text-foreground",
  },
  muted: {
    sm: "text-[clamp(0.875rem,0.3vw+0.65rem,1rem)] text-muted-foreground",
    base: "text-[clamp(0.9375rem,0.4vw+0.65rem,1.0625rem)] text-muted-foreground",
    lg: "text-[clamp(1rem,0.5vw+0.75rem,1.125rem)] text-muted-foreground",
  },
  lead: {
    sm: "text-[clamp(1rem,0.5vw+0.75rem,1.125rem)] text-foreground leading-relaxed",
    base: "text-[clamp(1.0625rem,0.5vw+0.75rem,1.1875rem)] text-foreground leading-relaxed",
    lg: "text-[clamp(1.125rem,0.6vw+0.8rem,1.25rem)] text-foreground leading-relaxed",
  },
  small: {
    sm: "text-[clamp(0.625rem,0.2vw+0.55rem,0.75rem)] text-muted-foreground",
    base: "text-[clamp(0.6875rem,0.2vw+0.55rem,0.8125rem)] text-muted-foreground",
    lg: "text-[clamp(0.75rem,0.2vw+0.55rem,0.875rem)] text-muted-foreground",
  },
  caption: {
    sm: "text-[clamp(0.625rem,0.2vw+0.55rem,0.75rem)] text-muted-foreground",
    base: "text-[clamp(0.625rem,0.2vw+0.55rem,0.75rem)] text-muted-foreground",
    lg: "text-[clamp(0.6875rem,0.2vw+0.55rem,0.8125rem)] text-muted-foreground",
  },
  label: {
    sm: "text-[clamp(0.75rem,0.2vw+0.55rem,0.875rem)] font-medium uppercase tracking-[0.02em] text-muted-foreground",
    base: "text-[clamp(0.75rem,0.2vw+0.55rem,0.875rem)] font-medium uppercase tracking-[0.02em] text-muted-foreground",
    lg: "text-[clamp(0.8125rem,0.2vw+0.55rem,0.9375rem)] font-medium uppercase tracking-[0.02em] text-muted-foreground",
  },
};

export function Text({
  as: Tag = "p",
  variant = "body",
  align = "left",
  maxWidth = false,
  className,
  children,
  ...props
}: TextProps & { as?: React.ElementType }) {
  const { size: textSize } = useTextSize();

  const alignStyles: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <Tag
      className={cn(
        textVariantMap[variant][textSize],
        alignStyles[align],
        maxWidth && "max-w-lg mx-auto",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

// ── Badge ──────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "outline";
}

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default:
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium bg-secondary text-secondary-foreground",
    primary:
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium border border-primary/20 bg-primary/10 text-primary",
    secondary:
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium bg-secondary text-secondary-foreground",
    outline:
      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-caption font-medium border border-border text-muted-foreground",
  };

  return (
    <span className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </span>
  );
}

// ── Pulsing dot (for badges) ───────────────────────────────
export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "size-1.5 rounded-full bg-primary animate-pulse",
        className,
      )}
    />
  );
}
