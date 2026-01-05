import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, Flag, Trophy, Zap, CheckCircle2, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  enabled: boolean;
  beforeSession: {
    enabled: boolean;
    delay: number; // minutes
  };
  sessionTypes: {
    practice: boolean;
    qualifying: boolean;
    sprint: boolean;
    race: boolean;
  };
  results: boolean;
  predictionReminders: boolean;
  news: boolean;
}

const defaultPreferences: NotificationPreferences = {
  enabled: true,
  beforeSession: {
    enabled: true,
    delay: 60, // 1 hour
  },
  sessionTypes: {
    practice: false,
    qualifying: true,
    sprint: true,
    race: true,
  },
  results: true,
  predictionReminders: true,
  news: false,
};

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [testSent, setTestSent] = useState(false);

  const updatePreference = (path: string, value: any) => {
    setPreferences(prev => {
      const keys = path.split('.');
      const newPrefs = { ...prev };
      let current: any = newPrefs;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newPrefs;
    });
  };

  const handleSavePreferences = () => {
    toast.success('Preferences saved', {
      description: 'Your notification settings have been updated.',
    });
  };

  const handleTestNotification = () => {
    setTestSent(true);
    toast.info('🏁 Race in 1 hour!', {
      description: 'Monaco Grand Prix - Start at 3:00 PM',
      duration: 5000,
    });
    
    setTimeout(() => setTestSent(false), 3000);
  };

  const delayOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Notifications</h2>
          <p className="text-muted-foreground text-lg">
            Configure your F1 reminders and alerts
          </p>
        </div>
        <Button
          variant={preferences.enabled ? 'default' : 'outline'}
          className="rounded-xl gap-2"
          onClick={() => updatePreference('enabled', !preferences.enabled)}
        >
          {preferences.enabled ? (
            <>
              <Bell className="w-4 h-4" />
              Enabled
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4" />
              Disabled
            </>
          )}
        </Button>
      </div>

      {/* Master Toggle Info */}
      {!preferences.enabled && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Notifications disabled</div>
                <p className="text-sm text-muted-foreground">
                  Enable notifications to receive reminders before sessions and stay informed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Reminders */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Session reminders
          </CardTitle>
          <CardDescription>
            Receive a notification before a session starts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <Label htmlFor="session-reminders" className="cursor-pointer">
              <div className="font-medium mb-1">Enable reminders</div>
              <div className="text-sm text-muted-foreground">
                Get alerted before sessions start
              </div>
            </Label>
            <Switch
              id="session-reminders"
              checked={preferences.beforeSession.enabled}
              onCheckedChange={(checked) => updatePreference('beforeSession.enabled', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          {preferences.beforeSession.enabled && (
            <div className="space-y-4 animate-scale-in">
              <div>
                <Label className="mb-3 block">Notification delay</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {delayOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={preferences.beforeSession.delay === option.value ? 'default' : 'outline'}
                      className="rounded-xl"
                      onClick={() => updatePreference('beforeSession.delay', option.value)}
                      disabled={!preferences.enabled}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Session types</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <Label htmlFor="notify-practice" className="cursor-pointer">
                        <div className="font-medium">Free Practice</div>
                        <div className="text-sm text-muted-foreground">FP1, FP2, FP3</div>
                      </Label>
                    </div>
                    <Switch
                      id="notify-practice"
                      checked={preferences.sessionTypes.practice}
                      onCheckedChange={(checked) => updatePreference('sessionTypes.practice', checked)}
                      disabled={!preferences.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                        <Flag className="w-5 h-5 text-chart-2" />
                      </div>
                      <Label htmlFor="notify-qualifying" className="cursor-pointer">
                        <div className="font-medium">Qualifying</div>
                        <div className="text-sm text-muted-foreground">Qualifying session</div>
                      </Label>
                    </div>
                    <Switch
                      id="notify-qualifying"
                      checked={preferences.sessionTypes.qualifying}
                      onCheckedChange={(checked) => updatePreference('sessionTypes.qualifying', checked)}
                      disabled={!preferences.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                        <Zap className="w-5 h-5 text-chart-3" />
                      </div>
                      <Label htmlFor="notify-sprint" className="cursor-pointer">
                        <div className="font-medium">Sprint</div>
                        <div className="text-sm text-muted-foreground">Sprint race</div>
                      </Label>
                    </div>
                    <Switch
                      id="notify-sprint"
                      checked={preferences.sessionTypes.sprint}
                      onCheckedChange={(checked) => updatePreference('sessionTypes.sprint', checked)}
                      disabled={!preferences.enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-primary" />
                      </div>
                      <Label htmlFor="notify-race" className="cursor-pointer">
                        <div className="font-medium">Race</div>
                        <div className="text-sm text-muted-foreground">Grand Prix</div>
                      </Label>
                    </div>
                    <Switch
                      id="notify-race"
                      checked={preferences.sessionTypes.race}
                      onCheckedChange={(checked) => updatePreference('sessionTypes.race', checked)}
                      disabled={!preferences.enabled}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Other notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <Label htmlFor="notify-results" className="cursor-pointer">
              <div className="font-medium mb-1">Race results</div>
              <div className="text-sm text-muted-foreground">
                Notification with podium after the race
              </div>
            </Label>
            <Switch
              id="notify-results"
              checked={preferences.results}
              onCheckedChange={(checked) => updatePreference('results', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <Label htmlFor="notify-predictions" className="cursor-pointer">
              <div className="font-medium mb-1">Prediction reminder</div>
              <div className="text-sm text-muted-foreground">
                Alert if predictions not filled 24h before race
              </div>
            </Label>
            <Switch
              id="notify-predictions"
              checked={preferences.predictionReminders}
              onCheckedChange={(checked) => updatePreference('predictionReminders', checked)}
              disabled={!preferences.enabled}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
            <Label htmlFor="notify-news" className="cursor-pointer">
              <div className="font-medium mb-1">Important news</div>
              <div className="text-sm text-muted-foreground">
                Major news (transfers, regulations, etc.)
              </div>
            </Label>
            <Switch
              id="notify-news"
              checked={preferences.news}
              onCheckedChange={(checked) => updatePreference('news', checked)}
              disabled={!preferences.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold mb-1">Test notifications</div>
              <p className="text-sm text-muted-foreground">
                Send a test notification to verify your settings
              </p>
            </div>
            <Button
              onClick={handleTestNotification}
              disabled={!preferences.enabled || testSent}
              className="rounded-xl gap-2 shrink-0"
            >
              {testSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Sent
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Test
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSavePreferences}
          className="rounded-xl gap-2"
          disabled={!preferences.enabled}
        >
          <CheckCircle2 className="w-4 h-4" />
          Save preferences
        </Button>
      </div>
    </div>
  );
}