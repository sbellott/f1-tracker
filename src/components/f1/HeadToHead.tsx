"use client";

import { useState, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Users, Trophy, Flag, Timer, Medal, Car, ArrowRight, ArrowLeftRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useDrivers } from "@/hooks/queries/use-drivers";
import type { DriverListItem } from "@/lib/services/drivers.service";

// ============================================
// Types
// ============================================

interface DriverWithStats extends DriverListItem {
  stats?: {
    gp: number;
    wins: number;
    podiums: number;
    poles: number;
    fastestLaps: number;
    points: number;
    titles: number;
  };
}

interface ComparisonStat {
  label: string;
  key: keyof NonNullable<DriverWithStats["stats"]>;
  icon: React.ReactNode;
  format?: (value: number) => string;
}

// ============================================
// Constants
// ============================================

const COMPARISON_STATS: ComparisonStat[] = [
  { label: "GP", key: "gp", icon: <Car className="h-4 w-4" /> },
  { label: "Victoires", key: "wins", icon: <Trophy className="h-4 w-4" /> },
  { label: "Podiums", key: "podiums", icon: <Medal className="h-4 w-4" /> },
  { label: "Poles", key: "poles", icon: <Flag className="h-4 w-4" /> },
  { label: "Tours Rapides", key: "fastestLaps", icon: <Timer className="h-4 w-4" /> },
  { label: "Points", key: "points", icon: <Trophy className="h-4 w-4" />, format: (v) => v.toLocaleString() },
  { label: "Titres", key: "titles", icon: <Trophy className="h-4 w-4 text-yellow-500" /> },
];

const RADAR_METRICS = ["wins", "podiums", "poles", "fastestLaps", "titles"] as const;

// ============================================
// Helper Functions
// ============================================

function normalizeStats(driver1: DriverWithStats, driver2: DriverWithStats) {
  const stats1 = driver1.stats || { gp: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, points: 0, titles: 0 };
  const stats2 = driver2.stats || { gp: 0, wins: 0, podiums: 0, poles: 0, fastestLaps: 0, points: 0, titles: 0 };

  return RADAR_METRICS.map((metric) => {
    const value1 = stats1[metric] || 0;
    const value2 = stats2[metric] || 0;
    const max = Math.max(value1, value2, 1);

    return {
      metric: getMetricLabel(metric),
      [driver1.code]: Math.round((value1 / max) * 100),
      [driver2.code]: Math.round((value2 / max) * 100),
      raw1: value1,
      raw2: value2,
    };
  });
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    wins: "Victoires",
    podiums: "Podiums",
    poles: "Poles",
    fastestLaps: "Tours Rapides",
    titles: "Titres",
  };
  return labels[metric] || metric;
}

function getDriverInitials(driver: DriverListItem): string {
  return `${driver.firstName[0]}${driver.lastName[0]}`;
}

// ============================================
// Components
// ============================================

interface DriverSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
  drivers: DriverListItem[];
  excludeId?: string | null;
  placeholder: string;
  label: string;
  color?: string;
}

