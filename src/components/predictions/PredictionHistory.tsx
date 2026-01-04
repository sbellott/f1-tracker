import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Trophy, Zap, Target } from 'lucide-react';
import { User, Race, Driver, UserPrediction } from '@/types';

interface PredictionHistoryProps {
  currentUser: User;
  races: Race[];
  drivers: Driver[];
  userPredictions: UserPrediction[];
  onBack: () => void;
}

export function PredictionHistory({
  currentUser,
  races,
  drivers,
  userPredictions,
  onBack,
}: PredictionHistoryProps) {
  const completedRaces = races
    .filter(r => new Date(r.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Inconnu';
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des pronostics
          </CardTitle>
          <p className="text-muted-foreground">
            {userPredictions.length} pronostic{userPredictions.length > 1 ? 's' : ''} soumis
          </p>
        </CardHeader>
        <CardContent className="p-6">
          {userPredictions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun pronostic pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedRaces.map(race => {
                const prediction = userPredictions.find(
                  p => p.raceId === race.id && p.userId === currentUser.id
                );

                if (!prediction) return null;

                return (
                  <Card key={race.id} className="border-border/50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border/50">
                      <div>
                        <div className="font-bold">{race.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(race.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      {prediction.points !== undefined && (
                        <Badge className="gap-2 bg-gradient-to-r from-primary to-accent text-white border-0">
                          <Trophy className="w-3 h-3" />
                          {prediction.points} points
                        </Badge>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Top 3 */}
                      <div>
                        <div className="text-sm font-semibold text-muted-foreground mb-2">
                          Podium prédit
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                            1. {getDriverName(prediction.predictions.p1)}
                          </Badge>
                          <Badge className="bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0">
                            2. {getDriverName(prediction.predictions.p2)}
                          </Badge>
                          <Badge className="bg-gradient-to-br from-amber-700 to-amber-800 text-white border-0">
                            3. {getDriverName(prediction.predictions.p3)}
                          </Badge>
                        </div>
                      </div>

                      {/* Bonus */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Target className="w-3 h-3" />
                            Pole Position
                          </div>
                          <div className="font-semibold">
                            {getDriverName(prediction.predictions.pole)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Zap className="w-3 h-3" />
                            Tour rapide
                          </div>
                          <div className="font-semibold">
                            {getDriverName(prediction.predictions.fastestLap)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}