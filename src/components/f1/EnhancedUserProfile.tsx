"use client";

import { useState, useMemo } from "react";
import {
  User,
  Trophy,
  Target,
  Award,
  Calendar,
  TrendingUp,
  Star,
  Zap,
  Crown,
  Settings,
  Share2,
  ChevronRight,
  Flame,
  Medal,
  BarChart3,
  Users,
  Edit3,
  Camera,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { PageTransition, SlideUp, StaggerChildren, StaggerItem, ScaleIn } from "./Animations";
import { BadgeDisplay, BadgeGrid, BadgeType, BADGES } from "./BadgeUnlock";
import { UserStatsPanel, UserStatsCompact } from "./UserStatsPanel";
import { ShareCard, ShareButton } from "./ShareCard";

import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface UserStats {
  totalPoints: number;
  rank: number;
  totalParticipants: number;
  predictions: number;
  perfectPredictions: number;
  accuracy: number;
  streak: number;
  bestRank: number;
  badges: number;
  season: number;
}

interface GroupMembership {
  id: string;
  name: string;
  rank: number;
  points: number;
  members: number;
}

interface EnhancedUserProfileProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  stats: UserStats;
  unlockedBadges: BadgeType[];
  groups?: GroupMembership[];
  className?: string;
}

// ============================================
// Level System
// ============================================

const LEVELS = [
  { level: 1, name: "Rookie", minPoints: 0, color: "text-gray-500", icon: Star },
  { level: 2, name: "Amateur", minPoints: 100, color: "text-green-500", icon: Star },
  { level: 3, name: "Confirmé", minPoints: 300, color: "text-blue-500", icon: Medal },
  { level: 4, name: "Expert", minPoints: 600, color: "text-purple-500", icon: Trophy },
  { level: 5, name: "Master", minPoints: 1000, color: "text-orange-500", icon: Crown },
  { level: 6, name: "Champion", minPoints: 1500, color: "text-yellow-500", icon: Crown },
  { level: 7, name: "Légende", minPoints: 2500, color: "text-red-500", icon: Flame },
];

function getUserLevel(points: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      const current = LEVELS[i];
      const next = LEVELS[i + 1];
      const progress = next
        ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100
        : 100;
      return {
        ...current,
        progress: Math.min(progress, 100),
        pointsToNext: next ? next.minPoints - points : 0,
        nextLevel: next,
      };
    }
  }
  return { ...LEVELS[0], progress: 0, pointsToNext: LEVELS[1]?.minPoints || 100, nextLevel: LEVELS[1] };
}

// ============================================
// Sub-Components
// ============================================

function StatCard({
  icon: Icon,
  value,
  label,
  color = "text-primary",
  trend,
}: {
  icon: typeof Trophy;
  value: string | number;
  label: string;
  color?: string;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <div className="text-center p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
      <Icon className={cn("w-5 h-5 mx-auto mb-2", color)} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {trend && (
        <div
          className={cn(
            "text-xs mt-2 flex items-center justify-center gap-1",
            trend.isPositive ? "text-green-500" : "text-red-500"
          )}
        >
          <TrendingUp className={cn("w-3 h-3", !trend.isPositive && "rotate-180")} />
          {trend.isPositive ? "+" : ""}{trend.value}%
        </div>
      )}
    </div>
  );
}

