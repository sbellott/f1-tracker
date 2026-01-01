import { Driver, Constructor, Standing } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Minus, Trophy, Target } from 'lucide-react';

interface StandingsTableProps {
  standings: Standing[];
  drivers?: Driver[];
  constructors?: Constructor[];
  type: 'drivers' | 'constructors';
}

export function StandingsTable({ standings, drivers, constructors, type }: StandingsTableProps) {
  const getPositionChange = (standing: Standing) => {
    if (!standing.previousPosition) return null;
    const change = standing.previousPosition - standing.position;
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getDriver = (id: string) => drivers?.find(d => d.id === id);
  const getConstructor = (id: string) => constructors?.find(c => c.id === id);

  return (
    <Card className="overflow-hidden border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-gradient-to-br from-muted/50 to-transparent">
        <CardTitle className="text-2xl">
          {type === 'drivers' ? 'Classement pilotes' : 'Classement constructeurs'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {standings.map((standing, index) => {
            const driver = type === 'drivers' && standing.driverId ? getDriver(standing.driverId) : null;
            const constructor = type === 'constructors' && standing.constructorId ? getConstructor(standing.constructorId) : null;
            const teamColor = driver ? getConstructor(driver.constructorId)?.color : constructor?.color;
            const isPodium = standing.position <= 3;

            return (
              <div 
                key={standing.position} 
                className={`flex items-center gap-5 p-5 transition-all hover:bg-muted/30 group ${
                  isPodium ? 'bg-gradient-to-r from-primary/5 via-transparent to-transparent' : ''
                }`}
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
                <div className="flex-1 min-w-0">
                  {type === 'drivers' && driver && (
                    <div>
                      <div className="font-bold text-lg truncate leading-tight mb-1">
                        {driver.firstName} {driver.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {getConstructor(driver.constructorId)?.name}
                      </div>
                    </div>
                  )}
                  {type === 'constructors' && constructor && (
                    <div className="font-bold text-lg truncate">{constructor.name}</div>
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
      </CardContent>
    </Card>
  );
}