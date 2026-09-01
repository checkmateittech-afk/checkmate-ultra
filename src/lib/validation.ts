import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20)
    .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number"),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional(),
  message: z.string().trim().min(10, "Tell us a little more about what you need").max(1000),
  categorySlug: z.string().optional(),
  citySlug: z.string().optional(),
  providerId: z.string().optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;
