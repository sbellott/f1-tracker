import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Award, Target, Zap, Trophy, Flag, Star, Calendar, Flame, Lock } from 'lucide-react';

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserStats {
  totalPredictions: number;
  correctP1: number;
  correctPodium: number;
  correctPole: number;
  correctFastestLap: number;
  currentStreak: number;
  bestStreak: number;
  averagePoints: number;
  totalPoints: number;
  accuracyRate: number;
}

const mockStats: UserStats = {
  totalPredictions: 18,
  correctP1: 8,
  correctPodium: 12,
  correctPole: 10,
  correctFastestLap: 7,
  currentStreak: 3,
  bestStreak: 5,
  averagePoints: 42.5,
  totalPoints: 765,
  accuracyRate: 61.4,
};

const mockBadges: BadgeData[] = [
  {
    id: 'oracle',
    name: 'Oracle',
    description: '3 podiums exacts consécutifs',
    icon: '🔮',
    unlocked: false,
    progress: 2,
    maxProgress: 3,
    rarity: 'epic',
  },
  {
    id: 'sniper',
    name: 'Sniper',
    description: '5 P1 exacts dans la saison',
    icon: '🎯',
    unlocked: true,
    progress: 8,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'regular',
    name: 'Régulier',
    description: 'Pronostics sur 10 courses consécutives',
    icon: '📅',
    unlocked: true,
    progress: 18,
    maxProgress: 10,
    rarity: 'common',
  },
  {
    id: 'underdog',
    name: 'Underdog',
    description: 'Prédit un top 5 d\'un pilote hors top 10',
    icon: '🐕',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'rare',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: '5 Fastest Lap exacts',
    icon: '⚡',
    unlocked: true,
    progress: 7,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'pole-hunter',
    name: 'Pole Hunter',
    description: '5 Poles exactes',
    icon: '🏁',
    unlocked: true,
    progress: 10,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Gagner le classement de la saison',
    icon: '🏆',
    unlocked: false,
    progress: 1,
    maxProgress: 1,
    rarity: 'legendary',
  },
  {
    id: 'perfect-weekend',
    name: 'Perfect Weekend',
    description: 'Podium exact + Pole + FL sur une course',
    icon: '⭐',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rarity: 'epic',
  },
];

const rarityColors = {
  common: 'bg-slate-500/20 border-slate-500/50 text-slate-300',
  rare: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  epic: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  legendary: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
};

const rarityLabels = {
  common: 'Commun',
  rare: 'Rare',
  epic: 'Épique',
  legendary: 'Légendaire',
};

