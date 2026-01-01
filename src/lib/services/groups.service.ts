import { prisma } from "@/lib/db/prisma";
import { generateInviteCode } from "@/lib/auth/utils";
import { ApiError } from "@/lib/errors/api-error";

// ============================================
// Types
// ============================================

export interface GroupWithMembers {
  id: string;
  name: string;
  inviteCode: string;
  createdById: string;
  createdAt: Date;
  memberCount: number;
  members: GroupMemberInfo[];
  isOwner: boolean;
}

export interface GroupMemberInfo {
  id: string;
  userId: string;
  joinedAt: Date;
  totalPoints: number;
  user: {
    id: string;
    pseudo: string | null;
    avatar: string | null;
  };
}

export interface GroupLeaderboardEntry {
  rank: number;
  userId: string;
  pseudo: string | null;
  avatar: string | null;
  totalPoints: number;
  predictionsCount: number;
  averagePoints: number;
}

export interface CreateGroupData {
  name: string;
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
      inviteCode,
      createdById: data.ownerId,
      members: {
        create: {
          userId: data.ownerId,
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
              avatar: true,
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
              avatar: true,
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
                  avatar: true,
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
              avatar: true,
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
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  // Check if user is the owner
  if (group.createdById === userId) {
    // Check if there are other members
    const memberCount = await prisma.groupMember.count({
      where: { groupId },
    });

    if (memberCount > 1) {
      throw ApiError.badRequest(
        "Le créateur doit transférer le groupe avant de le quitter"
      );
    }

    // Delete group if owner is the only member
    await prisma.group.delete({ where: { id: groupId } });
    return;
  }

  // Delete membership using the composite unique constraint
  await prisma.groupMember.deleteMany({
    where: {
      groupId,
      userId,
    },
  });
}

/**
 * Update group settings
 */
export async function updateGroup(
  groupId: string,
  userId: string,
  data: { name?: string }
): Promise<GroupWithMembers> {
  // Verify user is owner
  await verifyGroupOwner(groupId, userId);

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
  await verifyGroupOwner(groupId, userId);

  await prisma.group.delete({ where: { id: groupId } });
}

/**
 * Regenerate invite code
 */
export async function regenerateInviteCode(
  groupId: string,
  userId: string
): Promise<string> {
  await verifyGroupOwner(groupId, userId);

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
          avatar: true,
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
      points: { not: null },
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
      avatar: member.user.avatar,
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
 * Remove a member from group
 */
export async function removeMember(
  groupId: string,
  ownerUserId: string,
  targetUserId: string
): Promise<void> {
  await verifyGroupOwner(groupId, ownerUserId);

  // Cannot remove the owner
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (group?.createdById === targetUserId) {
    throw ApiError.forbidden("Impossible de retirer le créateur du groupe");
  }

  // Find and delete the membership
  const deleted = await prisma.groupMember.deleteMany({
    where: {
      groupId,
      userId: targetUserId,
    },
  });

  if (deleted.count === 0) {
    throw ApiError.notFound("Membre non trouvé");
  }
}

// ============================================
// Helper Functions
// ============================================

async function verifyGroupOwner(groupId: string, userId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw ApiError.notFound("Groupe non trouvé");
  }

  if (group.createdById !== userId) {
    throw ApiError.forbidden("Seul le créateur peut effectuer cette action");
  }
}

function formatGroupResponse(
  group: {
    id: string;
    name: string;
    inviteCode: string;
    createdById: string;
    createdAt: Date;
    members: Array<{
      id: string;
      userId: string;
      joinedAt: Date;
      totalPoints: number;
      user: {
        id: string;
        pseudo: string | null;
        avatar: string | null;
      };
    }>;
    _count: { members: number };
  },
  userId?: string
): GroupWithMembers {
  return {
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    createdById: group.createdById,
    createdAt: group.createdAt,
    memberCount: group._count.members,
    members: group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      joinedAt: m.joinedAt,
      totalPoints: m.totalPoints,
      user: m.user,
    })),
    isOwner: userId === group.createdById,
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
  removeMember,
};
