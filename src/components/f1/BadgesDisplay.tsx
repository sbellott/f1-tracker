"use client";

import { Lock, Trophy, Loader2 } from 'lucide-react';
import { 
  useBadges, 
  getBadgeRarity, 
  getBadgeIcon,
  BADGE_RARITY_CONFIG,
  type Badge,
  type BadgeRarity 
} from '@/lib/hooks/useBadges';
import { cn } from '@/lib/utils';

interface BadgesDisplayProps {
  showProgress?: boolean;
  compact?: boolean;
  maxDisplay?: number;
}

export function BadgesDisplay({ showProgress = false, compact = false, maxDisplay }: BadgesDisplayProps) {
  const { data, isLoading, error } = useBadges();

  if (isLoading) {
    return <BadgesDisplaySkeleton compact={compact} />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Impossible de charger les badges</p>
      </div>
    );
  }

  const badges = maxDisplay ? data.badges.slice(0, maxDisplay) : data.badges;
  const stats = data.stats;

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      {stats && !compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-white">
              {stats.unlocked}/{stats.total}
            </span>
            <span className="text-gray-400">badges débloqués</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 bg-carbon-medium rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-racing-red to-cyan-bright transition-all duration-500"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-400">{stats.progress.toFixed(0)}%</span>
          </div>
        </div>
      )}

      {/* Badge Grid */}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4"
      )}>
        {badges.map((badge) => (
          <BadgeCardEnhanced 
            key={badge.id} 
            badge={badge} 
            compact={compact}
            showProgress={showProgress}
          />
        ))}
      </div>

      {/* Rarity Legend */}
      {!compact && (
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-800">
          {(Object.keys(BADGE_RARITY_CONFIG) as BadgeRarity[]).map((rarity) => (
            <div key={rarity} className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                BADGE_RARITY_CONFIG[rarity].bgColor.replace('/10', '/50')
              )} />
              <span className={cn("text-xs", BADGE_RARITY_CONFIG[rarity].color)}>
                {BADGE_RARITY_CONFIG[rarity].label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface BadgeCardEnhancedProps {
  badge: Badge;
  compact?: boolean;
  showProgress?: boolean;
}

function BadgeCardEnhanced({ badge, compact = false, showProgress = false }: BadgeCardEnhancedProps) {
  const rarity = getBadgeRarity(badge.code);
  const rarityConfig = BADGE_RARITY_CONFIG[rarity];
  const icon = getBadgeIcon(badge.icon);

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 transition-all duration-300",
        compact ? "p-3" : "p-6",
        badge.unlocked 
          ? cn(
              "bg-gradient-to-br from-racing-red/20 to-cyan-bright/20 hover:scale-105 shadow-glow",
              rarityConfig.borderColor.replace('/20', '')
            )
          : "bg-carbon-light border-gray-700 opacity-60 hover:opacity-80"
      )}
    >
      {/* Rarity indicator */}
      {badge.unlocked && (
        <div className={cn(
          "absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium",
          rarityConfig.bgColor,
          rarityConfig.color
        )}>
          {rarityConfig.label}
        </div>
      )}

      {/* Lock Icon for locked badges */}
      {!badge.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-gray-500" />
        </div>
      )}

      {/* Badge Icon */}
      <div className={cn("text-center", compact ? "mb-1" : "mb-3")}>
        <span className={cn(
          compact ? "text-3xl" : "text-5xl",
          !badge.unlocked && "grayscale opacity-50"
        )}>
          {icon}
        </span>
      </div>

      {/* Badge Info */}
      <div className="text-center">
        <h3 className={cn(
          "font-medium",
          compact ? "text-xs" : "text-sm mb-1",
          badge.unlocked ? "text-white" : "text-gray-400"
        )}>
          {badge.name}
        </h3>
        {!compact && (
          <p className="text-xs text-gray-500">
            {badge.description}
          </p>
        )}
      </div>

      {/* Unlocked date */}
      {badge.unlocked && badge.unlockedAt && !compact && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-racing-red/20 rounded-full text-[10px] text-racing-red border border-racing-red/30">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {new Date(badge.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}

      {/* Glow effect for unlocked badges */}
      {badge.unlocked && (
        <div className={cn(
          "absolute inset-0 rounded-xl blur-xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity",
          rarityConfig.bgColor.replace('/10', '/30')
        )} />
      )}
    </div>
  );
}

// Legacy BadgeCard component for backward compatibility
interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  unlocked: boolean;
  progress?: {
    current: number;
    target: number;
  };
}

export function BadgeCard({ badge, unlocked, progress }: BadgeCardProps) {
  const progressPercent = progress 
    ? Math.min((progress.current / progress.target) * 100, 100) 
    : 0;

  return (
    <div
      className={cn(
        "group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105",
        unlocked 
          ? "bg-gradient-to-br from-racing-red/20 to-cyan-bright/20 border-racing-red shadow-glow" 
          : "bg-carbon-light border-gray-700"
      )}
    >
      {/* Background Glow */}
      {unlocked && (
        <div className="absolute inset-0 bg-gradient-to-br from-racing-red/20 to-cyan-bright/20 rounded-xl blur-2xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Lock Icon for locked badges */}
      {!unlocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-gray-500" />
        </div>
      )}

      {/* Badge Icon */}
      <div className="text-center mb-4">
        <span className={cn("text-6xl", !unlocked && "grayscale")}>
          {badge.icon}
        </span>
      </div>

      {/* Badge Info */}
      <div className="text-center mb-4">
        <h3 className={cn("mb-2", unlocked ? "text-white" : "text-gray-400")}>
          {badge.name}
        </h3>
        <p className="text-sm text-gray-500">
          {badge.description}
        </p>
      </div>

      {/* Progress Bar */}
      {!unlocked && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progression</span>
            <span>{progress.current} / {progress.target}</span>
          </div>
          <div className="h-2 bg-carbon-medium rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-racing-red to-cyan-bright transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Unlocked indicator */}
      {unlocked && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-racing-red/20 rounded-full text-xs text-racing-red border border-racing-red">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Débloqué
          </span>
        </div>
      )}
    </div>
  );
}

function BadgesDisplaySkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-8 w-16 bg-carbon-medium rounded animate-pulse" />
            <div className="h-4 w-32 bg-carbon-medium rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-32 bg-carbon-medium rounded-full animate-pulse" />
            <div className="h-4 w-8 bg-carbon-medium rounded animate-pulse" />
          </div>
        </div>
      )}
      <div className={cn(
        "grid gap-4",
        compact ? "grid-cols-3 md:grid-cols-6" : "grid-cols-2 md:grid-cols-4"
      )}>
        {Array.from({ length: compact ? 6 : 8 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl border-2 border-gray-700 bg-carbon-light animate-pulse",
              compact ? "p-3 h-24" : "p-6 h-44"
            )}
          >
            <div className={cn("mx-auto rounded-full bg-carbon-medium", compact ? "w-8 h-8" : "w-12 h-12")} />
            <div className={cn("mx-auto mt-2 rounded bg-carbon-medium", compact ? "h-3 w-16" : "h-4 w-20")} />
            {!compact && <div className="mx-auto mt-2 h-3 w-28 rounded bg-carbon-medium" />}
          </div>
        ))}
      </div>
    </div>
  );
}