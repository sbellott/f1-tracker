import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  pseudo: z
    .string()
    .min(3, 'Pseudo must be at least 3 characters')
    .max(20, 'Pseudo must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Pseudo can only contain letters, numbers, underscores, and hyphens'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  pseudo: z
    .string()
    .min(3, 'Pseudo must be at least 3 characters')
    .max(20, 'Pseudo must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Pseudo can only contain letters, numbers, underscores, and hyphens')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').optional().nullable(),
});

export const updatePreferencesSchema = z.object({
  notifyBeforeSession: z.boolean().optional(),
  notifyDelayMinutes: z.number().min(5).max(120).optional(),
  darkMode: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
