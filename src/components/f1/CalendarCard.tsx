import { Race, Circuit, Driver, Constructor } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MapPin, CheckCircle2, Circle, Zap } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { RaceDetailModal } from './RaceDetailModal';
import { useState } from 'react';
import { getF1TrackMapUrl } from '@/lib/utils/circuit-images';

interface CalendarCardProps {
  race: Race;
  circuit: Circuit;
  drivers: Driver[];
  constructors: Constructor[];
}

export function CalendarCard({ race, circuit, drivers, constructors }: CalendarCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const nextSession = race.sessions.find(s => !s.completed);
  const isUpcoming = nextSession !== undefined;
  const isCompleted = race.sessions.every(s => s.completed);

  // Use official F1 track map based on circuit city
  const circuitImage = getF1TrackMapUrl(circuit.city);

  return (
    <>
      <Card 
        className={`overflow-hidden transition-all hover:shadow-xl group border-border/50 cursor-pointer ${
          isUpcoming ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' : ''
        }`}
        onClick={() => setShowDetail(true)}
      >
        <div className="relative h-48 overflow-hidden">
          <ImageWithFallback
            src={circuitImage}
            alt={circuit.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <Badge 
            variant="secondary" 
            className="absolute top-4 left-4 backdrop-blur-xl bg-white/90 dark:bg-black/70 text-foreground border-0 shadow-lg font-semibold"
          >
            Round {race.round}
          </Badge>
          {isUpcoming && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary/90 backdrop-blur-xl text-white px-3 py-1.5 rounded-full shadow-lg">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">À venir</span>
            </div>
          )}
          {isCompleted && (
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-green-500/90 backdrop-blur-xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl line-clamp-1 leading-tight">{race.name}</CardTitle>
            {race.hasSprint && (
              <Badge className="bg-gradient-to-r from-chart-3 to-chart-3/80 text-white border-0 shrink-0 shadow-md">
                Sprint
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm">{circuit.city}, {race.country}</span>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-sm">{format(new Date(race.date), 'd MMMM yyyy', { locale: fr })}</span>
            </div>
          </div>
        </CardHeader>

        {nextSession && (
          <CardContent className="pt-0">
            <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
              <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                <Circle className="w-3 h-3 fill-current" />
                <span className="text-sm">Prochaine session</span>
              </div>
              <div className="text-foreground font-medium">
                {nextSession.type} · {format(new Date(nextSession.dateTime), 'HH:mm', { locale: fr })}
              </div>
            </div>
          </CardContent>
        )}

        {isCompleted && (
          <CardContent className="pt-0">
            <div className="rounded-2xl bg-muted/50 p-4 text-center border border-border/50">
              <span className="text-sm font-medium text-muted-foreground">Course terminée</span>
            </div>
          </CardContent>
        )}
      </Card>

      <RaceDetailModal
        race={race}
        circuit={circuit}
        open={showDetail}
        onOpenChange={setShowDetail}
        drivers={drivers}
        constructors={constructors}
      />
    </>
  );
}