function LevelBadge({
  level,
  progress,
  pointsToNext,
  nextLevel,
}: {
  level: typeof LEVELS[0];
  progress: number;
  pointsToNext: number;
  nextLevel?: typeof LEVELS[0];
}) {
  const Icon = level.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-muted/20 border border-border/50">
      <div className={cn("w-14 h-14 rounded-xl bg-background flex items-center justify-center border-2", `border-current ${level.color}`)}>
        <Icon className={cn("w-7 h-7", level.color)} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold">{level.name}</span>
          <Badge variant="outline" className={level.color}>
            Niv. {level.level}
          </Badge>
        </div>
        {nextLevel && (
          <>
            <Progress value={progress} className="h-2 mb-1" />
            <p className="text-xs text-muted-foreground">
              {pointsToNext} pts pour {nextLevel.name}
            </p>
          </>
        )}
        {!nextLevel && (
          <p className="text-xs text-muted-foreground">Niveau maximum atteint !</p>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group }: { group: GroupMembership }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{group.name}</p>
          <p className="text-xs text-muted-foreground">{group.members} membres</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="font-bold">#{group.rank}</p>
          <p className="text-xs text-muted-foreground">{group.points} pts</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

function BadgeShowcase({ unlockedBadges }: { unlockedBadges: BadgeType[] }) {
  const allBadges = Object.keys(BADGES) as BadgeType[];
  const unlockedCount = unlockedBadges.length;
  const totalCount = allBadges.length;

  // Group badges by rarity
  const badgesByRarity = useMemo(() => {
    return {
      legendary: allBadges.filter(b => BADGES[b].rarity === "legendary"),
      epic: allBadges.filter(b => BADGES[b].rarity === "epic"),
      rare: allBadges.filter(b => BADGES[b].rarity === "rare"),
      common: allBadges.filter(b => BADGES[b].rarity === "common"),
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Collection de badges</h3>
          <p className="text-sm text-muted-foreground">{unlockedCount}/{totalCount} débloqués</p>
        </div>
        <div className="w-24">
          <Progress value={(unlockedCount / totalCount) * 100} className="h-2" />
        </div>
      </div>

      {/* By Rarity */}
      {(["legendary", "epic", "rare", "common"] as const).map((rarity) => {
        const badges = badgesByRarity[rarity];
        const unlockedInRarity = badges.filter(b => unlockedBadges.includes(b)).length;

        if (badges.length === 0) return null;

        return (
          <div key={rarity}>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={cn(
                  rarity === "legendary" && "border-yellow-500/50 text-yellow-600",
                  rarity === "epic" && "border-purple-500/50 text-purple-600",
                  rarity === "rare" && "border-blue-500/50 text-blue-600",
                  rarity === "common" && "border-gray-500/50 text-gray-600"
                )}
              >
                {rarity === "legendary" && "Légendaire"}
                {rarity === "epic" && "Épique"}
                {rarity === "rare" && "Rare"}
                {rarity === "common" && "Commun"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {unlockedInRarity}/{badges.length}
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {badges.map((badge) => (
                <BadgeDisplay
                  key={badge}
                  badge={badge}
                  unlocked={unlockedBadges.includes(badge)}
                  size="md"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function EnhancedUserProfile({
  user,
  stats,
  unlockedBadges,
  groups = [],
  className,
}: EnhancedUserProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const level = getUserLevel(stats.totalPoints);

  // Share stats for ShareCard
  const shareStats = {
    totalPoints: stats.totalPoints,
    rank: stats.rank,
    totalParticipants: stats.totalParticipants,
    predictionsCount: stats.predictions,
    perfectPredictions: stats.perfectPredictions,
    winRate: stats.accuracy,
    season: stats.season,
    username: `${user.firstName} ${user.lastName}`,
    avatarUrl: user.avatar,
  };

  return (
    <PageTransition className={cn("space-y-8", className)}>
      {/* Profile Header */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card to-muted/20">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-primary/20 shadow-xl">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl md:text-4xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Edit Avatar Button */}
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4" />
              </Button>

              {/* Rank Badge */}
              <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary shadow-lg">
                <Trophy className="w-3 h-3 mr-1" />
                #{stats.rank}
              </Badge>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Badge variant="outline" className={level.color}>
                    {level.name}
                  </Badge>
                  <ShareCard stats={shareStats} />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{user.email}</p>

              {/* Level Progress */}
              <LevelBadge
                level={level}
                progress={level.progress}
                pointsToNext={level.pointsToNext}
                nextLevel={level.nextLevel}
              />

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <StatCard icon={Trophy} value={stats.totalPoints} label="Points" color="text-primary" />
                <StatCard icon={Target} value={stats.predictions} label="Pronostics" color="text-chart-3" />
                <StatCard icon={Award} value={`${stats.accuracy}%`} label="Précision" color="text-chart-5" />
                <StatCard icon={Flame} value={stats.streak} label="Série" color="text-orange-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex w-auto bg-muted/50 p-1.5 rounded-2xl">
          <TabsTrigger value="overview" className="gap-2 rounded-xl">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 rounded-xl">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2 rounded-xl">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2 rounded-xl">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Groupes</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance
                </CardTitle>
                <CardDescription>Votre progression cette saison</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux de réussite</span>
                    <span className="font-medium">{stats.accuracy}%</span>
                  </div>
                  <Progress value={stats.accuracy} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Objectif saison</span>
                    <span className="font-medium">{stats.totalPoints} / 1000 pts</span>
                  </div>
                  <Progress value={(stats.totalPoints / 1000) * 100} className="h-2" />
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">{stats.perfectPredictions}</div>
                    <div className="text-xs text-muted-foreground">Pronostics parfaits</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold">#{stats.bestRank}</div>
                    <div className="text-xs text-muted-foreground">Meilleur classement</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Badges */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Badges récents
                    </CardTitle>
                    <CardDescription>{unlockedBadges.length} badges débloqués</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("badges")}>
                    Voir tout
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {unlockedBadges.length > 0 ? (
                  <div className="grid grid-cols-5 gap-3">
                    {unlockedBadges.slice(0, 5).map((badge) => (
                      <ScaleIn key={badge}>
                        <BadgeDisplay badge={badge} unlocked size="lg" />
                      </ScaleIn>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Pas encore de badge</p>
                    <p className="text-xs">Continuez à pronostiquer !</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Groups */}
            {groups.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Mes groupes
                      </CardTitle>
                      <CardDescription>{groups.length} groupes</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("groups")}>
                      Voir tout
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groups.slice(0, 4).map((group) => (
                      <GroupCard key={group.id} group={group} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <UserStatsPanel season={stats.season} />
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Tous les badges
              </CardTitle>
              <CardDescription>
                Débloquez des badges en accomplissant des objectifs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeShowcase unlockedBadges={unlockedBadges} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Mes groupes
              </CardTitle>
              <CardDescription>
                Vos ligues de pronostics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Vous n&apos;êtes dans aucun groupe</p>
                  <p className="text-xs mt-1">Rejoignez ou créez un groupe pour défier vos amis !</p>
                  <Button className="mt-4" variant="outline">
                    Trouver un groupe
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

// ============================================
// Compact Profile Card (for sidebars, etc.)
// ============================================

interface ProfileCardProps {
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  stats: {
    totalPoints: number;
    rank: number;
    streak: number;
  };
  className?: string;
  onClick?: () => void;
}

export function ProfileCard({ user, stats, className, onClick }: ProfileCardProps) {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const level = getUserLevel(stats.totalPoints);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors cursor-pointer",
        className
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {user.firstName} {user.lastName}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", level.color)}>
            {level.name}
          </Badge>
          <span className="text-xs text-muted-foreground">#{stats.rank}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm">{stats.totalPoints}</p>
        <p className="text-xs text-muted-foreground">pts</p>
      </div>
    </div>
  );
}
