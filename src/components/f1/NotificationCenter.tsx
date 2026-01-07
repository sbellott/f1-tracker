"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Trophy,
  Flag,
  Award,
  Users,
  AlarmClock,
  X,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
  formatNotificationTime,
  type Notification,
  type NotificationType,
} from "@/lib/hooks/use-notifications";

// ============================================
// Icon Mapping
// ============================================

const notificationIcons: Record<NotificationType, typeof Bell> = {
  PREDICTION_REMINDER_H24: Clock,
  PREDICTION_REMINDER_H1: AlarmClock,
  SCORING_COMPLETE: Trophy,
  RESULTS_AVAILABLE: Flag,
  BADGE_UNLOCKED: Award,
  BADGE_EARNED: Award,
  GROUP_INVITATION: Users,
};

const notificationColors: Record<NotificationType, string> = {
  PREDICTION_REMINDER_H24: "text-blue-500 bg-blue-500/10",
  PREDICTION_REMINDER_H1: "text-orange-500 bg-orange-500/10",
  SCORING_COMPLETE: "text-yellow-500 bg-yellow-500/10",
  RESULTS_AVAILABLE: "text-green-500 bg-green-500/10",
  BADGE_UNLOCKED: "text-purple-500 bg-purple-500/10",
  BADGE_EARNED: "text-purple-500 bg-purple-500/10",
  GROUP_INVITATION: "text-indigo-500 bg-indigo-500/10",
};

// ============================================
// NotificationItem Component
// ============================================

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: NotificationItemProps) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colorClass = notificationColors[notification.type] || "text-muted-foreground bg-muted";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "group relative p-3 rounded-lg transition-colors cursor-pointer",
        notification.read
          ? "bg-transparent hover:bg-muted/50"
          : "bg-primary/5 hover:bg-primary/10"
      )}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center",
            colorClass
          )}
        >
          <Icon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "text-sm font-medium line-clamp-1",
                !notification.read && "text-foreground"
              )}
            >
              {notification.title}
            </p>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {formatNotificationTime(notification.sentAt)}
          </p>
        </div>

        {/* Actions (on hover) */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// NotificationCenter Component
// ============================================

interface NotificationCenterProps {
  onOpenSettings?: () => void;
}

export function NotificationCenter({ onOpenSettings }: NotificationCenterProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useNotifications({ limit: 20 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center"
              >
                <Badge
                  variant="destructive"
                  className="h-5 min-w-[20px] px-1 text-[10px] font-bold"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleMarkAllRead}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckCheck className="h-3 w-3 mr-1" />
                )}
                Tout marquer lu
              </Button>
            )}
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setOpen(false);
                  onOpenSettings();
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">
                Aucune notification
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Tu recevras des alertes pour les courses et tes pronostics
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Voir toutes les notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
