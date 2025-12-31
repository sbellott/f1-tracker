import { prisma } from "@/lib/db/prisma";
import { generateInviteCode } from "@/lib/auth/utils";
import { ApiError } from "@/lib/errors/api-error";
import type { GroupRole } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface GroupWithMembers {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  isPublic: boolean;
  createdAt: Date;
  memberCount: number;
  members: GroupMember[];
  userRole: GroupRole | null;
}

export interface GroupMember {
  id: string;
  role: GroupRole;
  joinedAt: Date;
  user: {
    id: string;
    pseudo: string;
    avatarUrl: string | null;
  };
  totalPoints: number;
}

export interface GroupLeaderboardEntry {
  rank: number;
  userId: string;
  pseudo: string;
  avatarUrl: string | null;
  totalPoints: number;
  predictionsCount: number;
  averagePoints: number;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  isPublic?: boolean;
  ownerId: string;
}

// ============================================
// Groups Service
// ============================================

/**
 * Create a new group
 */
export async function createGroup(data: CreateGroupData): Promise<GroupWithMembers> {
  const inviteCode = generateInviteCode();

  const group = await prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      isPublic: data.isPublic ?? false,
      inviteCode,
      members: {
        create: {
          userId: data.ownerId,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  return formatGroupResponse(group, data.ownerId);
}

/**
 * Get group by ID
 */
export async function getGroupById(
  groupId: string,
  userId?: string
): Promise<GroupWithMembers | null> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!group) return null;

  return formatGroupResponse(group, userId);
}

/**
 * Get groups for a user
 */
export async function getUserGroups(userId: string): Promise<GroupWithMembers[]> {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => formatGroupResponse(m.group, userId));
}

/**
 * Join a group with invite code
 */
export async function joinGroup(
  inviteCode: string,
  userId: string
): Promise<GroupWithMembers> {
  const group = await prisma.group.findUnique({
    where: { inviteCode },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { members: true },
      },
    },
  });

  if (!group) {
    throw ApiError.notFound("Code d'invitation invalide");
  }

  // Check if already a member
  const existingMember = group.members.find((m) => m.userId === userId);
  if (existingMember) {
    throw ApiError.conflict("Vous êtes déjà membre de ce groupe");
  }

  // Add member
  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId,
      role: "MEMBER",
    },
  });

  // Refresh group data
  const updatedGroup = await getGroupById(group.id, userId);
  return updatedGroup!;
}

/**
 * Leave a group
 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  if (!membership) {
    throw ApiError.notFound("Vous n'êtes pas membre de ce groupe");
  }

  if (membership.role === "OWNER") {
    // Check if there are other members
    const memberCount = await prisma.groupMember.count({
      where: { groupId },
    });

    if (memberCount > 1) {
      throw ApiError.badRequest(
        "Le propriétaire doit transférer la propriété avant de quitter le groupe"
      );
    }

    // Delete group if owner is the only member
    await prisma.group.delete({ where: { id: groupId } });
    return;
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });
}

/**
 * Update group settings
 */
export async function updateGroup(
  groupId: string,
  userId: string,
  data: { name?: string; description?: string; isPublic?: boolean }
): Promise<GroupWithMembers> {
  // Verify user is owner or admin
  await verifyGroupAdmin(groupId, userId);

  await prisma.group.update({
    where: { id: groupId },
    data,
  });

  const updatedGroup = await getGroupById(groupId, userId);
  return updatedGroup!;
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string, userId: string): Promise<void> {
  // Verify user is owner
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership || membership.role !== "OWNER") {
    throw ApiError.forbidden("Seul le propriétaire peut supprimer le groupe");
  }

  await prisma.group.delete({ where: { id: groupId } });
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(
  groupId: string,
  userId: string
): Promise<string> {
  await verifyGroupAdmin(groupId, userId);

  const newCode = generateInviteCode();
  await prisma.group.update({
    where: { id: groupId },
    data: { inviteCode: newCode },
  });

  return newCode;
}

/**
 * Get group leaderboard
 */
