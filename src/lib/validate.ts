import { z } from "zod";

export const transactionSchema = z.object({
  description: z.string().min(1).max(200),
  amount: z.number().positive().max(999_999_999),
  type: z.enum(["income", "expense"]),
  accountId: z.number().int().positive(),
  categoryId: z.number().int().positive().nullable().optional(),
  date: z.string().min(1),
  notes: z.string().max(500).nullable().optional(),
});

export const transactionPatchSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().max(999_999_999).optional(),
  type: z.enum(["income", "expense"]).optional(),
  accountId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  date: z.string().min(1).optional(),
  notes: z.string().max(500).nullable().optional(),
});

export const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["checking", "savings", "credit", "investment"]),
  balance: z.number().max(999_999_999).optional().default(0),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const accountPatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(["checking", "savings", "credit", "investment"]).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export const budgetSchema = z.object({
  categoryId: z.number().int().positive(),
  amount: z.number().positive().max(999_999_999),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});
