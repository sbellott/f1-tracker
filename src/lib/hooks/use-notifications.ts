/**
 * Notifications Hooks
 * React Query hooks for notifications management
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ============================================
// Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  readAt: Date | null;
  sentAt: Date;
  data: NotificationData | null;
}

export type NotificationType =
  | "PREDICTION_REMINDER_H24"
  | "PREDICTION_REMINDER_H1"
  | "SCORING_COMPLETE"
  | "RESULTS_AVAILABLE"
  | "BADGE_UNLOCKED"
  | "GROUP_INVITATION"
  | "BADGE_EARNED";

export interface NotificationData {
  raceId?: string;
  raceName?: string;
  sessionType?: string;
  points?: number;
  rank?: number;
  badgeId?: string;
  badgeName?: string;
  badge?: {
    id: string;
    name: string;
    icon: string;
  };
  groupId?: string;
  groupName?: string;
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

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ============================================
// Query Keys
// ============================================

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (filters?: { unreadOnly?: boolean; type?: string; limit?: number }) =>
    [...notificationKeys.all, "list", filters] as const,
  unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchNotifications(filters?: {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
}): Promise<NotificationsResponse> {
  const params = new URLSearchParams();
  if (filters?.unreadOnly) params.set("unreadOnly", "true");
  if (filters?.type) params.set("type", filters.type);
  if (filters?.limit) params.set("limit", String(filters.limit));

  const url = `/api/notifications${params.toString() ? `?${params}` : ""}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return res.json();
}

async function fetchPreferences(): Promise<NotificationPreferences> {
  const res = await fetch("/api/notifications/preferences");

  if (!res.ok) {
    throw new Error("Failed to fetch notification preferences");
  }

  return res.json();
}

async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ read: true }),
  });

  if (!res.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

async function markAllNotificationsAsRead(): Promise<void> {
  const res = await fetch("/api/notifications/mark-all-read", {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
}

async function updatePreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const res = await fetch("/api/notifications/preferences", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preferences),
  });

  if (!res.ok) {
    throw new Error("Failed to update notification preferences");
  }

  return res.json();
}

async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete notification");
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Get user notifications
 */
export function useNotifications(filters?: {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => fetchNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get unread notification count only
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const data = await fetchNotifications({ unreadOnly: true, limit: 100 });
      return data.unreadCount;
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: fetchPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Mark a single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Optimistically update the notification list
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueriesData({
        queryKey: notificationKeys.all,
      });

      // Update all notification queries to mark this one as read
      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (old: NotificationsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
            ),
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
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
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      const previousData = queryClient.getQueriesData({
        queryKey: notificationKeys.all,
      });

      // Optimistically mark all as read
      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (old: NotificationsResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            notifications: old.notifications.map((n) => ({
              ...n,
              read: true,
              readAt: n.readAt || new Date(),
            })),
            unreadCount: 0,
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
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
    onSuccess: (newPreferences) => {
      queryClient.setQueryData(notificationKeys.preferences(), newPreferences);
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

      const previousData = queryClient.getQueriesData({
        queryKey: notificationKeys.all,
      });

      queryClient.setQueriesData(
        { queryKey: notificationKeys.list() },
        (old: NotificationsResponse | undefined) => {
          if (!old) return old;
          const notification = old.notifications.find((n) => n.id === notificationId);
          return {
            ...old,
            notifications: old.notifications.filter((n) => n.id !== notificationId),
            unreadCount: notification && !notification.read
              ? Math.max(0, old.unreadCount - 1)
              : old.unreadCount,
          };
        }
      );

      return { previousData };
    },
    onError: (_err, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

// ============================================
// Push Notification Registration
// ============================================

/**
 * Convert base64 to Uint8Array for VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register service worker and subscribe to push notifications
 */
async function registerAndSubscribe(): Promise<boolean> {
  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[Push] Service worker registered:", registration.scope);

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get VAPID public key from server
    const keyResponse = await fetch("/api/notifications/subscribe");
    if (!keyResponse.ok) {
      console.error("[Push] Failed to get VAPID key");
      return false;
    }
    const { publicKey } = await keyResponse.json();

    if (!publicKey) {
      console.error("[Push] No VAPID public key configured");
      return false;
    }

    // Subscribe to push notifications
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    console.log("[Push] Subscribed:", subscription.endpoint);

    // Send subscription to server
    const subscribeResponse = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")!))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))),
        },
        userAgent: navigator.userAgent,
      }),
    });

    if (!subscribeResponse.ok) {
      console.error("[Push] Failed to save subscription");
      return false;
    }

    console.log("[Push] Subscription saved successfully");
    return true;
  } catch (error) {
    console.error("[Push] Registration error:", error);
    return false;
  }
}

/**
 * Request push notification permission and register
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn("[Push] Push notifications not supported");
    return false;
  }

  if (Notification.permission === "denied") {
    console.warn("[Push] Notifications are blocked");
    return false;
  }

  // Request permission if not granted
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }
  }

  // Register service worker and subscribe
  return registerAndSubscribe();
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe from push
      await subscription.unsubscribe();

      // Remove from server
      await fetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
        method: "DELETE",
      });
    }

    return true;
  } catch (error) {
    console.error("[Push] Unsubscribe error:", error);
    return false;
  }
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushSupported(): boolean {
  return typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window;
}

/**
 * Get current push permission status
 */
export function getPushPermissionStatus(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    PREDICTION_REMINDER_H24: "clock",
    PREDICTION_REMINDER_H1: "alarm-clock",
    SCORING_COMPLETE: "trophy",
    RESULTS_AVAILABLE: "flag-checkered",
    BADGE_UNLOCKED: "award",
    BADGE_EARNED: "award",
    GROUP_INVITATION: "users",
  };
  return icons[type] || "bell";
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    PREDICTION_REMINDER_H24: "text-blue-500",
    PREDICTION_REMINDER_H1: "text-orange-500",
    SCORING_COMPLETE: "text-yellow-500",
    RESULTS_AVAILABLE: "text-green-500",
    BADGE_UNLOCKED: "text-purple-500",
    BADGE_EARNED: "text-purple-500",
    GROUP_INVITATION: "text-indigo-500",
  };
  return colors[type] || "text-muted-foreground";
}

/**
 * Format notification time (relative)
 */
export function formatNotificationTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}