function DriverSelector({
  value,
  onChange,
  drivers,
  excludeId,
  placeholder,
  label,
  color,
}: DriverSelectorProps) {
  const filteredDrivers = drivers.filter((d) => d.id !== excludeId);
  const selectedDriver = drivers.find((d) => d.id === value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger
          className="w-full h-14"
          style={{
            borderColor: color || undefined,
            borderWidth: color ? 2 : undefined,
          }}
        >
          <SelectValue placeholder={placeholder}>
            {selectedDriver && (
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedDriver.photoUrl || undefined} />
                  <AvatarFallback
                    className="text-xs font-bold"
                    style={{ backgroundColor: selectedDriver.constructor?.color || "#333" }}
                  >
                    {getDriverInitials(selectedDriver)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{selectedDriver.code}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedDriver.constructor?.name}
                  </span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {filteredDrivers.map((driver) => (
            <SelectItem key={driver.id} value={driver.id}>
              <div className="flex items-center gap-3">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={driver.photoUrl || undefined} />
                  <AvatarFallback
                    className="text-xs"
                    style={{ backgroundColor: driver.constructor?.color || "#333" }}
                  >
                    {getDriverInitials(driver)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{driver.code}</span>
                <span className="text-muted-foreground text-sm">
                  {driver.firstName} {driver.lastName}
                </span>
                {driver.constructor && (
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs"
                    style={{
                      borderColor: driver.constructor.color || undefined,
                      color: driver.constructor.color || undefined,
                    }}
                  >
                    {driver.constructor.name}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface StatComparisonRowProps {
  stat: ComparisonStat;
  value1: number;
  value2: number;
  color1: string;
  color2: string;
}

function StatComparisonRow({ stat, value1, value2, color1, color2 }: StatComparisonRowProps) {
  const total = value1 + value2;
  const percent1 = total > 0 ? (value1 / total) * 100 : 50;
  const winner = value1 > value2 ? 1 : value2 > value1 ? 2 : 0;
  const format = stat.format || ((v: number) => v.toString());

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            "font-semibold tabular-nums transition-all",
            winner === 1 && "scale-110"
          )}
          style={{ color: winner === 1 ? color1 : undefined }}
        >
          {format(value1)}
        </span>
        <div className="flex items-center gap-2 text-muted-foreground">
          {stat.icon}
          <span className="font-medium">{stat.label}</span>
        </div>
        <span
          className={cn(
            "font-semibold tabular-nums transition-all",
            winner === 2 && "scale-110"
          )}
          style={{ color: winner === 2 ? color2 : undefined }}
        >
          {format(value2)}
        </span>
      </div>
      <div className="flex h-2 gap-0.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full transition-all duration-500 rounded-l-full"
          style={{
            width: `${percent1}%`,
            backgroundColor: color1,
          }}
        />
        <div
          className="h-full transition-all duration-500 rounded-r-full"
          style={{
            width: `${100 - percent1}%`,
            backgroundColor: color2,
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

interface HeadToHeadProps {
  className?: string;
  initialDriver1?: string;
  initialDriver2?: string;
}

export function HeadToHead({ className, initialDriver1, initialDriver2 }: HeadToHeadProps) {
  const [driver1Id, setDriver1Id] = useState<string | null>(initialDriver1 || null);
  const [driver2Id, setDriver2Id] = useState<string | null>(initialDriver2 || null);

  const { data: driversData, isLoading } = useDrivers();

  const drivers = driversData?.drivers || [];

  const driver1 = useMemo(
    () => drivers.find((d) => d.id === driver1Id) as DriverWithStats | undefined,
    [drivers, driver1Id]
  );

  const driver2 = useMemo(
    () => drivers.find((d) => d.id === driver2Id) as DriverWithStats | undefined,
    [drivers, driver2Id]
  );

  const color1 = driver1?.constructor?.color || "#e10600";
  const color2 = driver2?.constructor?.color || "#0090d0";

  const radarData = useMemo(() => {
    if (!driver1 || !driver2) return [];
    return normalizeStats(driver1, driver2);
  }, [driver1, driver2]);

  const swapDrivers = () => {
    setDriver1Id(driver2Id);
    setDriver2Id(driver1Id);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Head-to-Head
        </CardTitle>
        <CardDescription>
          Comparez les statistiques de carrière de deux pilotes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Driver Selection */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <DriverSelector
            value={driver1Id}
            onChange={setDriver1Id}
            drivers={drivers}
            excludeId={driver2Id}
            placeholder="Sélectionner un pilote"
            label="Pilote 1"
            color={color1}
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={swapDrivers}
            disabled={!driver1Id || !driver2Id}
            className="hidden md:flex self-end mb-1"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>

          <DriverSelector
            value={driver2Id}
            onChange={setDriver2Id}
            drivers={drivers}
            excludeId={driver1Id}
            placeholder="Sélectionner un pilote"
            label="Pilote 2"
            color={color2}
          />
        </div>

        {/* Mobile swap button */}
        <Button
          variant="outline"
          onClick={swapDrivers}
          disabled={!driver1Id || !driver2Id}
          className="w-full md:hidden"
        >
          <ArrowLeftRight className="h-4 w-4 mr-2" />
          Inverser
        </Button>

        {/* Comparison Content */}
        {driver1 && driver2 ? (
          <>
            {/* Driver Headers */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: `${color1}15` }}
              >
                <Avatar className="h-12 w-12 border-2" style={{ borderColor: color1 }}>
                  <AvatarImage src={driver1.photoUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: color1 }}>
                    {getDriverInitials(driver1)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{driver1.firstName} {driver1.lastName}</p>
                  <p className="text-sm text-muted-foreground">{driver1.constructor?.name}</p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg justify-end"
                style={{ backgroundColor: `${color2}15` }}
              >
                <div className="text-right">
                  <p className="font-bold">{driver2.firstName} {driver2.lastName}</p>
                  <p className="text-sm text-muted-foreground">{driver2.constructor?.name}</p>
                </div>
                <Avatar className="h-12 w-12 border-2" style={{ borderColor: color2 }}>
                  <AvatarImage src={driver2.photoUrl || undefined} />
                  <AvatarFallback style={{ backgroundColor: color2 }}>
                    {getDriverInitials(driver2)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <Radar
                    name={driver1.code}
                    dataKey={driver1.code}
                    stroke={color1}
                    fill={color1}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name={driver2.code}
                    dataKey={driver2.code}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload?.length) return null;
                      const data = radarData.find((d) => d.metric === label);
                      if (!data) return null;

                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{label}</p>
                          <div className="space-y-1 text-sm">
                            <p style={{ color: color1 }}>
                              {driver1.code}: {data.raw1}
                            </p>
                            <p style={{ color: color2 }}>
                              {driver2.code}: {data.raw2}
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 20 }}
                    formatter={(value) => (
                      <span className="text-sm font-medium">{value}</span>
                    )}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Stat Bars */}
            <div className="space-y-4">
              {COMPARISON_STATS.map((stat) => (
                <StatComparisonRow
                  key={stat.key}
                  stat={stat}
                  value1={driver1.stats?.[stat.key] || 0}
                  value2={driver2.stats?.[stat.key] || 0}
                  color1={color1}
                  color2={color2}
                />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">Sélectionnez deux pilotes</p>
            <p className="text-sm">
              Choisissez deux pilotes ci-dessus pour comparer leurs statistiques
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Compact Version for Inline Use
// ============================================

interface HeadToHeadCompactProps {
  driver1Id: string;
  driver2Id: string;
  className?: string;
}

export function HeadToHeadCompact({ driver1Id, driver2Id, className }: HeadToHeadCompactProps) {
  const { data: driversData } = useDrivers();
  const drivers = driversData?.drivers || [];

  const driver1 = drivers.find((d) => d.id === driver1Id) as DriverWithStats | undefined;
  const driver2 = drivers.find((d) => d.id === driver2Id) as DriverWithStats | undefined;

  if (!driver1 || !driver2) return null;

  const color1 = driver1.constructor?.color || "#e10600";
  const color2 = driver2.constructor?.color || "#0090d0";

  // Quick comparison of key stats
  const stats = [
    { label: "Victoires", v1: driver1.stats?.wins || 0, v2: driver2.stats?.wins || 0 },
    { label: "Podiums", v1: driver1.stats?.podiums || 0, v2: driver2.stats?.podiums || 0 },
    { label: "Poles", v1: driver1.stats?.poles || 0, v2: driver2.stats?.poles || 0 },
  ];

  return (
    <div className={cn("flex items-center gap-4 p-3 rounded-lg bg-muted/50", className)}>
      {/* Driver 1 */}
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={driver1.photoUrl || undefined} />
          <AvatarFallback style={{ backgroundColor: color1 }}>
            {driver1.code?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <span className="font-bold">{driver1.code}</span>
      </div>

      {/* Stats */}
      <div className="flex-1 flex items-center justify-center gap-4">
        {stats.map((stat) => {
          const winner = stat.v1 > stat.v2 ? 1 : stat.v2 > stat.v1 ? 2 : 0;
          return (
            <div key={stat.label} className="text-center">
              <div className="flex items-center gap-1 text-sm">
                <span
                  className={cn("font-bold", winner === 1 && "text-green-600")}
                  style={{ color: winner === 1 ? color1 : undefined }}
                >
                  {stat.v1}
                </span>
                <span className="text-muted-foreground">-</span>
                <span
                  className={cn("font-bold", winner === 2 && "text-green-600")}
                  style={{ color: winner === 2 ? color2 : undefined }}
                >
                  {stat.v2}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Driver 2 */}
      <div className="flex items-center gap-2">
        <span className="font-bold">{driver2.code}</span>
        <Avatar className="h-8 w-8">
          <AvatarImage src={driver2.photoUrl || undefined} />
          <AvatarFallback style={{ backgroundColor: color2 }}>
            {driver2.code?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
