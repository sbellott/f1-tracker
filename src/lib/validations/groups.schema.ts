import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(50, 'Group name must be at most 50 characters'),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(3, 'Group name must be at least 3 characters')
    .max(50, 'Group name must be at most 50 characters')
    .optional(),
});

export const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
});

// Schema for managing group members
export const manageMemberSchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  action: z.enum(['remove', 'promote', 'demote']).optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
export type ManageMemberInput = z.infer<typeof manageMemberSchema>;