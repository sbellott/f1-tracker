import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Trophy, Zap, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Race, Driver, Prediction } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PredictionFormProps {
  race: Race;
  drivers: Driver[];
  onBack: () => void;
  onSubmit: (prediction: Prediction) => void;
  existingPrediction?: Prediction;
}

export function PredictionForm({
  race,
  drivers,
  onBack,
  onSubmit,
  existingPrediction,
}: PredictionFormProps) {
  // Filter only active drivers (those with a constructor = on the 2026 grid)
  const activeDrivers = drivers.filter(d => d.constructorId);

  const [prediction, setPrediction] = useState<Prediction>(
    existingPrediction || {
      p1: '',
      p2: '',
      p3: '',
      p4: '',
      p5: '',
      p6: '',
      p7: '',
      p8: '',
      p9: '',
      p10: '',
      pole: '',
      fastestLap: '',
    }
  );

  const [errors, setErrors] = useState<string[]>([]);

  // Check if race is locked (5 minutes before race start)
  const raceSession = race.sessions.find(s => s.type === 'RACE');
  const raceDate = raceSession ? new Date(raceSession.dateTime) : new Date(race.date);
  const lockTime = new Date(raceDate.getTime() - 5 * 60 * 1000);
  const isLocked = new Date() >= lockTime;

  const handlePositionChange = (position: keyof Prediction, driverId: string) => {
    setPrediction(prev => ({ ...prev, [position]: driverId }));
    setErrors([]);
  };

  const validatePrediction = (): string[] => {
    const errors: string[] = [];
    const positions: (keyof Prediction)[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    
    // Check all positions are filled
    positions.forEach(pos => {
      if (!prediction[pos]) {
        errors.push(`La position ${pos.toUpperCase()} doit être remplie`);
      }
    });

    if (!prediction.pole) errors.push('La pole position doit être remplie');
    if (!prediction.fastestLap) errors.push('Le tour le plus rapide doit être rempli');

    // Check for duplicates in top 10
    const selectedDrivers = positions.map(pos => prediction[pos]).filter(Boolean);
    const uniqueDrivers = new Set(selectedDrivers);
    if (uniqueDrivers.size !== selectedDrivers.length) {
      errors.push('Chaque pilote ne peut apparaître qu\'une seule fois dans le top 10');
    }

    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validatePrediction();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(prediction);
  };

  const getAvailableDrivers = (currentPosition: keyof Prediction) => {
    const positions: (keyof Prediction)[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'];
    const usedDrivers = positions
      .filter(pos => pos !== currentPosition)
      .map(pos => prediction[pos])
      .filter(Boolean);
    
    return activeDrivers.filter(d => !usedDrivers.includes(d.id));
  };

  const getDriverById = (id: string) => activeDrivers.find(d => d.id === id);

  const isFormValid = () => {
    return Object.values(prediction).every(v => v !== '') && errors.length === 0;
  };

  if (isLocked && !existingPrediction) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>

        <Card className="p-12 text-center border-border/50">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Pronostics verrouillés</h3>
          <p className="text-muted-foreground text-lg mb-6">
            Les pronostics pour cette course sont verrouillés depuis {lockTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-muted-foreground">
            Vous pourrez faire vos pronostics pour la prochaine course !
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        {!isLocked && (
          <Badge className="gap-2 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Ouvert jusqu'à {lockTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        )}
      </div>

      {/* Race Info */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{race.name}</CardTitle>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Date de la course</div>
              <div className="font-bold">{new Date(race.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erreurs de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Top 10 Predictions */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Top 10 Final
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'] as const).map((pos, index) => {
              const posNumber = index + 1;
              const points = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][index];
              
              return (
                <div key={pos} className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    posNumber === 1 ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white' :
                    posNumber === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' :
                    posNumber === 3 ? 'bg-gradient-to-br from-amber-700 to-amber-800 text-white' :
                    'bg-muted text-foreground'
                  }`}>
                    P{posNumber}
                  </div>
                  
                  <div className="flex-1">
                    <Select
                      value={prediction[pos]}
                      onValueChange={(value) => handlePositionChange(pos, value)}
                      disabled={isLocked}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Sélectionner un pilote" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableDrivers(pos).map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{driver.code}</span>
                              <span className="text-muted-foreground">
                                {driver.firstName} {driver.lastName}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-right shrink-0 w-16">
                    <div className="text-xs text-muted-foreground">Exact</div>
                    <div className="font-bold text-primary">{points} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bonus Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pole Position */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              Pole Position
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Select
              value={prediction.pole}
              onValueChange={(value) => handlePositionChange('pole', value)}
              disabled={isLocked}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Qui décrochera la pole ?" />
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{driver.code}</span>
                      <span className="text-muted-foreground">
                        {driver.firstName} {driver.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 p-3 rounded-xl bg-muted/30 text-sm">
              <span className="text-muted-foreground">Bonus:</span>
              <span className="font-bold text-accent ml-2">+10 points</span>
            </div>
          </CardContent>
        </Card>

        {/* Fastest Lap */}
        <Card className="border-border/50">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              Tour le plus rapide
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Select
              value={prediction.fastestLap}
              onValueChange={(value) => handlePositionChange('fastestLap', value)}
              disabled={isLocked}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Qui fera le meilleur temps ?" />
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{driver.code}</span>
                      <span className="text-muted-foreground">
                        {driver.firstName} {driver.lastName}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 p-3 rounded-xl bg-muted/30 text-sm">
              <span className="text-muted-foreground">Bonus:</span>
              <span className="font-bold text-chart-3 ml-2">+5 points</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Points System Info */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg">Système de points</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">25</div>
              <div className="text-xs text-muted-foreground">P1 exact</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">50</div>
              <div className="text-xs text-muted-foreground">Podium exact</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">10</div>
              <div className="text-xs text-muted-foreground">Pole exact</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">5</div>
              <div className="text-xs text-muted-foreground">Fastest Lap</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Des points bonus sont accordés pour les podiums dans l'ordre exact (+50 pts) ou désordre (+20 pts)
          </p>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid() || isLocked}
          size="lg"
          className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {existingPrediction ? 'Modifier mes pronostics' : 'Valider mes pronostics'}
        </Button>
      </div>
    </div>
  );
}