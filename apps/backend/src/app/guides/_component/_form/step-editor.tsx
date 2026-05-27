"use client";

import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { ImageUploadField } from "./image-upload-field";
import type { GuideStep } from "../types";

interface StepEditorProps {
  steps: GuideStep[];
  onChange: (steps: GuideStep[]) => void;
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  const addStep = () =>
    onChange([
      ...steps,
      { order: steps.length + 1, title: "", description: "", imageUrl: "" },
    ]);

  const removeStep = (i: number) =>
    onChange(
      steps
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, order: idx + 1 }))
    );

  const update = (i: number, patch: Partial<GuideStep>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= steps.length) return;
    const next = [...steps];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 justify-center align-center items-center">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <GripVertical className="size-3.5 text-muted-foreground/40" />
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === steps.length - 1}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {step.order}
            </span>
            <Input
              value={step.title}
              onChange={(e) => update(i, { title: e.target.value })}
              placeholder="Tiêu đề bước"
              className="h-7 flex-1 text-sm"
            />
            <button
              type="button"
              onClick={() => removeStep(i)}
              className="shrink-0 rounded p-1 text-muted-foreground hover:text-rose-500"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
          <Textarea
            value={step.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Mô tả chi tiết bước này…"
            rows={2}
            className="resize-none text-sm"
          />
          <ImageUploadField
            value={step.imageUrl ?? ""}
            onChange={(url) => update(i, { imageUrl: url })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1.5">
        <Plus className="size-3.5" />
        Thêm bước
      </Button>
    </div>
  );
}
