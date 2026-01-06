"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Users,
  Calendar,
  Flag,
  Target,
  Clock,
  Search,
  Bell,
  Star,
  Zap,
  Car,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================
// Types
// ============================================

type EmptyStateType =
  | "no-predictions"
  | "no-groups"
  | "no-races"
  | "no-results"
  | "no-history"
  | "no-notifications"
  | "no-members"
  | "no-search"
  | "race-finished"
  | "coming-soon"
  | "locked"
  | "error";

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

// ============================================
// Configuration
// ============================================

const EMPTY_STATE_CONFIG: Record<
  EmptyStateType,
  {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    defaultTitle: string;
    defaultDescription: string;
  }
> = {
  "no-predictions": {
    icon: Target,
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10",
    defaultTitle: "Aucun pronostic",
    defaultDescription:
      "Vous n'avez pas encore fait de pronostic pour cette course. C'est le moment de montrer vos talents d'analyste !",
  },
  "no-groups": {
    icon: Users,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    defaultTitle: "Aucun groupe",
    defaultDescription:
      "Rejoignez une ligue de pronostics avec vos amis pour comparer vos scores et grimper dans le classement !",
  },
  "no-races": {
    icon: Calendar,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
    defaultTitle: "Aucune course à venir",
    defaultDescription:
      "La saison est terminée ou il n'y a pas de courses programmées pour le moment.",
  },
  "no-results": {
    icon: Flag,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
    defaultTitle: "Résultats non disponibles",
    defaultDescription:
      "Les résultats de cette course ne sont pas encore disponibles. Revenez après la fin de la course.",
  },
  "no-history": {
    icon: Clock,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
    defaultTitle: "Aucun historique",
    defaultDescription:
      "Vous n'avez pas encore d'historique de pronostics. Commencez à prédire pour voir vos performances ici !",
  },
  "no-notifications": {
    icon: Bell,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    defaultTitle: "Pas de notifications",
    defaultDescription:
      "Vous êtes à jour ! Nous vous notifierons des prochaines courses et des résultats.",
  },
  "no-members": {
    icon: Users,
    iconColor: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    defaultTitle: "Aucun membre",
    defaultDescription:
      "Ce groupe n'a pas encore de membres. Invitez vos amis pour commencer la compétition !",
  },
  "no-search": {
    icon: Search,
    iconColor: "text-gray-500",
    bgColor: "bg-gray-500/10",
    defaultTitle: "Aucun résultat",
    defaultDescription:
      "Aucun résultat ne correspond à votre recherche. Essayez avec d'autres termes.",
  },
  "race-finished": {
    icon: Flag,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    defaultTitle: "Course terminée",
    defaultDescription:
      "Cette course est terminée. Consultez vos résultats et préparez-vous pour la prochaine !",
  },
  "coming-soon": {
    icon: Zap,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/10",
    defaultTitle: "Bientôt disponible",
    defaultDescription:
      "Cette fonctionnalité arrive très prochainement. Restez connecté !",
  },
  locked: {
    icon: Timer,
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10",
    defaultTitle: "Pronostics verrouillés",
    defaultDescription:
      "Les pronostics pour cette course sont maintenant verrouillés. Les qualifications ont commencé.",
  },
  error: {
    icon: Zap,
    iconColor: "text-red-500",
    bgColor: "bg-red-500/10",
    defaultTitle: "Une erreur est survenue",
    defaultDescription:
      "Nous n'avons pas pu charger les données. Veuillez réessayer.",
  },
};

// ============================================
// F1 Car SVG Illustration
// ============================================

function F1CarIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 80"
      className={cn("w-32 h-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main body */}
      <path
        d="M20 50 L40 35 L120 35 L160 40 L180 45 L180 55 L160 60 L40 60 L20 55 Z"
        className="fill-primary/20 stroke-primary"
        strokeWidth="2"
      />
      {/* Cockpit */}
      <ellipse cx="80" cy="45" rx="15" ry="8" className="fill-primary/30" />
      {/* Front wing */}
      <rect x="5" y="48" width="25" height="4" rx="1" className="fill-primary" />
      {/* Rear wing */}
      <rect x="170" y="35" width="4" height="15" rx="1" className="fill-primary" />
      <rect x="165" y="32" width="14" height="4" rx="1" className="fill-primary" />
      {/* Front wheel */}
      <circle cx="45" cy="55" r="10" className="fill-muted-foreground" />
      <circle cx="45" cy="55" r="6" className="fill-muted" />
      {/* Rear wheel */}
      <circle cx="150" cy="55" r="12" className="fill-muted-foreground" />
      <circle cx="150" cy="55" r="8" className="fill-muted" />
      {/* Driver helmet */}
      <ellipse cx="80" cy="42" rx="6" ry="5" className="fill-primary" />
    </svg>
  );
}

function TrophyIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={cn("w-24 h-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trophy cup */}
      <path
        d="M30 20 L30 50 Q30 70 50 80 Q70 70 70 50 L70 20 Z"
        className="fill-yellow-500/20 stroke-yellow-500"
        strokeWidth="3"
      />
      {/* Left handle */}
      <path
        d="M30 25 Q10 25 10 40 Q10 55 25 55"
        className="stroke-yellow-500 fill-none"
        strokeWidth="3"
      />
      {/* Right handle */}
      <path
        d="M70 25 Q90 25 90 40 Q90 55 75 55"
        className="stroke-yellow-500 fill-none"
        strokeWidth="3"
      />
      {/* Base */}
      <rect x="35" y="80" width="30" height="10" className="fill-yellow-500/30" />
      <rect x="25" y="90" width="50" height="8" rx="2" className="fill-yellow-500/40" />
      <rect x="20" y="98" width="60" height="12" rx="2" className="fill-yellow-500/50" />
      {/* Star */}
      <polygon
        points="50,30 53,40 63,40 55,47 58,57 50,50 42,57 45,47 37,40 47,40"
        className="fill-yellow-500"
      />
    </svg>
  );
}

function ChartIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("w-28 h-auto", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bars */}
      <rect x="10" y="50" width="15" height="25" rx="2" className="fill-primary/30" />
      <rect x="35" y="35" width="15" height="40" rx="2" className="fill-primary/50" />
      <rect x="60" y="20" width="15" height="55" rx="2" className="fill-primary/70" />
      <rect x="85" y="10" width="15" height="65" rx="2" className="fill-primary" />
      {/* Base line */}
      <line x1="5" y1="75" x2="115" y2="75" className="stroke-muted-foreground" strokeWidth="2" />
      {/* Trend line */}
      <path
        d="M17 45 Q40 35 50 30 T85 15"
        className="stroke-green-500 fill-none"
        strokeWidth="2"
        strokeDasharray="4"
      />
    </svg>
  );
}

// ============================================
// Main Component
// ============================================

export function EmptyState({
  type,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const config = EMPTY_STATE_CONFIG[type];
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      container: "py-6",
      iconWrapper: "w-12 h-12",
      icon: "h-6 w-6",
      title: "text-base",
      description: "text-sm max-w-xs",
    },
    md: {
      container: "py-10",
      iconWrapper: "w-16 h-16",
      icon: "h-8 w-8",
      title: "text-lg",
      description: "text-sm max-w-sm",
    },
    lg: {
      container: "py-16",
      iconWrapper: "w-20 h-20",
      icon: "h-10 w-10",
      title: "text-xl",
      description: "text-base max-w-md",
    },
  };

  const classes = sizeClasses[size];

  // Choose illustration based on type
  const Illustration =
    type === "no-predictions" || type === "locked"
      ? F1CarIllustration
      : type === "no-history" || type === "no-groups"
      ? ChartIllustration
      : type === "race-finished"
      ? TrophyIllustration
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        classes.container,
        className
      )}
    >
      {/* Illustration or Icon */}
      {Illustration ? (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <Illustration className="opacity-60" />
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className={cn(
            "rounded-full flex items-center justify-center mb-4",
            config.bgColor,
            classes.iconWrapper
          )}
        >
          <Icon className={cn(config.iconColor, classes.icon)} />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={cn("font-semibold mb-2", classes.title)}
      >
        {title || config.defaultTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "text-muted-foreground mx-auto",
          classes.description
        )}
      >
        {description || config.defaultDescription}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-2 mt-6"
        >
          {action && (
            <Button
              variant={action.variant || "default"}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// Pre-configured Empty States
// ============================================

export function NoPredictionsEmpty({
  onMakePrediction,
}: {
  onMakePrediction: () => void;
}) {
  return (
    <EmptyState
      type="no-predictions"
      action={{
        label: "Faire un pronostic",
        onClick: onMakePrediction,
      }}
    />
  );
}

export function NoGroupsEmpty({
  onCreateGroup,
  onJoinGroup,
}: {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}) {
  return (
    <EmptyState
      type="no-groups"
      action={{
        label: "Créer un groupe",
        onClick: onCreateGroup,
      }}
      secondaryAction={{
        label: "Rejoindre avec un code",
        onClick: onJoinGroup,
      }}
    />
  );
}

export function NoHistoryEmpty() {
  return <EmptyState type="no-history" size="sm" />;
}

export function NoSearchResultsEmpty({
  query,
  onClear,
}: {
  query: string;
  onClear: () => void;
}) {
  return (
    <EmptyState
      type="no-search"
      description={`Aucun résultat pour "${query}". Essayez avec d'autres termes.`}
      action={{
        label: "Effacer la recherche",
        onClick: onClear,
        variant: "outline",
      }}
    />
  );
}

export function PredictionsLockedEmpty({
  qualifyingTime,
}: {
  qualifyingTime?: string;
}) {
  return (
    <EmptyState
      type="locked"
      description={
        qualifyingTime
          ? `Les qualifications ont commencé à ${qualifyingTime}. Les pronostics sont verrouillés.`
          : "Les qualifications ont commencé. Les pronostics sont maintenant verrouillés."
      }
    />
  );
}

export function ComingSoonEmpty({ feature }: { feature?: string }) {
  return (
    <EmptyState
      type="coming-soon"
      title={feature ? `${feature} arrive bientôt` : "Bientôt disponible"}
    />
  );
}

export function ErrorEmpty({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      type="error"
      action={{
        label: "Réessayer",
        onClick: onRetry,
      }}
    />
  );
}

export default EmptyState;
