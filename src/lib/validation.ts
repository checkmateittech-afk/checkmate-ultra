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

const phoneField = z
  .string()
  .trim()
  .min(8, "Enter a valid phone number")
  .max(20)
  .regex(/^[0-9+\-\s()]+$/, "Enter a valid phone number");

export const providerOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name").max(120),
  about: z.string().trim().min(30, "Tell customers a bit more (30+ characters)").max(1500),
  phone: phoneField,
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]).optional(),
  yearsInBusiness: z.coerce.number().int().min(0).max(100),
  categorySlug: z.string().min(1, "Choose a primary service"),
  citySlug: z.string().min(1, "Choose your city"),
  localitySlug: z.string().min(1, "Choose your locality"),
  addressLine: z.string().trim().min(4, "Enter your address").max(200),
  priceFrom: z.coerce.number().int().min(0).max(10_000_000).optional(),
  priceUnit: z.string().trim().max(40).optional(),
});
export type ProviderOnboardingInput = z.infer<typeof providerOnboardingSchema>;

export const providerProfileSchema = z.object({
  about: z.string().trim().min(30).max(1500),
  phone: phoneField,
  email: z.union([z.string().trim().email(), z.literal("")]).optional(),
  yearsInBusiness: z.coerce.number().int().min(0).max(100),
  addressLine: z.string().trim().min(4).max(200),
  localitySlug: z.string().min(1),
});

export const kycSchema = z.object({
  docType: z.enum(["PAN", "GST", "AADHAAR", "UDYAM"]),
  docRef: z.string().trim().min(4, "Enter the document number").max(40),
  note: z.string().trim().max(300).optional(),
});

export const leadStatusSchema = z.object({
  status: z.enum(["NEW", "VIEWED", "CONTACTED", "WON", "LOST"]).optional(),
  note: z.string().trim().max(500).optional(),
});

export const reviewSchema = z.object({
  providerId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().min(4, "Add a short headline").max(120),
  body: z.string().trim().min(15, "Tell others a bit more (15+ characters)").max(1500),
});

export const reviewReplySchema = z.object({
  reply: z.string().trim().min(2, "Write a reply").max(1000),
});

export const adminProviderSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"]).optional(),
  kycDecision: z.enum(["VERIFIED", "REJECTED"]).optional(),
});

export const adminReviewSchema = z.object({
  status: z.enum(["PUBLISHED", "PENDING", "HIDDEN"]),
});
