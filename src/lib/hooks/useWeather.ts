import { useQuery } from '@tanstack/react-query';
import { getCircuitWeather, type WeatherForecast } from '@/lib/services/weather.service';

/**
 * Hook to fetch weather data for a circuit
 */
export function useCircuitWeather(city: string | undefined) {
  return useQuery<WeatherForecast | null>({
    queryKey: ['weather', city],
    queryFn: () => city ? getCircuitWeather(city) : Promise.resolve(null),
    enabled: !!city,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour cache
    retry: 1,
  });
}

/**
 * Hook to fetch weather for a specific race date
 */
export function useRaceWeather(city: string | undefined, raceDate?: Date) {
  return useQuery<WeatherForecast | null>({
    queryKey: ['weather', city, raceDate?.toISOString()],
    queryFn: () => city ? getCircuitWeather(city) : Promise.resolve(null),
    enabled: !!city,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
