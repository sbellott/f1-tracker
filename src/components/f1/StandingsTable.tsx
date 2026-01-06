import { Driver, Constructor, Race, SessionResults } from '@/types';
import { Standing } from '@/lib/hooks/useF1Data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, Minus, Trophy, Target, User, ChevronLeft, ChevronRight, Globe, Flag } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useMemo } from 'react';

// Drivers without F1.com images (2026 rookies or new team drivers)
const driversWithoutImages = new Set([
  'Isack Hadjar',
  'Arvid Lindblad', 
  'Valtteri Bottas',
  'Sergio Pérez',
  'Sergio Perez',
  'Nico Hülkenberg',
  'Nico Hulkenberg',
  'Gabriel Bortoleto',
]);

// Special driver image overrides for drivers who changed teams or are new
// Maps "FirstName LastName" to team-specific images OR a default image
// Format: { teamName: { year, teamSlug, driverCode } } OR { default: { year, teamSlug, driverCode } }
const driverImageOverrides: Record<string, Record<string, { year: string; teamSlug: string; driverCode: string }>> = {
  'Carlos Sainz': {
    'Ferrari': { year: '2024', teamSlug: 'ferrari', driverCode: 'carsai01' },
    'Williams': { year: '2025', teamSlug: 'williams', driverCode: 'carsai01' },
    'default': { year: '2025', teamSlug: 'williams', driverCode: 'carsai01' },
  },
  'Isack Hadjar': {
    'Racing Bulls': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
    'RB': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
    'RB F1 Team': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
    'Red Bull Racing': { year: '2026', teamSlug: 'redbullracing', driverCode: 'isahad01' },
    'Red Bull': { year: '2026', teamSlug: 'redbullracing', driverCode: 'isahad01' },
    'default': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
  },
  'Arvid Lindblad': {
    'default': { year: '2026', teamSlug: 'racingbulls', driverCode: 'arvlin01' },
  },
  'Valtteri Bottas': {
    'Kick Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
    'Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
    'Alfa Romeo': { year: '2023', teamSlug: 'alfaromeo', driverCode: 'valbot01' },
    'Mercedes': { year: '2021', teamSlug: 'mercedes', driverCode: 'valbot01' },
    'default': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
  },
  'Sergio Pérez': {
    'Red Bull Racing': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
    'Red Bull': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
    'Racing Point': { year: '2020', teamSlug: 'racingpoint', driverCode: 'serper01' },
    'default': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
  },
  'Sergio Perez': {
    'Red Bull Racing': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
    'Red Bull': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
    'Racing Point': { year: '2020', teamSlug: 'racingpoint', driverCode: 'serper01' },
    'default': { year: '2024', teamSlug: 'redbullracing', driverCode: 'serper01' },
  },
  'Nico Hülkenberg': {
    'Kick Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Haas': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'Haas F1 Team': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'default': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
  },
  'Nico Hulkenberg': {
    'Kick Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Haas': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'Haas F1 Team': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'default': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
  },
  'Gabriel Bortoleto': {
    'default': { year: '2025', teamSlug: 'kicksauber', driverCode: 'gabbor01' },
  },
  'Daniel Ricciardo': {
    'Racing Bulls': { year: '2024', teamSlug: 'racingbulls', driverCode: 'danric01' },
    'RB': { year: '2024', teamSlug: 'racingbulls', driverCode: 'danric01' },
    'AlphaTauri': { year: '2023', teamSlug: 'alphatauri', driverCode: 'danric01' },
    'McLaren': { year: '2022', teamSlug: 'mclaren', driverCode: 'danric01' },
    'default': { year: '2024', teamSlug: 'racingbulls', driverCode: 'danric01' },
  },
  'Kevin Magnussen': {
    'Haas': { year: '2024', teamSlug: 'haasf1team', driverCode: 'kevmag01' },
    'Haas F1 Team': { year: '2024', teamSlug: 'haasf1team', driverCode: 'kevmag01' },
    'default': { year: '2024', teamSlug: 'haasf1team', driverCode: 'kevmag01' },
  },
  'Zhou Guanyu': {
    'Kick Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'guazho01' },
    'Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'guazho01' },
    'Alfa Romeo': { year: '2023', teamSlug: 'alfaromeo', driverCode: 'guazho01' },
    'default': { year: '2024', teamSlug: 'kicksauber', driverCode: 'guazho01' },
  },
  'Logan Sargeant': {
    'Williams': { year: '2024', teamSlug: 'williams', driverCode: 'logsar01' },
    'default': { year: '2024', teamSlug: 'williams', driverCode: 'logsar01' },
  },
  'Nyck de Vries': {
    'AlphaTauri': { year: '2023', teamSlug: 'alphatauri', driverCode: 'nycdev01' },
    'default': { year: '2023', teamSlug: 'alphatauri', driverCode: 'nycdev01' },
  },
  'Lewis Hamilton': {
    'Ferrari': { year: '2025', teamSlug: 'ferrari', driverCode: 'lewham01' },
    'Mercedes': { year: '2024', teamSlug: 'mercedes', driverCode: 'lewham01' },
    'default': { year: '2025', teamSlug: 'ferrari', driverCode: 'lewham01' },
  },
};

