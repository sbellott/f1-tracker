"use client";

import { Session, SessionResults, SessionResultPosition, Driver, Constructor } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Trophy, 
  Medal, 
  Timer, 
  Zap,
  Flag,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle
} from 'lucide-react';

interface SessionResultsViewProps {
  session: Session;
  drivers: Driver[];
  constructors: Constructor[];
}

// Couleurs des constructeurs
const constructorColors: Record<string, string> = {
  'red_bull': '#3671C6',
  'ferrari': '#E8002D',
  'mercedes': '#27F4D2',
  'mclaren': '#FF8000',
  'aston_martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'rb': '#6692FF',
  'kick_sauber': '#52E252',
  'haas': '#B6BABD',
};

export function SessionResultsView({ session, drivers, constructors }: SessionResultsViewProps) {
  if (!session.results || !session.results.positions.length) {
    return (
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>Résultats non disponibles</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { positions, fastestLap } = session.results;
  const isRaceOrSprint = session.type === 'RACE' || session.type === 'SPRINT';
  const isQualifying = session.type === 'QUALIFYING' || session.type === 'SPRINT_QUALIFYING';
  const isPractice = session.type.startsWith('FP');

  // Podium (top 3)
  const podium = positions.slice(0, 3);
  // Reste du classement
  const restOfGrid = positions.slice(3, 10);

  const getConstructorColor = (constructorId: string) => {
    const constructor = constructors.find(c => c.id === constructorId);
    if (!constructor) return '#666';
    const normalizedName = constructor.name.toLowerCase().replace(/\s+/g, '_');
    return constructorColors[normalizedName] || constructor.color || '#666';
  };

  const getPositionChange = (result: SessionResultPosition) => {
    if (!result.gridPosition || !isRaceOrSprint) return null;
    const change = result.gridPosition - result.position;
    if (change > 0) return { direction: 'up', value: change };
    if (change < 0) return { direction: 'down', value: Math.abs(change) };
    return { direction: 'same', value: 0 };
  };

  const formatTime = (time?: string, isFirst?: boolean) => {
    if (!time) return '-';
    if (isFirst) return time;
    return time.startsWith('+') ? time : `+${time}`;
  };

  return (
    <div className="space-y-4">
      {/* Podium Section - Only for Race/Sprint/Qualifying */}
      {(isRaceOrSprint || isQualifying) && podium.length >= 3 && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {isQualifying ? 'Grille de départ' : 'Podium'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-3 py-4">
              {/* P2 */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-20 h-24 rounded-t-xl flex flex-col items-center justify-end pb-2 relative overflow-hidden"
                  style={{ backgroundColor: `${getConstructorColor(podium[1].constructorId)}20` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: getConstructorColor(podium[1].constructorId) }}
                  />
                  <Medal className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="font-bold text-lg">{podium[1].driverCode}</span>
                  <span className="text-xs text-muted-foreground">{podium[1].time || '-'}</span>
                </div>
                <div className="w-20 h-16 bg-gradient-to-t from-gray-400 to-gray-300 rounded-b-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
              </div>

              {/* P1 */}
              <div className="flex flex-col items-center -mt-6">
                <div 
                  className="w-24 h-32 rounded-t-xl flex flex-col items-center justify-end pb-2 relative overflow-hidden"
                  style={{ backgroundColor: `${getConstructorColor(podium[0].constructorId)}20` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: getConstructorColor(podium[0].constructorId) }}
                  />
                  <Trophy className="w-8 h-8 text-yellow-500 mb-1" />
                  <span className="font-bold text-xl">{podium[0].driverCode}</span>
                  <span className="text-xs text-muted-foreground">{podium[0].time || '-'}</span>
                </div>
                <div className="w-24 h-20 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-b-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
              </div>

              {/* P3 */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-20 h-20 rounded-t-xl flex flex-col items-center justify-end pb-2 relative overflow-hidden"
                  style={{ backgroundColor: `${getConstructorColor(podium[2].constructorId)}20` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: getConstructorColor(podium[2].constructorId) }}
                  />
                  <Medal className="w-5 h-5 text-amber-700 mb-1" />
                  <span className="font-bold text-lg">{podium[2].driverCode}</span>
                  <span className="text-xs text-muted-foreground">{podium[2].time || '-'}</span>
                </div>
                <div className="w-20 h-14 bg-gradient-to-t from-amber-700 to-amber-600 rounded-b-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Results Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5" />
              {isPractice ? 'Classement de la session' : isQualifying ? 'Résultats qualifications' : 'Résultats complets'}
            </div>
            {fastestLap && (
              <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 gap-1">
                <Zap className="w-3 h-3" />
                Tour rapide: {positions.find(p => p.driverId === fastestLap.driverId)?.driverCode}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-3 font-medium">Pos</th>
                  <th className="text-left p-3 font-medium">Pilote</th>
                  <th className="text-left p-3 font-medium">Écurie</th>
                  <th className="text-right p-3 font-medium">
                    {isPractice ? 'Temps' : isQualifying ? 'Temps' : 'Écart'}
                  </th>
                  {isRaceOrSprint && (
                    <>
                      <th className="text-center p-3 font-medium">+/-</th>
                      <th className="text-right p-3 font-medium">Pts</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {positions.slice(0, 20).map((result, idx) => {
                  const posChange = getPositionChange(result);
                  const hasFastestLap = fastestLap?.driverId === result.driverId;
                  
                  return (
                    <tr 
                      key={result.driverId}
                      className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                        result.status === 'DNF' || result.status === 'DSQ' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span 
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-yellow-500 text-white' :
                              idx === 1 ? 'bg-gray-400 text-white' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-muted text-foreground'
                            }`}
                          >
                            {result.position}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-1 h-6 rounded-full"
                            style={{ backgroundColor: getConstructorColor(result.constructorId) }}
                          />
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-1">
                              {result.driverCode}
                              {hasFastestLap && (
                                <Zap className="w-3 h-3 text-purple-500" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.driverName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {result.constructorName}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {result.status && result.status !== 'Finished' ? (
                          <Badge variant="destructive" className="text-xs">
                            {result.status}
                          </Badge>
                        ) : (
                          <span className={`text-sm font-mono ${idx === 0 ? 'font-bold' : ''}`}>
                            {formatTime(result.time, idx === 0)}
                          </span>
                        )}
                      </td>
                      {isRaceOrSprint && (
                        <>
                          <td className="p-3 text-center">
                            {posChange && (
                              <div className="flex items-center justify-center gap-0.5">
                                {posChange.direction === 'up' && (
                                  <>
                                    <TrendingUp className="w-3 h-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{posChange.value}</span>
                                  </>
                                )}
                                {posChange.direction === 'down' && (
                                  <>
                                    <TrendingDown className="w-3 h-3 text-red-500" />
                                    <span className="text-xs text-red-500">-{posChange.value}</span>
                                  </>
                                )}
                                {posChange.direction === 'same' && (
                                  <Minus className="w-3 h-3 text-muted-foreground" />
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-sm font-semibold ${
                              result.points && result.points > 0 ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {result.points || '-'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Fastest Lap Info */}
      {fastestLap && isRaceOrSprint && (
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Timer className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Tour le plus rapide</div>
                  <div className="text-xs text-muted-foreground">
                    {positions.find(p => p.driverId === fastestLap.driverId)?.driverName}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-purple-500">{fastestLap.time}</div>
                <div className="text-xs text-muted-foreground">Tour {fastestLap.lap}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
