import { Race, Session } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  Tv,
  Flag,
  Trophy,
  Zap,
  Play,
  Calendar
} from 'lucide-react';

interface SessionsTimelineProps {
  race: Race;
}

export function SessionsTimeline({ race }: SessionsTimelineProps) {
  const sessionTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
    FP1: { label: 'Essais Libres 1', icon: Play, color: 'bg-muted' },
    FP2: { label: 'Essais Libres 2', icon: Play, color: 'bg-muted' },
    FP3: { label: 'Essais Libres 3', icon: Play, color: 'bg-muted' },
    SPRINT_QUALIFYING: { label: 'Qualif. Sprint', icon: Zap, color: 'bg-chart-2' },
    SPRINT: { label: 'Sprint', icon: Zap, color: 'bg-chart-2' },
    QUALIFYING: { label: 'Qualifications', icon: Trophy, color: 'bg-chart-3' },
    RACE: { label: 'Course', icon: Flag, color: 'bg-primary' },
  };

  const nextSession = race.sessions.find(s => !s.completed);

  const getSessionStatus = (session: Session) => {
    if (session.completed) return 'completed';
    if (session === nextSession) return 'next';
    return 'upcoming';
  };

  const getDayLabel = (date: string | Date) => {
    return format(new Date(date), 'EEEE', { locale: fr });
  };

  // Group sessions by day
  const sessionsByDay = race.sessions.reduce((acc, session) => {
    const day = format(new Date(session.dateTime), 'yyyy-MM-dd');
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Programme du weekend
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(sessionsByDay).map(([day, sessions], dayIndex) => (
          <div key={day}>
            {/* Day Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {getDayLabel(sessions[0].dateTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(day), 'd MMMM', { locale: fr })}
              </div>
            </div>

            {/* Sessions for this day */}
            <div className="space-y-3 pl-4 border-l-2 border-border/50">
              {sessions.map((session, sessionIndex) => {
                const status = getSessionStatus(session);
                const sessionInfo = sessionTypeLabels[session.type] || { 
                  label: session.type, 
                  icon: Clock, 
                  color: 'bg-muted' 
                };
                const Icon = sessionInfo.icon;

                return (
                  <div 
                    key={sessionIndex}
                    className={`relative pl-6 pb-3 ${
                      sessionIndex === sessions.length - 1 ? 'pb-0' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-background ${
                        status === 'completed' ? 'bg-green-500' :
                        status === 'next' ? 'bg-primary animate-pulse' :
                        'bg-muted'
                      }`}
                    />

                    <div 
                      className={`rounded-xl p-3 transition-all ${
                        status === 'next' ? 'bg-primary/10 border-2 border-primary/30 shadow-md' :
                        status === 'completed' ? 'bg-muted/30' :
                        'bg-muted/20 hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${sessionInfo.color} flex items-center justify-center ${
                            status === 'next' ? 'ring-2 ring-primary/50' : ''
                          }`}>
                            <Icon className={`w-4 h-4 ${
                              status === 'next' ? 'text-primary-foreground' : 'text-foreground'
                            }`} />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{sessionInfo.label}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {format(new Date(session.dateTime), 'HH:mm', { locale: fr })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {status === 'completed' && (
                            <Badge className="bg-green-500 text-white gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Terminée
                            </Badge>
                          )}
                          {status === 'next' && (
                            <Badge className="bg-primary text-white gap-1 animate-pulse">
                              <Circle className="w-3 h-3 fill-current" />
                              En cours
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Canal+ info */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Tv className="w-3 h-3" />
                        <span>Canal+ dès {format(new Date(new Date(session.dateTime).getTime() - 15 * 60000), 'HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}