import { prisma } from "@/lib/db/prisma";
import { ApiError } from "@/lib/errors/api-error";
import type { GroupRole, InvitationStatus, Prisma } from "@prisma/client";
import { nanoid } from "nanoid";

// ============================================
// Types
// ============================================

export interface GroupWithDetails {
  id: string;
  name: string;
  description: string | null;
  code: string;
  imageUrl: string | null;
  isPrivate: boolean;
  maxMembers: number;
  season: number;
  createdAt: Date;
  memberCount: number;
  owner: {
    id: string;
    pseudo: string | null;
    avatar: string | null;
  };
  currentUserRole?: GroupRole;
}

export interface GroupMemberWithUser {
  id: string;
  role: GroupRole;
  joinedAt: Date;
  user: {
    id: string;
    pseudo: string | null;
    avatar: string | null;
    email: string;
  };
  totalPoints: number;
  rank: number;
}

export interface GroupLeaderboard {
  groupId: string;
  groupName: string;
  season: number;
  members: GroupMemberWithUser[];
}

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
  season?: number;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface InvitationWithDetails {
  id: string;
  status: InvitationStatus;
  createdAt: Date;
  expiresAt: Date;
  group: {
    id: string;
    name: string;
    imageUrl: string | null;
    memberCount: number;
  };
  sender: {
    id: string;
    pseudo: string | null;
    avatar: string | null;
  };
}

// ============================================
// Group CRUD Operations
// ============================================

/**
 * Create a new group
 */
export async function createGroup(
  ownerId: string,
  input: CreateGroupInput
): Promise<GroupWithDetails> {
  const { name, description, imageUrl, isPrivate = true, maxMembers = 50, season } = input;
  const currentSeason = season || new Date().getFullYear();

  // Validate name length
  if (name.length < 3 || name.length > 50) {
    throw ApiError.badRequest("Le nom du groupe doit contenir entre 3 et 50 caractères");
  }

  // Generate unique invite code (8 characters)
  let code: string;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    code = nanoid(8).toUpperCase();
    const existing = await prisma.group.findUnique({ where: { code } });
    if (!existing) isUnique = true;
    attempts++;
  }

  if (!isUnique) {
    throw ApiError.internal("Impossible de générer un code unique");
  }

  // Create group with owner as first member
  const group = await prisma.group.create({
    data: {
      name,
      description,
      code: code!,
      imageUrl,
      isPrivate,
      maxMembers,
      season: currentSeason,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: "OWNER",
        },
      },
    },
    include: {
      owner: {
        select: { id: true, pseudo: true, avatar: true },
      },
      _count: { select: { members: true } },
    },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    code: group.code,
    imageUrl: group.imageUrl,
    isPrivate: group.isPrivate,
    maxMembers: group.maxMembers,
    season: group.season,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    owner: group.owner,
    currentUserRole: "OWNER",
  };
}

/**
 * Get a group by ID
 */
export async function getGroup(
  groupId: string,
  userId?: string
): Promise<GroupWithDetails | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      owner: {
        select: { id: true, pseudo: true, avatar: true },
      },
      _count: { select: { members: true } },
      members: userId
        ? {
            where: { userId },
            select: { role: true },
            take: 1,
          }
        : false,
    },
  });

  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    code: group.code,
    imageUrl: group.imageUrl,
    isPrivate: group.isPrivate,
    maxMembers: group.maxMembers,
    season: group.season,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    owner: group.owner,
    currentUserRole: group.members?.[0]?.role,
  };
}

/**
 * Get group by invite code
 */
export async function getGroupByCode(code: string): Promise<GroupWithDetails | null> {
  const group = await prisma.group.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      owner: {
        select: { id: true, pseudo: true, avatar: true },
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    code: group.code,
    imageUrl: group.imageUrl,
    isPrivate: group.isPrivate,
    maxMembers: group.maxMembers,
    season: group.season,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    owner: group.owner,
  };
}

/**
 * Get all groups for a user
 */
export async function getUserGroups(userId: string): Promise<GroupWithDetails[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          owner: {
            select: { id: true, pseudo: true, avatar: true },
          },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    code: m.group.code,
    imageUrl: m.group.imageUrl,
    isPrivate: m.group.isPrivate,
    maxMembers: m.group.maxMembers,
    season: m.group.season,
    createdAt: m.group.createdAt,
    memberCount: m.group._count.members,
    owner: m.group.owner,
    currentUserRole: m.role,
  }));
}

/**
 * Update a group
 */
export async function updateGroup(
  groupId: string,
  userId: string,
  input: UpdateGroupInput
): Promise<GroupWithDetails> {
  // Check if user is owner or admin
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    throw ApiError.forbidden("Vous n'avez pas les droits pour modifier ce groupe");
  }

  const group = await prisma.group.update({
    where: { id: groupId },
    data: input,
    include: {
      owner: {
        select: { id: true, pseudo: true, avatar: true },
      },
      _count: { select: { members: true } },
    },
  });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    code: group.code,
    imageUrl: group.imageUrl,
    isPrivate: group.isPrivate,
    maxMembers: group.maxMembers,
    season: group.season,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    owner: group.owner,
    currentUserRole: membership.role,
  };
}

