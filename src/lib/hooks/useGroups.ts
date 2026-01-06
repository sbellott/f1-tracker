import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GroupRole } from "@prisma/client";

// ============================================
// Types (mirroring service types for client)
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
  createdAt: string;
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
  joinedAt: string;
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

export interface InvitationWithDetails {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string;
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

export interface CreateGroupInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  isPrivate?: boolean;
  maxMembers?: number;
}

// ============================================
// Query Keys
// ============================================

export const groupKeys = {
  all: ["groups"] as const,
  lists: () => [...groupKeys.all, "list"] as const,
  list: () => [...groupKeys.lists()] as const,
  details: () => [...groupKeys.all, "detail"] as const,
  detail: (id: string) => [...groupKeys.details(), id] as const,
  leaderboard: (id: string, season?: number) => 
    [...groupKeys.detail(id), "leaderboard", season] as const,
  members: (id: string) => [...groupKeys.detail(id), "members"] as const,
  invitations: ["invitations"] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchUserGroups(): Promise<GroupWithDetails[]> {
  const response = await fetch("/api/groups");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement des groupes");
  }
  return response.json();
}

async function fetchGroup(groupId: string): Promise<GroupWithDetails> {
  const response = await fetch(`/api/groups/${groupId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Groupe non trouvé");
  }
  return response.json();
}

async function fetchGroupLeaderboard(
  groupId: string,
  season?: number
): Promise<GroupLeaderboard> {
  const url = season
    ? `/api/groups/${groupId}/leaderboard?season=${season}`
    : `/api/groups/${groupId}/leaderboard`;
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement du classement");
  }
  return response.json();
}

async function fetchGroupMembers(groupId: string): Promise<GroupMemberWithUser[]> {
  const response = await fetch(`/api/groups/${groupId}/members`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement des membres");
  }
  return response.json();
}

async function fetchInvitations(): Promise<InvitationWithDetails[]> {
  const response = await fetch("/api/invitations");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement des invitations");
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
    throw new Error(error.error || "Erreur lors de la création du groupe");
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
    throw new Error(error.error || "Erreur lors de la mise à jour du groupe");
  }
  return response.json();
}

async function deleteGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la suppression du groupe");
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
    throw new Error(error.error || "Code d'invitation invalide");
  }
  return response.json();
}

async function leaveGroup(groupId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la sortie du groupe");
  }
}

async function removeMember(groupId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la suppression du membre");
  }
}

async function changeMemberRole(
  groupId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER"
): Promise<void> {
  const response = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du changement de rôle");
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
    throw new Error(error.error || "Erreur lors du transfert de propriété");
  }
}

async function regenerateInviteCode(groupId: string): Promise<string> {
  const response = await fetch(`/api/groups/${groupId}/code`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la régénération du code");
  }
  const data = await response.json();
  return data.code;
}

async function respondToInvitation(
  invitationId: string,
  accept: boolean
): Promise<{ accepted: boolean; group?: GroupWithDetails }> {
  const response = await fetch(`/api/invitations/${invitationId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accept }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la réponse à l'invitation");
  }
  return response.json();
}

// ============================================
// Query Hooks
// ============================================

/**
 * Get all groups for current user
 */
export function useUserGroups() {
  return useQuery({
    queryKey: groupKeys.list(),
    queryFn: fetchUserGroups,
  });
}

/**
 * Get a specific group
 */
export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.detail(groupId || ""),
    queryFn: () => fetchGroup(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Get group leaderboard
 */
export function useGroupLeaderboard(groupId: string | undefined, season?: number) {
  return useQuery({
    queryKey: groupKeys.leaderboard(groupId || "", season),
    queryFn: () => fetchGroupLeaderboard(groupId!, season),
    enabled: !!groupId,
  });
}

/**
 * Get group members
 */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: groupKeys.members(groupId || ""),
    queryFn: () => fetchGroupMembers(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Get pending invitations for current user
 */
export function useInvitations() {
  return useQuery({
    queryKey: groupKeys.invitations,
    queryFn: fetchInvitations,
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create a new group
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroup,
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.setQueryData(groupKeys.detail(newGroup.id), newGroup);
    },
  });
}

/**
 * Update a group
 */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroupInput) => updateGroup(groupId, input),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.setQueryData(groupKeys.detail(groupId), updatedGroup);
    },
  });
}

/**
 * Delete a group
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Join a group by invite code
 */
export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: joinGroupByCode,
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.setQueryData(groupKeys.detail(group.id), group);
    },
  });
}

/**
 * Leave a group
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: leaveGroup,
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Remove a member from group
 */
export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeMember(groupId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.leaderboard(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Change member role
 */
export function useChangeMemberRole(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: "ADMIN" | "MEMBER" }) =>
      changeMemberRole(groupId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
}

/**
 * Transfer group ownership
 */
export function useTransferOwnership(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newOwnerId: string) => transferOwnership(groupId, newOwnerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
      queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId) });
    },
  });
}

/**
 * Regenerate invite code
 */
export function useRegenerateInviteCode(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => regenerateInviteCode(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId) });
    },
  });
}

/**
 * Respond to an invitation
 */
export function useRespondToInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, accept }: { invitationId: string; accept: boolean }) =>
      respondToInvitation(invitationId, accept),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: groupKeys.invitations });
      if (result.accepted && result.group) {
        queryClient.invalidateQueries({ queryKey: groupKeys.lists() });
        queryClient.setQueryData(groupKeys.detail(result.group.id), result.group);
      }
    },
  });
}
