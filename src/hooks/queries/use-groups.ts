"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  GroupWithDetails,
  GroupMemberWithUser,
  GroupLeaderboard,
  InvitationWithDetails,
} from "@/lib/services/groups.service";
import type { GroupRole } from "@prisma/client";

// ============================================
// Types
// ============================================

interface CreateGroupInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
  season?: number;
}

interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
}

interface GroupMembersResponse {
  members: GroupMemberWithUser[];
  count: number;
}

// ============================================
// API Functions - Groups
// ============================================

async function fetchGroups(): Promise<GroupWithDetails[]> {
  const response = await fetch("/api/groups");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch groups");
  }

  return response.json();
}

async function fetchGroup(groupId: string): Promise<GroupWithDetails> {
  const response = await fetch(`/api/groups/${groupId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch group");
  }

  return response.json();
}

async function fetchGroupMembers(groupId: string): Promise<GroupMembersResponse> {
  const response = await fetch(`/api/groups/${groupId}/members`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch members");
  }

  // API returns array of members, wrap in expected format
  const members = await response.json();
  return { members, count: members.length };
}

async function fetchGroupLeaderboard(
  groupId: string,
  season?: number
): Promise<GroupLeaderboard> {
  const params = season ? `?season=${season}` : "";
  const response = await fetch(`/api/groups/${groupId}/leaderboard${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch leaderboard");
  }

  return response.json();
}

async function createGroup(input: CreateGroupInput): Promise<GroupWithDetails> {
  const response = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create group");
  }

  return response.json();
}

async function updateGroup(
  groupId: string,
  input: UpdateGroupInput
): Promise<GroupWithDetails> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update group");
  }

  return response.json();
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

async function joinGroupByCode(code: string): Promise<GroupWithDetails> {
  const response = await fetch("/api/groups/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to join group");
  }

  return response.json();
}

async function leaveGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to leave group");
  }
}

async function removeMember(groupId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to remove member");
  }
}

async function changeMemberRole(
  groupId: string,
  memberId: string,
  role: GroupRole
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to change member role");
  }
}

async function transferOwnership(
  groupId: string,
  newOwnerId: string
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newOwnerId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to transfer ownership");
  }
}

async function regenerateCode(groupId: string): Promise<string> {
  const response = await fetch(`/api/groups/${groupId}/code`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to regenerate code");
  }

  const json = await response.json();
  return json.code;
}

// ============================================
// API Functions - Invitations
// ============================================

async function fetchUserInvitations(): Promise<InvitationWithDetails[]> {
  const response = await fetch("/api/invitations");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch invitations");
  }

  const json = await response.json();
  return json.data.invitations;
}

async function createInvitation(
  groupId: string,
  recipientEmail?: string,
  recipientId?: string
): Promise<InvitationWithDetails> {
  const response = await fetch(`/api/groups/${groupId}/invitations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipientEmail, recipientId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to create invitation");
  }

  const json = await response.json();
  return json.data;
}

async function respondToInvitation(
  invitationId: string,
  accept: boolean
): Promise<GroupWithDetails | null> {
  const response = await fetch(`/api/invitations/${invitationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accept }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to respond to invitation");
  }

  const json = await response.json();
  return json.data;
}

// ============================================
// Query Hooks - Groups
// ============================================

/**
 * Hook to fetch all groups for the current user
 */
export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single group by ID
 */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ["groups", groupId],
    queryFn: () => fetchGroup(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch members of a group
 */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch group leaderboard
 */
export function useGroupLeaderboard(groupId: string | undefined, season?: number) {
  return useQuery({
    queryKey: ["groups", groupId, "leaderboard", season],
    queryFn: () => fetchGroupLeaderboard(groupId!, season),
    enabled: !!groupId,
    staleTime: 1000 * 60 * 2, // 2 minutes (leaderboard changes after races)
  });
}

// ============================================
// Query Hooks - Invitations
// ============================================

/**
 * Hook to fetch pending invitations for the current user
 */
export function useUserInvitations() {
  return useQuery({
    queryKey: ["invitations"],
    queryFn: fetchUserInvitations,
    staleTime: 1000 * 60 * 1, // 1 minute (invitations can expire)
  });
}

// ============================================
// Mutation Hooks - Groups
// ============================================

/**
 * Hook to create a new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      // Optimistically add to cache
      queryClient.setQueryData(["groups", newGroup.id], newGroup);
    },
  });
}

/**
 * Hook to update a group
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, ...input }: { groupId: string } & UpdateGroupInput) =>
      updateGroup(groupId, input),
    onSuccess: (updatedGroup, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.setQueryData(["groups", groupId], updatedGroup);
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
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Hook to join a group with invite code
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroupByCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
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
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Hook to remove a member from a group (admin/owner only)
 */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      removeMember(groupId, memberId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
    },
  });
}

/**
 * Hook to change a member's role (owner only)
 */
export function useChangeMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      memberId,
      role,
    }: {
      groupId: string;
      memberId: string;
      role: GroupRole;
    }) => changeMemberRole(groupId, memberId, role),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
    },
  });
}

/**
 * Hook to transfer group ownership (owner only)
 */
export function useTransferOwnership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, newOwnerId }: { groupId: string; newOwnerId: string }) =>
      transferOwnership(groupId, newOwnerId),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
    },
  });
}

/**
 * Hook to regenerate group invite code (admin/owner only)
 */
export function useRegenerateCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateCode,
    onSuccess: (newCode, groupId) => {
      // Update the cached group with the new code
      queryClient.setQueryData<GroupWithDetails>(["groups", groupId], (old) =>
        old ? { ...old, code: newCode } : old
      );
    },
  });
}

// ============================================
// Mutation Hooks - Invitations
// ============================================

/**
 * Hook to create an invitation (member of group)
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      recipientEmail,
      recipientId,
    }: {
      groupId: string;
      recipientEmail?: string;
      recipientId?: string;
    }) => createInvitation(groupId, recipientEmail, recipientId),
    onSuccess: () => {
      // Note: This doesn't affect the current user's invitations, but could
      // be extended to track sent invitations
    },
  });
}

/**
 * Hook to respond to an invitation (accept/reject)
 */
export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, accept }: { invitationId: string; accept: boolean }) =>
      respondToInvitation(invitationId, accept),
    onSuccess: (group, { accept }) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      if (accept && group) {
        queryClient.invalidateQueries({ queryKey: ["groups"] });
        queryClient.setQueryData(["groups", group.id], group);
      }
    },
  });
}