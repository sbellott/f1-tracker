/**
 * Groups React Query Hooks
 * Handles fetching groups and members data with caching
 */

import { useQuery } from "@tanstack/react-query";

// ============================================
// Types
// ============================================

export interface GroupSummary {
  id: string;
  name: string;
  memberCount: number;
  currentUserRole: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
}

export interface GroupMember {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  totalPoints: number;
  rank?: number;
  user: {
    id: string;
    pseudo: string | null;
    email: string;
    avatar: string | null;
  };
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch all groups the current user belongs to
 */
export function useGroups() {
  return useQuery<GroupSummary[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) {
        throw new Error("Failed to fetch groups");
      }
      const data = await res.json();
      // API returns array directly, or wrapped in .groups for compatibility
      return Array.isArray(data) ? data : (data.groups || []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch members of a specific group
 */
export function useGroupMembers(groupId: string) {
  return useQuery<GroupMember[]>({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/members`);
      if (!res.ok) {
        throw new Error("Failed to fetch group members");
      }
      const data = await res.json();
      // API returns array directly, or wrapped in .members for compatibility
      return Array.isArray(data) ? data : (data.members || []);
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch group leaderboard
 */
export function useGroupLeaderboard(groupId: string) {
  return useQuery({
    queryKey: ["group-leaderboard", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/leaderboard`);
      if (!res.ok) {
        throw new Error("Failed to fetch leaderboard");
      }
      return res.json();
    },
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single group details
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch group");
      }
      return res.json();
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
