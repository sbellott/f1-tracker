"use client";

/**
 * ResultsView - Wrapper component that fetches data and renders ResultsModal
 * Provides a complete results viewing experience with real data
 */

import { useRaceResults } from "@/lib/hooks/use-race-results";
import { useResultsStore, type BadgeUnlock } from "@/lib/stores/results-store";
import { ResultsModal } from "./ResultsModal";
import { Loader2 } from "lucide-react";

interface ResultsViewProps {
  raceId: string;
  raceName: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResultsView({
  raceId,
  raceName,
  currentUserId,
  open,
  onOpenChange,
}: ResultsViewProps) {
  const { pinnedOpponent } = useResultsStore();

  const { data, isLoading, error } = useRaceResults(
    open ? raceId : null,
    pinnedOpponent?.id
  );

  // Show loading or error state
  if (!open) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-f1-red" />
          <p className="text-muted-foreground">Chargement des résultats...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card rounded-xl p-8 text-center max-w-md">
          <p className="text-destructive mb-4">
            {error?.message || "Impossible de charger les résultats"}
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // Transform data to match ResultsModal expected format
  const raceResults = data.results.map((r) => ({
    position: r.position,
    driver: {
      id: r.driver.id,
      code: r.driver.code,
      firstName: r.driver.firstName,
      lastName: r.driver.lastName,
      photoUrl: r.driver.photoUrl,
      constructor: r.driver.constructor
        ? {
            color: r.driver.constructor.color,
            name: r.driver.constructor.name,
          }
        : undefined,
    },
  }));

  const userPrediction = data.userPrediction
    ? {
        userId: data.userPrediction.userId,
        pseudo: data.userPrediction.pseudo,
        avatar: data.userPrediction.avatar,
        topTen: data.userPrediction.topTen,
        pole: data.userPrediction.pole,
        fastestLap: data.userPrediction.fastestLap,
        score: data.userPrediction.score ?? undefined,
      }
    : null;

  const opponentPrediction = data.opponentPrediction
    ? {
        userId: data.opponentPrediction.userId,
        pseudo: data.opponentPrediction.pseudo,
        avatar: data.opponentPrediction.avatar,
        topTen: data.opponentPrediction.topTen,
        pole: data.opponentPrediction.pole,
        fastestLap: data.opponentPrediction.fastestLap,
        score: data.opponentPrediction.score ?? undefined,
      }
    : null;

  const drivers = data.drivers.map((d) => ({
    id: d.id,
    code: d.code,
    firstName: d.firstName,
    lastName: d.lastName,
    photoUrl: d.photoUrl,
    constructor: d.constructor
      ? {
          color: d.constructor.color,
          name: d.constructor.name,
        }
      : undefined,
  }));

  const poleDriver = data.poleDriver
    ? {
        id: data.poleDriver.id,
        code: data.poleDriver.code,
        firstName: data.poleDriver.firstName,
        lastName: data.poleDriver.lastName,
        photoUrl: data.poleDriver.photoUrl,
        constructor: data.poleDriver.constructor
          ? {
              color: data.poleDriver.constructor.color,
              name: data.poleDriver.constructor.name,
            }
          : undefined,
      }
    : null;

  const fastestLapDriver = data.fastestLapDriver
    ? {
        id: data.fastestLapDriver.id,
        code: data.fastestLapDriver.code,
        firstName: data.fastestLapDriver.firstName,
        lastName: data.fastestLapDriver.lastName,
        photoUrl: data.fastestLapDriver.photoUrl,
        constructor: data.fastestLapDriver.constructor
          ? {
              color: data.fastestLapDriver.constructor.color,
              name: data.fastestLapDriver.constructor.name,
            }
          : undefined,
      }
    : null;

  const newBadges: BadgeUnlock[] = data.newBadges.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    description: b.description,
    icon: b.icon,
    rarity: "rare" as const, // Default rarity - can be enhanced later with DB field
    unlockedAt: new Date(b.unlockedAt),
  }));

  // If no user prediction, show a message
  if (!userPrediction) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-card rounded-xl p-8 text-center max-w-md">
          <p className="mb-4">
            Vous n'avez pas soumis de pronostic pour cette course.
          </p>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  return (
    <ResultsModal
      open={open}
      onOpenChange={onOpenChange}
      raceId={raceId}
      raceName={raceName}
      raceResults={raceResults}
      userPrediction={userPrediction}
      opponentPrediction={opponentPrediction}
      drivers={drivers}
      poleDriver={poleDriver}
      fastestLapDriver={fastestLapDriver}
      newBadges={newBadges}
      currentUserId={currentUserId}
    />
  );
}