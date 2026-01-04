import { Race, Circuit, Session, Driver, Constructor } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ChevronRight,
  ChevronLeft,
  Ruler,
  TrendingUp,
  Play,
  History,
  ListOrdered
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SessionResultsView } from './SessionResultsView';
import { useState } from 'react';
import { getF1HeroImageUrl } from '@/lib/utils/circuit-images';
import { WeatherWidget } from './WeatherWidget';

interface RaceDetailModalProps {
  race: Race;
  circuit: Circuit;
  drivers: Driver[];
  constructors: Constructor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RaceDetailModal({ race, circuit, drivers, constructors, open, onOpenChange }: RaceDetailModalProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'results' | 'history'>('sessions');

  // Use official F1 hero image based on race country
  const circuitImage = getF1HeroImageUrl(race.country);

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
  const completedSessions = race.sessions.filter(s => s.completed);
  const totalSessions = race.sessions.length;

  const getSessionStatus = (session: Session) => {
    if (session.completed) return 'completed';
    if (session === nextSession) return 'next';
    return 'upcoming';
  };

  const getSessionBroadcast = (session: Session) => {
    const sessionTime = new Date(session.dateTime);
    const broadcastStart = new Date(sessionTime.getTime() - 15 * 60000);
    return format(broadcastStart, 'HH:mm', { locale: fr });
  };

  const handleSessionClick = (session: Session) => {
    if (session.completed) {
      setSelectedSession(session);
      setActiveTab('results');
    } else {
      setSelectedSession(selectedSession?.id === session.id ? null : session);
    }
  };

  const handleBackToSessions = () => {
    setSelectedSession(null);
    setActiveTab('sessions');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Hero Image */}
        <div className="relative h-56 -mx-6 -mt-6 mb-4 overflow-hidden">
          <ImageWithFallback
            src={circuitImage}
            alt={circuit.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
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

          <div className="absolute bottom-6 left-6 right-6">
            <DialogTitle className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
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
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Ruler className="w-3 h-3" />
                Longueur
              </div>
              <div className="text-xl font-bold">{circuit.length} km</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Virages
              </div>
              <div className="text-xl font-bold">{circuit.turns || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <CheckCircle2 className="w-3 h-3" />
                Progression
              </div>
              <div className="text-xl font-bold">{completedSessions.length}/{totalSessions}</div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Widget */}
        <div className="mb-4">
          <WeatherWidget city={circuit.city} compact />
        </div>

        {/* Tabs for Sessions / Results / History */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions" className="gap-2">
              <Calendar className="w-4 h-4" />
              Programme
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <ListOrdered className="w-4 h-4" />
              Résultats
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-3">
            {race.sessions.map((session, index) => {
              const status = getSessionStatus(session);
              const sessionInfo = sessionTypeLabels[session.type] || { 
                label: session.type, 
                icon: Clock, 
                color: 'text-muted-foreground' 
              };
              const Icon = sessionInfo.icon;
              const isExpanded = selectedSession?.id === session.id;

              return (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    status === 'next' ? 'ring-2 ring-primary/50 bg-primary/5' : 
                    status === 'completed' ? 'bg-muted/30 hover:bg-muted/50' : 
                    'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSessionClick(session)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          status === 'completed' ? 'bg-green-500/10' :
                          status === 'next' ? 'bg-primary/10' :
                          'bg-muted'
                        }`}>
                          {status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <Icon className={`w-5 h-5 ${sessionInfo.color}`} />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{sessionInfo.label}</h4>
                            {status === 'next' && (
                              <Badge className="bg-primary text-white text-xs">Prochaine</Badge>
                            )}
                            {status === 'completed' && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                Voir résultats
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(session.dateTime), 'EEE d MMM', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.dateTime), 'HH:mm', { locale: fr })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Tv className="w-3 h-3" />
                              Canal+ dès {getSessionBroadcast(session)}
                            </div>
                          </div>
                        </div>

                        <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>

                    {isExpanded && !session.completed && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-2 text-sm">
                            <Tv className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              Disponible en direct sur Canal+ F1 et MyCanal
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {selectedSession && selectedSession.completed ? (
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBackToSessions}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour aux sessions
                </Button>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    sessionTypeLabels[selectedSession.type]?.color === 'text-primary' ? 'bg-primary/10' :
                    sessionTypeLabels[selectedSession.type]?.color === 'text-chart-2' ? 'bg-chart-2/10' :
                    sessionTypeLabels[selectedSession.type]?.color === 'text-chart-3' ? 'bg-chart-3/10' :
                    'bg-muted'
                  }`}>
                    {(() => {
                      const Icon = sessionTypeLabels[selectedSession.type]?.icon || Clock;
                      return <Icon className={`w-5 h-5 ${sessionTypeLabels[selectedSession.type]?.color}`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">
                      {sessionTypeLabels[selectedSession.type]?.label || selectedSession.type}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedSession.dateTime), 'EEEE d MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>
                <SessionResultsView 
                  session={selectedSession}
                  drivers={drivers}
                  constructors={constructors}
                />
              </div>
            ) : completedSessions.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez une session terminée pour voir les résultats
                </p>
                {completedSessions.map((session, index) => {
                  const sessionInfo = sessionTypeLabels[session.type] || { 
                    label: session.type, 
                    icon: Clock, 
                    color: 'text-muted-foreground' 
                  };
                  const Icon = sessionInfo.icon;

                  return (
                    <Card 
                      key={index}
                      className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/50"
                      onClick={() => setSelectedSession(session)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                              <Icon className={`w-5 h-5 ${sessionInfo.color}`} />
                            </div>
                            <div>
                              <h4 className="font-bold">{sessionInfo.label}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(session.dateTime), 'EEE d MMM - HH:mm', { locale: fr })}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                            <ListOrdered className="w-3 h-3" />
                            Voir
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Aucun résultat disponible</h4>
                  <p className="text-sm text-muted-foreground">
                    Les résultats seront affichés une fois les sessions terminées
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            {circuit.winners && circuit.winners.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Palmarès récent
                </h3>
                {circuit.winners.map((winner, index) => (
                  <Card key={index} className="hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="font-bold text-primary">{winner.year}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span className="font-semibold">{winner.winner}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span>Pole: {winner.pole}</span>
                              <span>Tour rapide: {winner.fastestLap}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="p-8 text-center">
                  <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-semibold mb-2">Historique non disponible</h4>
                  <p className="text-sm text-muted-foreground">
                    Les données historiques de ce circuit seront bientôt ajoutées
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Lap Record */}
        {circuit.lapRecord && (
          <Card className="mt-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Record du tour</div>
                  <div className="text-xl font-bold">{circuit.lapRecord}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Détenteur</div>
                  <div className="font-semibold">{circuit.lapRecordHolder || '-'}</div>
                  <div className="text-sm text-muted-foreground">{circuit.lapRecordYear || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}