export async function getGroupLeaderboard(
  groupId: string,
  season?: number
): Promise<GroupLeaderboardEntry[]> {
  const targetSeason = season || new Date().getFullYear();

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          pseudo: true,
          avatarUrl: true,
        },
      },
    },
  });

  const userIds = members.map((m) => m.userId);

  // Get predictions with scores for this group
  const predictions = await prisma.prediction.findMany({
    where: {
      userId: { in: userIds },
      groupId,
      scored: true,
      race: {
        season: targetSeason,
      },
    },
    select: {
      userId: true,
      points: true,
    },
  });

  // Calculate stats per user
  const statsMap = new Map<
    string,
    { totalPoints: number; predictionsCount: number }
  >();

  for (const pred of predictions) {
    const existing = statsMap.get(pred.userId) || {
      totalPoints: 0,
      predictionsCount: 0,
    };
    existing.totalPoints += pred.points || 0;
    existing.predictionsCount++;
    statsMap.set(pred.userId, existing);
  }

  // Build leaderboard
  const leaderboard: GroupLeaderboardEntry[] = members.map((member) => {
    const stats = statsMap.get(member.userId) || {
      totalPoints: 0,
      predictionsCount: 0,
    };
    return {
      rank: 0,
      userId: member.user.id,
      pseudo: member.user.pseudo,
      avatarUrl: member.user.avatarUrl,
      totalPoints: stats.totalPoints,
      predictionsCount: stats.predictionsCount,
      averagePoints:
        stats.predictionsCount > 0
          ? Math.round(stats.totalPoints / stats.predictionsCount)
          : 0,
    };
  });

  // Sort and assign ranks
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

/**
 * Update member role
 */
export async function updateMemberRole(
  groupId: string,
  adminUserId: string,
  targetUserId: string,
  newRole: GroupRole
): Promise<void> {
  // Verify admin
  const adminMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: adminUserId } },
  });

  if (
    !adminMembership ||
    (adminMembership.role !== "OWNER" && adminMembership.role !== "ADMIN")
  ) {
    throw ApiError.forbidden("Permission insuffisante");
  }

  // Cannot change owner role
  const targetMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  if (!targetMembership) {
    throw ApiError.notFound("Membre non trouvé");
  }

  if (targetMembership.role === "OWNER") {
    throw ApiError.forbidden("Impossible de modifier le rôle du propriétaire");
  }

  // Only owner can promote to admin
  if (newRole === "ADMIN" && adminMembership.role !== "OWNER") {
    throw ApiError.forbidden("Seul le propriétaire peut promouvoir un admin");
  }

  await prisma.groupMember.update({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    data: { role: newRole },
  });
}

/**
 * Remove a member from group
 */
export async function removeMember(
  groupId: string,
  adminUserId: string,
  targetUserId: string
): Promise<void> {
  await verifyGroupAdmin(groupId, adminUserId);

  const targetMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });

  if (!targetMembership) {
    throw ApiError.notFound("Membre non trouvé");
  }

  if (targetMembership.role === "OWNER") {
    throw ApiError.forbidden("Impossible de retirer le propriétaire");
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId: targetUserId } },
  });
}

// ============================================
// Helper Functions
// ============================================

async function verifyGroupAdmin(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });

  if (!membership) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw ApiError.forbidden("Permission insuffisante");
  }
}

function formatGroupResponse(
  group: {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
    isPublic: boolean;
    createdAt: Date;
    members: Array<{
      id: string;
      role: GroupRole;
      joinedAt: Date;
      user: {
        id: string;
        pseudo: string;
        avatarUrl: string | null;
      };
    }>;
    _count: { members: number };
  },
  userId?: string
): GroupWithMembers {
  const userMember = userId
    ? group.members.find((m) => m.user.id === userId)
    : null;

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode: group.inviteCode,
    isPublic: group.isPublic,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    members: group.members.map((m) => ({
      id: m.id,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
      totalPoints: 0, // Calculated separately when needed
    })),
    userRole: userMember?.role || null,
  };
}

export default {
  createGroup,
  getGroupById,
  getUserGroups,
  joinGroup,
  leaveGroup,
  updateGroup,
  deleteGroup,
  regenerateInviteCode,
  getGroupLeaderboard,
  updateMemberRole,
  removeMember,
};
