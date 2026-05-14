"use client";

import { useState, useRef } from "react";
import { ZoomIn, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { ImageLightbox, type LightboxImage } from "@ui/components/image-lightbox";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";

interface GuideStep {
  order: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface GuideSection {
  id: string;
  sectionKey: string;
  content: {
    title?: string;
    description?: string;
    steps?: GuideStep[];
  };
}

function StepSlider({
  steps,
  onZoom,
}: {
  steps: GuideStep[];
  onZoom: (index: number) => void;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = (idx: number) => {
    setActive(idx);
    trackRef.current?.children[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const step = steps[active];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden rounded-2xl pt-0">
        {/* Image area */}
        <div className="group relative h-[50vh] w-full overflow-hidden bg-muted">
          {step.imageUrl?.trim() ? (
            <>
              <img
                src={step.imageUrl}
                alt={step.title}
                className="h-full w-full object-cover transition-transform duration-500"
                loading="lazy"
                decoding="async"
              />
              <button
                type="button"
                onClick={() => onZoom(active)}
                className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/25"
                aria-label="Phóng to"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <ZoomIn className="size-3.5" />
                  Phóng to
                </span>
              </button>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-6xl font-black text-muted-foreground/10">{step.order}</span>
            </div>
          )}

          {/* Step counter badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold">
              {step.order}
            </span>
            <span>{`${active + 1} / ${steps.length}`}</span>
          </div>

          {/* Prev/Next overlay buttons */}
          {steps.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => goTo(Math.max(0, active - 1))}
                disabled={active === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white disabled:opacity-20"
                aria-label="Bước trước"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => goTo(Math.min(steps.length - 1, active + 1))}
                disabled={active === steps.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white disabled:opacity-20"
                aria-label="Bước tiếp"
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
        </div>

        {/* Step info */}
        <div className="space-y-1.5 p-4">
          <h3 className="font-semibold leading-snug">{step.title}</h3>
          {step.description && (
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              {step.description}
            </p>
          )}
        </div>
      </Card>

      {/* Thumbnail strip */}
      {steps.length > 1 && (
        <div
          ref={trackRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {steps.map((s, i) => (
            <button
              key={s.order}
              type="button"
              onClick={() => goTo(i)}
              className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === active
                  ? "border-primary shadow-md"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
              style={{ width: 80, height: 52 }}
              aria-label={`Bước ${s.order}: ${s.title}`}
            >
              {s.imageUrl?.trim() ? (
                <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold text-muted-foreground">
                  {s.order}
                </div>
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[9px] font-medium text-white">
                B{s.order}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GuideSections({ sections }: { sections: GuideSection[] }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [lbImages, setLbImages] = useState<LightboxImage[]>([]);

  const openLightbox = (images: LightboxImage[], index: number) => {
    setLbImages(images);
    setLbIndex(index);
    setLbOpen(true);
  };

  return (
    <>
      {sections.map((sec, secIdx) => {
        const steps = sec.content.steps ?? [];
        const lbImgs: LightboxImage[] = steps
          .filter((s) => s.imageUrl?.trim())
          .map((s) => ({ key: s.imageUrl!, src: s.imageUrl!, altText: s.title }));

        return (
          <section key={sec.id} className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {secIdx + 1}
              </div>
              <div className="space-y-0.5">
                {sec.content.title && (
                  <h2 className="text-lg font-bold leading-snug">{sec.content.title}</h2>
                )}
                {sec.content.description && (
                  <p className="text-sm text-muted-foreground">{sec.content.description}</p>
                )}
              </div>
            </div>

            {steps.length > 0 && (
              <StepSlider
                steps={steps}
                onZoom={(idx) => {
                  const imgIdx = lbImgs.findIndex((img) => img.src === steps[idx].imageUrl);
                  if (imgIdx >= 0) openLightbox(lbImgs, imgIdx);
                }}
              />
            )}
          </section>
        );
      })}

      <ImageLightbox
        open={lbOpen}
        images={lbImages}
        index={lbIndex}
        onIndexChange={setLbIndex}
        onClose={() => setLbOpen(false)}
      />
    </>
  );
}
