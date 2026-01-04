/**
 * Weather Service using Open-Meteo API (free, no API key required)
 * https://open-meteo.com/
 */

// Circuit coordinates mapping (latitude, longitude)
const circuitCoordinates: Record<string, { lat: number; lon: number }> = {
  // Australia
  'Melbourne': { lat: -37.8497, lon: 144.968 },
  // Bahrain
  'Sakhir': { lat: 26.0325, lon: 50.5106 },
  // Saudi Arabia
  'Jeddah': { lat: 21.6319, lon: 39.1044 },
  // Japan
  'Suzuka': { lat: 34.8431, lon: 136.541 },
  // China
  'Shanghai': { lat: 31.3389, lon: 121.22 },
  // USA
  'Miami': { lat: 25.9581, lon: -80.2389 },
  'Austin': { lat: 30.1328, lon: -97.6411 },
  'Las Vegas': { lat: 36.1147, lon: -115.173 },
  // Italy
  'Imola': { lat: 44.3439, lon: 11.7167 },
  'Monza': { lat: 45.6156, lon: 9.2811 },
  // Monaco
  'Monte Carlo': { lat: 43.7347, lon: 7.4206 },
  // Spain
  'Barcelona': { lat: 41.57, lon: 2.2611 },
  'Madrid': { lat: 40.4168, lon: -3.7038 },
  // Canada
  'Montreal': { lat: 45.5017, lon: -73.5269 },
  // Austria
  'Spielberg': { lat: 47.2197, lon: 14.7647 },
  // UK
  'Silverstone': { lat: 52.0786, lon: -1.0169 },
  // Hungary
  'Budapest': { lat: 47.5789, lon: 19.2486 },
  // Belgium
  'Spa': { lat: 50.4372, lon: 5.9714 },
  // Netherlands
  'Zandvoort': { lat: 52.3888, lon: 4.5409 },
  // Azerbaijan
  'Baku': { lat: 40.3725, lon: 49.8533 },
  // Singapore
  'Marina Bay': { lat: 1.2914, lon: 103.864 },
  // Mexico
  'Mexico City': { lat: 19.4042, lon: -99.0907 },
  // Brazil
  'São Paulo': { lat: -23.7036, lon: -46.6997 },
  // Qatar
  'Lusail': { lat: 25.49, lon: 51.4542 },
  // UAE
  'Abu Dhabi': { lat: 24.4672, lon: 54.6031 },
};

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  isDay: boolean;
}

export interface WeatherForecast {
  current: WeatherData;
  hourly: Array<{
    time: string;
    temperature: number;
    precipitationProbability: number;
    weatherCode: number;
    weatherIcon: string;
  }>;
  daily: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    precipitationProbability: number;
    weatherCode: number;
    weatherIcon: string;
  }>;
}

