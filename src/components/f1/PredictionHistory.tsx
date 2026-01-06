"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  History,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Calendar,
  Filter,
  ChevronDown,
  ChevronRight,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Flag,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { PageTransition, SlideUp, StaggerChildren, StaggerItem } from "./Animations";
import { NoPredictionsEmpty, NoHistoryEmpty } from "./EmptyStates";

import { usePredictions } from "@/hooks/queries/use-predictions";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface PredictionResult {
  id: string;
  raceId: string;
  raceName: string;
  raceRound: number;
  circuitName: string;
  sessionType: "RACE" | "QUALIFYING" | "SPRINT";
  date: string;
  predictions: {
    p1?: string;
    p2?: string;
    p3?: string;
    pole?: string;
    fastestLap?: string;
    [key: string]: string | undefined;
  };
  results?: {
    p1?: string;
    p2?: string;
    p3?: string;
    pole?: string;
    fastestLap?: string;
    [key: string]: string | undefined;
  };
  pointsBreakdown?: {
    p1: number;
    p2: number;
    p3: number;
    pole: number;
    fastestLap: number;
    bonus: number;
  };
  totalPoints: number;
  status: "pending" | "scored" | "locked";
}

interface PredictionHistoryProps {
  season?: number;
  className?: string;
}

// ============================================
// Chart Configs
// ============================================

const pointsChartConfig: ChartConfig = {
  points: {
    label: "Points",
    color: "hsl(var(--chart-1))",
  },
  cumulative: {
    label: "Cumul",
    color: "hsl(var(--chart-2))",
  },
};

const accuracyChartConfig: ChartConfig = {
  accuracy: {
    label: "Précision",
    color: "hsl(var(--chart-3))",
  },
  average: {
    label: "Moyenne",
    color: "hsl(var(--chart-4))",
  },
};

// ============================================
// Helper Functions
// ============================================

