import { useState } from 'react';
import { Race, Driver, Prediction, Circuit } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PredictionForm } from './PredictionForm';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, CheckCircle2, Clock, Lock, MapPin, TrendingUp } from 'lucide-react';

interface PredictionManagerProps {
  races: Race[];
  circuits: Circuit[];
  drivers: Driver[];
  predictions: Record<string, Prediction>;
  onSubmit: (raceId: string, prediction: Prediction) => void;
}

export function PredictionManager({ races, circuits, drivers, predictions, onSubmit }: PredictionManagerProps) {
  const [selectedRaceId, setSelectedRaceId] = useState<string>('');

  // Trouver la prochaine course par défaut
  const nextRace = races.find(race => !race.sessions.every(s => s.completed));
  const defaultRaceId = selectedRaceId || nextRace?.id || races[0]?.id;
  
  const selectedRace = races.find(r => r.id === defaultRaceId);
  const selectedCircuit = circuits.find(c => c.id === selectedRace?.circuitId);
  const selectedPrediction = defaultRaceId ? predictions[defaultRaceId] : null;

  // Déterminer l'état de la course
  const isCompleted = selectedRace?.sessions.every(s => s.completed);
  const qualifyingSession = selectedRace?.sessions.find(s => s.type === 'QUALIFYING');
  const isLocked = qualifyingSession?.completed || false;

  // Séparer les courses pour l'historique
  const upcomingRaces = races.filter(r => !r.sessions.every(s => s.completed));
  const completedRaces = races.filter(r => r.sessions.every(s => s.completed));

  const handleRaceChange = (raceId: string) => {
    setSelectedRaceId(raceId);
  };

  const handlePredictionSubmit = (prediction: Prediction) => {
    if (defaultRaceId) {
      onSubmit(defaultRaceId, prediction);
    }
  };

  const getDriverName = (driverId?: string) => {
    if (!driverId) return '—';
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : '—';
  };

  return (
    <div className="space-y-8">
      {/* Sélecteur de course */}
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-2xl">Sélectionner une course</CardTitle>
          </div>
          
          <Select value={defaultRaceId} onValueChange={handleRaceChange}>
            <SelectTrigger className="h-14 rounded-xl border-border/50 hover:border-primary/50 transition-colors text-base">
              <SelectValue placeholder="Choisir une course" />
            </SelectTrigger>
            <SelectContent>
              {upcomingRaces.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">À venir</div>
                  {upcomingRaces.map((race) => (
                    <SelectItem key={race.id} value={race.id}>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="shrink-0">R{race.round}</Badge>
                        <div>
                          <div className="font-medium">{race.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(race.date), 'd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
              
              {completedRaces.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Terminées</div>
                  {completedRaces.map((race) => (
                    <SelectItem key={race.id} value={race.id}>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="shrink-0">R{race.round}</Badge>
                        <div>
                          <div className="font-medium">{race.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(race.date), 'd MMM yyyy', { locale: fr })}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          {/* Infos course sélectionnée */}
          {selectedRace && selectedCircuit && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-sm">{selectedCircuit.city}, {selectedRace.country}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <Badge className="gap-1.5 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Course terminée
                  </Badge>
                )}
                {isLocked && !isCompleted && (
                  <Badge className="gap-1.5 bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
                    <Lock className="w-3.5 h-3.5" />
                    Pronostics verrouillés
                  </Badge>
                )}
                {!isLocked && !isCompleted && (
                  <Badge className="gap-1.5 bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    Pronostics ouverts
                  </Badge>
                )}
                {selectedRace.hasSprint && (
                  <Badge className="bg-gradient-to-r from-chart-3 to-chart-3/80 text-white border-0">
                    Sprint
                  </Badge>
                )}
                {selectedPrediction && (
                  <Badge className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pronostic enregistré
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Formulaire ou résultats */}
      {isCompleted && selectedPrediction ? (
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Vos résultats</CardTitle>
                <CardDescription className="text-base">
                  Pronostics pour {selectedRace?.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 lg:p-8 space-y-6">
            {/* Score simulé */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/20 text-center">
              <div className="text-5xl font-bold mb-2 bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                42 pts
              </div>
              <div className="text-muted-foreground">Score du pronostic</div>
            </div>

            {/* Top 10 */}
            <div>
              <h4 className="font-semibold mb-3">Top 10</h4>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pos) => {
                  const key = `p${pos}` as keyof Prediction;
                  const driverId = selectedPrediction[key];
                  return (
                    <div key={pos} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                      <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center rounded-lg">
                        {pos}
                      </Badge>
                      <span className="text-sm">{getDriverName(driverId)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bonus */}
            <div className="pt-6 border-t border-border/50">
              <h4 className="font-semibold mb-3">Pronostics bonus</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-accent/5">
                  <span className="text-sm text-muted-foreground">Pole Position</span>
                  <span className="font-medium">{getDriverName(selectedPrediction.pole)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-chart-3/5">
                  <span className="text-sm text-muted-foreground">Tour le plus rapide</span>
                  <span className="font-medium">{getDriverName(selectedPrediction.fastestLap)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <PredictionForm
          drivers={drivers}
          onSubmit={handlePredictionSubmit}
          existingPrediction={selectedPrediction || undefined}
          isLocked={isLocked}
        />
      )}

      {/* Historique des pronostics */}
      {Object.keys(predictions).length > 0 && (
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="text-xl">Historique des pronostics</CardTitle>
            <CardDescription className="text-base">
              {Object.keys(predictions).length} pronostic(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Accordion type="single" collapsible className="w-full">
              {races
                .filter(race => predictions[race.id])
                .map((race) => {
                  const racePrediction = predictions[race.id];
                  const raceCircuit = circuits.find(c => c.id === race.circuitId);
                  return (
                    <AccordionItem key={race.id} value={race.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <Badge variant="secondary">R{race.round}</Badge>
                          <div>
                            <div className="font-medium">{race.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {raceCircuit?.city} · {format(new Date(race.date), 'd MMM yyyy', { locale: fr })}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4 space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Top 3</h5>
                          <div className="space-y-2">
                            {[1, 2, 3].map((pos) => {
                              const key = `p${pos}` as keyof Prediction;
                              return (
                                <div key={pos} className="flex items-center gap-2">
                                  <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center text-xs">
                                    {pos}
                                  </Badge>
                                  <span className="text-sm">{getDriverName(racePrediction[key])}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border/50">
                          <div className="text-sm text-muted-foreground">
                            Pole: <span className="text-foreground font-medium">{getDriverName(racePrediction.pole)}</span>
                            {' · '}
                            Fastest Lap: <span className="text-foreground font-medium">{getDriverName(racePrediction.fastestLap)}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
