import { z } from "zod";

// ============================================
// Sign In Schema
// ============================================

export const signInSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, "Mot de passe requis"),
});

export type SignInInput = z.infer<typeof signInSchema>;

// ============================================
// Register Schema
// ============================================

export const registerSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  pseudo: z
    .string()
    .min(2, "Le pseudo doit contenir au moins 2 caractères")
    .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores"
    )
    .trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// Password Reset Schema
// ============================================

export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email("Email invalide")
    .toLowerCase()
    .trim(),
});

export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================
// Profile Update Schema
// ============================================

export const updateProfileSchema = z.object({
  pseudo: z
    .string()
    .min(2, "Le pseudo doit contenir au moins 2 caractères")
    .max(20, "Le pseudo ne peut pas dépasser 20 caractères")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores"
    )
    .trim()
    .optional(),
  avatar: z
    .string()
    .url("URL d'avatar invalide")
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// User Preferences Schema
// ============================================

export const updatePreferencesSchema = z.object({
  notifyBeforeSession: z.boolean().optional(),
  notifyDelayMinutes: z
    .number()
    .int()
    .min(5, "Délai minimum: 5 minutes")
    .max(120, "Délai maximum: 2 heures")
    .optional(),
  darkMode: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
