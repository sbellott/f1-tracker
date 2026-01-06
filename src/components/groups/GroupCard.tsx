"use client";

import Link from "next/link";
import { Users, Lock, Globe, Crown, Shield, User } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { GroupWithDetails } from "@/lib/services/groups.service";
import type { GroupRole } from "@prisma/client";

// ============================================
// Types
// ============================================

interface GroupCardProps {
  group: GroupWithDetails;
  className?: string;
}

// ============================================
// Helpers
// ============================================

const roleConfig: Record<GroupRole, { label: string; icon: typeof Crown; variant: "default" | "secondary" | "outline" }> = {
  OWNER: { label: "Propriétaire", icon: Crown, variant: "default" },
  ADMIN: { label: "Admin", icon: Shield, variant: "secondary" },
  MEMBER: { label: "Membre", icon: User, variant: "outline" },
};

// ============================================
// Component
// ============================================

export function GroupCard({ group, className }: GroupCardProps) {
  const userRole = group.currentUserRole;
  const RoleIcon = userRole ? roleConfig[userRole].icon : null;

  return (
    <Link href={`/predictions/groups/${group.id}`}>
      <Card
        className={`
          hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer
          ${className ?? ""}
        `}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold truncate">
                {group.isPrivate ? (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{group.name}</span>
              </CardTitle>
              {group.description && (
                <CardDescription className="mt-1 line-clamp-2">
                  {group.description}
                </CardDescription>
              )}
            </div>
            {userRole && RoleIcon && (
              <Badge variant={roleConfig[userRole].variant} className="shrink-0">
                <RoleIcon className="h-3 w-3 mr-1" />
                {roleConfig[userRole].label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            {/* Member Count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {group.memberCount} / {group.maxMembers} membres
              </span>
            </div>

            {/* Owner */}
            {group.owner && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={group.owner.avatar ?? undefined} alt={group.owner.pseudo ?? ""} />
                  <AvatarFallback className="text-xs">
                    {(group.owner.pseudo ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {group.owner.pseudo}
                </span>
              </div>
            )}
          </div>

          {/* Season Badge */}
          {group.season && (
            <div className="mt-3 pt-3 border-t">
              <Badge variant="outline" className="text-xs">
                Saison {group.season}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================
// Skeleton Loader
// ============================================

export function GroupCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
          </div>
          <div className="h-5 w-20 bg-muted rounded" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}