// Driver initials fallback component
function DriverInitials({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center font-bold text-white text-base">
      {initials}
    </div>
  );
}

// Custom Audi Logo Component (4 interlocking rings)
function AudiLogo({ className = "", color = "#E30613" }: { className?: string; color?: string }) {
  return (
    <svg 
      viewBox="0 0 100 30" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ring 1 */}
      <circle cx="18" cy="15" r="12" stroke={color} strokeWidth="2.5" fill="none" />
      {/* Ring 2 */}
      <circle cx="36" cy="15" r="12" stroke={color} strokeWidth="2.5" fill="none" />
      {/* Ring 3 */}
      <circle cx="54" cy="15" r="12" stroke={color} strokeWidth="2.5" fill="none" />
      {/* Ring 4 */}
      <circle cx="72" cy="15" r="12" stroke={color} strokeWidth="2.5" fill="none" />
    </svg>
  );
}

// Custom Cadillac Logo Component (simplified crest)
function CadillacLogo({ className = "", color = "#D4AF37" }: { className?: string; color?: string }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield outline */}
      <path 
        d="M20 2 L36 8 L36 22 C36 30 28 36 20 38 C12 36 4 30 4 22 L4 8 Z" 
        stroke={color} 
        strokeWidth="2" 
        fill="none"
      />
      {/* Crown/crest elements */}
      <path 
        d="M12 14 L20 10 L28 14 M12 20 L20 16 L28 20 M12 26 L20 22 L28 26" 
        stroke={color} 
        strokeWidth="1.5" 
        fill="none"
      />
    </svg>
  );
}

// Team name to F1.com slug mapping
const teamToSlug: Record<string, string> = {
  'McLaren': 'mclaren',
  'Red Bull Racing': 'redbullracing',
  'Red Bull': 'redbullracing',
  'Ferrari': 'ferrari',
  'Mercedes': 'mercedes',
  'Aston Martin': 'astonmartin',
  'Alpine': 'alpine',
  'Alpine F1 Team': 'alpine',
  'Williams': 'williams',
  'Racing Bulls': 'racingbulls',
  'RB': 'racingbulls',
  'RB F1 Team': 'racingbulls',
  'Haas F1 Team': 'haasf1team',
  'Haas': 'haasf1team',
  'Kick Sauber': 'kicksauber',
  'Sauber': 'kicksauber',
  'Audi': 'audi',
  'Cadillac F1 Team': 'cadillac',
  'Cadillac': 'cadillac',
  // Historical team names
  'AlphaTauri': 'alphatauri',
  'Scuderia AlphaTauri': 'alphatauri',
  'Alfa Romeo': 'alfaromeo',
  'Alfa Romeo Racing': 'alfaromeo',
  'Alfa Romeo F1 Team Stake': 'alfaromeo',
  'Toro Rosso': 'tororosso',
  'Scuderia Toro Rosso': 'tororosso',
  'Renault': 'renault',
  'Renault F1 Team': 'renault',
  'Racing Point': 'racingpoint',
  'BWT Racing Point F1 Team': 'racingpoint',
};

