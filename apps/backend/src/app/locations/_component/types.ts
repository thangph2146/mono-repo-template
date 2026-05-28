import { z } from "zod";

export type LocationRow = {
  id: string;
  mapUrl: string;
  name: string | null;
  address: string | null;
  status: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export interface LocationConfirmAction {
  kind: "delete" | "restore" | "purge";
  row: LocationRow;
}

export const locationFormSchema = z.object({
  mapUrl: z.string().min(1, "URL bản đồ không được để trống"),
  name: z.string().optional(),
  address: z.string().optional(),
  status: z.coerce.number().optional(),
});

export type LocationFormValues = z.infer<typeof locationFormSchema>;

export type LocationDetail = LocationRow;
