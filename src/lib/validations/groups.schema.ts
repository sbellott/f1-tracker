import { z } from "zod/v4";

/**
 * Schema for creating a group
 */
export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(
      /^[a-zA-Z0-9\sàâäéèêëïîôùûüç'-]+$/,
      "Le nom contient des caractères non autorisés"
    ),
  description: z
    .string()
    .max(200, "La description ne peut pas dépasser 200 caractères")
    .optional(),
  isPublic: z.boolean().default(false),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

/**
 * Schema for updating a group
 */
export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(
      /^[a-zA-Z0-9\sàâäéèêëïîôùûüç'-]+$/,
      "Le nom contient des caractères non autorisés"
    )
    .optional(),
  description: z
    .string()
    .max(200, "La description ne peut pas dépasser 200 caractères")
    .optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

/**
 * Schema for joining a group with invite code
 */
export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .length(8, "Le code d'invitation doit contenir 8 caractères")
    .regex(/^[A-Z0-9]+$/, "Code d'invitation invalide"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

/**
 * Schema for group query parameters
 */
export const groupQuerySchema = z.object({
  search: z.string().optional(),
  isPublic: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type GroupQueryInput = z.infer<typeof groupQuerySchema>;

/**
 * Schema for managing group members
 */
export const manageMemberSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["MEMBER", "ADMIN"]).optional(),
});

export type ManageMemberInput = z.infer<typeof manageMemberSchema>;

/**
 * Schema for regenerating invite code
 */
export const regenerateInviteSchema = z.object({
  groupId: z.string().cuid(),
});

export type RegenerateInviteInput = z.infer<typeof regenerateInviteSchema>;
