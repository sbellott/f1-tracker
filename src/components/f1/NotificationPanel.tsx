"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellOff,
  Clock,
  AlarmClock,
  Flag,
  Trophy,
  Award,
  Users,
  CheckCircle2,
  Settings,
  X,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

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
// Icon & Color Mapping
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

const typeColors: Record<NotificationType, string> = {
  PREDICTION_REMINDER_H24: "bg-blue-500/10 text-blue-500",
  PREDICTION_REMINDER_H1: "bg-orange-500/10 text-orange-500",
  SCORING_COMPLETE: "bg-yellow-500/10 text-yellow-500",
  RESULTS_AVAILABLE: "bg-green-500/10 text-green-500",
  BADGE_UNLOCKED: "bg-purple-500/10 text-purple-500",
  BADGE_EARNED: "bg-purple-500/10 text-purple-500",
  GROUP_INVITATION: "bg-indigo-500/10 text-indigo-500",
};

// ============================================
// Types
// ============================================

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings?: () => void;
}

// ============================================
// Notification Item Component
// ============================================

function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const Icon = notificationIcons[notification.type] || Bell;
  const colorClass =
    typeColors[notification.type] || "bg-muted text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        notification.read
          ? "border-border/50 bg-muted/20 opacity-60 hover:opacity-100"
          : "border-border bg-background hover:bg-muted/50"
      }`}
      onClick={() => !notification.read && onMarkRead(notification.id)}
    >
      <div className="flex gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-sm leading-tight">
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatNotificationTime(notification.sentAt)}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Lu
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function NotificationPanel({
  open,
  onOpenChange,
  onOpenSettings,
}: NotificationPanelProps) {
  const { data, isLoading } = useNotifications({ limit: 50 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Notifications</SheetTitle>
                <SheetDescription>
                  {unreadCount > 0
                    ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Aucune nouvelle notification"}
                </SheetDescription>
              </div>
            </div>
            {onOpenSettings && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onOpenChange(false);
                  onOpenSettings();
                }}
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  Aucune notification
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous êtes à jour !
                </p>
              </div>
            ) : (
              <>
                {/* Unread Notifications */}
                {unreadNotifications.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Nouvelles
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        disabled={markAllAsRead.isPending}
                        className="h-7 text-xs"
                      >
                        {markAllAsRead.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        Tout marquer lu
                      </Button>
                    </div>
                    <AnimatePresence mode="popLayout">
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkAsRead}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {/* Read Notifications */}
                {readNotifications.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Anciennes
                    </h3>
                    <AnimatePresence mode="popLayout">
                      {readNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkRead={handleMarkAsRead}
                          onDelete={handleDelete}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {onOpenSettings && (
          <div className="p-4 border-t bg-muted/20">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={() => {
                onOpenChange(false);
                onOpenSettings();
              }}
            >
              <Settings className="w-4 h-4" />
              Paramètres de notification
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
