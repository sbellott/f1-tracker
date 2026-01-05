import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, BellOff, Clock, Flag, Trophy, Zap, CheckCircle2, Settings, X } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'session' | 'result' | 'prediction' | 'news';
  icon: any;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Course dans 1 heure !',
    description: 'Grand Prix de Monaco - Départ à 15:00',
    timestamp: '2026-05-26T13:00:00Z',
    read: false,
    type: 'session',
    icon: Flag,
  },
  {
    id: '2',
    title: 'Predictions not filled',
    description: 'Don\'t forget to fill in your predictions for Monaco',
    timestamp: '2026-05-25T10:00:00Z',
    read: false,
    type: 'prediction',
    icon: Clock,
  },
  {
    id: '3',
    title: 'Résultats disponibles',
    description: 'Verstappen remporte le GP de Monaco',
    timestamp: '2026-05-24T17:30:00Z',
    read: true,
    type: 'result',
    icon: Trophy,
  },
  {
    id: '4',
    title: 'Actualité F1',
    description: 'Hamilton prolonge chez Mercedes jusqu\'en 2025',
    timestamp: '2026-05-23T12:00:00Z',
    read: true,
    type: 'news',
    icon: Zap,
  },
];

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount: number;
}

export function NotificationPanel({ open, onOpenChange, unreadCount }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('Toutes les notifications ont été marquées comme lues');
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success('Toutes les notifications ont été supprimées');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours === 1) return "Il y a 1h";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Hier";
    return `Il y a ${diffInDays}j`;
  };

  const typeColors = {
    session: 'bg-primary/10 text-primary',
    result: 'bg-chart-5/10 text-chart-5',
    prediction: 'bg-chart-3/10 text-chart-3',
    news: 'bg-accent/10 text-accent',
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">Notifications</SheetTitle>
                <SheetDescription>
                  {unreadNotifications.length > 0
                    ? `${unreadNotifications.length} unread`
                    : 'No new notifications'}
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex items-center justify-between px-6 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <Bell className="w-4 h-4 text-primary" />
            ) : (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            )}
            <Label htmlFor="notifications-toggle" className="text-sm font-medium cursor-pointer">
              Notifications {notificationsEnabled ? 'activées' : 'désactivées'}
            </Label>
          </div>
          <Switch
            id="notifications-toggle"
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 pt-4 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <>
                {unreadNotifications.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Nouvelles
                      </h3>
                      {unreadNotifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          className="h-7 text-xs"
                        >
                          Tout marquer comme lu
                        </Button>
                      )}
                    </div>
                    {unreadNotifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className="group relative p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-all cursor-pointer"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeColors[notification.type]}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {notification.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {getTimeAgo(notification.timestamp)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsRead(notification.id);
                                  }}
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Marquer comme lu
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {readNotifications.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Anciennes
                    </h3>
                    {readNotifications.map((notification) => {
                      const Icon = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className="p-4 rounded-xl border border-border/50 bg-muted/20 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <div className="flex gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 opacity-50 ${typeColors[notification.type]}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 leading-tight">
                                {notification.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {notification.description}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(notification.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="p-4 border-t bg-muted/20">
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2"
              onClick={handleClearAll}
            >
              <X className="w-4 h-4" />
              Tout supprimer
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}