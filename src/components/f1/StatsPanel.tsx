import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Award, Target, Zap, Trophy, Flag, Star, Flame, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    id: 'sniper',
    name: 'Sniper',
    description: '5 exact P1',
    icon: '🎯',
    unlocked: true,
    progress: 8,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'regular',
    name: 'Regular',
    description: '10 consecutive races',
    icon: '📅',
    unlocked: true,
    progress: 18,
    maxProgress: 10,
    rarity: 'common',
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: '5 exact Fastest Laps',
    icon: '⚡',
    unlocked: true,
    progress: 7,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'pole-hunter',
    name: 'Pole Hunter',
    description: '5 exact Poles',
    icon: '🏁',
    unlocked: true,
    progress: 10,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: 'oracle',
    name: 'Oracle',
    description: '3 consecutive exact podiums',
    icon: '🔮',
    unlocked: false,
    progress: 2,
    maxProgress: 3,
    rarity: 'epic',
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Win the ranking',
    icon: '🏆',
    unlocked: false,
    progress: 1,
    maxProgress: 1,
    rarity: 'legendary',
  },
];

const rarityColors = {
  common: 'bg-slate-500/20 border-slate-500/50 text-slate-300',
  rare: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  epic: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  legendary: 'bg-amber-500/20 border-amber-500/50 text-amber-300',
};

const rarityLabels = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

interface StatsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatsPanel({ open, onOpenChange }: StatsPanelProps) {
  const unlockedBadges = mockBadges.filter(b => b.unlocked);
  const lockedBadges = mockBadges.filter(b => !b.unlocked);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-chart-5 to-chart-5/80 flex items-center justify-center shadow-lg shadow-chart-5/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl">Your statistics</SheetTitle>
              <SheetDescription>
                Performance & achievements
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Target className="w-6 h-6 mb-2 text-primary" />
                <div className="text-3xl font-bold">{mockStats.accuracyRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">Success rate</div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-chart-5/10 to-chart-5/5 border border-chart-5/20">
                <Trophy className="w-6 h-6 mb-2 text-chart-5" />
                <div className="text-3xl font-bold">{mockStats.totalPoints}</div>
                <div className="text-xs text-muted-foreground mt-1">Total points</div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-chart-3/10 to-chart-3/5 border border-chart-3/20">
                <Flame className="w-6 h-6 mb-2 text-chart-3" />
                <div className="text-3xl font-bold">{mockStats.currentStreak}</div>
                <div className="text-xs text-muted-foreground mt-1">Current streak</div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <Award className="w-6 h-6 mb-2 text-accent" />
                <div className="text-3xl font-bold">{unlockedBadges.length}/{mockBadges.length}</div>
                <div className="text-xs text-muted-foreground mt-1">Badges</div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Performance
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Winner (P1)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mockStats.correctP1}/{mockStats.totalPredictions}
                    </span>
                  </div>
                  <Progress value={(mockStats.correctP1 / mockStats.totalPredictions) * 100} className="h-1.5" />
                </div>

                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-chart-2" />
                      <span className="text-sm font-medium">Podium</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mockStats.correctPodium}/{mockStats.totalPredictions}
                    </span>
                  </div>
                  <Progress value={(mockStats.correctPodium / mockStats.totalPredictions) * 100} className="h-1.5" />
                </div>

                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-chart-3" />
                      <span className="text-sm font-medium">Pole</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mockStats.correctPole}/{mockStats.totalPredictions}
                    </span>
                  </div>
                  <Progress value={(mockStats.correctPole / mockStats.totalPredictions) * 100} className="h-1.5" />
                </div>

                <div className="p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-chart-4" />
                      <span className="text-sm font-medium">Fastest lap</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {mockStats.correctFastestLap}/{mockStats.totalPredictions}
                    </span>
                  </div>
                  <Progress value={(mockStats.correctFastestLap / mockStats.totalPredictions) * 100} className="h-1.5" />
                </div>
              </div>
            </div>

            {/* Unlocked Badges */}
            {unlockedBadges.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Unlocked badges
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {unlockedBadges.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {unlockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`relative p-4 rounded-xl border-2 text-center hover:scale-105 transition-transform ${rarityColors[badge.rarity]}`}
                    >
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
                          {rarityLabels[badge.rarity]}
                        </Badge>
                      </div>
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <div className="font-bold text-sm mb-0.5">{badge.name}</div>
                      <div className="text-[10px] text-muted-foreground">{badge.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    To unlock
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {lockedBadges.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {lockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="relative p-4 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 text-center"
                    >
                      <Lock className="w-3 h-3 absolute top-2 right-2 text-muted-foreground/50" />
                      <div className="text-4xl mb-2 opacity-30 grayscale">{badge.icon}</div>
                      <div className="font-bold text-sm text-muted-foreground mb-0.5">{badge.name}</div>
                      <div className="text-[10px] text-muted-foreground/70 mb-2">{badge.description}</div>
                      {badge.maxProgress && (
                        <>
                          <Progress
                            value={badge.progress ? (badge.progress / badge.maxProgress) * 100 : 0}
                            className="h-1 opacity-50"
                          />
                          <div className="text-[10px] text-muted-foreground/70 mt-1">
                            {badge.progress || 0}/{badge.maxProgress}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Hint */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm mb-1">Next goal</div>
                  <p className="text-xs text-muted-foreground">
                    Only <strong>1 exact podium</strong> left to unlock the <strong>Oracle</strong> badge 🔮
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/20">
          <Button
            variant="outline"
            className="w-full rounded-xl gap-2"
            onClick={() => onOpenChange(false)}
          >
            <TrendingUp className="w-4 h-4" />
            View all stats
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}