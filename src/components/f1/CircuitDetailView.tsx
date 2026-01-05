import { Circuit, Driver, Constructor, Race, Session } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Trophy, Zap, Calendar, ChevronDown, ChevronUp, Loader2, Plus, Flag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useCircuitHistory } from '@/lib/hooks/useF1Data';
import type { FullRaceResult } from '@/lib/services/circuit-history.service';
import { WeatherWidget } from './WeatherWidget';

interface CircuitDetailViewProps {
  circuit: Circuit;
  drivers: Driver[];
  constructors: Constructor[];
  races: Race[];
  onBack: () => void;
  circuitImage: string;
}

// Session type labels
const sessionTypeLabels: Record<string, { label: string; shortLabel: string }> = {
  FP1: { label: 'Practice 1', shortLabel: 'FP1' },
  FP2: { label: 'Practice 2', shortLabel: 'FP2' },
  FP3: { label: 'Practice 3', shortLabel: 'FP3' },
  SPRINT_QUALIFYING: { label: 'Sprint Qualifying', shortLabel: 'SQ' },
  SPRINT: { label: 'Sprint', shortLabel: 'SPR' },
  QUALIFYING: { label: 'Qualifying', shortLabel: 'Q' },
  RACE: { label: 'Race', shortLabel: 'RACE' },
};

// ============================================
// F1.COM OFFICIAL IMAGE URL MAPPINGS
// ============================================

// Hero banner images by country name
const F1_HERO_BASE_URL = 'https://media.formula1.com/image/upload/f_auto/q_auto/v1677245032/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9';

const countryToHeroImage: Record<string, string> = {
  'Australia': 'Australia',
  'China': 'China',
  'Japan': 'Japan',
  'Bahrain': 'Bahrain',
  'Saudi Arabia': 'Saudi%20Arabia',
  'USA': 'United%20States',
  'Monaco': 'Monaco',
  'Spain': 'Spain',
  'Canada': 'Canada',
  'Austria': 'Austria',
  'UK': 'Great%20Britain',
  'United Kingdom': 'Great%20Britain',
  'Belgium': 'Belgium',
  'Hungary': 'Hungary',
  'Netherlands': 'Netherlands',
  'Italy': 'Italy',
  'Azerbaijan': 'Azerbaijan',
  'Singapore': 'Singapore',
  'Mexico': 'Mexico',
  'Brazil': 'Brazil',
  'Qatar': 'Qatar',
  'UAE': 'Abu%20Dhabi',
  'United Arab Emirates': 'Abu%20Dhabi',
};

// Track map images by city/circuit location
const F1_TRACK_BASE_URL = 'https://media.formula1.com/image/upload/f_auto/q_auto/v1677245035/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9';

const cityToTrackMap: Record<string, string> = {
  'Melbourne': 'Australia_Circuit',
  'Shanghai': 'China_Circuit',
  'Suzuka': 'Japan_Circuit',
  'Sakhir': 'Bahrain_Circuit',
  'Jeddah': 'Saudi_Arabia_Circuit',
  'Miami': 'Miami_Circuit',
  'Monte Carlo': 'Monaco_Circuit',
  'Barcelona': 'Spain_Circuit',
  'Montreal': 'Canada_Circuit',
  'Spielberg': 'Austria_Circuit',
  'Silverstone': 'Great_Britain_Circuit',
  'Spa': 'Belgium_Circuit',
  'Budapest': 'Hungary_Circuit',
  'Zandvoort': 'Netherlands_Circuit',
  'Monza': 'Italy_Circuit',
  'Baku': 'Azerbaijan_Circuit',
  'Marina Bay': 'Singapore_Circuit',
  'Austin': 'USA_Circuit',
  'Mexico City': 'Mexico_Circuit',
  'São Paulo': 'Brazil_Circuit',
  'Las Vegas': 'Las_Vegas_Circuit',
  'Lusail': 'Qatar_Circuit',
  'Abu Dhabi': 'Abu_Dhabi_Circuit',
  'Madrid': 'Spain_Circuit', // New Madrid circuit - fallback to Spain
};

