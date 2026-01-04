import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, TrendingUp, Sword, Crown, Medal, Zap, Share2 } from 'lucide-react';
import { User, Race, Driver, UserPrediction } from '@/types';

// Participant info for head-to-head
interface Participant {
  id: string;
  name: string;
  totalPoints: number;
}

interface DuelViewProps {
  participants: Participant[];
  currentUser: User;
  races: Race[];
  drivers: Driver[];
  userPredictions: UserPrediction[];
  onBack: () => void;
  onMakePrediction: () => void;
}

export function DuelView({
  participants,
  currentUser,
  races,
  drivers,
  userPredictions,
  onBack,
  onMakePrediction,
}: DuelViewProps) {
  const sortedParticipants = [...participants].sort((a, b) => b.totalPoints - a.totalPoints);
  const [leader, challenger] = sortedParticipants;
  
  const currentParticipant = participants.find(p => p.id === currentUser.id);
  const opponentParticipant = participants.find(p => p.id !== currentUser.id);

  const pointsDifference = Math.abs(leader.totalPoints - challenger.totalPoints);
  const isLeader = currentParticipant?.id === leader.id;

  // Stats des dernières courses
  const recentRaces = races
    .filter(r => new Date(r.date) < new Date())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Check if there's an upcoming race
  const upcomingRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    return raceDate > new Date();
  });
  const hasUpcomingRace = upcomingRaces.length > 0;

  const getRaceWinner = (raceId: string) => {
    const predictions = userPredictions.filter(p => p.raceId === raceId);
    if (predictions.length !== 2) return null;
    
    const sorted = predictions.sort((a, b) => (b.points || 0) - (a.points || 0));
    if ((sorted[0]?.points || 0) === (sorted[1]?.points || 0)) return 'draw';
    return sorted[0]?.userId;
  };

  const currentWins = recentRaces.filter(r => getRaceWinner(r.id) === currentUser.id).length;
  const opponentWins = recentRaces.filter(r => getRaceWinner(r.id) === opponentParticipant?.id).length;
  const draws = recentRaces.filter(r => getRaceWinner(r.id) === 'draw').length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        
        <Badge className="gap-2 bg-gradient-to-r from-primary to-accent text-white border-0">
          <Sword className="w-3 h-3" />
          Mode Duel
        </Badge>
      </div>

      {/* Duel Header */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
        <CardHeader>
          <CardTitle className="text-center text-2xl mb-4">Saison 2026</CardTitle>
          
          <div className="grid grid-cols-3 gap-4 items-center">
            {/* Current User */}
            <div className={`text-center p-6 rounded-2xl ${
              isLeader
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30'
                : 'bg-muted/30'
            }`}>
              {isLeader && (
                <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              )}
              <div className="text-sm text-muted-foreground mb-1">Vous</div>
              <div className="font-bold text-lg mb-2">{currentParticipant?.name || 'Vous'}</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
                {currentParticipant?.totalPoints || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">points</div>
            </div>

            {/* VS Badge */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto shadow-lg">
                <span className="text-white font-bold text-xl">VS</span>
              </div>
              {pointsDifference > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Écart: <span className="font-bold">{pointsDifference} pts</span>
                </div>
              )}
            </div>

            {/* Opponent */}
            <div className={`text-center p-6 rounded-2xl ${
              !isLeader
                ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30'
                : 'bg-muted/30'
            }`}>
              {!isLeader && (
                <Crown className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              )}
              <div className="text-sm text-muted-foreground mb-1">Adversaire</div>
              <div className="font-bold text-lg mb-2">{opponentParticipant?.name || 'Adversaire'}</div>
              <div className="text-3xl font-bold bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
                {opponentParticipant?.totalPoints || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1">points</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <Trophy className="w-5 h-5 text-green-500" />
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-0">Victoires</Badge>
          </div>
          <div className="text-3xl font-bold mb-1">{currentWins}</div>
          <div className="text-sm text-muted-foreground">Courses gagnées (5 dernières)</div>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <Medal className="w-5 h-5 text-blue-500" />
            <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-0">Égalités</Badge>
          </div>
          <div className="text-3xl font-bold mb-1">{draws}</div>
          <div className="text-sm text-muted-foreground">Courses à égalité</div>
        </Card>

        <Card className="p-6 border-border/50 bg-gradient-to-br from-orange-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-0">Défaites</Badge>
          </div>
          <div className="text-3xl font-bold mb-1">{opponentWins}</div>
          <div className="text-sm text-muted-foreground">Courses perdues</div>
        </Card>
      </div>

      {/* Recent Battles */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Derniers duels
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {recentRaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune course complétée pour le moment
              </div>
            ) : (
              recentRaces.map(race => {
                const winnerId = getRaceWinner(race.id);
                const currentPrediction = userPredictions.find(
                  p => p.raceId === race.id && p.userId === currentUser.id
                );
                const opponentPrediction = userPredictions.find(
                  p => p.raceId === race.id && p.userId === opponentParticipant?.id
                );

                const isDraw = winnerId === 'draw';
                const isCurrentWinner = winnerId === currentUser.id;

                return (
                  <div
                    key={race.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{race.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(race.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`font-bold ${isCurrentWinner ? 'text-green-500' : ''}`}>
                          {currentPrediction?.points || 0} pts
                        </div>
                        <div className="text-xs text-muted-foreground">Vous</div>
                      </div>

                      <div className="w-16 text-center">
                        {isDraw ? (
                          <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-0">
                            Égalité
                          </Badge>
                        ) : isCurrentWinner ? (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-0">
                            Gagné
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive border-0">
                            Perdu
                          </Badge>
                        )}
                      </div>

                      <div className="text-left">
                        <div className={`font-bold ${!isCurrentWinner && !isDraw ? 'text-green-500' : ''}`}>
                          {opponentPrediction?.points || 0} pts
                        </div>
                        <div className="text-xs text-muted-foreground">Adversaire</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <Button
        onClick={onMakePrediction}
        disabled={!hasUpcomingRace}
        size="lg"
        className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Target className="w-5 h-5 mr-2" />
        {hasUpcomingRace ? 'Faire mes pronostics' : 'Aucune course à venir'}
      </Button>
    </div>
  );
}