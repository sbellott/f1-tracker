/**
 * Notifications React Query Hooks
 * Client-side hooks for notification management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationType } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  sentAt: string;
  readAt: string | null;
  emailSent: boolean;
  pushSent: boolean;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationPreferences {
  notifyEmail: boolean;
  notifyPush: boolean;
  notifyH24: boolean;
  notifyH1: boolean;
  notifyResults: boolean;
  notifyBeforeSession: boolean;
  notifyDelayMinutes: number;
}

// ============================================
// Query Keys
// ============================================

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: { unreadOnly?: boolean; type?: NotificationType }) =>
    [...notificationKeys.all, "list", filters] as const,
  unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
  if (params?.type) searchParams.set("type", params.type);

  const url = `/api/notifications${searchParams.toString() ? `?${searchParams}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement des notifications");
  }

  return response.json();
}

async function fetchPreferences(): Promise<NotificationPreferences> {
  const response = await fetch("/api/notifications/preferences");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors du chargement des préférences");
  }

  return response.json();
}

async function markAsRead(notificationId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la mise à jour");
  }

  return response.json();
}

async function markAllAsRead(): Promise<{ success: boolean; updated: number }> {
  const response = await fetch("/api/notifications/mark-all-read", {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la mise à jour");
  }

  return response.json();
}

async function deleteNotification(notificationId: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la suppression");
  }

  return response.json();
}

async function updatePreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Erreur lors de la mise à jour des préférences");
  }

  return response.json();
}

// ============================================
// Query Hooks
// ============================================

/**
 * Get all notifications for current user
 */
export function useNotifications(params?: {
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => fetchNotifications(params),
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });
}

/**
 * Get unread notification count only
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await fetchNotifications({ limit: 1 });
      return data.unreadCount;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: fetchPreferences,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Mark a single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onMutate: async (notificationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueryData<NotificationsResponse>(
        notificationKeys.list()
      );

      if (previousData) {
        queryClient.setQueryData<NotificationsResponse>(notificationKeys.list(), {
          ...previousData,
          notifications: previousData.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, previousData.unreadCount - 1),
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationKeys.list(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueryData<NotificationsResponse>(
        notificationKeys.list()
      );

      if (previousData) {
        const now = new Date().toISOString();
        queryClient.setQueryData<NotificationsResponse>(notificationKeys.list(), {
          ...previousData,
          notifications: previousData.notifications.map((n) => ({
            ...n,
            read: true,
            readAt: n.readAt || now,
          })),
          unreadCount: 0,
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationKeys.list(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueryData<NotificationsResponse>(
        notificationKeys.list()
      );

      if (previousData) {
        const notification = previousData.notifications.find((n) => n.id === notificationId);
        queryClient.setQueryData<NotificationsResponse>(notificationKeys.list(), {
          ...previousData,
          notifications: previousData.notifications.filter((n) => n.id !== notificationId),
          unreadCount: notification && !notification.read
            ? Math.max(0, previousData.unreadCount - 1)
            : previousData.unreadCount,
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationKeys.list(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreferences,
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() });

      const previousData = queryClient.getQueryData<NotificationPreferences>(
        notificationKeys.preferences()
      );

      if (previousData) {
        queryClient.setQueryData<NotificationPreferences>(notificationKeys.preferences(), {
          ...previousData,
          ...newPreferences,
        });
      }

      return { previousData };
    },
    onError: (_, __, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(notificationKeys.preferences(), context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}

// ============================================
// Utility Hooks
// ============================================

/**
 * Helper hook for notification badge display
 */
export function useNotificationBadge() {
  const { data: unreadCount, isLoading } = useUnreadCount();

  return {
    count: unreadCount || 0,
    hasUnread: (unreadCount || 0) > 0,
    displayCount: unreadCount && unreadCount > 99 ? "99+" : unreadCount?.toString() || "0",
    isLoading,
  };
}
