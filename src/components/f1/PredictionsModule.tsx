import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, History, Target, Crown, Swords, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Race, Driver, UserPrediction, User } from '@/types';
import { PredictionForm } from '@/components/predictions/PredictionForm';
import { PredictionHistory } from '@/components/predictions/PredictionHistory';
import { Prediction } from '@/types';

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
  userPredictions,
  opponentPredictions,
  onSubmitPrediction,
}: PredictionsModuleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('duel');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

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
    return { icon: Minus, color: 'text-muted-foreground', text: 'Égalité' };
  };

  const status = getStatusIndicator();

  return (
    <div className="space-y-6">
      {/* Main Duel View */}
      {viewMode === 'duel' && (
        <>
          {/* Header with competition title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Duel F1 2026</h2>
            <p className="text-muted-foreground text-lg">
              Qui sera le meilleur pronostiqueur de la saison ?
            </p>
          </div>

          {/* Main Score Card */}
          <Card className="border-border/50 overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
            <CardContent className="p-0">
              <div className="grid grid-cols-3 items-center">
                {/* Current User */}
                <div className={`p-6 text-center ${myTotalPoints > opponentTotalPoints ? 'bg-gradient-to-br from-amber-500/10 to-transparent' : ''}`}>
                  <div className="relative inline-block mb-3">
                    {myTotalPoints > opponentTotalPoints && (
                      <Crown className="w-6 h-6 text-amber-500 absolute -top-4 left-1/2 transform -translate-x-1/2" />
                    )}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-2xl font-bold text-white mx-auto">
                      {currentUser.pseudo?.[0] || currentUser.email[0]}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{currentUser.pseudo || 'Moi'}</h3>
                  <div className="text-4xl font-bold text-primary mb-1">
                    {myTotalPoints}
                  </div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>

                {/* VS / Status */}
                <div className="p-6 text-center border-x border-border/30">
                  <Swords className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold text-muted-foreground mb-2">VS</div>
                  <Badge className={`gap-1 ${pointsDiff > 0 ? 'bg-green-500/20 text-green-600' : pointsDiff < 0 ? 'bg-red-500/20 text-red-600' : 'bg-muted/50 text-muted-foreground'} border-0`}>
                    <status.icon className="w-3 h-3" />
                    {status.text}
                  </Badge>
                </div>

                {/* Opponent */}
                <div className={`p-6 text-center ${opponentTotalPoints > myTotalPoints ? 'bg-gradient-to-br from-amber-500/10 to-transparent' : ''}`}>
                  <div className="relative inline-block mb-3">
                    {opponentTotalPoints > myTotalPoints && (
                      <Crown className="w-6 h-6 text-amber-500 absolute -top-4 left-1/2 transform -translate-x-1/2" />
                    )}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-2xl font-bold text-white mx-auto">
                      {opponent.pseudo?.[0] || opponent.email[0]}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{opponent.pseudo || 'Adversaire'}</h3>
                  <div className="text-4xl font-bold text-accent mb-1">
                    {opponentTotalPoints}
                  </div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <Badge variant="outline" className="text-xs">Courses</Badge>
              </div>
              <div className="text-2xl font-bold">{completedRaces.length}</div>
              <div className="text-xs text-muted-foreground">terminées</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 text-accent" />
                <Badge variant="outline" className="text-xs">Pronostics</Badge>
              </div>
              <div className="text-2xl font-bold">{userPredictions.length}</div>
              <div className="text-xs text-muted-foreground">soumis</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <Badge variant="outline" className="text-xs">Victoires</Badge>
              </div>
              <div className="text-2xl font-bold">
                {completedRaces.filter(race => {
                  const myPred = userPredictions.find(p => p.raceId === race.id);
                  const oppPred = opponentPredictions.find(p => p.raceId === race.id);
                  return (myPred?.points || 0) > (oppPred?.points || 0);
                }).length}
              </div>
              <div className="text-xs text-muted-foreground">courses gagnées</div>
            </Card>

            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <Badge variant="outline" className="text-xs">Moyenne</Badge>
              </div>
              <div className="text-2xl font-bold">
                {userPredictions.length > 0 
                  ? Math.round(myTotalPoints / userPredictions.length)
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">pts/course</div>
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
                    Prochaine course
                  </div>
                  {hasNextRacePrediction ? (
                    <Badge className="bg-green-500/20 text-green-600 border-0">
                      ✓ Pronostic soumis
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-600 border-0">
                      En attente
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{nextRace.name}</h3>
                    <p className="text-muted-foreground">
                      {new Date(nextRace.date).toLocaleDateString('fr-FR', { 
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
                    {hasNextRacePrediction ? 'Modifier mes pronostics' : 'Faire mes pronostics'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewMode('history')}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    Historique
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
                  Résultats course par course
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
                            {new Date(race.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
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
        />
      )}
    </div>
  );
}
