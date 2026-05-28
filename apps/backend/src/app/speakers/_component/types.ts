import { z } from "zod";

export type SpeakerRow = {
  id: string;
  name: string;
  title: string | null;
  organization: string | null;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  phone: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface SpeakerConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: SpeakerRow;
}

export const speakerFormSchema = z.object({
  name: z.string().min(1, "Tên diễn giả không được để trống"),
  title: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  status: z.coerce.number(),
});

export type SpeakerFormValues = z.infer<typeof speakerFormSchema>;

export type SpeakerDetail = SpeakerRow;
