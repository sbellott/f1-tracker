import { useEffect, useState } from 'react';
import { Session } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Tv } from 'lucide-react';

interface CountdownProps {
  nextSession: Session;
  raceName: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const getSessionLabel = (type: Session['type']): string => {
  const labels: Record<Session['type'], string> = {
    FP1: 'Essais Libres 1',
    FP2: 'Essais Libres 2',
    FP3: 'Essais Libres 3',
    SPRINT_QUALIFYING: 'Sprint Qualifying',
    SPRINT: 'Sprint Race',
    QUALIFYING: 'Qualifications',
    RACE: 'Course',
  };
  return labels[type];
};

export function Countdown({ nextSession, raceName }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(nextSession.dateTime).getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [nextSession.dateTime]);

  return (
    <Card className="overflow-hidden border-primary/20 shadow-xl shadow-primary/5">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-muted-foreground">Prochaine session</span>
            </div>
            <CardTitle className="text-xl mb-1">{raceName}</CardTitle>
            <p className="text-sm text-muted-foreground">{getSessionLabel(nextSession.type)}</p>
          </div>
          {nextSession.isLive && (
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white border-0 h-8 px-4 animate-pulse shadow-lg shadow-primary/30">
              <div className="w-2 h-2 rounded-full bg-white mr-2 animate-ping" />
              <div className="w-2 h-2 rounded-full bg-white mr-2 absolute left-3" />
              EN DIRECT
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-5 relative z-10">
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { value: timeLeft.days, label: 'Jours' },
            { value: timeLeft.hours, label: 'Heures' },
            { value: timeLeft.minutes, label: 'Min' },
            { value: timeLeft.seconds, label: 'Sec' }
          ].map((item, index) => (
            <div key={index} className="text-center group">
              <div className="relative bg-gradient-to-br from-muted to-muted/80 rounded-xl p-3 mb-2 shadow-sm group-hover:shadow-md transition-all border border-border/50">
                <div className="text-2xl lg:text-3xl font-bold tabular-nums bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {String(item.value).padStart(2, '0')}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
        
        {nextSession.channel && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground bg-muted/50 backdrop-blur-sm rounded-xl p-3 border border-border/50">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Tv className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-medium text-foreground">{nextSession.channel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}