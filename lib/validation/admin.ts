import { z } from "zod";

const currentYear = new Date().getFullYear();

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Datum mora biti u formatu GGGG-MM-DD")
  .optional()
  .nullable()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

export const seasonInputSchema = z.object({
  name: z.string().trim().min(4, "Naziv sezone je obavezan").max(40),
  startDate: optionalDate,
  endDate: optionalDate,
  active: z.boolean().optional(),
});

export const seasonIdSchema = z.string().trim().min(1).max(64);

export const historyInputSchema = z.object({
  title: z.string().trim().min(1, "Naslov je obavezan").max(200),
  body: z.string().trim().min(1, "Tekst je obavezan").max(20_000),
  year: z
    .number()
    .int()
    .min(1900)
    .max(currentYear + 1)
    .optional()
    .nullable(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  published: z.boolean().optional(),
});

export const historyIdSchema = z.string().trim().min(1).max(64);

export type SeasonInput = z.input<typeof seasonInputSchema>;
export type HistoryInput = z.input<typeof historyInputSchema>;
