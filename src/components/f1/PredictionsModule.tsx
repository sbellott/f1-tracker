import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, History, Target, Crown, Swords, Calendar, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import { Race, Driver, Constructor, UserPrediction, User } from '@/types';
import { PredictionForm } from '@/components/predictions/PredictionForm';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { Prediction } from '@/types';
import { useConfetti } from '@/hooks/use-confetti';
import { VictoryAnimation } from './VictoryAnimation';
import { useScoringCelebration, type ScoreBreakdown } from '@/lib/hooks/useScoringCelebration';

interface Participant {
  id: string;
  name: string;
  totalPoints: number;
  predictions: UserPrediction[];
}

interface PredictionsModuleProps {
  currentUser: User;
  opponent: User;
  races: Race[];
  drivers: Driver[];
  constructors: Constructor[];
  userPredictions: UserPrediction[];
  opponentPredictions: UserPrediction[];
  onSubmitPrediction: (raceId: string, sessionType: 'RACE' | 'SPRINT', prediction: Prediction) => void;
}

type ViewMode = 'duel' | 'form' | 'history';

export function PredictionsModule({
  currentUser,
  opponent,
  races,
  drivers,
  constructors,
  userPredictions,
  opponentPredictions,
  onSubmitPrediction,
}: PredictionsModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('duel');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const { celebrate, celebrateFirstPrediction } = useConfetti();

  // Scoring celebration hook
  const {
    isOpen: isVictoryOpen,
    celebrationData,
    closeCelebration,
    triggerCelebration,
    checkForNewScores,
    initializeSeenPredictions,
    checkForBadgeUnlocks,
  } = useScoringCelebration();

  // Initialize seen predictions on mount (so we don't celebrate old scores)
  useEffect(() => {
    initializeSeenPredictions(userPredictions);
  }, []); // Only run once on mount

  // Check for new scores when predictions update
  useEffect(() => {
    checkForNewScores(userPredictions, races);
  }, [userPredictions, races, checkForNewScores]);

  // Check for badge unlocks periodically (every 30 seconds when focused)
  useEffect(() => {
    checkForBadgeUnlocks();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkForBadgeUnlocks();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [checkForBadgeUnlocks]);

  // Calculate total points for each participant
  const myTotalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const opponentTotalPoints = opponentPredictions.reduce((sum, p) => sum + (p.points || 0), 0);
  const pointsDiff = myTotalPoints - opponentTotalPoints;

  // Get next race that needs prediction
  const upcomingRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    return raceDate > new Date();
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const nextRace = upcomingRaces[0];

  // Check if current user has prediction for next race
  const hasNextRacePrediction = nextRace && userPredictions.some(p => p.raceId === nextRace.id);

  // Get completed races for history comparison
  const completedRaces = races.filter(race => {
    const raceSession = race.sessions?.find(s => s.type === 'RACE');
    return raceSession?.completed;
  });

  const handleMakePrediction = () => {
    if (nextRace) {
      setSelectedRace(nextRace);
      setViewMode('form');
    }
  };

  const handleSubmitPrediction = (prediction: Prediction) => {
    if (selectedRace) {
      onSubmitPrediction(selectedRace.id, 'RACE', prediction);
      
      // Celebrate with confetti!
      // Check if it's the first prediction ever
      if (userPredictions.length === 0) {
        celebrateFirstPrediction();
      } else {
        celebrate({ particleCount: 80, spread: 100 });
      }
      
      setViewMode('duel');
      setSelectedRace(null);
    }
  };

  // Get status indicator
  const getStatusIndicator = () => {
    if (pointsDiff > 0) {
      return { icon: TrendingUp, color: 'text-green-500', text: `+${pointsDiff} pts` };
    } else if (pointsDiff < 0) {
      return { icon: TrendingDown, color: 'text-red-500', text: `${pointsDiff} pts` };
    }
    return { icon: Minus, color: 'text-muted-foreground', text: 'Tie' };
  };

  const status = getStatusIndicator();

  return (
    <div className="space-y-6">
      {/* Main Duel View */}
      {viewMode === 'duel' && (
        <>
          {/* Header with competition title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">F1 2026 Duel</h2>
            <p className="text-muted-foreground text-lg">
              Who will be the best predictor of the season?
            </p>
          </div>

          {/* Main Score Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
            <CardContent className="p-0">
              {/* Mobile: Stack vertically, Desktop: 3 columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-center">
                {/* Current User */}
                <div className={`p-4 md:p-6 text-center ${myTotalPoints > opponentTotalPoints ? 'bg-gradient-to-br from-amber-500/10 to-transparent' : ''}`}>
                  <div className="relative inline-block mb-2 md:mb-3">
                    {myTotalPoints > opponentTotalPoints && (
                      <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-500 absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2" />
                    )}
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xl md:text-2xl font-bold text-white mx-auto">
                      {currentUser.pseudo?.[0] || currentUser.email[0]}
                    </div>
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-1">{currentUser.pseudo || 'Moi'}</h3>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {myTotalPoints}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">points</div>
                </div>

                {/* VS / Status - Hidden label on mobile, shown between scores */}
                <div className="p-3 md:p-6 text-center border-y md:border-y-0 md:border-x border-border/30 flex md:block items-center justify-center gap-4">
                  <Swords className="w-6 h-6 md:w-10 md:h-10 text-muted-foreground" />
                  <div className="text-xl md:text-2xl font-bold text-muted-foreground">VS</div>
                  <Badge className={`gap-1 ${pointsDiff > 0 ? 'bg-green-500/20 text-green-600' : pointsDiff < 0 ? 'bg-red-500/20 text-red-600' : 'bg-muted/50 text-muted-foreground'} border-0`}>
                    <status.icon className="w-3 h-3" />
                    {status.text}
                  </Badge>
                </div>

                {/* Opponent */}
                <div className={`p-4 md:p-6 text-center ${opponentTotalPoints > myTotalPoints ? 'bg-gradient-to-br from-amber-500/10 to-transparent' : ''}`}>
                  <div className="relative inline-block mb-2 md:mb-3">
                    {opponentTotalPoints > myTotalPoints && (
                      <Crown className="w-5 h-5 md:w-6 md:h-6 text-amber-500 absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2" />
                    )}
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-xl md:text-2xl font-bold text-white mx-auto">
                      {opponent.pseudo?.[0] || opponent.email[0]}
                    </div>
                  </div>
                  <h3 className="font-bold text-base md:text-lg mb-1">{opponent.pseudo || 'Adversaire'}</h3>
                  <div className="text-3xl md:text-4xl font-bold text-accent mb-1">
                    {opponentTotalPoints}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <Badge variant="outline" className="text-xs">Races</Badge>
              </div>
              <div className="text-2xl font-bold">{completedRaces.length}</div>
              <div className="text-xs text-muted-foreground">completed</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-accent" />
                <Badge variant="outline" className="text-xs">Predictions</Badge>
              </div>
              <div className="text-2xl font-bold">{userPredictions.length}</div>
              <div className="text-xs text-muted-foreground">submitted</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <Badge variant="outline" className="text-xs">Wins</Badge>
              </div>
              <div className="text-2xl font-bold">
                {completedRaces.filter(race => {
                  const myPred = userPredictions.find(p => p.raceId === race.id);
                  const oppPred = opponentPredictions.find(p => p.raceId === race.id);
                  return (myPred?.points || 0) > (oppPred?.points || 0);
                }).length}
              </div>
              <div className="text-xs text-muted-foreground">races won</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <Badge variant="outline" className="text-xs">Average</Badge>
              </div>
              <div className="text-2xl font-bold">
                {userPredictions.length > 0 
                  ? Math.round(myTotalPoints / userPredictions.length)
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">pts/race</div>
            </Card>
          </div>

          {/* Next Race Card */}
          {nextRace && (
            <Card className="border-border/50 overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    Next race
                  </div>
                  {hasNextRacePrediction ? (
                    <Badge className="bg-green-500/20 text-green-600 border-0">
                      ✓ Prediction submitted
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-600 border-0">
                      Pending
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{nextRace.name}</h3>
                    <p className="text-muted-foreground">
                      {new Date(nextRace.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={handleMakePrediction}
                    className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <Target className="w-4 h-4" />
                    {hasNextRacePrediction ? 'Edit my predictions' : 'Make my predictions'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('history')}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Race by Race Comparison */}
          {completedRaces.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Race by race results
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {completedRaces.slice(-5).reverse().map(race => {
                    const myPred = userPredictions.find(p => p.raceId === race.id);
                    const oppPred = opponentPredictions.find(p => p.raceId === race.id);
                    const myPoints = myPred?.points || 0;
                    const oppPoints = oppPred?.points || 0;
                    const winner = myPoints > oppPoints ? 'me' : myPoints < oppPoints ? 'opponent' : 'tie';
                    
                    return (
                      <div key={race.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                        <div className="flex-1">
                          <div className="font-medium">{race.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(race.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className={`text-right ${winner === 'me' ? 'text-green-500 font-bold' : ''}`}>
                            {myPoints} pts
                          </div>
                          <div className="text-muted-foreground">-</div>
                          <div className={`text-left ${winner === 'opponent' ? 'text-green-500 font-bold' : ''}`}>
                            {oppPoints} pts
                          </div>
                          
                          {winner === 'me' && <Trophy className="w-4 h-4 text-green-500" />}
                          {winner === 'opponent' && <Trophy className="w-4 h-4 text-red-500" />}
                          {winner === 'tie' && <Minus className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Prediction Form */}
      {viewMode === 'form' && selectedRace && (
        <PredictionForm
          race={selectedRace}
          drivers={drivers}
          onBack={() => {
            setViewMode('duel');
            setSelectedRace(null);
          }}
          onSubmit={handleSubmitPrediction}
          existingPrediction={userPredictions.find(p => p.raceId === selectedRace.id)?.predictions}
          constructors={constructors}
        />
      )}

      {/* History View */}
      {viewMode === 'history' && (
        <PredictionHistory
          currentUser={currentUser}
          races={races}
          drivers={drivers}
          userPredictions={userPredictions}
          onBack={() => setViewMode('duel')}
          onViewScore={(prediction, race) => {
            if (prediction.points !== null && prediction.points !== undefined && prediction.pointsBreakdown) {
              const breakdown = prediction.pointsBreakdown;
              triggerCelebration({
                raceName: race.name,
                score: {
                  positionPoints: breakdown.positionPoints || 0,
                  partialPoints: breakdown.partialPoints || 0,
                  polePoints: breakdown.polePoints || 0,
                  fastestLapPoints: breakdown.fastestLapPoints || 0,
                  podiumBonus: breakdown.podiumBonus || 0,
                  totalPoints: prediction.points,
                },
              });
            }
          }}
        />
      )}

      {/* Victory Animation Modal */}
      {celebrationData && (
        <VictoryAnimation
          isOpen={isVictoryOpen}
          onClose={closeCelebration}
          raceName={celebrationData.raceName}
          score={celebrationData.score}
          previousRank={celebrationData.previousRank}
          newRank={celebrationData.newRank}
          perfectPodium={celebrationData.perfectPodium}
          badgesUnlocked={celebrationData.badgesUnlocked}
        />
      )}
    </div>
  );
}