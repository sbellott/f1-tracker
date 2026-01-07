"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  AlarmClock,
  Trophy,
  Flag,
  Settings,
  Loader2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

import {
  useNotificationPreferences,
  useUpdatePreferences,
  requestPushPermission,
  isPushSupported,
  getPushPermissionStatus,
  type NotificationPreferences as NotificationPreferencesType,
} from "@/lib/hooks/use-notifications";

// ============================================
// Types
// ============================================

interface NotificationPreferencesProps {
  className?: string;
}

// ============================================
// Sub-Components
// ============================================

function PreferenceRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  iconColor = "text-muted-foreground",
}: {
  icon: typeof Bell;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  iconColor?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        disabled && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-muted", iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="font-medium">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function NotificationPreferences({
  className,
}: NotificationPreferencesProps) {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdatePreferences();

  const pushSupported = isPushSupported();
  const pushStatus = getPushPermissionStatus();

  // Handle preference update
  const handleUpdate = (key: keyof NotificationPreferencesType, value: boolean | number) => {
    updatePreferences.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          toast.success("Préférences mises à jour", {
            description: "Vos préférences de notification ont été enregistrées.",
          });
        },
        onError: () => {
          toast.error("Erreur", {
            description: "Impossible de mettre à jour les préférences.",
          });
        },
      }
    );
  };

  // Handle push notification permission request
  const handleEnablePush = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      handleUpdate("notifyPush", true);
      toast.success("Notifications push activées", {
        description: "Vous recevrez des notifications dans votre navigateur.",
      });
    } else {
      toast.error("Permission refusée", {
        description:
          "Vous pouvez activer les notifications dans les paramètres de votre navigateur.",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12 text-muted-foreground">
          Impossible de charger les préférences
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Préférences de notification
        </CardTitle>
        <CardDescription>
          Configurez comment et quand vous souhaitez être notifié
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Notification Channels */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Canaux de notification
          </h4>
          <div className="space-y-1">
            {/* Email notifications */}
            <PreferenceRow
              icon={Mail}
              label="Notifications par email"
              description="Recevez les alertes importantes par email"
              checked={preferences.notifyEmail}
              onCheckedChange={(checked) => handleUpdate("notifyEmail", checked)}
              iconColor="text-blue-500"
            />

            {/* Push notifications */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-green-500">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <Label className="font-medium">Notifications push</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Alertes instantanées dans votre navigateur
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!pushSupported ? (
                  <Badge variant="secondary">Non supporté</Badge>
                ) : pushStatus === "denied" ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="destructive">Bloqué</Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        Autorisez les notifications dans les paramètres du
                        navigateur
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : pushStatus === "granted" ? (
                  <Switch
                    checked={preferences.notifyPush}
                    onCheckedChange={(checked) =>
                      handleUpdate("notifyPush", checked)
                    }
                  />
                ) : (
                  <Switch
                    checked={preferences.notifyPush}
                    onCheckedChange={handleEnablePush}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reminder Settings */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Rappels de pronostics
          </h4>
          <div className="space-y-1">
            {/* 24h reminder */}
            <PreferenceRow
              icon={Clock}
              label="Rappel J-1 (24h avant)"
              description="Notification 24 heures avant la clôture"
              checked={preferences.notifyH24}
              onCheckedChange={(checked) => handleUpdate("notifyH24", checked)}
              iconColor="text-blue-500"
            />

            {/* 1h reminder */}
            <PreferenceRow
              icon={AlarmClock}
              label="Rappel H-1 (1h avant)"
              description="Dernière chance avant la clôture"
              checked={preferences.notifyH1}
              onCheckedChange={(checked) => handleUpdate("notifyH1", checked)}
              iconColor="text-orange-500"
            />

            {/* Before session reminder */}
            <PreferenceRow
              icon={Flag}
              label="Avant le début de session"
              description="Notification X minutes avant le départ"
              checked={preferences.notifyBeforeSession}
              onCheckedChange={(checked) =>
                handleUpdate("notifyBeforeSession", checked)
              }
              iconColor="text-green-500"
            />

            {/* Delay selector */}
            {preferences.notifyBeforeSession && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pl-11 pb-2"
              >
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-muted-foreground">
                    Délai avant la session:
                  </Label>
                  <Select
                    value={String(preferences.notifyDelayMinutes)}
                    onValueChange={(value) =>
                      handleUpdate("notifyDelayMinutes", parseInt(value, 10))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">1 heure</SelectItem>
                      <SelectItem value="120">2 heures</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <Separator />

        {/* Results Notifications */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Résultats et scores
          </h4>
          <div className="space-y-1">
            {/* Results available */}
            <PreferenceRow
              icon={Flag}
              label="Résultats disponibles"
              description="Notification quand les résultats sont publiés"
              checked={preferences.notifyResults}
              onCheckedChange={(checked) =>
                handleUpdate("notifyResults", checked)
              }
              iconColor="text-green-500"
            />
          </div>
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-muted/50 p-4 flex gap-3">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p>
              Les notifications vous aident à ne pas manquer les dates limites
              de pronostics et à suivre vos scores en temps réel.
            </p>
            <p className="mt-2">
              Activez les notifications push pour recevoir des alertes même
              quand le site n'est pas ouvert.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationPreferences;