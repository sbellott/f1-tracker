/**
 * Notifications Service
 * Handles notification creation, scheduling, and delivery
 */

import { prisma } from "@/lib/db/prisma";
import type { NotificationType, SessionType, ScheduleStatus, JobStatus } from "@prisma/client";

// ============================================
// Types
// ============================================

export interface NotificationData {
  raceId?: string;
  raceName?: string;
  sessionType?: SessionType;
  points?: number;
  rank?: number;
  badgeId?: string;
  badgeName?: string;
  groupId?: string;
  groupName?: string;
  [key: string]: unknown;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
}

export interface ScheduleReminderParams {
  raceId: string;
  sessionType: SessionType;
  sessionDateTime: Date;
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
// Notification Templates
// ============================================

export const NOTIFICATION_TEMPLATES = {
  PREDICTION_REMINDER_H24: {
    title: (raceName: string) => `🏎️ Rappel: ${raceName} dans 24h`,
    message: (raceName: string, sessionType: string) => 
      `N'oublie pas de faire ton pronostic pour ${sessionType === 'RACE' ? 'la course' : 'le sprint'} du ${raceName}! Les pronostics seront verrouillés 1h avant le départ.`,
  },
  PREDICTION_REMINDER_H1: {
    title: (raceName: string) => `⏰ Dernière chance: ${raceName} dans 1h`,
    message: (raceName: string, sessionType: string) => 
      `Dernière chance! ${sessionType === 'RACE' ? 'La course' : 'Le sprint'} du ${raceName} commence dans 1 heure. Dépêche-toi de faire ton pronostic!`,
  },
  RESULTS_AVAILABLE: {
    title: (raceName: string) => `🏁 Résultats: ${raceName}`,
    message: (raceName: string) => 
      `Les résultats du ${raceName} sont disponibles! Découvre ton score et ton classement.`,
  },
  SCORING_COMPLETE: {
    title: (raceName: string) => `🎯 Ton score: ${raceName}`,
    message: (points: number, raceName: string) => 
      `Tu as marqué ${points} points au ${raceName}! Consulte le détail de ton score.`,
  },
  BADGE_UNLOCKED: {
    title: (badgeName: string) => `🏆 Badge débloqué: ${badgeName}`,
    message: (badgeName: string) => 
      `Félicitations! Tu as débloqué le badge "${badgeName}". Continue comme ça!`,
  },
  GROUP_INVITATION: {
    title: (groupName: string) => `📨 Invitation: ${groupName}`,
    message: (groupName: string, senderName: string) => 
      `${senderName} t'invite à rejoindre le groupe "${groupName}".`,
  },
} as const;

// ============================================
// Core Functions
// ============================================

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, data } = params;

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data as object,
    },
  });

  return notification;
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData
) {
  const notifications = await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data: data as object,
    })),
  });

  return notifications;
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    unreadOnly?: boolean;
    type?: NotificationType;
  } = {}
) {
  const { limit = 50, unreadOnly = false, type } = options;

  const notifications = await prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && { read: false }),
      ...(type && { type }),
    },
    orderBy: { sentAt: "desc" },
    take: limit,
  });

  return notifications;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return notification;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return result;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });

  return count;
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      sentAt: { lt: cutoffDate },
      read: true,
    },
  });

  return result;
}

// ============================================
// Scheduling Functions
// ============================================

/**
 * Schedule reminder notifications for a race session
 */
export async function scheduleSessionReminders(params: ScheduleReminderParams) {
  const { raceId, sessionType, sessionDateTime } = params;

  const h24Before = new Date(sessionDateTime);
  h24Before.setHours(h24Before.getHours() - 24);

  const h1Before = new Date(sessionDateTime);
  h1Before.setHours(h1Before.getHours() - 1);

  const schedules = [];

  // Only schedule if in the future
  const now = new Date();

  if (h24Before > now) {
    schedules.push({
      raceId,
      sessionType,
      type: "PREDICTION_REMINDER_H24" as NotificationType,
      scheduledAt: h24Before,
    });
  }

  if (h1Before > now) {
    schedules.push({
      raceId,
      sessionType,
      type: "PREDICTION_REMINDER_H1" as NotificationType,
      scheduledAt: h1Before,
    });
  }

  if (schedules.length === 0) {
    return [];
  }

  // Upsert schedules
  const results = await Promise.all(
    schedules.map((schedule) =>
      prisma.notificationSchedule.upsert({
        where: {
          raceId_sessionType_type: {
            raceId: schedule.raceId,
            sessionType: schedule.sessionType,
            type: schedule.type,
          },
        },
        create: schedule,
        update: { scheduledAt: schedule.scheduledAt, status: "PENDING" },
      })
    )
  );

  return results;
}