// Helper function to get F1.com hero image URL
function getF1HeroImageUrl(country: string): string {
  const heroName = countryToHeroImage[country] || country.replace(/\s+/g, '%20');
  return `${F1_HERO_BASE_URL}/${heroName}.jpg.transform/9col/image.jpg`;
}

// Helper function to get F1.com track map URL
function getF1TrackMapUrl(city: string): string {
  const trackName = cityToTrackMap[city] || city.replace(/\s+/g, '_') + '_Circuit';
  return `${F1_TRACK_BASE_URL}/${trackName}.png`;
}

// ============================================
// F1 SCHEDULE SECTION
// ============================================
function F1ScheduleSection({ races }: { races: Race[] }) {
  const [timeZone, setTimeZone] = useState<'track' | 'local'>('local');
  
  // Get the most recent/upcoming race
  const currentRace = races.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  if (!currentRace) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No schedule available</p>
      </div>
    );
  }

  // Sort sessions by datetime
  const sortedSessions = [...currentRace.sessions].sort(
    (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
  );

  return (
    <section className="py-8">
      <h2 className="f1-section-title">Schedule</h2>
      
      {/* Time Zone Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTimeZone('local')}
          className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${
            timeZone === 'local' 
              ? 'bg-foreground text-background' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My time
        </button>
        <button
          onClick={() => setTimeZone('track')}
          className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors ${
            timeZone === 'track' 
              ? 'bg-foreground text-background' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Track time
        </button>
      </div>

      {/* Sessions List */}
      <div className="bg-card">
        {sortedSessions.map((session, idx) => {
          const sessionDate = new Date(session.dateTime);
          const info = sessionTypeLabels[session.type] || { label: session.type, shortLabel: session.type };
          const isRace = session.type === 'RACE';
          
          return (
            <div 
              key={idx} 
              className={`f1-session-item ${isRace ? 'bg-muted/30' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Date Badge */}
                <div className="f1-date-badge">
                  <span className="f1-date-badge-day">
                    {format(sessionDate, 'd')}
                  </span>
                  <span className="f1-date-badge-month">
                    {format(sessionDate, 'MMM', { locale: enUS })}
                  </span>
                </div>
                
                {/* Session Name */}
                <div>
                  <div className={`font-semibold uppercase tracking-wide ${isRace ? 'text-primary' : ''}`}>
                    {info.label}
                  </div>
                  {session.completed && (
                    <span className="text-xs text-green-600 font-medium">Completed</span>
                  )}
                </div>
              </div>
              
              {/* Time */}
              <div className="text-right">
                <div className="font-semibold">
                  {format(sessionDate, 'HH:mm')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Calendar Button */}
      <Button 
        className="w-full mt-4 bg-primary hover:bg-primary/90 text-white gap-2 rounded-none"
      >
        <Plus className="w-4 h-4" />
        Add F1 calendar
      </Button>
    </section>
  );
}

// ============================================
// F1 WEATHER SECTION
// ============================================
function F1WeatherSection({ city }: { city: string }) {
  return (
    <section className="py-8">
      <h2 className="f1-section-title">Weather</h2>
      <WeatherWidget city={city} showForecast />
    </section>
  );
}

// ============================================
// F1 CIRCUIT SECTION
// ============================================
function F1CircuitSection({ circuit }: { circuit: Circuit }) {
  // Calculate laps from circuit length (F1 races are minimum 305km, Monaco 260km exception)
  const F1_RACE_DISTANCE_KM = 305;
  const laps = circuit.length
    ? Math.ceil(F1_RACE_DISTANCE_KM / circuit.length)
    : null;

  // Calculate race distance
  const raceDistance = circuit.length && laps
    ? (circuit.length * laps).toFixed(3)
    : null;

  // Use F1.com official track map URL
  const trackMapUrl = getF1TrackMapUrl(circuit.city);

  return (
    <section className="py-8">
      <h2 className="f1-section-title">Circuit</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Track Map */}
        <div className="bg-card p-6">
          <div className="aspect-square relative flex items-center justify-center">
            {trackMapUrl ? (
              <ImageWithFallback
                src={trackMapUrl}
                alt={`${circuit.name} Track Layout`}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-muted-foreground text-center">
                <div className="text-6xl mb-4">🏎️</div>
                <p>Track layout not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-card p-6">
          {/* Hero Stat */}
          <div className="border-b border-border pb-6 mb-6">
            <div className="f1-stat-label mb-2">Circuit Length</div>
            <div className="f1-stat-value">
              {circuit.length || '-'}
              {circuit.length && <span className="text-lg ml-1">km</span>}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="f1-stat-label mb-2">First Grand Prix</div>
              <div className="f1-stat-value">{circuit.firstGP || '-'}</div>
            </div>
            <div>
              <div className="f1-stat-label mb-2">Number of Laps</div>
              <div className="f1-stat-value">{laps || '-'}</div>
            </div>
            <div>
              <div className="f1-stat-label mb-2">Race Distance</div>
              <div className="f1-stat-value">
                {raceDistance || '-'}
                {raceDistance && <span className="text-lg ml-1">km</span>}
              </div>
            </div>
            <div>
              <div className="f1-stat-label mb-2">Lap Record</div>
              {circuit.lapRecord ? (
                <>
                  <div className="f1-stat-value text-xl">{circuit.lapRecord}</div>
                  {circuit.lapRecordHolder && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {circuit.lapRecordHolder} ({circuit.lapRecordYear})
                    </div>
                  )}
                </>
              ) : (
                <div className="f1-stat-value">-</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// F1 ABOUT SECTION (Accordion FAQ)
// ============================================
function F1AboutSection({ circuit }: { circuit: Circuit }) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: `What makes ${circuit.city} unique?`,
      answer: `The ${circuit.name} in ${circuit.city}, ${circuit.country} is one of the most iconic circuits on the Formula 1 calendar. First hosting a Grand Prix in ${circuit.firstGP}, this ${circuit.length}km circuit features ${circuit.turns} corners and provides excellent racing action. The track's unique characteristics have produced many memorable moments in F1 history.`
    },
    {
      question: 'What are the key overtaking opportunities?',
      answer: `The circuit offers several overtaking opportunities, particularly in the DRS zones. With ${circuit.turns} corners and a mix of high-speed and technical sections, drivers must find the right balance between attacking and defending.`
    },
    {
      question: 'What is the track history?',
      answer: `Since its first Grand Prix in ${circuit.firstGP}, this circuit has been a regular fixture on the F1 calendar. The track has undergone various modifications over the years to improve racing and safety, while maintaining its essential character and challenge.`
    },
    {
      question: 'What weather conditions are typical?',
      answer: `Racing conditions at ${circuit.city} can vary significantly. Teams and drivers must be prepared for changing weather patterns, which can add an extra strategic dimension to the race weekend.`
    }
  ];

  return (
    <section className="py-8">
      <h2 className="f1-section-title">About</h2>
      
      <div className="bg-card">
        {faqs.map((faq, index) => (
          <div key={index} className="f1-accordion-item">
            <button
              onClick={() => toggleItem(index)}
              className="f1-accordion-trigger"
            >
              <span>{faq.question}</span>
              {openItems.includes(index) ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {openItems.includes(index) && (
              <div className="f1-accordion-content">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================
// F1 RESULTS SECTION (Race Classifications)
// ============================================
function F1ResultsSection({ results, isLoading }: { results: FullRaceResult[]; isLoading: boolean }) {
  const [expandedYear, setExpandedYear] = useState<number | null>(results[0]?.season || null);

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-br from-amber-500 to-amber-600 text-white';
      case 2:
        return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-br from-amber-700 to-amber-800 text-white';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="f1-section-title">Results</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!results || results.length === 0) {
    return (
      <section className="py-8">
        <h2 className="f1-section-title">Results</h2>
        <div className="bg-card p-8 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No historical results available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="f1-section-title">Results</h2>
      
      <div className="space-y-3">
        {results.map((race) => {
          const isExpanded = expandedYear === race.season;
          const winner = race.results[0];

          return (
            <div key={race.season} className="bg-card overflow-hidden">
              {/* Year Header */}
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedYear(isExpanded ? null : race.season)}
              >
                <div className="flex items-center gap-4">
                  <Badge className="bg-primary text-white border-0 text-lg font-bold px-4 py-2 rounded">
                    {race.season}
                  </Badge>
                  <div className="text-left">
                    <div className="font-bold">{race.raceName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      {winner?.driver.firstName} {winner?.driver.lastName}
                      <span className="opacity-50">•</span>
                      {winner?.constructor.name}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {/* Expanded Results Table */}
              {isExpanded && (
                <div className="border-t border-border">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold text-muted-foreground bg-muted/50 uppercase tracking-wide">
                    <div className="col-span-1 text-center">Pos</div>
                    <div className="col-span-4">Driver</div>
                    <div className="col-span-3">Team</div>
                    <div className="col-span-1 text-center">Grid</div>
                    <div className="col-span-2 text-right">Time</div>
                    <div className="col-span-1 text-right">Pts</div>
                  </div>

                  {/* Results Rows */}
                  <div className="divide-y divide-border/50">
                    {race.results.map((result) => {
                      const hasFastestLap = result.fastestLap?.rank === 1;
                      const statusDisplay = result.status !== 'Finished' && !result.status.includes('Lap') 
                        ? result.status 
                        : null;

                      return (
                        <div 
                          key={result.driver.driverId}
                          className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-muted/20 transition-colors"
                        >
                          <div className="col-span-1 flex justify-center">
                            <Badge className={`w-7 h-7 rounded flex items-center justify-center text-sm font-bold ${getPositionStyle(result.position)}`}>
                              {result.positionText}
                            </Badge>
                          </div>
                          <div className="col-span-4">
                            <span className="font-semibold">
                              {result.driver.firstName.charAt(0)}. {result.driver.lastName}
                            </span>
                            {hasFastestLap && (
                              <Badge className="ml-2 bg-purple-500/10 text-purple-500 border-purple-500/20 text-[10px] px-1">
                                FL
                              </Badge>
                            )}
                          </div>
                          <div className="col-span-3 text-sm text-muted-foreground truncate">
                            {result.constructor.name}
                          </div>
                          <div className="col-span-1 text-center text-sm">
                            {result.grid || '-'}
                          </div>
                          <div className="col-span-2 text-right">
                            {statusDisplay ? (
                              <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/30">
                                {statusDisplay}
                              </Badge>
                            ) : result.position === 1 ? (
                              <span className="font-mono text-sm font-semibold">{result.time}</span>
                            ) : (
                              <span className="font-mono text-sm text-muted-foreground">
                                {result.time ? `+${result.time}` : result.status}
                              </span>
                            )}
                          </div>
                          <div className="col-span-1 text-right">
                            <span className={`font-bold ${result.points > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                              {result.points > 0 ? result.points : '-'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="p-3 bg-muted/30 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
                    <span>{format(new Date(race.date), 'MMMM d, yyyy', { locale: enUS })}</span>
                    <span>Round {race.round}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ============================================
// F1 STATS SECTION (Historical Statistics)
// ============================================
function F1StatsSection({ 
  circuit, 
  historyData, 
  isLoading 
}: { 
  circuit: Circuit; 
  historyData: any; 
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="py-8">
        <h2 className="f1-section-title">Statistics</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <h2 className="f1-section-title">Statistics</h2>
      
      <div className="bg-card p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-4 bg-muted/30 rounded">
            <div className="f1-stat-value">{historyData?.stats?.firstRace || circuit.firstGP}</div>
            <div className="f1-stat-label mt-2">First Grand Prix</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded">
            <div className="f1-stat-value">{historyData?.stats?.totalRaces || '-'}</div>
            <div className="f1-stat-label mt-2">Total Races</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded">
            <div className="f1-stat-value">{circuit.turns}</div>
            <div className="f1-stat-label mt-2">Corners</div>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded">
            <div className="f1-stat-value">{circuit.length}</div>
            <div className="f1-stat-label mt-2">Circuit Length (km)</div>
          </div>
        </div>

        {/* Most Wins */}
        {(historyData?.stats?.mostWinsDriver || historyData?.stats?.mostWinsConstructor) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-6 border-t border-border">
            {historyData?.stats?.mostWinsDriver && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded">
                <div className="f1-stat-label mb-2">Most Wins - Driver</div>
                <div className="font-bold text-lg">{historyData.stats.mostWinsDriver.driver}</div>
                <div className="text-amber-600 font-semibold">
                  {historyData.stats.mostWinsDriver.wins} win{historyData.stats.mostWinsDriver.wins > 1 ? 's' : ''}
                </div>
              </div>
            )}
            {historyData?.stats?.mostWinsConstructor && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded">
                <div className="f1-stat-label mb-2">Most Wins - Constructor</div>
                <div className="font-bold text-lg">{historyData.stats.mostWinsConstructor.constructor}</div>
                <div className="text-primary font-semibold">
                  {historyData.stats.mostWinsConstructor.wins} win{historyData.stats.mostWinsConstructor.wins > 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function CircuitDetailView({ 
  circuit, 
  drivers, 
  constructors, 
  races, 
  onBack, 
  circuitImage 
}: CircuitDetailViewProps) {
  // Fetch real historical data from Ergast API
  const { data: historyData, isLoading: historyLoading } = useCircuitHistory(circuit.ergastId || circuit.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="px-4 py-4 lg:px-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="gap-2 hover:bg-muted/50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to calendar
        </Button>
      </div>

      {/* Hero Section */}
      <div className="f1-hero relative h-64 lg:h-80 mb-8">
        <ImageWithFallback
          src={getF1HeroImageUrl(circuit.country)}
          alt={circuit.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#15151e] via-[#15151e]/60 to-transparent" />
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <Flag className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-sm uppercase tracking-wide">
                {circuit.country}
              </span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight" style={{ fontStyle: 'italic' }}>
              {circuit.name}
            </h1>
            <p className="text-white/80 mt-2">{circuit.city}, {circuit.country}</p>
            
            {/* Lap Record Badge */}
            {circuit.lapRecord && (
              <div className="mt-4 inline-flex items-center gap-3 bg-primary/90 text-white px-4 py-2 rounded">
                <Zap className="w-4 h-4" />
                <div>
                  <div className="text-xs uppercase tracking-wide opacity-80">Lap Record</div>
                  <div className="font-bold">{circuit.lapRecord}</div>
                </div>
                {circuit.lapRecordHolder && (
                  <div className="text-sm opacity-80">
                    {circuit.lapRecordHolder} · {circuit.lapRecordYear}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pb-12">
        {/* Schedule Section */}
        <F1ScheduleSection races={races} />
        
        {/* Weather Section */}
        <F1WeatherSection city={circuit.city} />
        
        {/* Circuit Section */}
        <F1CircuitSection circuit={circuit} />
        
        {/* About Section */}
        <F1AboutSection circuit={circuit} />
        
        {/* Results Section */}
        <F1ResultsSection 
          results={historyData?.fullResults || []} 
          isLoading={historyLoading} 
        />
        
        {/* Statistics Section */}
        <F1StatsSection 
          circuit={circuit} 
          historyData={historyData} 
          isLoading={historyLoading} 
        />
      </div>
    </div>
  );
}