import { useState } from 'react';
import { Driver, Prediction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Lock } from 'lucide-react';

interface PredictionFormProps {
  drivers: Driver[];
  onSubmit: (prediction: Prediction) => void;
  existingPrediction?: Prediction;
  isLocked?: boolean;
}

export function PredictionForm({ drivers, onSubmit, existingPrediction, isLocked = false }: PredictionFormProps) {
  const [prediction, setPrediction] = useState<Partial<Prediction>>(existingPrediction || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    // Vérifier que tous les champs sont remplis
    if (prediction.p1 && prediction.p2 && prediction.p3 && prediction.p4 && 
        prediction.p5 && prediction.p6 && prediction.p7 && prediction.p8 && 
        prediction.p9 && prediction.p10 && prediction.pole && prediction.fastestLap) {
      onSubmit(prediction as Prediction);
    }
  };

  const getAvailableDrivers = (position: keyof Prediction) => {
    const selectedDrivers = Object.entries(prediction)
      .filter(([key, value]) => key !== position && key !== 'pole' && key !== 'fastestLap' && value)
      .map(([, value]) => value);
    
    return drivers.filter(d => !selectedDrivers.includes(d.id));
  };

  const positions = [
    { key: 'p1' as const, label: '1', points: 25, color: 'from-amber-500 to-amber-600' },
    { key: 'p2' as const, label: '2', points: 18, color: 'from-slate-400 to-slate-500' },
    { key: 'p3' as const, label: '3', points: 15, color: 'from-orange-600 to-orange-700' },
    { key: 'p4' as const, label: '4', points: 12, color: 'from-primary to-primary/80' },
    { key: 'p5' as const, label: '5', points: 10, color: 'from-primary to-primary/80' },
    { key: 'p6' as const, label: '6', points: 8, color: 'from-primary to-primary/80' },
    { key: 'p7' as const, label: '7', points: 6, color: 'from-primary to-primary/80' },
    { key: 'p8' as const, label: '8', points: 4, color: 'from-primary to-primary/80' },
    { key: 'p9' as const, label: '9', points: 2, color: 'from-primary to-primary/80' },
    { key: 'p10' as const, label: '10', points: 1, color: 'from-primary to-primary/80' },
  ];

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-2xl">Your predictions</CardTitle>
          </div>
          {isLocked && (
            <Badge className="gap-2 bg-muted text-muted-foreground border-border">
              <Lock className="w-3 h-3" />
              Verrouillé
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Top 10 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Top 10</h3>
              <span className="text-sm text-muted-foreground">Classement final de la course</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {positions.map(({ key, label, points, color }) => (
                <div key={key} className="group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shadow-md shrink-0`}>
                      {label}
                    </div>
                    <Select
                      value={prediction[key] || ''}
                      onValueChange={(value) => setPrediction({ ...prediction, [key]: value })}
                      disabled={isLocked}
                    >
                      <SelectTrigger className="flex-1 h-12 rounded-xl border-border/50 hover:border-primary/50 transition-colors">
                        <SelectValue placeholder="Choisir un pilote" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableDrivers(key).map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{driver.firstName} {driver.lastName}</span>
                              <span className="text-xs text-muted-foreground">#{driver.number}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-right min-w-[60px]">
                      <div className="font-bold text-sm">{points}</div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bonus */}
          <div className="space-y-4 pt-6 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Bonus predictions</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                    P
                  </div>
                  <Select
                    value={prediction.pole || ''}
                    onValueChange={(value) => setPrediction({ ...prediction, pole: value })}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="flex-1 h-12 rounded-xl border-border/50 hover:border-accent/50 transition-colors">
                      <SelectValue placeholder="Pole Position" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{driver.firstName} {driver.lastName}</span>
                            <span className="text-xs text-muted-foreground">#{driver.number}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-right min-w-[60px]">
                    <div className="font-bold text-sm">10</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>

              <div className="group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                    FL
                  </div>
                  <Select
                    value={prediction.fastestLap || ''}
                    onValueChange={(value) => setPrediction({ ...prediction, fastestLap: value })}
                    disabled={isLocked}
                  >
                    <SelectTrigger className="flex-1 h-12 rounded-xl border-border/50 hover:border-chart-3/50 transition-colors">
                      <SelectValue placeholder="Tour le plus rapide" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{driver.firstName} {driver.lastName}</span>
                            <span className="text-xs text-muted-foreground">#{driver.number}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-right min-w-[60px]">
                    <div className="font-bold text-sm">5</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isLocked && (
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary shadow-lg shadow-primary/20 text-base font-semibold"
            >
              Save my predictions
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}