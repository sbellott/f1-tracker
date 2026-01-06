"use client";

import { useState } from "react";
import { Trophy, Medal, Crown, Shield, User, TrendingUp, TrendingDown, Minus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { useGroupLeaderboard } from "@/hooks/queries/use-groups";
import type { GroupMemberWithUser } from "@/lib/services/groups.service";
import type { GroupRole } from "@prisma/client";
import { cn } from "@/components/ui/utils";

// ============================================
// Types
// ============================================

interface GroupLeaderboardProps {
  groupId: string;
  groupName?: string;
  currentUserId?: string;
  initialSeason?: number;
  className?: string;
}

// ============================================
// Helpers
// ============================================

const roleIcons: Record<GroupRole, typeof Crown> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const roleColors: Record<GroupRole, string> = {
  OWNER: "text-yellow-500",
  ADMIN: "text-blue-500",
  MEMBER: "text-muted-foreground",
};

function getPositionStyle(position: number) {
  switch (position) {
    case 1:
      return {
        bg: "bg-gradient-to-r from-yellow-500/20 to-yellow-500/5",
        border: "border-yellow-500/30",
        icon: <Trophy className="h-5 w-5 text-yellow-500" />,
      };
    case 2:
      return {
        bg: "bg-gradient-to-r from-slate-400/20 to-slate-400/5",
        border: "border-slate-400/30",
        icon: <Medal className="h-5 w-5 text-slate-400" />,
      };
    case 3:
      return {
        bg: "bg-gradient-to-r from-amber-700/20 to-amber-700/5",
        border: "border-amber-700/30",
        icon: <Medal className="h-5 w-5 text-amber-700" />,
      };
    default:
      return {
        bg: "",
        border: "border-transparent",
        icon: null,
      };
  }
}

function getAvailableSeasons(): number[] {
  const currentYear = new Date().getFullYear();
  const seasons: number[] = [];
  for (let year = currentYear; year >= 2024; year--) {
    seasons.push(year);
  }
  return seasons;
}

// ============================================
// Component
// ============================================

export function GroupLeaderboard({
  groupId,
  groupName,
  currentUserId,
  initialSeason,
  className,
}: GroupLeaderboardProps) {
  const currentYear = new Date().getFullYear();
  const [selectedSeason, setSelectedSeason] = useState<number>(initialSeason ?? currentYear);

  const { data: leaderboard, isLoading, error } = useGroupLeaderboard(groupId, selectedSeason);

  const availableSeasons = getAvailableSeasons();

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          Erreur lors du chargement du classement
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Classement
            </CardTitle>
            {groupName && (
              <CardDescription className="mt-1">{groupName}</CardDescription>
            )}
          </div>
          <Select
            value={selectedSeason.toString()}
            onValueChange={(value) => setSelectedSeason(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Saison" />
            </SelectTrigger>
            <SelectContent>
              {availableSeasons.map((season) => (
                <SelectItem key={season} value={season.toString()}>
                  Saison {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : !leaderboard?.members.length ? (
          <div className="py-8 text-center text-muted-foreground">
            Aucun membre dans le classement
          </div>
        ) : (
          leaderboard.members.map((member, index) => (
            <LeaderboardRow
              key={member.id}
              member={member}
              position={index + 1}
              isCurrentUser={member.user.id === currentUserId}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Leaderboard Row
// ============================================

interface LeaderboardRowProps {
  member: GroupMemberWithUser;
  position: number;
  isCurrentUser?: boolean;
}

function LeaderboardRow({ member, position, isCurrentUser }: LeaderboardRowProps) {
  const positionStyle = getPositionStyle(position);
  const RoleIcon = roleIcons[member.role];

  // Calculate position change (mock for now - would need previous rank data)
  const positionChange = 0; // TODO: Add position tracking

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
        positionStyle.bg,
        positionStyle.border,
        isCurrentUser && "ring-2 ring-primary/50"
      )}
    >
      {/* Position */}
      <div className="flex items-center justify-center w-8 h-8 shrink-0">
        {positionStyle.icon || (
          <span className="text-lg font-bold text-muted-foreground">
            {position}
          </span>
        )}
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage
            src={member.user.avatar ?? undefined}
            alt={member.user.pseudo ?? ""}
          />
          <AvatarFallback>
            {(member.user.pseudo ?? member.user.email ?? "?")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate",
              isCurrentUser && "text-primary"
            )}>
              {member.user.pseudo ?? member.user.email?.split("@")[0]}
            </span>
            <RoleIcon className={cn("h-3.5 w-3.5 shrink-0", roleColors[member.role])} />
            {isCurrentUser && (
              <Badge variant="outline" className="text-xs shrink-0">
                Vous
              </Badge>
            )}
          </div>

          {/* Position Change Indicator */}
          {positionChange !== 0 && (
            <div className="flex items-center gap-1 text-xs">
              {positionChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">+{positionChange}</span>
                </>
              ) : positionChange < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">{positionChange}</span>
                </>
              ) : (
                <>
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">-</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <span className="text-lg font-bold">{member.totalPoints}</span>
        <span className="text-sm text-muted-foreground ml-1">pts</span>
      </div>
    </div>
  );
}

// ============================================
// Skeleton Loader
// ============================================

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// Compact Version
// ============================================

interface GroupLeaderboardCompactProps {
  groupId: string;
  currentUserId?: string;
  limit?: number;
  className?: string;
}

export function GroupLeaderboardCompact({
  groupId,
  currentUserId,
  limit = 5,
  className,
}: GroupLeaderboardCompactProps) {
  const currentYear = new Date().getFullYear();
  const { data: leaderboard, isLoading } = useGroupLeaderboard(groupId, currentYear);

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: limit }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!leaderboard?.members.length) {
    return (
      <div className={cn("text-center text-muted-foreground py-4", className)}>
        Aucun classement disponible
      </div>
    );
  }

  const displayedMembers = leaderboard.members.slice(0, limit);

  return (
    <div className={cn("space-y-1", className)}>
      {displayedMembers.map((member, index) => (
        <div
          key={member.id}
          className={cn(
            "flex items-center gap-2 py-2 px-2 rounded",
            member.user.id === currentUserId && "bg-primary/10"
          )}
        >
          <span className="w-5 text-sm font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Avatar className="h-6 w-6">
            <AvatarImage src={member.user.avatar ?? undefined} />
            <AvatarFallback className="text-xs">
              {(member.user.pseudo ?? "?").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 text-sm truncate">
            {member.user.pseudo ?? member.user.email?.split("@")[0]}
          </span>
          <span className="text-sm font-medium">{member.totalPoints}</span>
        </div>
      ))}
    </div>
  );
}
