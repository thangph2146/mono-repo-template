"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@ui/components/button";
import {
  TypographyDescriptionLarge,
  TypographyH2,
  TypographyH3,
  TypographyPSmallMuted,
} from "@ui/components/typography";
import { HISTORY_TIMELINE } from "../constants";

export const HistorySection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = HISTORY_TIMELINE.length;

  const updateActiveIndex = useCallback(() => {
    const slider = sliderRef.current;
    if (!slider || total === 0) return;

    const threshold = 10;
    const atStart = slider.scrollLeft <= threshold;
    const atEnd =
      slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - threshold;

    if (atStart) {
      setActiveIndex(0);
      return;
    }

    if (atEnd) {
      setActiveIndex(total - 1);
      return;
    }

    const itemEls = slider.querySelectorAll("[data-history-index]");
    let current = 0;
    let minDistance = Infinity;

    itemEls.forEach((el, index) => {
      const distance = Math.abs((el as HTMLElement).offsetLeft - slider.scrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        current = index;
      }
    });

    setActiveIndex(current);
  }, [total]);

  const scrollByCard = useCallback(
    (direction: "prev" | "next") => {
      const slider = sliderRef.current;
      if (!slider || total === 0) return;

      const firstItem = slider.querySelector("[data-history-index]") as HTMLElement | null;
      const gapPx = parseFloat(getComputedStyle(slider).gap) || 0;
      const step = firstItem ? firstItem.offsetWidth + gapPx : slider.clientWidth;

      slider.scrollBy({
        left: direction === "next" ? step : -step,
        behavior: "smooth",
      });
    },
    [total]
  );

  const goPrev = () => scrollByCard("prev");
  const goNext = () => scrollByCard("next");
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < total - 1;

  return (
    <section className="bg-background py-16 sm:py-20">
      <div className="w-full mx-auto max-w-[1440px] px-6 md:px-12">
        <div className="grid gap-4 border-b pb-6 md:grid-cols-2 md:items-end">
          <div className="space-y-2">
            <TypographyPSmallMuted className="uppercase tracking-[0.22em] text-primary">
              Góc truyền thống
            </TypographyPSmallMuted>
            <TypographyH2 className="mb-0">
              Lịch sử hình thành & Phát triển
            </TypographyH2>
          </div>
          <TypographyDescriptionLarge className="max-w-3xl md:ml-auto">
            Đại học Ngân hàng có lịch sử hình thành và phát triển lâu đời, với
            nhiều truyền thống quý báu được gìn giữ và phát huy qua nhiều thế hệ.
          </TypographyDescriptionLarge>
        </div>

        <div className="space-y-6 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TypographyH3 className="text-primary">
              Lịch sử hình thành
            </TypographyH3>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goPrev}
                disabled={!canGoPrev}
                aria-label="Slide trước"
                className="size-10 rounded-full border-border bg-background shadow-sm"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={goNext}
                disabled={!canGoNext}
                aria-label="Slide tiếp theo"
                className="size-10 rounded-full border-border bg-background shadow-sm"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="-mx-6 px-6 md:mx-0 md:px-0">
            <div
              ref={sliderRef}
              onScroll={updateActiveIndex}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="region"
              aria-label="Slider lịch sử hình thành và phát triển HUB"
            >
              {HISTORY_TIMELINE.map((item, index) => (
                <article
                  key={item.year}
                  data-history-index={index}
                  className="w-[320px] shrink-0 snap-start transition-all sm:w-[360px] lg:w-[420px]"
                >
                  <div className="relative aspect-[4/2] w-full overflow-hidden rounded-lg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <Image
                      src={item.image}
                      alt={item.year}
                      title={item.year}
                      fill
                      className="object-cover article-image article-image-ux-impr article-image-new expandable"
                      sizes="(max-width: 768px) 320px, (max-width: 1280px) 50vw, 33vw"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-2 px-1 pt-4">
                    <p className="text-base font-bold tracking-tight text-[#c84b31] sm:text-lg">
                      {item.year}
                    </p>
                    <h4 className="text-[clamp(2rem,4vw,3.5rem)] font-black leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(148,163,184,0.95)]">
                      {item.year}
                    </h4>
                    <p className="line-clamp-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              {HISTORY_TIMELINE.map((item, index) => (
                <button
                  key={`${item.year}-indicator`}
                  type="button"
                  onClick={() => {
                    const slider = sliderRef.current;
                    const target = slider?.querySelector(
                      `[data-history-index="${index}"]`
                    ) as HTMLElement | null;
                    target?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "start",
                    });
                  }}
                  aria-label={`Đi tới giai đoạn ${item.year}`}
                  aria-pressed={index === activeIndex}
                  className={
                    index === activeIndex
                      ? "h-2.5 w-8 rounded-full bg-primary transition-all"
                      : "h-2.5 w-2.5 rounded-full bg-border transition-all hover:bg-primary/40"
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