/**
 * Delete a group (owner only)
 */
export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true },
  });

  if (!group) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  if (group.ownerId !== userId) {
    throw ApiError.forbidden("Seul le propriétaire peut supprimer ce groupe");
  }

  await prisma.group.delete({ where: { id: groupId } });
}

// ============================================
// Member Management
// ============================================

/**
 * Join a group with invite code
 */
export async function joinGroupByCode(
  userId: string,
  code: string
): Promise<GroupWithDetails> {
  const group = await prisma.group.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      _count: { select: { members: true } },
      members: {
        where: { userId },
        take: 1,
      },
    },
  });

  if (!group) {
    throw ApiError.notFound("Code d'invitation invalide");
  }

  // Check if already a member
  if (group.members.length > 0) {
    throw ApiError.badRequest("Vous êtes déjà membre de ce groupe");
  }

  // Check if group is full
  if (group._count.members >= group.maxMembers) {
    throw ApiError.badRequest("Ce groupe est complet");
  }

  // Add user as member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: "MEMBER",
    },
  });

  return getGroup(group.id, userId) as Promise<GroupWithDetails>;
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    throw ApiError.notFound("Vous n'êtes pas membre de ce groupe");
  }

  // Owner cannot leave - must transfer ownership or delete group
  if (membership.role === "OWNER") {
    throw ApiError.badRequest(
      "Le propriétaire ne peut pas quitter le groupe. Transférez la propriété ou supprimez le groupe."
    );
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

/**
 * Remove a member from group (admin/owner only)
 */
export async function removeMember(
  groupId: string,
  adminUserId: string,
  targetUserId: string
): Promise<void> {
  // Check admin privileges
  const adminMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: adminUserId } },
  });

  if (!adminMembership || adminMembership.role === "MEMBER") {
    throw ApiError.forbidden("Vous n'avez pas les droits pour retirer des membres");
  }

  // Get target membership
  const targetMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  if (!targetMembership) {
    throw ApiError.notFound("Membre non trouvé");
  }

  // Cannot remove owner
  if (targetMembership.role === "OWNER") {
    throw ApiError.forbidden("Impossible de retirer le propriétaire du groupe");
  }

  // Admin cannot remove other admins (only owner can)
  if (targetMembership.role === "ADMIN" && adminMembership.role !== "OWNER") {
    throw ApiError.forbidden("Seul le propriétaire peut retirer un administrateur");
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
}

/**
 * Change member role
 */
export async function changeMemberRole(
  groupId: string,
  adminUserId: string,
  targetUserId: string,
  newRole: GroupRole
): Promise<void> {
  // Only owner can change roles
  const adminMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: adminUserId } },
  });

  if (!adminMembership || adminMembership.role !== "OWNER") {
    throw ApiError.forbidden("Seul le propriétaire peut modifier les rôles");
  }

  // Cannot change owner role this way
  if (newRole === "OWNER") {
    throw ApiError.badRequest("Utilisez la fonction de transfert de propriété");
  }

  const targetMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  if (!targetMembership) {
    throw ApiError.notFound("Membre non trouvé");
  }

  if (targetMembership.role === "OWNER") {
    throw ApiError.badRequest("Impossible de modifier le rôle du propriétaire");
  }

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: newRole },
  });
}

/**
 * Transfer ownership
 */
export async function transferOwnership(
  groupId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> {
  // Verify current owner
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true },
  });

  if (!group || group.ownerId !== currentOwnerId) {
    throw ApiError.forbidden("Seul le propriétaire peut transférer la propriété");
  }

  // Verify new owner is a member
  const newOwnerMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  });

  if (!newOwnerMembership) {
    throw ApiError.badRequest("Le nouveau propriétaire doit être membre du groupe");
  }

  // Transaction: update group owner and member roles
  await prisma.$transaction([
    prisma.group.update({
      where: { id: groupId },
      data: { ownerId: newOwnerId },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: currentOwnerId } },
      data: { role: "ADMIN" },
    }),
    prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: "OWNER" },
    }),
  ]);
}

// ============================================
// Leaderboard
// ============================================

/**
 * Get group leaderboard with prediction scores
 */
export async function getGroupLeaderboard(
  groupId: string,
  season?: number
): Promise<GroupLeaderboard> {
  const targetSeason = season || new Date().getFullYear();

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, season: true },
  });

  if (!group) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  // Get all members with their prediction scores
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          pseudo: true,
          avatar: true,
          email: true,
          predictions: {
            where: {
              points: { not: null },
              race: { season: targetSeason },
            },
            select: { points: true },
          },
        },
      },
    },
  });

  // Calculate total points and sort
  const membersWithPoints = members
    .map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: {
        id: m.user.id,
        pseudo: m.user.pseudo,
        avatar: m.user.avatar,
        email: m.user.email,
      },
      totalPoints: m.user.predictions.reduce((sum, p) => sum + (p.points || 0), 0),
      rank: 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign ranks (handle ties)
  let currentRank = 1;
  let previousPoints = -1;
  membersWithPoints.forEach((m, idx) => {
    if (m.totalPoints !== previousPoints) {
      currentRank = idx + 1;
    }
    m.rank = currentRank;
    previousPoints = m.totalPoints;
  });

  return {
    groupId: group.id,
    groupName: group.name,
    season: targetSeason,
    members: membersWithPoints,
  };
}