export function StatsAndBadges() {
  const unlockedBadges = mockBadges.filter(b => b.unlocked);
  const lockedBadges = mockBadges.filter(b => !b.unlocked);

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Statistiques & Badges</h2>
        <p className="text-muted-foreground text-lg">
          Suivez vos performances et débloquez des achievements
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-3 text-primary" />
              <div className="text-4xl font-bold mb-1">{mockStats.accuracyRate}%</div>
              <div className="text-sm text-muted-foreground">Taux de réussite</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="w-8 h-8 mx-auto mb-3 text-amber-500" />
              <div className="text-4xl font-bold mb-1">{mockStats.totalPoints}</div>
              <div className="text-sm text-muted-foreground">Points totaux</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Flame className="w-8 h-8 mx-auto mb-3 text-chart-3" />
              <div className="text-4xl font-bold mb-1">{mockStats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Série actuelle</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-accent" />
              <div className="text-4xl font-bold mb-1">{unlockedBadges.length}/{mockBadges.length}</div>
              <div className="text-sm text-muted-foreground">Badges</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Statistiques détaillées
          </CardTitle>
          <CardDescription>
            Vos performances par type de pronostic
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="font-medium">Vainqueur (P1)</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockStats.correctP1}/{mockStats.totalPredictions} ({Math.round((mockStats.correctP1 / mockStats.totalPredictions) * 100)}%)
                </span>
              </div>
              <Progress value={(mockStats.correctP1 / mockStats.totalPredictions) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-chart-2" />
                  <span className="font-medium">Podium complet</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockStats.correctPodium}/{mockStats.totalPredictions} ({Math.round((mockStats.correctPodium / mockStats.totalPredictions) * 100)}%)
                </span>
              </div>
              <Progress value={(mockStats.correctPodium / mockStats.totalPredictions) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-chart-3" />
                  <span className="font-medium">Pole Position</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockStats.correctPole}/{mockStats.totalPredictions} ({Math.round((mockStats.correctPole / mockStats.totalPredictions) * 100)}%)
                </span>
              </div>
              <Progress value={(mockStats.correctPole / mockStats.totalPredictions) * 100} className="h-2" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-chart-4" />
                  <span className="font-medium">Tour le plus rapide</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {mockStats.correctFastestLap}/{mockStats.totalPredictions} ({Math.round((mockStats.correctFastestLap / mockStats.totalPredictions) * 100)}%)
                </span>
              </div>
              <Progress value={(mockStats.correctFastestLap / mockStats.totalPredictions) * 100} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="text-2xl font-bold mb-1">{mockStats.averagePoints}</div>
              <div className="text-sm text-muted-foreground">Pts moyens/course</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="text-2xl font-bold mb-1">{mockStats.bestStreak}</div>
              <div className="text-sm text-muted-foreground">Meilleure série</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <div className="text-2xl font-bold mb-1">{mockStats.totalPredictions}</div>
              <div className="text-sm text-muted-foreground">Pronostics soumis</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Badges débloqués
              <Badge variant="secondary" className="ml-2">
                {unlockedBadges.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Vos achievements obtenus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`relative p-6 rounded-2xl border-2 text-center group hover:scale-105 transition-all cursor-pointer ${rarityColors[badge.rarity]}`}
                >
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="text-xs">
                      {rarityLabels[badge.rarity]}
                    </Badge>
                  </div>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                  <div className="font-bold mb-1">{badge.name}</div>
                  <div className="text-xs text-muted-foreground">{badge.description}</div>
                  {badge.progress && badge.maxProgress && (
                    <div className="mt-3">
                      <Progress 
                        value={(badge.progress / badge.maxProgress) * 100} 
                        className="h-1.5"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {badge.progress}/{badge.maxProgress}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              Badges à débloquer
              <Badge variant="secondary" className="ml-2">
                {lockedBadges.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Continuez à progresser pour débloquer ces achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className="relative p-6 rounded-2xl border-2 border-dashed border-border/50 bg-muted/20 text-center group hover:bg-muted/40 transition-all cursor-pointer"
                >
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-xs">
                      {rarityLabels[badge.rarity]}
                    </Badge>
                  </div>
                  <div className="text-5xl mb-3 opacity-30 grayscale group-hover:opacity-50 transition-all">
                    {badge.icon}
                  </div>
                  <div className="font-bold mb-1 text-muted-foreground">{badge.name}</div>
                  <div className="text-xs text-muted-foreground/70">{badge.description}</div>
                  {badge.maxProgress && (
                    <div className="mt-3">
                      <Progress 
                        value={badge.progress ? (badge.progress / badge.maxProgress) * 100 : 0} 
                        className="h-1.5 opacity-50"
                      />
                      <div className="text-xs text-muted-foreground/70 mt-1">
                        {badge.progress || 0}/{badge.maxProgress}
                      </div>
                    </div>
                  )}
                  <Lock className="w-4 h-4 absolute bottom-3 left-3 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Info */}
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-semibold mb-1">Continuez vos pronostics !</div>
              <p className="text-sm text-muted-foreground">
                Vous êtes à <strong>1 podium exact</strong> de débloquer le badge <strong>Oracle</strong> 🔮. 
                Maintenez votre série de {mockStats.currentStreak} victoires !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
