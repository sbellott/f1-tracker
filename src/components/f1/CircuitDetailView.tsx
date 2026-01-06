import { Circuit, Driver, Constructor, Race, Session } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Trophy, Zap, Calendar, ChevronDown, ChevronUp, Loader2, Flag, Play, Maximize2, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useCircuitHistory } from '@/lib/hooks/useF1Data';
import type { FullRaceResult } from '@/lib/services/circuit-history.service';
import { WeatherWidget } from './WeatherWidget';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

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
// TIMEZONE MAPPINGS
// ============================================
const cityToTimezone: Record<string, string> = {
  'Melbourne': 'Australia/Melbourne',
  'Shanghai': 'Asia/Shanghai',
  'Suzuka': 'Asia/Tokyo',
  'Sakhir': 'Asia/Bahrain',
  'Jeddah': 'Asia/Riyadh',
  'Miami': 'America/New_York',
  'Monte Carlo': 'Europe/Monaco',
  'Barcelona': 'Europe/Madrid',
  'Montreal': 'America/Toronto',
  'Spielberg': 'Europe/Vienna',
  'Silverstone': 'Europe/London',
  'Spa': 'Europe/Brussels',
  'Budapest': 'Europe/Budapest',
  'Zandvoort': 'Europe/Amsterdam',
  'Monza': 'Europe/Rome',
  'Baku': 'Asia/Baku',
  'Marina Bay': 'Asia/Singapore',
  'Austin': 'America/Chicago',
  'Mexico City': 'America/Mexico_City',
  'São Paulo': 'America/Sao_Paulo',
  'Las Vegas': 'America/Los_Angeles',
  'Lusail': 'Asia/Qatar',
  'Abu Dhabi': 'Asia/Dubai',
  'Madrid': 'Europe/Madrid',
  'Imola': 'Europe/Rome',
};

// User's timezone (France)
const USER_TIMEZONE = 'Europe/Paris';

// Country flag emojis by city
const cityToFlag: Record<string, string> = {
  'Melbourne': '🇦🇺',
  'Shanghai': '🇨🇳',
  'Suzuka': '🇯🇵',
  'Sakhir': '🇧🇭',
  'Jeddah': '🇸🇦',
  'Miami': '🇺🇸',
  'Monte Carlo': '🇲🇨',
  'Barcelona': '🇪🇸',
  'Montreal': '🇨🇦',
  'Spielberg': '🇦🇹',
  'Silverstone': '🇬🇧',
  'Spa': '🇧🇪',
  'Budapest': '🇭🇺',
  'Zandvoort': '🇳🇱',
  'Monza': '🇮🇹',
  'Baku': '🇦🇿',
  'Marina Bay': '🇸🇬',
  'Austin': '🇺🇸',
  'Mexico City': '🇲🇽',
  'São Paulo': '🇧🇷',
  'Las Vegas': '🇺🇸',
  'Lusail': '🇶🇦',
  'Abu Dhabi': '🇦🇪',
  'Madrid': '🇪🇸',
  'Imola': '🇮🇹',
};

// Helper to format time in a specific timezone
function formatTimeInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).format(date);
}

// Helper to format date in a specific timezone
function formatDateInTimezone(date: Date, timezone: string): { day: string; month: string } {
  const day = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    timeZone: timezone,
  }).format(date);
  
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: timezone,
  }).format(date);
  
  return { day, month };
}

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

// ============================================
// CIRCUIT VIDEO MAPPINGS
// ============================================
const cityToVideo: Record<string, string> = {
  'Shanghai': '/videos/chinese.mp4',
  // Add more videos as they become available:
  // 'Monte Carlo': '/videos/monaco.mp4',
  // 'Abu Dhabi': '/videos/abu-dhabi.mp4',
  // 'Las Vegas': '/videos/las-vegas.mp4',
  // 'Lusail': '/videos/qatar.mp4',
};

