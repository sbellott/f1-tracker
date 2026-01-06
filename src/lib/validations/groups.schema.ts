import { z } from "zod";

// ============================================
// Group Schemas
// ============================================

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  imageUrl: z.string().url("URL d'image invalide").optional().nullable(),
  isPrivate: z.boolean().default(true),
  maxMembers: z
    .number()
    .int()
    .min(2, "Minimum 2 membres")
    .max(100, "Maximum 100 membres")
    .default(50),
  season: z.number().int().min(2020).max(2030).optional(),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, "La description ne peut pas dépasser 500 caractères")
    .optional()
    .nullable(),
  imageUrl: z.string().url("URL d'image invalide").optional().nullable(),
  isPrivate: z.boolean().optional(),
  maxMembers: z
    .number()
    .int()
    .min(2, "Minimum 2 membres")
    .max(100, "Maximum 100 membres")
    .optional(),
});

export const joinGroupByCodeSchema = z.object({
  code: z
    .string()
    .length(8, "Le code d'invitation doit contenir 8 caractères")
    .toUpperCase(),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"], {
    errorMap: () => ({ message: "Rôle invalide" }),
  }),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().cuid("ID utilisateur invalide"),
});

// ============================================
// Invitation Schemas
// ============================================

export const createInvitationSchema = z
  .object({
    recipientEmail: z.string().email("Email invalide").optional(),
    recipientId: z.string().cuid("ID utilisateur invalide").optional(),
  })
  .refine((data) => data.recipientEmail || data.recipientId, {
    message: "Email ou ID du destinataire requis",
  });

export const respondToInvitationSchema = z.object({
  accept: z.boolean(),
});

// ============================================
// Query Params
// ============================================

export const leaderboardQuerySchema = z.object({
  season: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(2020).max(2030))
    .optional(),
});

// ============================================
// Types
// ============================================

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type JoinGroupByCodeInput = z.infer<typeof joinGroupByCodeSchema>;
export type ChangeMemberRoleInput = z.infer<typeof changeMemberRoleSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RespondToInvitationInput = z.infer<typeof respondToInvitationSchema>;
