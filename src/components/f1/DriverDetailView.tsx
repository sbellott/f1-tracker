import { Driver, Constructor, Race } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Award, Calendar, Flag, MapPin, Trophy, Zap, TrendingUp, Medal } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { format } from 'date-fns';

interface DriverDetailViewProps {
  driver: Driver;
  constructor: Constructor;
  races: Race[];
  onBack: () => void;
  driverImage: string;
}

export function DriverDetailView({ driver, constructor, races, onBack, driverImage }: DriverDetailViewProps) {
  // Mock recent race results
  const recentResults = [
    { race: races[0], position: 1, points: 25, fastestLap: true },
    { race: races[1], position: 3, points: 15, fastestLap: false },
    { race: races[2], position: 2, points: 18, fastestLap: true },
    { race: races[3], position: 1, points: 25, fastestLap: false },
    { race: races[4], position: 4, points: 12, fastestLap: false },
  ].filter(r => r.race);

  const careerHighlights = [
    { label: 'First win', value: 'Monaco 2020', icon: Trophy },
    { label: 'First pole', value: 'Silverstone 2019', icon: Zap },
    { label: 'Best result', value: '1st', icon: Medal },
    { label: 'Races finished', value: `${Math.round((driver.stats.gp * 0.85))}/${driver.stats.gp}`, icon: Flag },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="gap-2 hover:bg-muted/50 rounded-xl"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to drivers
      </Button>

      {/* Hero Section */}
      <Card className="overflow-hidden border-border/50 shadow-2xl">
        <div className="relative">
          {/* Background Image */}
          <div className="relative h-80 lg:h-96 overflow-hidden">
            <ImageWithFallback
              src={driverImage}
              alt={`${driver.firstName} ${driver.lastName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
            
            {/* Team Color Bar */}
            <div 
              className="absolute top-0 left-0 right-0 h-2"
              style={{ backgroundColor: constructor.color }}
            />
          </div>

          {/* Driver Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge 
                    className="text-3xl font-bold h-16 w-16 rounded-2xl backdrop-blur-xl bg-white/90 dark:bg-black/70 text-black dark:text-white border-0 flex items-center justify-center shadow-2xl"
                  >
                    {driver.number}
                  </Badge>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{driver.code}</div>
                    <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                      {driver.firstName} <span className="uppercase">{driver.lastName}</span>
                    </h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: constructor.color }}
                  />
                  <span className="text-white font-semibold text-xl drop-shadow">{constructor.name}</span>
                </div>
              </div>

              {/* Championship Position */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 backdrop-blur-xl p-6 text-white shadow-2xl">
                <div className="text-sm mb-1 opacity-90">Classement</div>
                <div className="text-5xl font-bold">P1</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-transparent">
              {driver.stats.wins}
            </div>
            <div className="text-sm text-muted-foreground">Wins</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-accent" />
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">
              {driver.stats.podiums}
            </div>
            <div className="text-sm text-muted-foreground">Podiums</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-chart-3" />
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-chart-3 to-chart-3/70 bg-clip-text text-transparent">
              {driver.stats.poles}
            </div>
            <div className="text-sm text-muted-foreground">Pole Positions</div>
          </CardHeader>
        </Card>

        <Card className="border-border/50 overflow-hidden group hover:shadow-lg transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-chart-4/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-chart-4" />
              <div className="text-xs text-muted-foreground">2026 Season</div>
            </div>
            <div className="text-4xl font-bold bg-gradient-to-br from-chart-4 to-chart-4/70 bg-clip-text text-transparent">
              {driver.stats.points}
            </div>
            <div className="text-sm text-muted-foreground">Points</div>
          </CardHeader>
        </Card>
      </div>

      {/* Career Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biography & Info */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <Flag className="w-4 h-4 text-white" />
              </div>
              Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Nationality</div>
                <div className="font-semibold">{driver.nationality}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Date of birth</div>
                <div className="font-semibold">
                  {format(new Date(driver.dateOfBirth), 'MMM d, yyyy')}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Age</div>
                <div className="font-semibold">
                  {new Date().getFullYear() - new Date(driver.dateOfBirth).getFullYear()} years
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Grand Prix</div>
                <div className="font-semibold">{driver.stats.gp}</div>
              </div>
            </div>

            {driver.stats.titles > 0 && (
              <div className="pt-4 border-t border-border/50">
                <Badge className="w-full justify-center py-3 bg-gradient-to-r from-chart-5 to-chart-5/80 text-white border-0 shadow-lg shadow-chart-5/20">
                  <Trophy className="w-4 h-4 mr-2" />
                  {driver.stats.titles}× World Champion
                </Badge>
              </div>
            )}

            <div className="pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground mb-3">Current team</div>
              <div className="p-4 rounded-xl bg-muted/30 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: constructor.color }}
                  />
                  <span className="font-bold">{constructor.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Base: </span>
                    <span>{constructor.base}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engine: </span>
                    <span>{constructor.engine}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Highlights */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                <Award className="w-4 h-4 text-white" />
              </div>
              Highlights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {careerHighlights.map((highlight, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <highlight.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground">{highlight.label}</div>
                </div>
                <div className="font-semibold">{highlight.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Race Results */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-3 to-chart-3/80 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            Recent results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {recentResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Badge 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      result.position === 1 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0'
                        : result.position === 2
                        ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white border-0'
                        : result.position === 3
                        ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white border-0'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {result.position}
                  </Badge>
                  
                  <div className="flex-1">
                    <div className="font-semibold">{result.race.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(result.race.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result.fastestLap && (
                    <Badge className="gap-1 bg-chart-3/10 text-chart-3 border-chart-3/20">
                      <Zap className="w-3 h-3" />
                      FL
                    </Badge>
                  )}
                  <div className="text-right">
                    <div className="font-bold">{result.points}</div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All-Time Stats */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-chart-4 to-chart-4/80 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            Career statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">{driver.stats.gp}</div>
              <div className="text-sm text-muted-foreground">Grand Prix</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">{driver.stats.fastestLaps}</div>
              <div className="text-sm text-muted-foreground">Fastest laps</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">
                {Math.round((driver.stats.wins / driver.stats.gp) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Win rate</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">
                {Math.round((driver.stats.podiums / driver.stats.gp) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Podium rate</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">
                {Math.round((driver.stats.poles / driver.stats.gp) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Pole rate</div>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/30">
              <div className="text-3xl font-bold mb-1">
                {(driver.stats.points / driver.stats.gp).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Points per race</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}