// Team colors fallback (when not in database)
const teamColors: Record<string, string> = {
  'McLaren': '#FF8000',
  'Red Bull Racing': '#3671C6',
  'Red Bull': '#3671C6',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Aston Martin': '#229971',
  'Alpine': '#0093CC',
  'Alpine F1 Team': '#0093CC',
  'Williams': '#64C4FF',
  'Racing Bulls': '#6692FF',
  'RB': '#6692FF',
  'RB F1 Team': '#6692FF',
  'Haas F1 Team': '#B6BABD',
  'Haas': '#B6BABD',
  'Kick Sauber': '#52E252',
  'Sauber': '#52E252',
  'Audi': '#E30613',
  'Audi F1 Team': '#E30613',
  'Stake F1 Team Kick Sauber': '#E30613',
  'Cadillac F1 Team': '#D4AF37',
  'Cadillac': '#D4AF37',
  // Historical team colors
  'AlphaTauri': '#2B4562',
  'Scuderia AlphaTauri': '#2B4562',
  'Alfa Romeo': '#900000',
  'Alfa Romeo Racing': '#900000',
  'Alfa Romeo F1 Team Stake': '#900000',
  'Toro Rosso': '#469BFF',
  'Scuderia Toro Rosso': '#469BFF',
  'Renault': '#FFF500',
  'Renault F1 Team': '#FFF500',
  'Racing Point': '#F596C8',
  'BWT Racing Point F1 Team': '#F596C8',
};

// Helper function to get team color with robust fallback
function getTeamColorFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  // Direct match
  if (teamColors[name]) return teamColors[name];
  // Case-insensitive match
  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(teamColors)) {
    if (key.toLowerCase() === lowerName) return color;
  }
  // Partial match
  for (const [key, color] of Object.entries(teamColors)) {
    if (name.includes(key) || key.includes(name)) return color;
  }
  return null;
}

// Driver code mapping (firstName lastName -> F1 code)
const driverCodeMap: Record<string, string> = {
  'Lando Norris': 'lannor01',
  'Max Verstappen': 'maxver01',
  'Oscar Piastri': 'oscpia01',
  'George Russell': 'georus01',
  'Charles Leclerc': 'chalec01',
  'Lewis Hamilton': 'lewham01',
  'Kimi Antonelli': 'andant01',
  'Andrea Kimi Antonelli': 'andant01',
  'Alexander Albon': 'alealb01',
  'Carlos Sainz': 'carsai01',
  'Fernando Alonso': 'feralo01',
  'Nico Hulkenberg': 'nichul01',
  'Nico Hülkenberg': 'nichul01',
  'Isack Hadjar': 'isahad01',
  'Oliver Bearman': 'olibea01',
  'Liam Lawson': 'lialaw01',
  'Esteban Ocon': 'estoco01',
  'Lance Stroll': 'lanstr01',
  'Yuki Tsunoda': 'yuktsu01',
  'Pierre Gasly': 'piegas01',
  'Gabriel Bortoleto': 'gabbor01',
  'Franco Colapinto': 'fracol01',
  'Jack Doohan': 'jacdoo01',
  'Valtteri Bottas': 'valbot01',
  'Sergio Pérez': 'serper01',
  'Sergio Perez': 'serper01',
  'Arvid Lindblad': 'arvlin01',
};

// F1 Official driver headshot URL (circular badge style)
function getDriverHeadshotUrl(firstName: string, lastName: string, teamName: string): string {
  const fullName = `${firstName} ${lastName}`;
  
  // Check for special override (drivers who changed teams or new rookies)
  const driverOverrides = driverImageOverrides[fullName];
  if (driverOverrides) {
    // First try to find team-specific override
    const teamOverride = driverOverrides[teamName];
    if (teamOverride) {
      return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000000/common/f1/${teamOverride.year}/${teamOverride.teamSlug}/${teamOverride.driverCode}/${teamOverride.year}${teamOverride.teamSlug}${teamOverride.driverCode}right.webp`;
    }
    // Fall back to default override if no team-specific one
    const defaultOverride = driverOverrides['default'];
    if (defaultOverride) {
      return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000000/common/f1/${defaultOverride.year}/${defaultOverride.teamSlug}/${defaultOverride.driverCode}/${defaultOverride.year}${defaultOverride.teamSlug}${defaultOverride.driverCode}right.webp`;
    }
  }
  
  // Default URL generation for standard drivers
  const driverCode = driverCodeMap[fullName] || `${firstName.substring(0, 3).toLowerCase()}${lastName.substring(0, 3).toLowerCase()}01`;
  const teamSlug = teamToSlug[teamName] || teamName.toLowerCase().replace(/\s+/g, '');
  return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/${teamSlug}/${driverCode}/2025${teamSlug}${driverCode}right.webp`;
}

// F1 Official team logo URL (white logo for dark backgrounds)
function getTeamLogoUrl(teamName: string): string {
  const teamSlug = teamToSlug[teamName] || teamName.toLowerCase().replace(/\s+/g, '');
  return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000000/common/f1/2025/${teamSlug}/2025${teamSlug}logowhite.webp`;
}

