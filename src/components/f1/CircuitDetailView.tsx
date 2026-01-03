import { Circuit, Driver, Constructor, Race, Session, SessionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Route, Gauge, Clock, Trophy, Zap, Calendar, ThermometerSun, Users, Flag, TrendingUp, Award, Play, Map as MapIcon, CheckCircle2, ChevronDown, ChevronUp, ListOrdered, Tv, Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SessionResultsView } from './SessionResultsView';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCircuitHistory } from '@/lib/hooks/useF1Data';

interface CircuitDetailViewProps {
  circuit: Circuit;
  drivers: Driver[];
  constructors: Constructor[];
  races: Race[];
  onBack: () => void;
  circuitImage: string;
}

// Session type labels
const sessionTypeLabels: Record<string, { label: string; shortLabel: string; color: string }> = {
  FP1: { label: 'Essais Libres 1', shortLabel: 'EL1', color: 'text-muted-foreground' },
  FP2: { label: 'Essais Libres 2', shortLabel: 'EL2', color: 'text-muted-foreground' },
  FP3: { label: 'Essais Libres 3', shortLabel: 'EL3', color: 'text-muted-foreground' },
  SPRINT_QUALIFYING: { label: 'Qualifications Sprint', shortLabel: 'QS', color: 'text-chart-2' },
  SPRINT: { label: 'Sprint', shortLabel: 'SPR', color: 'text-chart-2' },
  QUALIFYING: { label: 'Qualifications', shortLabel: 'Q', color: 'text-chart-3' },
  RACE: { label: 'Course', shortLabel: 'GP', color: 'text-primary' },
};

