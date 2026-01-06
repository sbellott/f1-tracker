import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, Trophy, Zap, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Race, Driver, Prediction, Constructor } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageWithFallback } from '@/components/f1/figma/ImageWithFallback';
import { getDriverHeadshotUrl, getTeamColor } from '@/lib/utils/driver-images';
import { getPredictionLockStatus, getSessionName, PREDICTION_LOCK_MINUTES } from '@/lib/utils/date';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PredictionFormProps {
  race: Race;
  drivers: Driver[];
  constructors: Constructor[];
  onBack: () => void;
  onSubmit: (prediction: Prediction) => void;
  existingPrediction?: Prediction;
}

export function PredictionForm({
  race,
  drivers,
  constructors,
  onBack,
  onSubmit,
  existingPrediction,
}: PredictionFormProps) {
  // Filter only active drivers (those with a constructor = on the 2026 grid)
  const activeDrivers = drivers.filter(d => d.constructorId);

  // Helper to get constructor by ID
  const getConstructor = (constructorId: string) => constructors.find(c => c.id === constructorId);

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Check lock status using shared utility (15 minutes before qualifying/sprint qualifying)
  const sessionsForLock = race.sessions.map(s => ({
    type: s.type,
    dateTime: new Date(s.dateTime),
  }));
  const lockStatus = getPredictionLockStatus(sessionsForLock);
  const isLocked = lockStatus.isLocked;
  const lockTime = lockStatus.lockTime;
  const lockSessionName = lockStatus.lockSession ? getSessionName(lockStatus.lockSession) : null;

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
      errors.push('Each driver can only appear once in the top 10');
    }

    return errors;
  };

  const handleSubmit = () => {
    const validationErrors = validatePrediction();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Show confirmation dialog instead of submitting directly
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(false);
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

  // Render driver option with photo and team color
  const renderDriverOption = (driver: Driver) => {
    const constructor = getConstructor(driver.constructorId);
    const teamName = constructor?.name || '';
    const teamColor = constructor?.color || getTeamColor(teamName);
    
    return (
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ backgroundColor: teamColor }}
        >
          <ImageWithFallback
            src={getDriverHeadshotUrl(driver.firstName, driver.lastName, teamName)}
            alt={`${driver.firstName} ${driver.lastName}`}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{driver.code}</span>
          <span className="text-muted-foreground">
            {driver.firstName} {driver.lastName}
          </span>
        </div>
      </div>
    );
  };

  // Render selected driver in trigger with photo
  const renderSelectedDriver = (driverId: string) => {
    const driver = activeDrivers.find(d => d.id === driverId);
    if (!driver) return null;
    
    const constructor = getConstructor(driver.constructorId);
    const teamName = constructor?.name || '';
    const teamColor = constructor?.color || getTeamColor(teamName);
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
          style={{ backgroundColor: teamColor }}
        >
          <ImageWithFallback
            src={getDriverHeadshotUrl(driver.firstName, driver.lastName, teamName)}
            alt={`${driver.firstName} ${driver.lastName}`}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <span className="font-semibold">{driver.code}</span>
        <span className="text-muted-foreground text-sm">
          {driver.firstName} {driver.lastName}
        </span>
      </div>
    );
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
          <p className="text-muted-foreground">
            Les pronostics sont verrouillés depuis {lockTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {PREDICTION_LOCK_MINUTES} minutes avant {lockSessionName || 'les qualifications'}
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
        
        {!isLocked && lockTime && (
          <Badge className="gap-2 bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Ouvert jusqu'à {lockTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            {lockSessionName && <span className="text-xs opacity-75">({PREDICTION_LOCK_MINUTES}min avant {lockSessionName})</span>}
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
              <div className="text-sm text-muted-foreground mb-1">Race date</div>
              <div className="font-bold">{new Date(race.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</div>
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
              Validation errors
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
                      <SelectTrigger 
                        className="h-12"
                        aria-label={`Sélectionner le pilote pour la position ${posNumber}`}
                      >
                        {prediction[pos] ? renderSelectedDriver(prediction[pos]) : <SelectValue placeholder="Sélectionner un pilote" />}
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableDrivers(pos).map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {renderDriverOption(driver)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-right shrink-0 w-16">
                    <div className="text-xs text-muted-foreground">Exact P1</div>
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
              <SelectTrigger 
                className="h-12"
                aria-label="Sélectionner le pilote pour la pole position"
              >
                {prediction.pole ? renderSelectedDriver(prediction.pole) : <SelectValue placeholder="Qui décrochera la pole ?" />}
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {renderDriverOption(driver)}
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
              <SelectTrigger 
                className="h-12"
                aria-label="Sélectionner le pilote pour le tour le plus rapide"
              >
                {prediction.fastestLap ? renderSelectedDriver(prediction.fastestLap) : <SelectValue placeholder="Qui fera le meilleur temps ?" />}
              </SelectTrigger>
              <SelectContent>
                {activeDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {renderDriverOption(driver)}
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
              <div className="text-xs text-muted-foreground">Exact P1</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">50</div>
              <div className="text-xs text-muted-foreground">Exact podium</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">10</div>
              <div className="text-xs text-muted-foreground">Exact pole</div>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 text-center">
              <div className="font-bold text-lg">5</div>
              <div className="text-xs text-muted-foreground">Fastest Lap</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Bonus points are awarded for exact podium order (+50 pts) or any order (+20 pts)
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
          {existingPrediction ? 'Modifier mes pronostics' : 'Soumettre mes pronostics'}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Confirmer vos pronostics
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>Vous êtes sur le point de soumettre vos pronostics pour :</p>
                <div className="font-semibold text-foreground">{race.name}</div>
                
                <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                  <div className="font-medium text-foreground">Podium prédit :</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['p1', 'p2', 'p3'] as const).map((pos, idx) => {
                      const driver = getDriverById(prediction[pos]);
                      return (
                        <div key={pos} className="text-center">
                          <div className="text-xs text-muted-foreground">P{idx + 1}</div>
                          <div className="font-medium text-foreground">{driver?.code || '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Pole: </span>
                    <span className="font-medium text-foreground">{getDriverById(prediction.pole)?.code || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fastest Lap: </span>
                    <span className="font-medium text-foreground">{getDriverById(prediction.fastestLap)?.code || '—'}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Vous pourrez modifier vos pronostics jusqu'au verrouillage ({PREDICTION_LOCK_MINUTES} min avant les qualifications).
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} className="bg-primary hover:bg-primary/90">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}