// ============================================
// Invitations
// ============================================

/**
 * Create an invitation
 */
export async function createInvitation(
  groupId: string,
  senderId: string,
  recipientEmail?: string,
  recipientId?: string
): Promise<InvitationWithDetails> {
  // Check sender privileges
  const senderMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: senderId } },
  });

  if (!senderMembership) {
    throw ApiError.forbidden("Vous devez être membre du groupe pour inviter");
  }

  // Get group info
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true } } },
  });

  if (!group) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  // Check if group is full
  if (group._count.members >= group.maxMembers) {
    throw ApiError.badRequest("Ce groupe est complet");
  }

  // If recipient ID provided, check they're not already a member
  if (recipientId) {
    const existingMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: recipientId } },
    });

    if (existingMember) {
      throw ApiError.badRequest("Cet utilisateur est déjà membre du groupe");
    }

    // Check for existing pending invitation
    const existingInvitation = await prisma.groupInvitation.findFirst({
      where: {
        groupId,
        recipientId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      throw ApiError.badRequest("Une invitation est déjà en attente pour cet utilisateur");
    }
  }

  // Expiration: 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await prisma.groupInvitation.create({
    data: {
      groupId,
      senderId,
      recipientId,
      email: recipientEmail,
      expiresAt,
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          _count: { select: { members: true } },
        },
      },
      sender: {
        select: { id: true, pseudo: true, avatar: true },
      },
    },
  });

  return {
    id: invitation.id,
    status: invitation.status,
    createdAt: invitation.createdAt,
    expiresAt: invitation.expiresAt,
    group: {
      id: invitation.group.id,
      name: invitation.group.name,
      imageUrl: invitation.group.imageUrl,
      memberCount: invitation.group._count.members,
    },
    sender: invitation.sender,
  };
}

/**
 * Get pending invitations for a user
 */
export async function getUserInvitations(userId: string): Promise<InvitationWithDetails[]> {
  const invitations = await prisma.groupInvitation.findMany({
    where: {
      recipientId: userId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      group: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          _count: { select: { members: true } },
        },
      },
      sender: {
        select: { id: true, pseudo: true, avatar: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitations.map((inv) => ({
    id: inv.id,
    status: inv.status,
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    group: {
      id: inv.group.id,
      name: inv.group.name,
      imageUrl: inv.group.imageUrl,
      memberCount: inv.group._count.members,
    },
    sender: inv.sender,
  }));
}

/**
 * Respond to an invitation
 */
export async function respondToInvitation(
  invitationId: string,
  userId: string,
  accept: boolean
): Promise<GroupWithDetails | null> {
  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    include: {
      group: {
        include: { _count: { select: { members: true } } },
      },
    },
  });

  if (!invitation) {
    throw ApiError.notFound("Invitation non trouvée");
  }

  if (invitation.recipientId !== userId) {
    throw ApiError.forbidden("Cette invitation ne vous est pas destinée");
  }

  if (invitation.status !== "PENDING") {
    throw ApiError.badRequest("Cette invitation a déjà été traitée");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: "EXPIRED" },
    });
    throw ApiError.badRequest("Cette invitation a expiré");
  }

  if (accept) {
    // Check if group is full
    if (invitation.group._count.members >= invitation.group.maxMembers) {
      throw ApiError.badRequest("Ce groupe est complet");
    }

    // Transaction: accept invitation and add member
    await prisma.$transaction([
      prisma.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      }),
      prisma.groupMember.create({
        data: {
          groupId: invitation.groupId,
          userId,
          role: "MEMBER",
        },
      }),
    ]);

    return getGroup(invitation.groupId, userId);
  } else {
    await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    return null;
  }
}

/**
 * Regenerate group invite code (owner/admin only)
 */
export async function regenerateInviteCode(
  groupId: string,
  userId: string
): Promise<string> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || membership.role === "MEMBER") {
    throw ApiError.forbidden("Vous n'avez pas les droits pour régénérer le code");
  }

  // Generate new unique code
  let newCode: string;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    newCode = nanoid(8).toUpperCase();
    const existing = await prisma.group.findUnique({ where: { code: newCode } });
    if (!existing) isUnique = true;
    attempts++;
  }

  if (!isUnique) {
    throw ApiError.internal("Impossible de générer un nouveau code unique");
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { code: newCode! },
  });

  return newCode!;
}

// ============================================
// Export
// ============================================

export default {
  // Group CRUD
  createGroup,
  getGroup,
  getGroupByCode,
  getUserGroups,
  updateGroup,
  deleteGroup,
  // Member management
  joinGroupByCode,
  leaveGroup,
  removeMember,
  changeMemberRole,
  transferOwnership,
  // Leaderboard
  getGroupLeaderboard,
  // Invitations
  createInvitation,
  getUserInvitations,
  respondToInvitation,
  regenerateInviteCode,
};