// Component to display races and sessions for a circuit
function CircuitRacesSection({ 
  races, 
  drivers, 
  constructors 
}: { 
  races: Race[]; 
  drivers: Driver[]; 
  constructors: Constructor[];
}) {
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<'schedule' | 'results'>('schedule');

  // Sort races by season (descending) and round
  const sortedRaces = [...races].sort((a, b) => {
    if (a.season !== b.season) return b.season - a.season;
    return b.round - a.round;
  });

  // Group races by season
  const racesBySeason = sortedRaces.reduce((acc, race) => {
    if (!acc[race.season]) acc[race.season] = [];
    acc[race.season].push(race);
    return acc;
  }, {} as Record<number, Race[]>);

  const seasons = Object.keys(racesBySeason).map(Number).sort((a, b) => b - a);

  if (races.length === 0) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-8 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-semibold mb-2">Aucune course disponible</h4>
          <p className="text-sm text-muted-foreground">
            Les données des courses sur ce circuit seront bientôt ajoutées
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSessionClick = (session: Session) => {
    if (session.completed && session.results) {
      setSelectedSession(session);
      setActiveTab('results');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            Programme
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <ListOrdered className="w-4 h-4" />
            Résultats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-6">
          {seasons.map(season => (
            <div key={season} className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {season}
                </Badge>
                <span className="text-muted-foreground text-sm font-normal">
                  {racesBySeason[season].length} course{racesBySeason[season].length > 1 ? 's' : ''}
                </span>
              </h3>
              
              {racesBySeason[season].map(race => {
                const isExpanded = expandedRaceId === race.id;
                const completedSessions = race.sessions.filter(s => s.completed).length;
                const totalSessions = race.sessions.length;
                const raceSession = race.sessions.find(s => s.type === 'RACE');
                const hasResults = race.sessions.some(s => s.completed && s.results);

                return (
                  <Card 
                    key={race.id}
                    className="overflow-hidden border-border/50 hover:shadow-md transition-all"
                  >
                    <CardContent className="p-0">
                      {/* Race Header */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedRaceId(isExpanded ? null : race.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              completedSessions === totalSessions 
                                ? 'bg-green-500/10' 
                                : 'bg-primary/10'
                            }`}>
                              {completedSessions === totalSessions ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                              ) : (
                                <Flag className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold">{race.name}</h4>
                                {race.hasSprint && (
                                  <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs gap-1">
                                    <Zap className="w-3 h-3" />
                                    Sprint
                                  </Badge>
                                )}
                                {hasResults && (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                    Résultats
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                <span>Round {race.round}</span>
                                <span>•</span>
                                <span>{format(new Date(race.date), 'd MMMM yyyy', { locale: fr })}</span>
                                <span>•</span>
                                <span>{completedSessions}/{totalSessions} sessions</span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Sessions */}
                      {isExpanded && (
                        <div className="border-t border-border/50 bg-muted/20 p-4 space-y-2">
                          {race.sessions.map((session, idx) => {
                            const info = sessionTypeLabels[session.type] || { 
                              label: session.type, 
                              shortLabel: session.type,
                              color: 'text-muted-foreground' 
                            };
                            const hasSessionResults = session.completed && session.results;

                            return (
                              <div 
                                key={idx}
                                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                  hasSessionResults 
                                    ? 'bg-background hover:bg-muted/50 cursor-pointer' 
                                    : 'bg-background/50'
                                }`}
                                onClick={() => hasSessionResults && handleSessionClick(session)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    session.completed ? 'bg-green-500/10' : 'bg-muted'
                                  }`}>
                                    {session.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{info.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(session.dateTime), 'EEE d MMM - HH:mm', { locale: fr })}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session.channel && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Tv className="w-3 h-3" />
                                      {session.channel}
                                    </Badge>
                                  )}
                                  {hasSessionResults && (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                      Voir
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {selectedSession ? (
            <div className="space-y-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedSession(null);
                  setActiveTab('schedule');
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour au programme
              </Button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10`}>
                  <Flag className="w-5 h-5 text-primary" />
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
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez une session terminée pour voir les résultats
              </p>
              
              {sortedRaces.flatMap(race => 
                race.sessions
                  .filter(s => s.completed && s.results)
                  .map(session => {
                    const info = sessionTypeLabels[session.type];
                    return (
                      <Card 
                        key={session.id}
                        className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/50"
                        onClick={() => setSelectedSession(session)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Flag className={`w-5 h-5 ${info?.color || 'text-primary'}`} />
                              </div>
                              <div>
                                <h4 className="font-bold">{info?.label || session.type}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {race.name} • {format(new Date(session.dateTime), 'd MMM yyyy', { locale: fr })}
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
                  })
              )}
              
              {sortedRaces.every(race => !race.sessions.some(s => s.completed && s.results)) && (
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
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function CircuitDetailView({ circuit, drivers, constructors, races, onBack, circuitImage }: CircuitDetailViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Fetch real historical data from Ergast API
  const { data: historyData, isLoading: historyLoading } = useCircuitHistory(circuit.ergastId || circuit.id);
  
  // Circuit stats from real data or defaults
  const circuitStats = {
    maxSpeed: 340, // Would need separate data source
    elevation: 45,
    straights: 3,
    drsZones: circuit.drsZones || 2,
    difficulty: 8.5,
    capacity: 150000,
    avgLapTime: circuit.lapRecord?.time || '1:32.090',
    totalRaces: historyData?.stats?.totalRaces || (new Date().getFullYear() - circuit.firstGP),
  };

  // Real winners from Ergast API
  const recentWinners = historyData?.winners || [];

  // Key corners
  const keyCorners = [
    { name: 'Virage 1', type: 'Freinage', speed: 85, description: 'Zone de dépassement principale' },
    { name: 'Esse rapide', type: 'Enchaînement', speed: 220, description: 'Technique et rapide' },
    { name: 'Épingle', type: 'Lent', speed: 60, description: 'Opportunité de dépassement' },
    { name: 'Dernière courbe', type: 'Moyen', speed: 180, description: 'Crucial pour le chronométrage' },
  ];

  // Weather info
  const weatherInfo = {
    avgTemp: 28,
    rainChance: 15,
    bestConditions: 'Ensoleillé et sec',
    challengingConditions: 'Vent fort dans les lignes droites',
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="gap-2 hover:bg-muted/50 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au calendrier
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden border-border/50 shadow-2xl">
        <div className="relative">
          {/* Background Image */}
          <div className="relative h-80 lg:h-96 overflow-hidden">
            <ImageWithFallback
              src={circuitImage}
              alt={circuit.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
            
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-accent to-chart-3" />
          </div>

          {/* Circuit Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="gap-1 backdrop-blur-xl bg-white/90 dark:bg-black/70 text-black dark:text-white border-0 shadow-lg">
                    <MapPin className="w-3 h-3" />
                    {circuit.country}
                  </Badge>
                  <Badge className="gap-1 backdrop-blur-xl bg-primary/90 text-white border-0 shadow-lg">
                    <Calendar className="w-3 h-3" />
                    Depuis {circuit.firstGP}
                  </Badge>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                  {circuit.name}
                </h1>
                
                <div className="flex items-center gap-2 text-white/90 drop-shadow">
                  <Flag className="w-4 h-4" />
                  <span className="font-semibold text-lg">{circuit.city}, {circuit.country}</span>
                </div>
              </div>

              {/* Record Badge */}
              {circuit.lapRecord && (
                <div className="rounded-2xl bg-gradient-to-br from-chart-3/90 to-chart-3/70 backdrop-blur-xl p-6 text-white shadow-2xl">
                  <div className="text-sm mb-1 opacity-90 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Record du tour
                  </div>
                  <div className="text-3xl font-bold mb-1">{circuit.lapRecord.time}</div>
                  <div className="text-sm opacity-90">{circuit.lapRecord.driver} · {circuit.lapRecord.year}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Route className="w-5 h-5 text-primary" />
              <div className="text-xs text-muted-foreground">Circuit</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
              {circuit.length}
            </div>
            <div className="text-sm text-muted-foreground">km par tour</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-5 h-5 text-accent" />
              <div className="text-xs text-muted-foreground">Virages</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
              {circuit.turns}
            </div>
            <div className="text-sm text-muted-foreground">au total</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Gauge className="w-5 h-5 text-chart-3" />
              <div className="text-xs text-muted-foreground">Vitesse max</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-chart-3 to-chart-3/70 bg-clip-text text-transparent">
              {circuitStats.maxSpeed}
            </div>
            <div className="text-sm text-muted-foreground">km/h</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-4/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-5 h-5 text-chart-4" />
              <div className="text-xs text-muted-foreground">Éditions</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-chart-4 to-chart-4/70 bg-clip-text text-transparent">
              {circuitStats.totalRaces}
            </div>
            <div className="text-sm text-muted-foreground">Grands Prix</div>
          </CardHeader>
        </Card>
      </div>

      {/* Track Layout & Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Track Layout */}
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-white" />
              </div>
              Tracé du circuit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden bg-muted/30">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1518565461527-e8c70d55cc8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWNlJTIwdHJhY2slMjBsYXlvdXQlMjBtYXB8ZW58MXx8fHwxNzY3MTU1Mjc2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt={`Tracé ${circuit.name}`}
                className="w-full h-full object-contain p-6 transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute bottom-4 right-4 backdrop-blur-xl bg-black/70 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                {circuit.turns} virages · {circuit.length} km
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Preview */}
        <Card className="border-border/50 shadow-lg overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Play className="w-4 h-4 text-white" />
              </div>
              Présentation du circuit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-square overflow-hidden bg-muted/30 group cursor-pointer">
              {!isPlaying ? (
                <>
                  <ImageWithFallback
                    src={circuitImage}
                    alt={`Présentation ${circuit.name}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Play Button Overlay */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => setIsPlaying(true)}
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-xl flex items-center justify-center shadow-2xl transition-all group-hover:scale-110 group-hover:bg-primary">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="backdrop-blur-xl bg-black/70 text-white p-4 rounded-xl">
                      <div className="font-semibold mb-1">Tour embarqué</div>
                      <div className="text-sm opacity-90">Vue pilote · 4:32</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="text-center text-white p-8">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-semibold mb-2">Lecture de la vidéo</p>
                    <p className="text-sm text-white/70 mb-4">Simulation de lecteur vidéo</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsPlaying(false)}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circuit Characteristics */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Route className="w-4 h-4 text-white" />
              </div>
              Caractéristiques
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Distance totale</div>
                <div className="font-semibold">{circuit.totalDistance} km</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Tours de course</div>
                <div className="font-semibold">{Math.round(circuit.totalDistance / circuit.length)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Zones DRS</div>
                <div className="font-semibold">{circuitStats.drsZones}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Dénivelé</div>
                <div className="font-semibold">{circuitStats.elevation}m</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Temps moyen</div>
                <div className="font-semibold">{circuitStats.avgLapTime}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Capacité</div>
                <div className="font-semibold">{circuitStats.capacity.toLocaleString()}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground mb-3">Difficulté</div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-chart-3 rounded-full transition-all"
                    style={{ width: `${(circuitStats.difficulty / 10) * 100}%` }}
                  />
                </div>
                <div className="font-bold text-xl">{circuitStats.difficulty}/10</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Info */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <ThermometerSun className="w-4 h-4 text-white" />
              </div>
              Conditions météo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="text-sm text-muted-foreground mb-2">Température moyenne</div>
                <div className="text-3xl font-bold">{weatherInfo.avgTemp}°C</div>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <div className="text-sm text-muted-foreground mb-2">Risque de pluie</div>
                <div className="text-3xl font-bold">{weatherInfo.rainChance}%</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="text-sm text-muted-foreground mb-1">Conditions idéales</div>
                <div className="font-semibold text-green-700 dark:text-green-400">
                  {weatherInfo.bestConditions}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                <div className="text-sm text-muted-foreground mb-1">Point d'attention</div>
                <div className="font-semibold text-orange-700 dark:text-orange-400">
                  {weatherInfo.challengingConditions}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Corners */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center">
              <Flag className="w-4 h-4 text-white" />
            </div>
            Virages clés
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyCorners.map((corner, index) => (
              <div 
                key={index}
                className="p-5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold text-lg mb-1">{corner.name}</div>
                    <Badge className="text-xs">{corner.type}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{corner.speed}</div>
                    <div className="text-xs text-muted-foreground">km/h</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{corner.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Winners */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-5 to-chart-5/80 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            Derniers vainqueurs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : recentWinners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune donnée historique disponible</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWinners.slice(0, 5).map((winner, index) => (
                <div 
                  key={`${winner.season}-${index}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Badge 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        index === 0 
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {winner.season}
                    </Badge>
                    
                    <div className="flex-1">
                      <div className="font-semibold">
                        {winner.driver.firstName} {winner.driver.lastName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{winner.constructor.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {winner.time && (
                      <div className="flex items-center gap-2 text-chart-3">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-semibold">{winner.time}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circuit Stats Summary */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-4 to-chart-4/80 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Statistiques historiques
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-3xl font-bold mb-1">{historyData?.stats?.firstRace || circuit.firstGP}</div>
                  <div className="text-sm text-muted-foreground">Premier Grand Prix</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-3xl font-bold mb-1">{historyData?.stats?.totalRaces || circuitStats.totalRaces}</div>
                  <div className="text-sm text-muted-foreground">Courses disputées</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-3xl font-bold mb-1">{circuitStats.straights}</div>
                  <div className="text-sm text-muted-foreground">Lignes droites</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/30">
                  <div className="text-3xl font-bold mb-1">{circuitStats.capacity.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Capacité spectateurs</div>
                </div>
              </div>

              {/* Most Wins */}
              {(historyData?.stats?.mostWinsDriver || historyData?.stats?.mostWinsConstructor) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  {historyData?.stats?.mostWinsDriver && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20">
                      <div className="text-sm text-muted-foreground mb-1">Pilote le plus victorieux</div>
                      <div className="font-bold text-lg">{historyData.stats.mostWinsDriver.driver}</div>
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        {historyData.stats.mostWinsDriver.wins} victoire{historyData.stats.mostWinsDriver.wins > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                  {historyData?.stats?.mostWinsConstructor && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <div className="text-sm text-muted-foreground mb-1">Écurie la plus victorieuse</div>
                      <div className="font-bold text-lg">{historyData.stats.mostWinsConstructor.constructor}</div>
                      <div className="text-primary font-semibold">
                        {historyData.stats.mostWinsConstructor.wins} victoire{historyData.stats.mostWinsConstructor.wins > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Circuit Races & Sessions Section */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Courses & Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <CircuitRacesSection
            races={races}
            drivers={drivers}
            constructors={constructors}
          />
        </CardContent>
      </Card>
    </div>
  );
}