function getAccuracyForPrediction(prediction: PredictionResult): number {
  if (!prediction.results || prediction.status !== "scored") return 0;

  let correct = 0;
  let total = 0;

  const keysToCheck = ["p1", "p2", "p3", "pole", "fastestLap"];
  keysToCheck.forEach((key) => {
    if (prediction.predictions[key]) {
      total++;
      if (prediction.predictions[key] === prediction.results?.[key]) {
        correct++;
      }
    }
  });

  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function getSessionIcon(type: string) {
  switch (type) {
    case "RACE":
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case "QUALIFYING":
      return <Clock className="w-4 h-4 text-blue-500" />;
    case "SPRINT":
      return <Zap className="w-4 h-4 text-purple-500" />;
    default:
      return <Flag className="w-4 h-4" />;
  }
}

function getSessionLabel(type: string) {
  switch (type) {
    case "RACE":
      return "Course";
    case "QUALIFYING":
      return "Qualif";
    case "SPRINT":
      return "Sprint";
    default:
      return type;
  }
}

// ============================================
// Sub-Components
// ============================================

function PointsEvolutionChart({ predictions }: { predictions: PredictionResult[] }) {
  const chartData = useMemo(() => {
    const sorted = [...predictions]
      .filter((p) => p.status === "scored")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let cumulative = 0;
    return sorted.map((pred) => {
      cumulative += pred.totalPoints;
      return {
        race: pred.raceName.replace("Grand Prix", "GP"),
        round: pred.raceRound,
        points: pred.totalPoints,
        cumulative,
      };
    });
  }, [predictions]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Pas encore de données</p>
      </div>
    );
  }

  return (
    <ChartContainer config={pointsChartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="race"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="points"
            stroke="hsl(var(--chart-1))"
            fill="url(#pointsGradient)"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulative"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function AccuracyChart({ predictions }: { predictions: PredictionResult[] }) {
  const chartData = useMemo(() => {
    const sorted = [...predictions]
      .filter((p) => p.status === "scored")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalAccuracy = sorted.reduce((sum, p) => sum + getAccuracyForPrediction(p), 0);
    const average = sorted.length > 0 ? Math.round(totalAccuracy / sorted.length) : 0;

    return sorted.map((pred) => ({
      race: pred.raceName.replace("Grand Prix", "GP"),
      round: pred.raceRound,
      accuracy: getAccuracyForPrediction(pred),
      average,
    }));
  }, [predictions]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Pas encore de données</p>
      </div>
    );
  }

  return (
    <ChartContainer config={accuracyChartConfig} className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
          <XAxis
            dataKey="race"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => [`${value}%`, "Précision"]}
              />
            }
          />
          <ReferenceLine
            y={chartData[0]?.average || 0}
            stroke="hsl(var(--chart-4))"
            strokeDasharray="5 5"
            label={{
              value: `Moy: ${chartData[0]?.average || 0}%`,
              position: "right",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Bar
            dataKey="accuracy"
            fill="hsl(var(--chart-3))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function PredictionCard({
  prediction,
  expanded,
  onToggle,
}: {
  prediction: PredictionResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accuracy = getAccuracyForPrediction(prediction);
  const isScored = prediction.status === "scored";
  const isPending = prediction.status === "pending";

  const getPredictionStatus = (key: string): "correct" | "incorrect" | "pending" => {
    if (!isScored || !prediction.results) return "pending";
    if (prediction.predictions[key] === prediction.results[key]) return "correct";
    return "incorrect";
  };

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <div
        className={cn(
          "rounded-xl border transition-colors",
          expanded ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card hover:border-primary/30"
        )}
      >
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center font-bold text-sm">
                R{prediction.raceRound}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{prediction.raceName}</p>
                  <Badge variant="outline" className="text-xs">
                    {getSessionIcon(prediction.sessionType)}
                    <span className="ml-1">{getSessionLabel(prediction.sessionType)}</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{prediction.circuitName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isScored && (
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{prediction.totalPoints}</span>
                    <span className="text-sm text-muted-foreground">pts</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="w-3 h-3" />
                    {accuracy}%
                  </div>
                </div>
              )}
              {isPending && (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  En attente
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="shrink-0">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            <div className="h-px bg-border mb-4" />

            {/* Predictions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {["p1", "p2", "p3", "pole", "fastestLap"].map((key) => {
                const status = getPredictionStatus(key);
                const predicted = prediction.predictions[key];
                const actual = prediction.results?.[key];

                if (!predicted) return null;

                return (
                  <div
                    key={key}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      status === "correct" && "bg-green-500/10 border-green-500/30",
                      status === "incorrect" && "bg-red-500/10 border-red-500/30",
                      status === "pending" && "bg-muted border-border"
                    )}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-xs uppercase text-muted-foreground">
                        {key === "p1" && "P1"}
                        {key === "p2" && "P2"}
                        {key === "p3" && "P3"}
                        {key === "pole" && "Pole"}
                        {key === "fastestLap" && "FL"}
                      </span>
                      {status === "correct" && (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      )}
                      {status === "incorrect" && (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{predicted}</p>
                    {status === "incorrect" && actual && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Résultat: {actual}
                      </p>
                    )}
                    {prediction.pointsBreakdown && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-2 text-xs",
                          prediction.pointsBreakdown[key as keyof typeof prediction.pointsBreakdown] > 0
                            ? "text-green-600"
                            : "text-muted-foreground"
                        )}
                      >
                        +{prediction.pointsBreakdown[key as keyof typeof prediction.pointsBreakdown] || 0}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Points Breakdown */}
            {prediction.pointsBreakdown && prediction.pointsBreakdown.bonus > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-sm">Bonus Podium Parfait</span>
                  <Badge className="bg-yellow-500/20 text-yellow-600 ml-auto">
                    +{prediction.pointsBreakdown.bonus} pts
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// ============================================
// Main Component
// ============================================

export function PredictionHistory({
  season = 2026,
  className,
}: PredictionHistoryProps) {
  const [filter, setFilter] = useState<"all" | "RACE" | "QUALIFYING" | "SPRINT">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: predictions = [], isLoading } = usePredictions(season);

  // Cast to our internal type (since API might return different structure)
  const typedPredictions = predictions as unknown as PredictionResult[];

  const filteredPredictions = useMemo(() => {
    const filtered =
      filter === "all"
        ? typedPredictions
        : typedPredictions.filter((p) => p.sessionType === filter);

    // Sort by date descending
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [typedPredictions, filter]);

  // Stats
  const stats = useMemo(() => {
    const scored = typedPredictions.filter((p) => p.status === "scored");
    const totalPoints = scored.reduce((sum, p) => sum + p.totalPoints, 0);
    const avgPoints = scored.length > 0 ? Math.round(totalPoints / scored.length) : 0;
    const bestResult = scored.length > 0 ? Math.max(...scored.map((p) => p.totalPoints)) : 0;
    const perfectPodiums = scored.filter(
      (p) => p.pointsBreakdown && p.pointsBreakdown.bonus > 0
    ).length;

    return { totalPoints, avgPoints, bestResult, perfectPodiums, count: scored.length };
  }, [typedPredictions]);

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="h-[400px] animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  if (typedPredictions.length === 0) {
    return (
      <div className={className}>
        <NoHistoryEmpty />
      </div>
    );
  }

  return (
    <PageTransition className={cn("space-y-6", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints}</p>
                <p className="text-xs text-muted-foreground">Points total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgPoints}</p>
                <p className="text-xs text-muted-foreground">Moyenne/course</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.bestResult}</p>
                <p className="text-xs text-muted-foreground">Meilleur score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.perfectPodiums}</p>
                <p className="text-xs text-muted-foreground">Podiums parfaits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolution" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Évolution
          </TabsTrigger>
          <TabsTrigger value="accuracy" className="gap-2">
            <Target className="w-4 h-4" />
            Précision
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Évolution des points</CardTitle>
              <CardDescription>
                Points par course et cumul total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PointsEvolutionChart predictions={typedPredictions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Taux de précision</CardTitle>
              <CardDescription>
                Pourcentage de prédictions correctes par course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccuracyChart predictions={typedPredictions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* History List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Historique
              </CardTitle>
              <CardDescription>
                {filteredPredictions.length} pronostics
              </CardDescription>
            </div>
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as typeof filter)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="RACE">Courses</SelectItem>
                <SelectItem value="QUALIFYING">Qualifs</SelectItem>
                <SelectItem value="SPRINT">Sprints</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredPredictions.map((prediction) => (
              <SlideUp key={prediction.id}>
                <PredictionCard
                  prediction={prediction}
                  expanded={expandedId === prediction.id}
                  onToggle={() =>
                    setExpandedId(expandedId === prediction.id ? null : prediction.id)
                  }
                />
              </SlideUp>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

// ============================================
// Compact Version
// ============================================

interface PredictionHistoryCompactProps {
  predictions: PredictionResult[];
  maxItems?: number;
  className?: string;
}

export function PredictionHistoryCompact({
  predictions,
  maxItems = 5,
  className,
}: PredictionHistoryCompactProps) {
  const recentPredictions = useMemo(() => {
    return [...predictions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxItems);
  }, [predictions, maxItems]);

  if (recentPredictions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {recentPredictions.map((pred) => (
        <div
          key={pred.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
              R{pred.raceRound}
            </div>
            <div>
              <p className="font-medium text-sm">{pred.raceName}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getSessionIcon(pred.sessionType)}
                {getSessionLabel(pred.sessionType)}
              </div>
            </div>
          </div>
          <Badge
            variant={pred.totalPoints > 0 ? "default" : "secondary"}
            className={pred.totalPoints > 0 ? "bg-green-500/80" : ""}
          >
            {pred.totalPoints > 0 ? `+${pred.totalPoints}` : "0"} pts
          </Badge>
        </div>
      ))}
    </div>
  );
}
