"use client";

import { cn } from "../lib/utils";

export interface TimelineItem {
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface TimelineProps {
  data: TimelineItem[];
  className?: string;
}

export function Timeline({ data, className }: TimelineProps) {
  return (
    <div className={cn("relative space-y-8", className)}>
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border md:left-1/2 md:-translate-x-1/2" />
      {data.map((item, index) => (
        <div
          key={`${index}-${typeof item.title === "string" ? item.title : "timeline-item"}`}
          className="relative grid gap-4 md:grid-cols-2 md:gap-8"
        >
          <div
            className={cn(
              "relative pl-10 md:pl-0",
              index % 2 === 0 ? "md:pr-10" : "md:order-2 md:pl-10"
            )}
          >
            <div className="absolute left-0 top-1 flex size-6 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm md:left-auto md:right-[-12px] md:top-2 md:size-6">
              <span className="size-2 rounded-full bg-primary" />
            </div>
            {index % 2 !== 0 ? null : (
              <h3 className="text-lg font-bold text-primary md:text-right">{item.title}</h3>
            )}
          </div>
          <div
            className={cn(
              "pl-10 md:pl-10",
              index % 2 === 0 ? "md:pl-10" : "md:order-1 md:pr-10 md:pl-0"
            )}
          >
            {index % 2 !== 0 ? (
              <h3 className="mb-3 text-lg font-bold text-primary md:text-left">{item.title}</h3>
            ) : null}
            <div className="rounded-lg border border-border/60 bg-card p-4 shadow-sm sm:p-5">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
