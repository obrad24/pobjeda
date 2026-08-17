import { z } from "zod";

export const positionSchema = z.enum(["GK", "DF", "MF", "WG", "FW"]);

const currentYear = new Date().getFullYear();

const optionalText = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((value) => (value === "" ? null : value));

export const playerImageSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
    { message: "Slika mora biti URL ili putanja koja počinje sa /" },
  )
  .optional()
  .nullable()
  .transform((value) => (value === "" || value == null ? null : value));

export const playerSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug smije sadržavati samo mala slova, brojeve i crte");

export const createPlayerSchema = z.object({
  firstName: z.string().trim().min(1, "Ime je obavezno").max(80),
  lastName: z.string().trim().min(1, "Prezime je obavezno").max(80),
  birthYear: z
    .number()
    .int()
    .min(1940)
    .max(currentYear - 12)
    .optional()
    .nullable(),
  jerseyNumber: z.number().int().min(1).max(99).optional().nullable(),
  position: positionSchema,
  image: playerImageSchema,
  formerClubs: optionalText,
  active: z.boolean().optional(),
  slug: playerSlugSchema.optional(),
});

export const updatePlayerSchema = createPlayerSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Nema polja za ažuriranje",
  });

export const playerIdSchema = z.string().trim().min(1).max(64);
export const playerSlugParamSchema = playerSlugSchema;

export type CreatePlayerInput = z.input<typeof createPlayerSchema>;
export type UpdatePlayerInput = z.input<typeof updatePlayerSchema>;
