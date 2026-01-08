"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History, Trophy, Zap, Target, Eye, BarChart3, Sparkles } from 'lucide-react';
import { User, Race, Driver, UserPrediction } from '@/types';
import { ScoreDetailModal } from './ScoreDetailModal';
import { ResultsView, BadgeCelebration } from './results';

// Extended type to handle both API formats - matches ScoreDetailModal
interface ExtendedPrediction extends Omit<UserPrediction, 'predictions'> {
  predictions?: {
    p1: string;
    p2: string;
    p3: string;
    p4: string;
    p5: string;
    p6: string;
    p7: string;
    p8: string;
    p9: string;
    p10: string;
    pole: string;
    fastestLap: string;
  };
  // API format fields
  topTen?: string[];
  pole?: string;
  fastestLap?: string;
}

interface PredictionHistoryProps {
  currentUser: User;
  races: Race[];
  drivers: Driver[];
  userPredictions: ExtendedPrediction[];
  onBack: () => void;
}

export function PredictionHistory({
  currentUser,
  races,
  drivers,
  userPredictions,
  onBack,
}: PredictionHistoryProps) {
  const [selectedPrediction, setSelectedPrediction] = useState<ExtendedPrediction | null>(null);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New state for ResultsView modal
  const [resultsRaceId, setResultsRaceId] = useState<string | null>(null);
  const [resultsRaceName, setResultsRaceName] = useState<string>('');
  const [resultsModalOpen, setResultsModalOpen] = useState(false);

  // Get race IDs that have scored predictions (user has points)
  const scoredRaceIds = new Set(
    userPredictions
      .filter(p => p.points !== undefined && p.points !== null)
      .map(p => p.raceId)
  );

  // Include races that are either:
  // 1. In the past (date < now)
  // 2. Have a scored prediction (race was processed even if date is in future due to simulation)
  const completedRaces = races
    .filter(r => new Date(r.date) < new Date() || scoredRaceIds.has(r.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? `${driver.firstName} ${driver.lastName}` : 'Inconnu';
  };

  // Helper to get podium driver IDs (handles both formats)
  const getPodiumDrivers = (prediction: ExtendedPrediction) => {
    if (prediction.predictions) {
      return {
        p1: prediction.predictions.p1,
        p2: prediction.predictions.p2,
        p3: prediction.predictions.p3,
      };
    }
    if (prediction.topTen && prediction.topTen.length >= 3) {
      return {
        p1: prediction.topTen[0],
        p2: prediction.topTen[1],
        p3: prediction.topTen[2],
      };
    }
    return null;
  };

  // Helper to get bonus predictions (handles both formats)
  const getBonusPredictions = (prediction: ExtendedPrediction) => {
    if (prediction.predictions) {
      return {
        pole: prediction.predictions.pole,
        fastestLap: prediction.predictions.fastestLap,
      };
    }
    return {
      pole: prediction.pole,
      fastestLap: prediction.fastestLap,
    };
  };

  const handleViewScore = (prediction: ExtendedPrediction, race: Race) => {
    setSelectedPrediction(prediction);
    setSelectedRace(race);
    setModalOpen(true);
  };

  const handleViewResults = (race: Race) => {
    setResultsRaceId(race.id);
    setResultsRaceName(race.name);
    setResultsModalOpen(true);
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
          <CardDescription>
            {userPredictions.length} pronostic{userPredictions.length > 1 ? 's' : ''} soumis
          </CardDescription>
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

                // Check if race has results
                const hasResults = race.resultsJson?.positions && race.resultsJson.positions.length > 0;

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
                      <div className="flex items-center gap-2">
                        {prediction.points !== undefined && (
                          <Badge className="gap-2 bg-gradient-to-r from-primary to-accent text-white border-0">
                            <Trophy className="w-3 h-3" />
                            {prediction.points} points
                          </Badge>
                        )}
                        {/* View Results button - shows when race has results */}
                        {hasResults && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewResults(race)}
                            className="h-7 px-3 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Voir résultats</span>
                          </Button>
                        )}
                        {/* Score detail button */}
                        {prediction.pointsBreakdown && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewScore(prediction, race)}
                            className="h-7 px-2 text-muted-foreground hover:text-foreground"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Top 3 */}
                      {(() => {
                        const podium = getPodiumDrivers(prediction);
                        const bonus = getBonusPredictions(prediction);
                        
                        if (!podium) {
                          return (
                            <div className="text-sm text-muted-foreground italic">
                              Détails du pronostic non disponibles
                            </div>
                          );
                        }
                        
                        return (
                          <>
                            <div>
                              <div className="text-sm font-semibold text-muted-foreground mb-2">
                                Podium prédit
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Badge className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
                                  1. {getDriverName(podium.p1)}
                                </Badge>
                                <Badge className="bg-gradient-to-br from-gray-400 to-gray-500 text-white border-0">
                                  2. {getDriverName(podium.p2)}
                                </Badge>
                                <Badge className="bg-gradient-to-br from-amber-700 to-amber-800 text-white border-0">
                                  3. {getDriverName(podium.p3)}
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
                                  {bonus.pole ? getDriverName(bonus.pole) : 'Non spécifié'}
                                </div>
                              </div>
                              <div className="p-3 rounded-xl bg-muted/30">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <Zap className="w-3 h-3" />
                                  Tour rapide
                                </div>
                                <div className="font-semibold">
                                  {bonus.fastestLap ? getDriverName(bonus.fastestLap) : 'Non spécifié'}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Detail Modal */}
      <ScoreDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        prediction={selectedPrediction}
        race={selectedRace}
        drivers={drivers}
      />

      {/* Results View Modal - Full results comparison with duel */}
      <ResultsView
        raceId={resultsRaceId || ''}
        raceName={resultsRaceName}
        currentUserId={currentUser.id}
        open={resultsModalOpen}
        onOpenChange={setResultsModalOpen}
      />

      {/* Badge Celebration - renders when badges are unlocked */}
      <BadgeCelebration />
    </div>
  );
}