/**
 * Get pending scheduled notifications
 */
export async function getPendingSchedules(batchSize: number = 100) {
  const now = new Date();

  const schedules = await prisma.notificationSchedule.findMany({
    where: {
      status: "PENDING",
      scheduledAt: { lte: now },
    },
    take: batchSize,
    orderBy: { scheduledAt: "asc" },
  });

  return schedules;
}

/**
 * Process a scheduled notification
 */
export async function processScheduledNotification(scheduleId: string) {
  // Mark as processing
  await prisma.notificationSchedule.update({
    where: { id: scheduleId },
    data: { status: "PROCESSING" },
  });

  try {
    const schedule = await prisma.notificationSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    // Get race info
    const race = await prisma.race.findUnique({
      where: { id: schedule.raceId },
      include: { circuit: true },
    });

    if (!race) {
      throw new Error("Race not found");
    }

    // Get users who haven't predicted yet and want notifications
    const usersWithPredictions = await prisma.prediction.findMany({
      where: {
        raceId: schedule.raceId,
        sessionType: schedule.sessionType,
      },
      select: { userId: true },
    });

    const userIdsWithPredictions = new Set(usersWithPredictions.map((p) => p.userId));

    // Get users who want this type of notification
    const notifyField = schedule.type === "PREDICTION_REMINDER_H24" ? "notifyH24" : "notifyH1";
    
    const usersToNotify = await prisma.user.findMany({
      where: {
        [notifyField]: true,
        notifyBeforeSession: true,
      },
      select: { id: true, email: true },
    });

    // Filter out users who already predicted
    const eligibleUsers = usersToNotify.filter(
      (user) => !userIdsWithPredictions.has(user.id)
    );

    if (eligibleUsers.length === 0) {
      await prisma.notificationSchedule.update({
        where: { id: scheduleId },
        data: { status: "COMPLETED", processedAt: new Date() },
      });
      return { processed: 0 };
    }

    // Get template - we know this is a reminder type
    type ReminderType = "PREDICTION_REMINDER_H24" | "PREDICTION_REMINDER_H1";
    const reminderType = schedule.type as ReminderType;
    const template = NOTIFICATION_TEMPLATES[reminderType];
    
    if (!template) {
      throw new Error(`Unknown notification type: ${schedule.type}`);
    }

    const sessionLabel = schedule.sessionType === "RACE" ? "Course" : "Sprint";
    const title = template.title(race.name);
    const message = template.message(race.name, schedule.sessionType);

    // Create notifications
    await createBulkNotifications(
      eligibleUsers.map((u) => u.id),
      schedule.type,
      title,
      message,
      {
        raceId: schedule.raceId,
        raceName: race.name,
        sessionType: schedule.sessionType,
      }
    );

    // Mark as completed
    await prisma.notificationSchedule.update({
      where: { id: scheduleId },
      data: { status: "COMPLETED", processedAt: new Date() },
    });

    return { processed: eligibleUsers.length };
  } catch (error) {
    // Mark as failed
    await prisma.notificationSchedule.update({
      where: { id: scheduleId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

// ============================================
// Scoring Job Functions
// ============================================

/**
 * Create a scoring job for a race session
 */
export async function createScoringJob(raceId: string, sessionType: SessionType) {
  const job = await prisma.scoringJob.upsert({
    where: {
      raceId_sessionType: { raceId, sessionType },
    },
    create: {
      raceId,
      sessionType,
      status: "PENDING",
    },
    update: {
      status: "PENDING",
      startedAt: null,
      completedAt: null,
      error: null,
      processed: 0,
    },
  });

  return job;
}

/**
 * Get pending scoring jobs
 */
export async function getPendingScoringJobs() {
  const jobs = await prisma.scoringJob.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  });

  return jobs;
}

/**
 * Update scoring job progress
 */
export async function updateScoringJobProgress(
  jobId: string,
  processed: number,
  total: number
) {
  await prisma.scoringJob.update({
    where: { id: jobId },
    data: { processed, total },
  });
}

/**
 * Complete a scoring job
 */
export async function completeScoringJob(
  jobId: string,
  status: "COMPLETED" | "FAILED",
  error?: string
) {
  await prisma.scoringJob.update({
    where: { id: jobId },
    data: {
      status,
      completedAt: new Date(),
      error,
    },
  });
}

// ============================================
// User Preferences
// ============================================

/**
 * Get user notification preferences
 */
export async function getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyEmail: true,
      notifyPush: true,
      notifyH24: true,
      notifyH1: true,
      notifyResults: true,
      notifyBeforeSession: true,
      notifyDelayMinutes: true,
    },
  });

  return user;
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: preferences,
  });

  return user;
}

