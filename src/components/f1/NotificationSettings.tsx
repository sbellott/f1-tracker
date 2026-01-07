"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  BellOff,
  Clock,
  AlarmClock,
  Mail,
  Smartphone,
  Flag,
  Trophy,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";

import {
  useNotificationPreferences,
  useUpdatePreferences,
  requestPushPermission,
  isPushSupported,
  getPushPermissionStatus,
} from "@/lib/hooks/use-notifications";

// ============================================
// Main Component
// ============================================

export function NotificationSettings() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdatePreferences();
  const [testSent, setTestSent] = useState(false);

  const pushSupported = isPushSupported();
  const pushStatus = getPushPermissionStatus();

  // Handle preference update
  const handleUpdate = (key: string, value: boolean | number) => {
    updatePreferences.mutate(
      { [key]: value },
      {
        onSuccess: () => {
          toast.success("Préférences enregistrées", {
            description: "Vos paramètres ont été mis à jour.",
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

  const handleTestNotification = () => {
    setTestSent(true);
    toast("🏁 Course dans 1 heure !", {
      description: "Grand Prix de Monaco - Départ à 15h00",
    });
    setTimeout(() => setTestSent(false), 3000);
  };

  const delayOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 heure" },
    { value: 120, label: "2 heures" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Impossible de charger les préférences
      </div>
    );
  }

  const notificationsEnabled = preferences.notifyEmail || preferences.notifyPush;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Notifications</h2>
          <p className="text-muted-foreground text-lg">
            Configurez vos rappels et alertes F1
          </p>
        </div>
        <Badge
          variant={notificationsEnabled ? "default" : "secondary"}
          className="gap-2"
        >
          {notificationsEnabled ? (
            <>
              <Bell className="w-3 h-3" />
              Activées
            </>
          ) : (
            <>
              <BellOff className="w-3 h-3" />
              Désactivées
            </>
          )}
        </Badge>
      </div>

      {/* Notification Channels */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Canaux de notification
          </CardTitle>
          <CardDescription>
            Choisissez comment recevoir vos notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <Label htmlFor="notify-email" className="cursor-pointer">
                <div className="font-medium mb-1">Email</div>
                <div className="text-sm text-muted-foreground">
                  Recevez les alertes par email
                </div>
              </Label>
            </div>
            <Switch
              id="notify-email"
              checked={preferences.notifyEmail}
              onCheckedChange={(checked) => handleUpdate("notifyEmail", checked)}
            />
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
              <Label htmlFor="notify-push" className="cursor-pointer">
                <div className="font-medium mb-1">Notifications push</div>
                <div className="text-sm text-muted-foreground">
                  Alertes instantanées dans le navigateur
                </div>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              {!pushSupported ? (
                <Badge variant="secondary">Non supporté</Badge>
              ) : pushStatus === "denied" ? (
                <Badge variant="destructive">Bloqué</Badge>
              ) : pushStatus === "granted" ? (
                <Switch
                  id="notify-push"
                  checked={preferences.notifyPush}
                  onCheckedChange={(checked) => handleUpdate("notifyPush", checked)}
                />
              ) : (
                <Switch
                  id="notify-push"
                  checked={preferences.notifyPush}
                  onCheckedChange={handleEnablePush}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Reminders */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Rappels de pronostics
          </CardTitle>
          <CardDescription>
            Rappels avant la clôture des pronostics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* H-24 reminder */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <Label htmlFor="notify-h24" className="cursor-pointer">
                <div className="font-medium mb-1">Rappel J-1 (24h avant)</div>
                <div className="text-sm text-muted-foreground">
                  Notification 24 heures avant la clôture
                </div>
              </Label>
            </div>
            <Switch
              id="notify-h24"
              checked={preferences.notifyH24}
              onCheckedChange={(checked) => handleUpdate("notifyH24", checked)}
              disabled={!notificationsEnabled}
            />
          </div>

          {/* H-1 reminder */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <AlarmClock className="w-5 h-5 text-orange-500" />
              </div>
              <Label htmlFor="notify-h1" className="cursor-pointer">
                <div className="font-medium mb-1">Rappel H-1 (1h avant)</div>
                <div className="text-sm text-muted-foreground">
                  Dernière chance avant la clôture
                </div>
              </Label>
            </div>
            <Switch
              id="notify-h1"
              checked={preferences.notifyH1}
              onCheckedChange={(checked) => handleUpdate("notifyH1", checked)}
              disabled={!notificationsEnabled}
            />
          </div>

          {/* Before session */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Flag className="w-5 h-5 text-green-500" />
              </div>
              <Label htmlFor="notify-before-session" className="cursor-pointer">
                <div className="font-medium mb-1">Avant la session</div>
                <div className="text-sm text-muted-foreground">
                  Notification X minutes avant le départ
                </div>
              </Label>
            </div>
            <Switch
              id="notify-before-session"
              checked={preferences.notifyBeforeSession}
              onCheckedChange={(checked) =>
                handleUpdate("notifyBeforeSession", checked)
              }
              disabled={!notificationsEnabled}
            />
          </div>

          {/* Delay selector */}
          {preferences.notifyBeforeSession && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pl-4 ml-12"
            >
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Label className="text-sm text-muted-foreground">
                  Délai avant la session:
                </Label>
                <Select
                  value={String(preferences.notifyDelayMinutes)}
                  onValueChange={(value) =>
                    handleUpdate("notifyDelayMinutes", parseInt(value, 10))
                  }
                  disabled={!notificationsEnabled}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {delayOptions.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Résultats et scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <Label htmlFor="notify-results" className="cursor-pointer">
              <div className="font-medium mb-1">Résultats disponibles</div>
              <div className="text-sm text-muted-foreground">
                Notification quand les résultats sont publiés
              </div>
            </Label>
            <Switch
              id="notify-results"
              checked={preferences.notifyResults}
              onCheckedChange={(checked) => handleUpdate("notifyResults", checked)}
              disabled={!notificationsEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">Tester les notifications</div>
              <p className="text-sm text-muted-foreground">
                Envoyez une notification de test pour vérifier vos paramètres
              </p>
            </div>
            <Button
              onClick={handleTestNotification}
              disabled={!notificationsEnabled || testSent}
              className="rounded-xl gap-2 shrink-0"
            >
              {testSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Envoyé
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Tester
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info box */}
      <div className="rounded-lg bg-muted/50 p-4 flex gap-3">
        <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            Les notifications vous aident à ne pas manquer les dates limites de
            pronostics et à suivre vos scores en temps réel.
          </p>
          <p className="mt-2">
            Activez les notifications push pour recevoir des alertes même quand
            le site n'est pas ouvert.
          </p>
        </div>
      </div>
    </div>
  );
}