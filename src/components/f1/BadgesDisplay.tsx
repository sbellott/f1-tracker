import { Badge } from '@/types';
import { mockBadges } from '@/data/mockData';
import { Lock } from 'lucide-react';

interface BadgesDisplayProps {
  unlockedBadgeIds?: string[];
  showProgress?: boolean;
}

export function BadgesDisplay({ unlockedBadgeIds = [], showProgress = false }: BadgesDisplayProps) {
  const isUnlocked = (badgeId: string) => unlockedBadgeIds.includes(badgeId);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {mockBadges.map((badge) => {
        const unlocked = isUnlocked(badge.id);

        return (
          <div
            key={badge.id}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-300
              ${unlocked 
                ? 'bg-gradient-to-br from-racing-red/20 to-cyan-bright/20 border-racing-red hover:scale-105 shadow-glow' 
                : 'bg-carbon-light border-gray-700 opacity-50 hover:opacity-75'
              }
            `}
          >
            {/* Badge Icon */}
            <div className="text-center mb-3">
              <span className="text-5xl">{badge.icon}</span>
              {!unlocked && (
                <div className="absolute top-4 right-4">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>

            {/* Badge Info */}
            <div className="text-center">
              <h3 className={`text-sm mb-1 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                {badge.name}
              </h3>
              <p className="text-xs text-gray-500">
                {badge.description}
              </p>
            </div>

            {/* Glow effect for unlocked badges */}
            {unlocked && (
              <div className="absolute inset-0 bg-gradient-to-br from-racing-red/10 to-cyan-bright/10 rounded-xl blur-xl -z-10" />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface BadgeCardProps {
  badge: Badge;
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
      className={`
        group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105
        ${unlocked 
          ? 'bg-gradient-to-br from-racing-red/20 to-cyan-bright/20 border-racing-red shadow-glow' 
          : 'bg-carbon-light border-gray-700'
        }
      `}
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
        <span className={`text-6xl ${!unlocked && 'grayscale'}`}>
          {badge.icon}
        </span>
      </div>

      {/* Badge Info */}
      <div className="text-center mb-4">
        <h3 className={`mb-2 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
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
