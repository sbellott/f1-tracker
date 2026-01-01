import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Target, Crown, Medal, Share2 } from 'lucide-react';
import { Group, User, Race } from '@/types';

interface GroupLeaderboardProps {
  group: Group;
  currentUser: User;
  races: Race[];
  onBack: () => void;
  onMakePrediction: () => void;
  onInvite?: () => void;
}

export function GroupLeaderboard({
  group,
  currentUser,
  races,
  onBack,
  onMakePrediction,
  onInvite,
}: GroupLeaderboardProps) {
  const sortedMembers = [...group.members].sort((a, b) => b.totalPoints - a.totalPoints);

  // Check if there's an upcoming race
  const upcomingRaces = races.filter(race => {
    const raceDate = new Date(race.date);
    return raceDate > new Date();
  });
  const hasUpcomingRace = upcomingRaces.length > 0;

  const getMedalColor = (position: number) => {
    if (position === 1) return 'from-amber-500 to-amber-600';
    if (position === 2) return 'from-gray-400 to-gray-500';
    if (position === 3) return 'from-amber-700 to-amber-800';
    return 'from-muted to-muted';
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
        <CardHeader>
          <CardTitle className="text-2xl">{group.name}</CardTitle>
          <p className="text-muted-foreground">
            {group.members.length} participant{group.members.length > 1 ? 's' : ''}
          </p>
        </CardHeader>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Classement général
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {sortedMembers.map((member, index) => {
              const position = index + 1;
              const isCurrentUser = member.userId === currentUser.id;

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-primary/10 to-transparent border-2 border-primary/30'
                      : 'bg-muted/30'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br ${getMedalColor(position)}`}>
                    {position === 1 && <Crown className="w-6 h-6" />}
                    {position === 2 && <Medal className="w-6 h-6" />}
                    {position === 3 && <Medal className="w-6 h-6" />}
                    {position > 3 && position}
                  </div>

                  <div className="flex-1">
                    <div className="font-bold text-lg">
                      {member.user?.pseudo || `Participant ${position}`}
                      {isCurrentUser && (
                        <Badge className="ml-2 bg-primary/20 text-primary border-0">Vous</Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">{member.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={onMakePrediction}
          disabled={!hasUpcomingRace}
          size="lg"
          className="flex-1 h-14 text-lg bg-gradient-to-r from-primary to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Target className="w-5 h-5 mr-2" />
          {hasUpcomingRace ? 'Faire mes pronostics' : 'Aucune course à venir'}
        </Button>
        {onInvite && (
          <Button
            onClick={onInvite}
            variant="outline"
            size="lg"
            className="h-14"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
}