// Helper function to get circuit video URL
function getCircuitVideoUrl(city: string): string | null {
  return cityToVideo[city] || null;
}

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
function F1ScheduleSection({ races, city }: { races: Race[]; city: string }) {
  const [timeZone, setTimeZone] = useState<'track' | 'local'>('local');
  
  // Get track timezone
  const trackTimezone = cityToTimezone[city] || 'UTC';
  const activeTimezone = timeZone === 'local' ? USER_TIMEZONE : trackTimezone;
  
  // Get track flag
  const trackFlag = cityToFlag[city] || '🏁';
  
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
          className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
            timeZone === 'local' 
              ? 'bg-foreground text-background' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-base">🇫🇷</span>
          My time
        </button>
        <button
          onClick={() => setTimeZone('track')}
          className={`text-sm font-semibold px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${
            timeZone === 'track' 
              ? 'bg-foreground text-background' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="text-base">{trackFlag}</span>
          Track time
        </button>
      </div>

      {/* Sessions List */}
      <div className="bg-card">
        {sortedSessions.map((session, idx) => {
          const sessionDate = new Date(session.dateTime);
          const info = sessionTypeLabels[session.type] || { label: session.type, shortLabel: session.type };
          const isRace = session.type === 'RACE';
          
          // Format date and time in the selected timezone
          const { day, month } = formatDateInTimezone(sessionDate, activeTimezone);
          const formattedTime = formatTimeInTimezone(sessionDate, activeTimezone);
          
          return (
            <div 
              key={idx} 
              className={`f1-session-item ${isRace ? 'bg-muted/30' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Date Badge */}
                <div className="f1-date-badge">
                  <span className="f1-date-badge-day">
                    {day}
                  </span>
                  <span className="f1-date-badge-month">
                    {month}
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
                  {formattedTime}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
  const [activeSlide, setActiveSlide] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreenPlaying, setIsFullscreenPlaying] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenType, setFullscreenType] = useState<'image' | 'video'>('image');

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
  
  // Get circuit video URL if available
  const videoUrl = getCircuitVideoUrl(circuit.city);

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleFullscreenVideoToggle = () => {
    if (fullscreenVideoRef.current) {
      if (isFullscreenPlaying) {
        fullscreenVideoRef.current.pause();
      } else {
        fullscreenVideoRef.current.play();
      }
      setIsFullscreenPlaying(!isFullscreenPlaying);
    }
  };

  const openFullscreen = (type: 'image' | 'video') => {
    setFullscreenType(type);
    setFullscreenOpen(true);
    // Reset video state when opening
    if (type === 'video') {
      setIsFullscreenPlaying(false);
    }
  };

  const closeFullscreen = () => {
    setFullscreenOpen(false);
    // Pause fullscreen video when closing
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
      setIsFullscreenPlaying(false);
    }
  };

  return (
    <section className="py-8">
      <h2 className="f1-section-title">Circuit</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Track Map / Video Carousel */}
        <div className="bg-card p-6">
          {videoUrl ? (
            <Carousel 
              className="w-full"
              opts={{ loop: true }}
            >
              <CarouselContent>
                {/* Slide 1: Track Map */}
                <CarouselItem>
                  <div 
                    className="aspect-square relative flex items-center justify-center group cursor-pointer"
                    onClick={() => openFullscreen('image')}
                  >
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
                    {/* Fullscreen button overlay */}
                    <button
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFullscreen('image');
                      }}
                    >
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </CarouselItem>
                
                {/* Slide 2: Circuit Video */}
                <CarouselItem>
                  <div className="aspect-square relative flex items-center justify-center bg-black rounded-lg overflow-hidden group">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      className="w-full h-full object-contain"
                      loop
                      playsInline
                      muted
                      onClick={handleVideoToggle}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {/* Play/Pause overlay */}
                    {!isPlaying && (
                      <button
                        onClick={handleVideoToggle}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl">
                          <Play className="w-10 h-10 text-white ml-1" fill="white" />
                        </div>
                      </button>
                    )}
                    {/* Fullscreen button */}
                    <button
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFullscreen('video');
                      }}
                    >
                      <Maximize2 className="w-5 h-5 text-white" />
                    </button>
                    {/* Video label */}
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full">
                      🎬 Circuit Tour
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              
              {/* Navigation */}
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
              
              {/* Indicators */}
              <div className="flex justify-center gap-2 mt-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Track Map
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Circuit Video
                </div>
              </div>
            </Carousel>
          ) : (
            /* Original single image view when no video available */
            <div 
              className="aspect-square relative flex items-center justify-center group cursor-pointer"
              onClick={() => openFullscreen('image')}
            >
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
              {/* Fullscreen button overlay */}
              <button
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  openFullscreen('image');
                }}
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
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

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black border-none">
          <DialogTitle className="sr-only">
            {fullscreenType === 'image' ? `${circuit.name} Track Layout` : `${circuit.name} Circuit Tour`}
          </DialogTitle>
          
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {fullscreenType === 'image' ? (
            /* Fullscreen Image */
            <div className="flex items-center justify-center w-[90vw] h-[90vh]">
              <ImageWithFallback
                src={trackMapUrl}
                alt={`${circuit.name} Track Layout`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            /* Fullscreen Video */
            <div className="relative flex items-center justify-center w-[90vw] h-[90vh] bg-black">
              <video
                ref={fullscreenVideoRef}
                src={videoUrl || ''}
                className="max-w-full max-h-full object-contain"
                loop
                playsInline
                onClick={handleFullscreenVideoToggle}
                onPlay={() => setIsFullscreenPlaying(true)}
                onPause={() => setIsFullscreenPlaying(false)}
              />
              {/* Play/Pause overlay for fullscreen */}
              {!isFullscreenPlaying && (
                <button
                  onClick={handleFullscreenVideoToggle}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
                >
                  <div className="w-24 h-24 rounded-full bg-primary/90 flex items-center justify-center shadow-2xl">
                    <Play className="w-12 h-12 text-white ml-1" fill="white" />
                  </div>
                </button>
              )}
              {/* Video label */}
              <div className="absolute bottom-6 left-6 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
                🎬 {circuit.name} - Circuit Tour
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
        {/* Statistics Section */}
        <F1StatsSection 
          circuit={circuit} 
          historyData={historyData} 
          isLoading={historyLoading} 
        />
        
        {/* Schedule & Weather - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Schedule Section */}
          <F1ScheduleSection races={races} city={circuit.city} />
          
          {/* Weather Section */}
          <F1WeatherSection city={circuit.city} />
        </div>
        
        {/* Circuit Section */}
        <F1CircuitSection circuit={circuit} />
        
        {/* Results Section */}
        <F1ResultsSection 
          results={historyData?.fullResults || []} 
          isLoading={historyLoading} 
        />
        
        {/* About Section */}
        <F1AboutSection circuit={circuit} />
      </div>
    </div>
  );
}