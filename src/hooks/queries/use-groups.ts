"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GroupWithMembers,
  GroupLeaderboardEntry,
} from "@/lib/services/groups.service";

// ============================================
// Types
// ============================================

interface GroupsResponse {
  groups: GroupWithMembers[];
  count: number;
}

interface LeaderboardResponse {
  groupId: string;
  groupName: string;
  season: number;
  leaderboard: GroupLeaderboardEntry[];
}

interface CreateGroupInput {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdateGroupInput {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// ============================================
// API Functions
// ============================================

async function fetchGroups(): Promise<GroupsResponse> {
  const response = await fetch("/api/groups");
  if (!response.ok) throw new Error("Failed to fetch groups");

  const json = await response.json();
  return json.data;
}

async function fetchGroup(groupId: string): Promise<GroupWithMembers> {
  const response = await fetch(`/api/groups/${groupId}`);
  if (!response.ok) throw new Error("Failed to fetch group");

  const json = await response.json();
  return json.data;
}

async function fetchLeaderboard(
  groupId: string,
  season?: number
): Promise<LeaderboardResponse> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/groups/${groupId}/leaderboard${params}`);

  if (!response.ok) throw new Error("Failed to fetch leaderboard");

  const json = await response.json();
  return json.data;
}

async function createGroup(input: CreateGroupInput): Promise<GroupWithMembers> {
  const response = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create group");
  }

  const json = await response.json();
  return json.data;
}

async function joinGroup(inviteCode: string): Promise<GroupWithMembers> {
  const response = await fetch("/api/groups/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to join group");
  }

  const json = await response.json();
  return json.data.group;
}

async function updateGroup(
  groupId: string,
  input: UpdateGroupInput
): Promise<GroupWithMembers> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to update group");
  }

  const json = await response.json();
  return json.data;
}

async function leaveGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}?action=leave`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to leave group");
  }
}

async function deleteGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to delete group");
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch user's groups
 */
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single group
 */
export function useGroup(groupId: string) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => fetchGroup(groupId),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch group leaderboard
 */
export function useGroupLeaderboard(groupId: string, season?: number) {
  return useQuery({
    queryKey: ["groups", groupId, "leaderboard", season],
    queryFn: () => fetchLeaderboard(groupId, season),
    enabled: !!groupId,
  });
}

/**
 * Hook to create a group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Hook to join a group
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Hook to update a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      ...input
    }: { groupId: string } & UpdateGroupInput) => updateGroup(groupId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["groups", variables.groupId] });
    },
  });
}

/**
 * Hook to leave a group
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

/**
 * Hook to delete a group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