// ============================================
// Specialized Notifications
// ============================================

/**
 * Send scoring complete notification to a user
 */
export async function notifyScoringComplete(
  userId: string,
  raceId: string,
  raceName: string,
  sessionType: SessionType,
  points: number
) {
  const template = NOTIFICATION_TEMPLATES.SCORING_COMPLETE;
  
  return createNotification({
    userId,
    type: "SCORING_COMPLETE",
    title: template.title(raceName),
    message: template.message(points, raceName),
    data: {
      raceId,
      raceName,
      sessionType,
      points,
    },
  });
}

/**
 * Send badge unlocked notification
 */
export async function notifyBadgeUnlocked(
  userId: string,
  badgeId: string,
  badgeName: string,
  raceId?: string
) {
  const template = NOTIFICATION_TEMPLATES.BADGE_UNLOCKED;
  
  return createNotification({
    userId,
    type: "BADGE_UNLOCKED",
    title: template.title(badgeName),
    message: template.message(badgeName),
    data: {
      badgeId,
      badgeName,
      raceId,
    },
  });
}

/**
 * Send group invitation notification
 */
export async function notifyGroupInvitation(
  userId: string,
  groupId: string,
  groupName: string,
  senderName: string
) {
  const template = NOTIFICATION_TEMPLATES.GROUP_INVITATION;
  
  return createNotification({
    userId,
    type: "GROUP_INVITATION",
    title: template.title(groupName),
    message: template.message(groupName, senderName),
    data: {
      groupId,
      groupName,
    },
  });
}

/**
 * Send results available notification to all users
 */
export async function notifyResultsAvailable(
  raceId: string,
  raceName: string,
  sessionType: SessionType
) {
  // Get users who want results notifications
  const users = await prisma.user.findMany({
    where: { notifyResults: true },
    select: { id: true },
  });

  if (users.length === 0) return { processed: 0 };

  const template = NOTIFICATION_TEMPLATES.RESULTS_AVAILABLE;

  await createBulkNotifications(
    users.map((u) => u.id),
    "RESULTS_AVAILABLE",
    template.title(raceName),
    template.message(raceName),
    {
      raceId,
      raceName,
      sessionType,
    }
  );

  return { processed: users.length };
}

// ============================================
// Export
// ============================================

export default {
  // Core
  createNotification,
  createBulkNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteOldNotifications,
  
  // Scheduling
  scheduleSessionReminders,
  getPendingSchedules,
  processScheduledNotification,
  
  // Scoring Jobs
  createScoringJob,
  getPendingScoringJobs,
  updateScoringJobProgress,
  completeScoringJob,
  
  // User Preferences
  getUserPreferences,
  updateUserPreferences,
  
  // Specialized
  notifyScoringComplete,
  notifyBadgeUnlocked,
  notifyGroupInvitation,
  notifyResultsAvailable,
  
  // Templates
  NOTIFICATION_TEMPLATES,
};