"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Target,
  Trophy,
  Medal,
  Flag,
  Timer,
  TrendingUp,
  TrendingDown,
  Flame,
  Star,
  Award,
  Zap,
  Calendar,
  BarChart3,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { usePredictions } from "@/hooks/queries/use-predictions";
import { useDrivers } from "@/hooks/queries/use-drivers";

// ============================================
// Types
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
}

interface AccuracyStat {
  label: string;
  correct: number;
  total: number;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

interface RacePerformance {
  raceName: string;
  points: number;
  maxPoints: number;
  percentage: number;
}

interface DriverPick {
  driverId: string;
  driverCode: string;
  driverName: string;
  count: number;
  color: string;
  [key: string]: string | number; // Index signature for recharts compatibility
}

// ============================================
// Constants
// ============================================

const STAT_COLORS = {
  p1: "#FFD700",     // Gold
  podium: "#C0C0C0", // Silver
  pole: "#e10600",   // F1 Red
  fastestLap: "#9333ea", // Purple
  total: "#0090d0",  // F1 Blue
};

// ============================================
// Components
// ============================================

function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: color ? `${color}20` : "hsl(var(--muted))" }}
          >
            {icon}
          </div>
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-2 text-xs">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : null}
            <span
              className={cn(
                trend === "up" && "text-green-500",
                trend === "down" && "text-red-500"
              )}
            >
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AccuracyBar({ stat }: { stat: AccuracyStat }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded"
            style={{ backgroundColor: `${stat.color}20` }}
          >
            {stat.icon}
          </div>
          <span className="font-medium">{stat.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {stat.correct}/{stat.total}
          </span>
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${stat.color}20`,
              color: stat.color,
            }}
          >
            {stat.percentage}%
          </Badge>
        </div>
      </div>
      <Progress
        value={stat.percentage}
        className="h-2"
        style={
          {
            "--progress-background": stat.color,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

function PerformanceChart({ data }: { data: RacePerformance[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="raceName"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          content={({ payload, label }) => {
            if (!payload?.length) return null;
            const data = payload[0].payload as RacePerformance;
            return (
              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="font-semibold">{label}</p>
                <p className="text-sm">
                  <span className="text-primary font-bold">{data.points}</span>
                  <span className="text-muted-foreground"> / {data.maxPoints} pts</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.percentage}% du max
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="points" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.percentage >= 50 ? "#22c55e" : entry.percentage >= 25 ? "#f59e0b" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function FavoriteDriversChart({ data }: { data: DriverPick[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="driverCode"
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          label={({ name, percent }) =>
            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
          }
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const data = payload[0].payload as DriverPick;
            return (
              <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="font-semibold">{data.driverName}</p>
                <p className="text-sm">
                  Prédit P1: <span className="font-bold">{data.count} fois</span>
                </p>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Main Component
// ============================================

interface UserStatsPanelProps {
  className?: string;
  season?: number;
}

export function UserStatsPanel({ className, season = 2026 }: UserStatsPanelProps) {
  const { data: predictionsData, isLoading: loadingPredictions } = usePredictions(season);
  const { data: driversData, isLoading: loadingDrivers } = useDrivers();

  const predictions = predictionsData?.predictions || [];
  const stats = predictionsData?.stats;
  const drivers = driversData?.drivers || [];

  // Calculate accuracy stats from predictions with pointsBreakdown
  const accuracyStats = useMemo<AccuracyStat[]>(() => {
    if (!predictions.length) return [];

    let p1Correct = 0;
    let p1Total = 0;
    let podiumCorrect = 0;
    let podiumTotal = 0;
    let poleCorrect = 0;
    let poleTotal = 0;
    let flCorrect = 0;
    let flTotal = 0;

    predictions.forEach((pred) => {
      const predAny = pred as unknown as Record<string, unknown>;
      if (!predAny.pointsBreakdown || !pred.points) return;

      const breakdown = predAny.pointsBreakdown as Record<string, number>;

      // P1 exact (25 pts)
      p1Total++;
      if (breakdown.position_1 === 25) p1Correct++;

      // Podium (any correct in top 3)
      podiumTotal += 3;
      if (breakdown.position_1 > 0) podiumCorrect++;
      if (breakdown.position_2 > 0) podiumCorrect++;
      if (breakdown.position_3 > 0) podiumCorrect++;

      // Pole
      if (breakdown.pole !== undefined) {
        poleTotal++;
        if (breakdown.pole === 10) poleCorrect++;
      }

      // Fastest Lap
      if (breakdown.fastestLap !== undefined) {
        flTotal++;
        if (breakdown.fastestLap === 5) flCorrect++;
      }
    });

    return [
      {
        label: "P1 Exact",
        correct: p1Correct,
        total: p1Total,
        percentage: p1Total > 0 ? Math.round((p1Correct / p1Total) * 100) : 0,
        icon: <Trophy className="h-4 w-4" style={{ color: STAT_COLORS.p1 }} />,
        color: STAT_COLORS.p1,
      },
      {
        label: "Podium",
        correct: podiumCorrect,
        total: podiumTotal,
        percentage: podiumTotal > 0 ? Math.round((podiumCorrect / podiumTotal) * 100) : 0,
        icon: <Medal className="h-4 w-4" style={{ color: STAT_COLORS.podium }} />,
        color: "#64748b",
      },
      {
        label: "Pole Position",
        correct: poleCorrect,
        total: poleTotal,
        percentage: poleTotal > 0 ? Math.round((poleCorrect / poleTotal) * 100) : 0,
        icon: <Flag className="h-4 w-4" style={{ color: STAT_COLORS.pole }} />,
        color: STAT_COLORS.pole,
      },
      {
        label: "Tour Rapide",
        correct: flCorrect,
        total: flTotal,
        percentage: flTotal > 0 ? Math.round((flCorrect / flTotal) * 100) : 0,
        icon: <Timer className="h-4 w-4" style={{ color: STAT_COLORS.fastestLap }} />,
        color: STAT_COLORS.fastestLap,
      },
    ];
  }, [predictions]);

  // Calculate performance per race
  const racePerformance = useMemo<RacePerformance[]>(() => {
    if (!predictions.length) return [];

    const MAX_POINTS = 166; // Maximum points per race

    return predictions
      .filter((p) => p.points !== null && p.points !== undefined)
      .map((p) => ({
        raceName: p.race?.name?.replace(" Grand Prix", "").replace("GP", "") || "Course",
        points: p.points || 0,
        maxPoints: MAX_POINTS,
        percentage: Math.round(((p.points || 0) / MAX_POINTS) * 100),
      }))
      .slice(0, 10);
  }, [predictions]);

  // Calculate favorite drivers (most predicted as P1)
  const favoriteDrivers = useMemo<DriverPick[]>(() => {
    if (!predictions.length || !drivers.length) return [];

    const driverCounts: Record<string, number> = {};

    predictions.forEach((pred) => {
      const predAny = pred as unknown as Record<string, unknown>;
      const positions = predAny.positions as string[] | undefined;
      // Also try to get p1 from predictions object
      const p1 = positions?.[0] || (predAny.predictions as Record<string, string>)?.p1;
      if (p1) {
        driverCounts[p1] = (driverCounts[p1] || 0) + 1;
      }
    });

    return Object.entries(driverCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([driverId, count]) => {
        const driver = drivers.find((d) => d.id === driverId);
        return {
          driverId,
          driverCode: driver?.code || driverId.slice(0, 3).toUpperCase(),
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : "Inconnu",
          count,
          color: driver?.constructor?.color || "#666",
        };
      });
  }, [predictions, drivers]);

  // Best and worst races
  const { bestRace, worstRace } = useMemo(() => {
    const scoredPredictions = predictions.filter(
      (p) => p.points !== null && p.points !== undefined
    );
    if (!scoredPredictions.length) return { bestRace: null, worstRace: null };

    const sorted = [...scoredPredictions].sort((a, b) => (b.points || 0) - (a.points || 0));
    return {
      bestRace: sorted[0],
      worstRace: sorted[sorted.length - 1],
    };
  }, [predictions]);

  // Overall accuracy
  const overallAccuracy = useMemo(() => {
    if (!accuracyStats.length) return 0;
    const totalCorrect = accuracyStats.reduce((sum, s) => sum + s.correct, 0);
    const totalAttempts = accuracyStats.reduce((sum, s) => sum + s.total, 0);
    return totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  }, [accuracyStats]);

  if (loadingPredictions || loadingDrivers) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-48" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Mes Statistiques {season}
        </CardTitle>
        <CardDescription>
          Analyse détaillée de vos performances en pronostics
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Points Totaux"
            value={stats?.totalPoints || 0}
            subtitle={`${predictions.length} courses`}
            icon={<Trophy className="h-5 w-5 text-primary" />}
            color="#e10600"
          />
          <StatCard
            title="Moyenne/Course"
            value={stats?.averagePoints?.toFixed(1) || "0"}
            subtitle="points par course"
            icon={<Target className="h-5 w-5 text-blue-500" />}
            color="#0090d0"
          />
          <StatCard
            title="Précision Globale"
            value={`${overallAccuracy}%`}
            subtitle="prédictions correctes"
            icon={<Zap className="h-5 w-5 text-yellow-500" />}
            color="#eab308"
          />
          <StatCard
            title="Meilleur Score"
            value={stats?.bestResult || 0}
            subtitle="record personnel"
            icon={<Star className="h-5 w-5 text-orange-500" />}
            color="#f97316"
          />
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="accuracy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accuracy">Précision</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="favorites">Favoris</TabsTrigger>
          </TabsList>

          <TabsContent value="accuracy" className="space-y-4 pt-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Précision par Type
            </h4>
            <div className="space-y-4">
              {accuracyStats.map((stat) => (
                <AccuracyBar key={stat.label} stat={stat} />
              ))}
            </div>

            {/* Best/Worst Race */}
            {(bestRace || worstRace) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {bestRace && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Meilleure Course</span>
                    </div>
                    <p className="font-bold">{bestRace.race?.name}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {bestRace.points} pts
                    </p>
                  </div>
                )}
                {worstRace && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-600">À Améliorer</span>
                    </div>
                    <p className="font-bold">{worstRace.race?.name}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {worstRace.points} pts
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="pt-4">
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              Points par Course
            </h4>
            <PerformanceChart data={racePerformance} />
          </TabsContent>

          <TabsContent value="favorites" className="pt-4">
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-primary" />
              Pilotes Favoris (Prédits P1)
            </h4>
            <FavoriteDriversChart data={favoriteDrivers} />

            {/* Top 5 list */}
            <div className="mt-4 space-y-2">
              {favoriteDrivers.map((driver, index) => (
                <div
                  key={driver.driverId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: driver.color }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{driver.driverCode}</p>
                      <p className="text-xs text-muted-foreground">{driver.driverName}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{driver.count}x P1</Badge>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ============================================
// Compact Version
// ============================================

export function UserStatsCompact({ className }: { className?: string }) {
  const { data: predictionsData } = usePredictions();
  const stats = predictionsData?.stats;

  if (!stats) return null;

  return (
    <div className={cn("flex items-center gap-4 p-3 rounded-lg bg-muted/50", className)}>
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <span className="font-bold">{stats.totalPoints}</span>
        <span className="text-sm text-muted-foreground">pts</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-blue-500" />
        <span className="font-bold">{stats.averagePoints.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">moy</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="font-bold">{stats.predictionsCount}</span>
        <span className="text-sm text-muted-foreground">courses</span>
      </div>
    </div>
  );
}