// Weather code to description and icon mapping
// Based on WMO Weather interpretation codes
const weatherCodeMap: Record<number, { description: string; icon: string; iconNight: string }> = {
  0: { description: 'Ciel dégagé', icon: '☀️', iconNight: '🌙' },
  1: { description: 'Principalement dégagé', icon: '🌤️', iconNight: '🌙' },
  2: { description: 'Partiellement nuageux', icon: '⛅', iconNight: '☁️' },
  3: { description: 'Couvert', icon: '☁️', iconNight: '☁️' },
  45: { description: 'Brouillard', icon: '🌫️', iconNight: '🌫️' },
  48: { description: 'Brouillard givrant', icon: '🌫️', iconNight: '🌫️' },
  51: { description: 'Bruine légère', icon: '🌧️', iconNight: '🌧️' },
  53: { description: 'Bruine modérée', icon: '🌧️', iconNight: '🌧️' },
  55: { description: 'Bruine dense', icon: '🌧️', iconNight: '🌧️' },
  56: { description: 'Bruine verglaçante légère', icon: '🌨️', iconNight: '🌨️' },
  57: { description: 'Bruine verglaçante dense', icon: '🌨️', iconNight: '🌨️' },
  61: { description: 'Pluie légère', icon: '🌧️', iconNight: '🌧️' },
  63: { description: 'Pluie modérée', icon: '🌧️', iconNight: '🌧️' },
  65: { description: 'Pluie forte', icon: '🌧️', iconNight: '🌧️' },
  66: { description: 'Pluie verglaçante légère', icon: '🌨️', iconNight: '🌨️' },
  67: { description: 'Pluie verglaçante forte', icon: '🌨️', iconNight: '🌨️' },
  71: { description: 'Neige légère', icon: '🌨️', iconNight: '🌨️' },
  73: { description: 'Neige modérée', icon: '🌨️', iconNight: '🌨️' },
  75: { description: 'Neige forte', icon: '❄️', iconNight: '❄️' },
  77: { description: 'Grains de neige', icon: '🌨️', iconNight: '🌨️' },
  80: { description: 'Averses légères', icon: '🌦️', iconNight: '🌧️' },
  81: { description: 'Averses modérées', icon: '🌦️', iconNight: '🌧️' },
  82: { description: 'Averses violentes', icon: '⛈️', iconNight: '⛈️' },
  85: { description: 'Averses de neige légères', icon: '🌨️', iconNight: '🌨️' },
  86: { description: 'Averses de neige fortes', icon: '❄️', iconNight: '❄️' },
  95: { description: 'Orage', icon: '⛈️', iconNight: '⛈️' },
  96: { description: 'Orage avec grêle légère', icon: '⛈️', iconNight: '⛈️' },
  99: { description: 'Orage avec grêle forte', icon: '⛈️', iconNight: '⛈️' },
};

function getWeatherInfo(code: number, isDay: boolean): { description: string; icon: string } {
  const weather = weatherCodeMap[code] || { description: 'Inconnu', icon: '❓', iconNight: '❓' };
  return {
    description: weather.description,
    icon: isDay ? weather.icon : weather.iconNight,
  };
}

/**
 * Get coordinates for a circuit by city name
 */
export function getCircuitCoordinates(city: string): { lat: number; lon: number } | null {
  return circuitCoordinates[city] || null;
}

/**
 * Fetch weather forecast for a specific location
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  targetDate?: Date
): Promise<WeatherForecast | null> {
  try {
    // Build URL with parameters
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day',
      hourly: 'temperature_2m,precipitation_probability,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code',
      timezone: 'auto',
      forecast_days: '7',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

    if (!response.ok) {
      console.error('Weather API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Parse current weather
    const isDay = data.current.is_day === 1;
    const currentWeatherInfo = getWeatherInfo(data.current.weather_code, isDay);

    const current: WeatherData = {
      temperature: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      precipitationProbability: 0, // Not available in current
      weatherCode: data.current.weather_code,
      weatherDescription: currentWeatherInfo.description,
      weatherIcon: currentWeatherInfo.icon,
      isDay,
    };

    // Parse hourly (next 24 hours)
    const hourly = data.hourly.time.slice(0, 24).map((time: string, i: number) => {
      const hourIsDay = new Date(time).getHours() >= 6 && new Date(time).getHours() < 20;
      const weatherInfo = getWeatherInfo(data.hourly.weather_code[i], hourIsDay);
      return {
        time,
        temperature: Math.round(data.hourly.temperature_2m[i]),
        precipitationProbability: data.hourly.precipitation_probability[i],
        weatherCode: data.hourly.weather_code[i],
        weatherIcon: weatherInfo.icon,
      };
    });

    // Parse daily
    const daily = data.daily.time.map((date: string, i: number) => {
      const weatherInfo = getWeatherInfo(data.daily.weather_code[i], true);
      return {
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipitationProbability: data.daily.precipitation_probability_max[i],
        weatherCode: data.daily.weather_code[i],
        weatherIcon: weatherInfo.icon,
      };
    });

    return { current, hourly, daily };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Get weather forecast for a circuit by city name
 */
export async function getCircuitWeather(city: string): Promise<WeatherForecast | null> {
  const coords = getCircuitCoordinates(city);
  if (!coords) {
    console.warn(`No coordinates found for city: ${city}`);
    return null;
  }
  return getWeatherForecast(coords.lat, coords.lon);
}
