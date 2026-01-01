import { Race, Circuit, Session } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Tv, 
  Zap,
  Flag,
  Trophy,
  Target,
  ChevronRight,
  Ruler,
  TrendingUp,
  Play
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';

interface RaceDetailModalProps {
  race: Race;
  circuit: Circuit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RaceDetailModal({ race, circuit, open, onOpenChange }: RaceDetailModalProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const circuitImages = [
    "https://images.unsplash.com/photo-1634417176270-27f83740daa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtdWxhJTIwMSUyMHJhY2luZyUyMHRyYWNrfGVufDF8fHx8MTc2NzA2MTI3NXww&ixlib=rb-4.1.0&q=80&w=1080",
    "https://images.unsplash.com/photo-1716402008418-8c03c882c59d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWNpbmclMjBjaXJjdWl0JTIwbmlnaHR8ZW58MXx8fHwxNzY3MTE2NzM1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  ];
  const circuitImage = circuitImages[race.round % circuitImages.length];

  const sessionTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    FP1: { label: 'Essais Libres 1', icon: Play, color: 'text-muted-foreground' },
    FP2: { label: 'Essais Libres 2', icon: Play, color: 'text-muted-foreground' },
    FP3: { label: 'Essais Libres 3', icon: Play, color: 'text-muted-foreground' },
    SPRINT_QUALIFYING: { label: 'Qualifications Sprint', icon: Zap, color: 'text-chart-2' },
    SPRINT: { label: 'Sprint', icon: Zap, color: 'text-chart-2' },
    QUALIFYING: { label: 'Qualifications', icon: Trophy, color: 'text-chart-3' },
    RACE: { label: 'Course', icon: Flag, color: 'text-primary' },
  };

  const nextSession = race.sessions.find(s => !s.completed);
  const completedSessions = race.sessions.filter(s => s.completed).length;
  const totalSessions = race.sessions.length;

  const getSessionStatus = (session: Session) => {
    if (session.completed) return 'completed';
    if (session === nextSession) return 'next';
    return 'upcoming';
  };

  const getSessionBroadcast = (session: Session) => {
    // Simulated Canal+ broadcast times
    const sessionTime = new Date(session.dateTime);
    const broadcastStart = new Date(sessionTime.getTime() - 15 * 60000); // 15 min avant
    return format(broadcastStart, 'HH:mm', { locale: fr });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-64 -mx-6 -mt-6 mb-6 overflow-hidden">
          <ImageWithFallback
            src={circuitImage}
            alt={circuit.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          {/* Overlays */}
          <Badge 
            variant="secondary" 
            className="absolute top-6 left-6 backdrop-blur-xl bg-white/90 dark:bg-black/70 text-foreground border-0 shadow-lg font-semibold text-base px-4 py-2"
          >
            Round {race.round}
          </Badge>

          {race.hasSprint && (
            <Badge className="absolute top-6 right-6 bg-gradient-to-r from-chart-2 to-chart-2/80 text-white border-0 shadow-lg text-base px-4 py-2 gap-2">
              <Zap className="w-4 h-4" />
              Weekend Sprint
            </Badge>
          )}

          {/* Title Section */}
          <div className="absolute bottom-6 left-6 right-6">
            <DialogTitle className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              {race.name}
            </DialogTitle>
            <div className="flex items-center gap-4 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{circuit.city}, {circuit.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(race.sessions[0]?.dateTime || new Date()), 'd MMMM yyyy', { locale: fr })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Circuit Info */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Ruler className="w-3.5 h-3.5" />
                Longueur
              </div>
              <div className="text-2xl font-bold">{circuit.length} km</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Virages
              </div>
              <div className="text-2xl font-bold">{circuit.turns || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Progression
              </div>
              <div className="text-2xl font-bold">{completedSessions}/{totalSessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Sessions du weekend</h3>
            <Badge variant="outline" className="text-sm">
              {totalSessions} sessions
            </Badge>
          </div>

          <div className="space-y-3">
            {race.sessions.map((session, index) => {
              const status = getSessionStatus(session);
              const sessionInfo = sessionTypeLabels[session.type] || { 
                label: session.type, 
                icon: Clock, 
                color: 'text-muted-foreground' 
              };
              const Icon = sessionInfo.icon;
              const isSelected = selectedSession?.type === session.type;

              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    status === 'next' ? 'ring-2 ring-primary/50 bg-primary/5' : 
                    status === 'completed' ? 'bg-muted/30' : 
                    'hover:bg-muted/50'
                  } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedSession(isSelected ? null : session)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          status === 'completed' ? 'bg-green-500/10' :
                          status === 'next' ? 'bg-primary/10' :
                          'bg-muted'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : status === 'next' ? (
                            <Icon className={`w-6 h-6 ${sessionInfo.color}`} />
                          ) : (
                            <Icon className={`w-6 h-6 ${sessionInfo.color}`} />
                          )}
                        </div>

                        {/* Session Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg">{sessionInfo.label}</h4>
                            {status === 'next' && (
                              <Badge className="bg-primary text-white text-xs">
                                Prochaine session
                              </Badge>
                            )}
                            {status === 'completed' && (
                              <Badge className="bg-green-500 text-white text-xs">
                                Terminée
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {format(new Date(session.dateTime), 'EEEE d MMMM', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {format(new Date(session.dateTime), 'HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Tv className="w-3.5 h-3.5" />
                              <span className="font-medium">
                                Canal+ dès {getSessionBroadcast(session)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expand Icon */}
                        <ChevronRight 
                          className={`w-5 h-5 text-muted-foreground transition-transform ${
                            isSelected ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="text-xs text-muted-foreground mb-1">Début session</div>
                            <div className="font-semibold">
                              {format(new Date(session.dateTime), 'HH:mm', { locale: fr })}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <div className="text-xs text-muted-foreground mb-1">Diffusion Canal+</div>
                            <div className="font-semibold">
                              Dès {getSessionBroadcast(session)}
                            </div>
                          </div>
                        </div>

                        {!session.completed && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <div className="flex items-center gap-2 text-sm">
                              <Tv className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                Disponible en direct sur Canal+ F1® et MyCanal
                              </span>
                            </div>
                          </div>
                        )}

                        {session.completed && (
                          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              <span className="font-medium">
                                Session terminée - Replay disponible
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Lap Record */}
        {circuit.lapRecord && (
          <Card className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Record du tour</div>
                  <div className="text-2xl font-bold">{circuit.lapRecord.time}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Détenteur</div>
                  <div className="font-semibold">{circuit.lapRecord.driver}</div>
                  <div className="text-sm text-muted-foreground">{circuit.lapRecord.year}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}