interface StandingsTableProps {
  standings: Standing[];
  drivers?: Driver[];
  constructors?: Constructor[];
  races?: Race[];
  type: 'drivers' | 'constructors';
  selectedRaceId?: string | null;
  onRaceSelect?: (raceId: string | null) => void;
  onDriverClick?: (driverId: string) => void;
  onConstructorClick?: (constructorId: string) => void;
}

// Race result position interface
interface RacePosition {
  position: number;
  driverId: string;
  driverCode: string;
  driverName: string;
  constructorId: string;
  constructorName: string;
  time?: string;
  laps?: number;
  points?: number;
  status?: string;
  fastestLap?: boolean;
  gridPosition?: number;
}

export function StandingsTable({ 
  standings, 
  drivers, 
  constructors, 
  races,
  type,
  selectedRaceId: externalSelectedRaceId,
  onRaceSelect,
  onDriverClick,
  onConstructorClick
}: StandingsTableProps) {
  // Use external selectedRaceId if provided (global filter mode)
  const selectedRaceId = externalSelectedRaceId ?? null;
  
  // Get all races for reference
  const allRaces = useMemo(() => {
    if (!races) return [];
    return races.filter(race => {
      return race.sessions?.some(s => s.type === 'RACE');
    });
  }, [races]);

  // Check if a race has results
  const raceHasResults = (raceId: string) => {
    if (!races) return false;
    const race = races.find(r => r.id === raceId);
    if (!race) return false;
    const raceSession = race.sessions?.find(s => s.type === 'RACE');
    return (raceSession?.results?.positions?.length ?? 0) > 0 || raceSession?.completed;
  };

  // Get race results for selected race
  const selectedRaceResults = useMemo(() => {
    if (!selectedRaceId || !races) return null;
    const race = races.find(r => r.id === selectedRaceId);
    if (!race) return null;
    const raceSession = race.sessions?.find(s => s.type === 'RACE');
    return raceSession?.results || null;
  }, [selectedRaceId, races]);

  // Get selected race info
  const selectedRace = useMemo(() => {
    if (!selectedRaceId || !races) return null;
    return races.find(r => r.id === selectedRaceId) || null;
  }, [selectedRaceId, races]);

  const getPositionChange = (standing: Standing) => {
    if (!standing.previousPosition) return null;
    const change = standing.previousPosition - standing.position;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getDriver = (id: string) => drivers?.find(d => d.id === id);
  const getConstructor = (id: string) => constructors?.find(c => c.id === id);
  
  // Find driver by code or name for race results
  const findDriverByCodeOrName = (driverCode: string, driverName: string) => {
    return drivers?.find(d => 
      d.code === driverCode || 
      `${d.firstName} ${d.lastName}`.toLowerCase() === driverName.toLowerCase()
    );
  };

  // Handle row click
  const handleRowClick = (driverId: string | undefined, constructorId: string | undefined) => {
    if (type === 'drivers' && driverId && onDriverClick) {
      onDriverClick(driverId);
    } else if (type === 'constructors' && constructorId && onConstructorClick) {
      onConstructorClick(constructorId);
    }
  };

  // Aggregate constructor results from race positions
  const constructorRaceResults = useMemo(() => {
    if (!selectedRaceResults?.positions || type !== 'constructors') return null;
    
    const constructorMap = new Map<string, {
      constructorId: string;
      constructorName: string;
      points: number;
      positions: number[];
      bestPosition: number;
    }>();

    selectedRaceResults.positions.forEach((pos: RacePosition) => {
      const key = pos.constructorId || pos.constructorName;
      if (!key) return;
      
      const existing = constructorMap.get(key);
      const posPoints = pos.points || 0;
      
      if (existing) {
        existing.points += posPoints;
        existing.positions.push(pos.position);
        existing.bestPosition = Math.min(existing.bestPosition, pos.position);
      } else {
        constructorMap.set(key, {
          constructorId: pos.constructorId,
          constructorName: pos.constructorName,
          points: posPoints,
          positions: [pos.position],
          bestPosition: pos.position,
        });
      }
    });

    // Sort by points (desc), then by best position (asc)
    return Array.from(constructorMap.values())
      .sort((a, b) => b.points - a.points || a.bestPosition - b.bestPosition);
  }, [selectedRaceResults, type]);

  // Render race results view or "no results" message
  const renderRaceResults = () => {
    if (!selectedRace) return null;

    // Check if race has results
    if (!selectedRaceResults || !selectedRaceResults.positions?.length) {
      const raceDate = new Date(selectedRace.date);
      const isPast = raceDate < new Date();
      
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
            {isPast ? (
              <Trophy className="w-10 h-10 text-muted-foreground" />
            ) : (
              <Flag className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {isPast ? "Résultats non disponibles" : "Course à venir"}
          </h3>
          <p className="text-muted-foreground max-w-md">
            {isPast 
              ? "Les résultats de cette course n'ont pas encore été synchronisés."
              : `Cette course aura lieu le ${raceDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}.`
            }
          </p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => onRaceSelect?.(null)}
          >
            <Globe className="w-4 h-4 mr-2" />
            Voir le classement global
          </Button>
        </div>
      );
    }

    // Render constructor results if in constructor view
    if (type === 'constructors' && constructorRaceResults) {
      return (
        <div className="divide-y divide-border/50">
          {constructorRaceResults.map((result, index) => {
            const constructor = constructors?.find(c => 
              c.id === result.constructorId || 
              c.name.toLowerCase() === result.constructorName?.toLowerCase()
            );
            
            const teamColor = constructor?.color || getTeamColorFromName(result.constructorName) || '#333';
            const isPodium = index < 3;
            const isClickable = onConstructorClick && constructor;

            return (
              <div 
                key={result.constructorId || result.constructorName} 
                onClick={() => constructor && handleRowClick(undefined, constructor.id)}
                className={`flex items-center gap-5 p-5 transition-all hover:bg-muted/30 group ${
                  isPodium ? 'bg-gradient-to-r from-primary/5 via-transparent to-transparent' : ''
                } ${isClickable ? 'cursor-pointer' : ''}`}
              >
                {/* Position */}
                <div className="flex items-center gap-3 w-20">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-lg shadow-sm transition-all group-hover:shadow-md ${
                    isPodium 
                      ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/20' 
                      : 'bg-muted text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                </div>

                {/* Team Color Bar */}
                <div className="relative">
                  <div 
                    className="w-1.5 h-14 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: teamColor,
                      boxShadow: `0 0 20px ${teamColor}40`
                    }}
                  />
                </div>

                {/* Constructor Info */}
                <div className="flex-1 min-w-0 flex items-center gap-3">
                  <div 
                    className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center p-2"
                    style={{ backgroundColor: teamColor }}
                  >
                    {(result.constructorName === 'Audi' || result.constructorName?.includes('Audi')) ? (
                      <AudiLogo className="w-full h-full" color="#FFFFFF" />
                    ) : (result.constructorName === 'Cadillac' || result.constructorName?.includes('Cadillac')) ? (
                      <CadillacLogo className="w-full h-full" color="#FFFFFF" />
                    ) : (
                      <ImageWithFallback
                        src={(constructor as any)?.logoUrl || getTeamLogoUrl(result.constructorName)}
                        alt={result.constructorName}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate leading-tight mb-1">
                      {result.constructorName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Positions: {result.positions.sort((a, b) => a - b).join(', ')}
                    </div>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right min-w-[80px]">
                  <div className="text-3xl font-bold tabular-nums bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {result.points}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    points
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Render driver results (existing logic)
    const positions = selectedRaceResults.positions || [];

    return (
      <div className="divide-y divide-border/50">
        {positions.map((pos: RacePosition) => {
          const driver = findDriverByCodeOrName(pos.driverCode, pos.driverName);
          const constructor = constructors?.find(c => 
            c.id === pos.constructorId || 
            c.name.toLowerCase() === pos.constructorName?.toLowerCase()
          );
          
          const teamColor = constructor?.color || getTeamColorFromName(pos.constructorName) || '#333';
          const isPodium = pos.position <= 3;
          const isClickable = type === 'drivers' && onDriverClick && driver;

          return (
            <div 
              key={pos.position} 
              onClick={() => driver && handleRowClick(driver.id, undefined)}
              className={`flex items-center gap-5 p-5 transition-all hover:bg-muted/30 group ${
                isPodium ? 'bg-gradient-to-r from-primary/5 via-transparent to-transparent' : ''
              } ${isClickable ? 'cursor-pointer' : ''}`}
            >
              {/* Position */}
              <div className="flex items-center gap-3 w-20">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-lg shadow-sm transition-all group-hover:shadow-md ${
                  isPodium 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/20' 
                    : 'bg-muted text-foreground'
                }`}>
                  {pos.position}
                </div>
              </div>

              {/* Team Color Bar */}
              <div className="relative">
                <div 
                  className="w-1.5 h-14 rounded-full shadow-lg" 
                  style={{ 
                    backgroundColor: teamColor,
                    boxShadow: `0 0 20px ${teamColor}40`
                  }}
                />
              </div>

              {/* Driver Info */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {driver ? (
                  <>
                    <div 
                      className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: teamColor }}
                    >
                      <ImageWithFallback
                        src={getDriverHeadshotUrl(driver.firstName, driver.lastName, pos.constructorName || '')}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-lg truncate leading-tight mb-1">
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {pos.constructorName}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="min-w-0">
                    <div className="font-bold text-lg truncate leading-tight mb-1">
                      {pos.driverName || pos.driverCode}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {pos.constructorName}
                    </div>
                  </div>
                )}
              </div>

              {/* Race Stats */}
              <div className="flex gap-2 items-center">
                {pos.fastestLap && (
                  <Badge className="gap-1 bg-purple-100 dark:bg-purple-950/50 border-purple-300 dark:border-purple-900/50 text-purple-900 dark:text-purple-100">
                    <span className="text-xs">⏱️ FL</span>
                  </Badge>
                )}
                {pos.status && pos.status !== 'Finished' && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {pos.status}
                  </Badge>
                )}
              </div>

              {/* Time/Points */}
              <div className="text-right min-w-[100px]">
                {pos.time ? (
                  <>
                    <div className="text-lg font-semibold tabular-nums">
                      {pos.position === 1 ? pos.time : `+${pos.time}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pos.laps} laps
                    </div>
                  </>
                ) : (
                  <div className="text-lg font-semibold text-muted-foreground">
                    {pos.status || 'DNF'}
                  </div>
                )}
                {pos.points !== undefined && pos.points > 0 && (
                  <Badge className="mt-1 bg-primary/10 text-primary border-primary/20">
                    +{pos.points} pts
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render global standings (existing logic)
  const renderGlobalStandings = () => {
    return (
      <div className="divide-y divide-border/50">
        {standings.map((standing, index) => {
          const embeddedDriver = type === 'drivers' ? standing.driver : null;
          const lookupDriver = type === 'drivers' && standing.driverId ? getDriver(standing.driverId) : null;
          const driver = embeddedDriver || lookupDriver;

          const embeddedConstructor = type === 'constructors' ? standing.constructor : null;
          const lookupConstructor = type === 'constructors' && standing.constructorId ? getConstructor(standing.constructorId) : null;
          const constructor = embeddedConstructor || lookupConstructor;

          const dbTeamColor = type === 'drivers'
            ? (embeddedDriver?.constructor?.color || (lookupDriver?.constructorId ? getConstructor(lookupDriver.constructorId)?.color : null))
            : (constructor?.color || null);

          let teamName: string | null = null;
          if (type === 'drivers') {
            teamName = embeddedDriver?.constructor?.name 
              || (lookupDriver?.constructorId ? getConstructor(lookupDriver.constructorId)?.name : null)
              || (standing as any).constructorName
              || null;
          }
          
          const constructorName = type === 'constructors' ? constructor?.name : teamName;
          const forcedColor = constructorName ? getTeamColorFromName(constructorName) : null;
          const teamColor = forcedColor || dbTeamColor || '#333';
            
          const isPodium = standing.position <= 3;
          
          // Determine if row is clickable
          const isClickable = (type === 'drivers' && onDriverClick && driver) || 
                             (type === 'constructors' && onConstructorClick && constructor);

          return (
            <div 
              key={standing.position} 
              onClick={() => handleRowClick(
                type === 'drivers' ? (driver?.id || standing.driverId) : undefined,
                type === 'constructors' ? (constructor?.id || standing.constructorId) : undefined
              )}
              className={`flex items-center gap-5 p-5 transition-all hover:bg-muted/30 group ${
                isPodium ? 'bg-gradient-to-r from-primary/5 via-transparent to-transparent' : ''
              } ${isClickable ? 'cursor-pointer' : ''}`}
            >
              {/* Position */}
              <div className="flex items-center gap-3 w-20">
                <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-bold text-lg shadow-sm transition-all group-hover:shadow-md ${
                  isPodium 
                    ? 'bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/20' 
                    : 'bg-muted text-foreground'
                }`}>
                  {standing.position}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {getPositionChange(standing)}
                </div>
              </div>

              {/* Team Color Bar */}
              {teamColor && (
                <div className="relative">
                  <div 
                    className="w-1.5 h-14 rounded-full shadow-lg" 
                    style={{ 
                      backgroundColor: teamColor,
                      boxShadow: `0 0 20px ${teamColor}40`
                    }}
                  />
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0 flex items-center gap-3">
                {type === 'drivers' && driver && (
                  <>
                    <div 
                      className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: teamColor || getTeamColorFromName(teamName) || '#333' }}
                    >
                      <ImageWithFallback
                        src={embeddedDriver?.photoUrl || getDriverHeadshotUrl(driver.firstName, driver.lastName, teamName || '')}
                        alt={`${driver.firstName} ${driver.lastName}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-lg truncate leading-tight mb-1">
                        {driver.firstName} {driver.lastName}
                      </div>
                      {teamName && (
                        <div className="text-sm text-muted-foreground truncate">
                          {teamName}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {type === 'constructors' && constructor && (
                  <>
                    <div 
                      className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center p-2"
                      style={{ backgroundColor: constructor.color || teamColors[constructor.name] || '#333' }}
                    >
                      {(constructor.name === 'Audi' || constructor.name?.includes('Audi')) ? (
                        <AudiLogo className="w-full h-full" color="#FFFFFF" />
                      ) : (constructor.name === 'Cadillac' || constructor.name?.includes('Cadillac')) ? (
                        <CadillacLogo className="w-full h-full" color="#FFFFFF" />
                      ) : (
                        <ImageWithFallback
                          src={(constructor as any).logoUrl || getTeamLogoUrl(constructor.name)}
                          alt={constructor.name}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="font-bold text-lg truncate">{constructor.name}</div>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-2">
                {standing.wins > 0 && (
                  <Badge className="gap-1.5 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-950/30 border-amber-300 dark:border-amber-900/50 text-amber-900 dark:text-amber-100 shadow-sm hover:shadow-md transition-shadow">
                    <Trophy className="w-3.5 h-3.5" />
                    <span className="font-semibold">{standing.wins}</span>
                  </Badge>
                )}
                {standing.poles && standing.poles > 0 && (
                  <Badge className="gap-1.5 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950/50 dark:to-blue-950/30 border-blue-300 dark:border-blue-900/50 text-blue-900 dark:text-blue-100 shadow-sm hover:shadow-md transition-shadow">
                    <Target className="w-3.5 h-3.5" />
                    <span className="font-semibold">{standing.poles}</span>
                  </Badge>
                )}
              </div>

              {/* Points */}
              <div className="text-right min-w-[80px]">
                <div className="text-3xl font-bold tabular-nums bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {standing.points}
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  points
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
        <CardTitle className="text-2xl">
          {type === 'drivers' 
            ? 'Classement pilotes' 
            : 'Classement constructeurs'
          }
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Standings Content */}
        {selectedRaceId ? renderRaceResults() : renderGlobalStandings()}
      </CardContent>
    </Card>
  );
}