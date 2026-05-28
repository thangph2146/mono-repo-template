import { z } from "zod";

export type EventRow = {
  id: string;
  title: string;
  slug: string | null;
  poster: unknown;
  description: string | null;
  content: unknown;
  startDate: string | null;
  endDate: string | null;
  checkinStart: string | null;
  checkinEnd: string | null;
  registrationStart: string | null;
  registrationEnd: string | null;
  organizer: string | null;
  location: string | null;
  address: string | null;
  qrCode: string | null;
  status: number;
  totalRegistrations: number;
  totalCheckins: number;
  totalCheckouts: number;
  allowCheckin: boolean;
  allowCheckout: boolean;
  requireFaceId: boolean;
  maxParticipants: number;
  format: number;
  onlineLink: string | null;
  schedule: unknown;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface EventConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: EventRow;
}

export const eventFormSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  slug: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  checkinStart: z.string().optional(),
  checkinEnd: z.string().optional(),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional(),
  organizer: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  status: z.coerce.number(),
  allowCheckin: z.coerce.boolean(),
  allowCheckout: z.coerce.boolean(),
  requireFaceId: z.coerce.boolean(),
  maxParticipants: z.coerce.number(),
  format: z.coerce.number().optional(),
  onlineLink: z.string().optional(),
  content: z.any().optional(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export type EventDetail = EventRow;
