import { z } from "zod";
import { playerImageSchema } from "./player";

export const shopProductIdSchema = z.string().trim().min(1).max(64);

export const shopProductInputSchema = z
  .object({
    name: z.string().trim().min(1, "Naziv proizvoda je obavezan").max(120),
    description: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .nullable()
      .transform((value) => (value ? value : null)),
    price: z
      .number()
      .gt(0, "Cijena mora biti veća od 0")
      .max(99_999.99, "Cijena je prevelika"),
    discountPercent: z
      .number()
      .int()
      .min(1, "Popust mora biti između 1 i 99")
      .max(99, "Popust mora biti između 1 i 99")
      .optional()
      .nullable(),
    image1: playerImageSchema,
    image2: playerImageSchema,
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .refine((data) => data.image1 != null || data.image2 == null, {
    message: "Prvo dodajte prvu sliku, pa drugu",
    path: ["image2"],
  });

export const shopOrderInputSchema = z.object({
  productId: shopProductIdSchema,
  quantity: z.number().int().min(1, "Količina mora biti najmanje 1").max(20, "Najviše 20 komada po narudžbi"),
  firstName: z.string().trim().min(1, "Ime je obavezno").max(80),
  lastName: z.string().trim().min(1, "Prezime je obavezno").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Unesite broj telefona")
    .max(30)
    .regex(/^[+\d][\d\s/-]{5,}$/, "Unesite ispravan broj telefona"),
  email: z.string().trim().email("Unesite ispravan email").max(120),
  address: z.string().trim().min(5, "Unesite adresu").max(300),
});

export const shopOrderStatusSchema = z.enum(["NEW", "DONE", "CANCELLED"]);
export const shopOrderIdSchema = z.string().trim().min(1).max(64);

export type ShopProductInput = z.input<typeof shopProductInputSchema>;
export type ShopOrderInput = z.input<typeof shopOrderInputSchema>;
