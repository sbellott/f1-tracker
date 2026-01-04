'use client';

import { useCircuitWeather } from '@/lib/hooks/useWeather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Cloud, Droplets, Wind, Thermometer, CloudOff } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface WeatherWidgetProps {
  city: string;
  compact?: boolean;
  showForecast?: boolean;
}

export function WeatherWidget({ city, compact = false, showForecast = true }: WeatherWidgetProps) {
  const { data: weather, isLoading, error } = useCircuitWeather(city);

  if (isLoading) {
    return <WeatherSkeleton compact={compact} />;
  }

  if (error || !weather) {
    return <WeatherEmpty compact={compact} />;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
        <span className="text-2xl">{weather.current.weatherIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">{weather.current.temperature}°C</span>
            <span className="text-sm text-muted-foreground truncate">
              {weather.current.weatherDescription}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" />
              {weather.current.windSpeed} km/h
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" />
              {weather.current.humidity}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-br from-sky-500/10 to-blue-500/5">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cloud className="w-5 h-5 text-sky-500" />
          Météo - {city}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/5 border border-sky-500/20">
          <span className="text-5xl">{weather.current.weatherIcon}</span>
          <div className="flex-1">
            <div className="text-3xl font-bold">{weather.current.temperature}°C</div>
            <div className="text-muted-foreground">{weather.current.weatherDescription}</div>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              <span>{weather.current.windSpeed} km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span>{weather.current.humidity}%</span>
            </div>
          </div>
        </div>

        {/* Hourly Forecast */}
        {showForecast && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Prochaines heures</h4>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {weather.hourly.slice(0, 12).map((hour, i) => (
                  <div
                    key={hour.time}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50 min-w-[60px] text-center"
                  >
                    <span className="text-xs text-muted-foreground">
                      {i === 0 ? 'Maint.' : format(new Date(hour.time), 'HH:mm')}
                    </span>
                    <span className="text-xl">{hour.weatherIcon}</span>
                    <span className="text-sm font-medium">{hour.temperature}°</span>
                    {hour.precipitationProbability > 0 && (
                      <span className="text-xs text-sky-500 flex items-center gap-0.5">
                        <Droplets className="w-3 h-3" />
                        {hour.precipitationProbability}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Forecast */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Prévisions 7 jours</h4>
              <div className="space-y-1">
                {weather.daily.map((day, i) => (
                  <div
                    key={day.date}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground w-16">
                      {i === 0 ? "Auj." : format(new Date(day.date), 'EEE d', { locale: fr })}
                    </span>
                    <span className="text-xl">{day.weatherIcon}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-medium">{day.tempMax}°</span>
                      <span className="text-muted-foreground">{day.tempMin}°</span>
                    </div>
                    {day.precipitationProbability > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        <Droplets className="w-3 h-3" />
                        {day.precipitationProbability}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function WeatherSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-14 rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherEmpty({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30 text-muted-foreground">
        <CloudOff className="w-5 h-5" />
        <span className="text-sm">Météo non disponible</span>
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
        <CloudOff className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">Météo non disponible</p>
        <p className="text-sm">Les données météo ne sont pas disponibles pour ce circuit</p>
      </CardContent>
    </Card>
  );
}
