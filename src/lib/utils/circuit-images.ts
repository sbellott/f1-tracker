// ============================================
// F1.COM OFFICIAL IMAGE URL MAPPINGS
// ============================================

// Hero banner images - Updated URL pattern for 2024+
const F1_HERO_BASE_URL = 'https://media.formula1.com/image/upload/c_lfill,w_1920/q_auto/v1740000000/content/dam/fom-website/2018-redesign-assets/Racehub%20header%20images%2016x9';

// City-specific hero images (takes priority over country)
const cityToHeroImage: Record<string, string> = {
  'Miami': 'Miami',
  'Las Vegas': 'Las%20Vegas',
  'Austin': 'USA',
  'Jeddah': 'Saudi_Arabia',
  'Madrid': 'Spain', // New Spanish GP venue
};

// Country to hero image mapping
const countryToHeroImage: Record<string, string> = {
  'Australia': 'Australia',
  'China': 'China',
  'Japan': 'Japan',
  'Bahrain': 'Bahrain',
  'Saudi Arabia': 'Saudi_Arabia',
  'USA': 'USA',
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
  'UAE': 'Abu_Dhabi',
  'United Arab Emirates': 'Abu_Dhabi',
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
  'Madrid': 'Spain_Circuit',
  'Imola': 'Emilia_Romagna_Circuit',
};

/**
 * Get F1.com hero image URL for a country/city
 * City-specific images take priority for circuits like Miami, Las Vegas
 */
export function getF1HeroImageUrl(country: string, city?: string): string {
  // Check city-specific mapping first (for Miami, Las Vegas, etc.)
  if (city && cityToHeroImage[city]) {
    return `${F1_HERO_BASE_URL}/${cityToHeroImage[city]}.webp`;
  }
  
  // Fall back to country mapping
  const heroName = countryToHeroImage[country] || country.replace(/\s+/g, '_');
  return `${F1_HERO_BASE_URL}/${heroName}.webp`;
}

/**
 * Get F1.com track map URL for a city
 */
export function getF1TrackMapUrl(city: string): string {
  const trackName = cityToTrackMap[city] || city.replace(/\s+/g, '_') + '_Circuit';
  return `${F1_TRACK_BASE_URL}/${trackName}.png`;
}

/**
 * Get circuit image URL based on circuit data
 * Prioritizes track map, falls back to hero image
 */
export function getCircuitImageUrl(circuit: { city?: string; country?: string } | null): string {
  if (!circuit) {
    return '/placeholder-circuit.jpg';
  }

  // Try track map first (better for thumbnails)
  if (circuit.city) {
    return getF1TrackMapUrl(circuit.city);
  }

  // Fall back to hero image
  if (circuit.country) {
    return getF1HeroImageUrl(circuit.country);
  }

  return '/placeholder-circuit.jpg';
}

/**
 * Get race thumbnail URL based on race data
 */
export function getRaceThumbnailUrl(race: {
  circuit?: { city?: string; country?: string } | null;
  country?: string;
}): string {
  // Use circuit data if available
  if (race.circuit) {
    return getCircuitImageUrl(race.circuit);
  }

  // Fall back to country from race
  if (race.country) {
    return getF1HeroImageUrl(race.country);
  }

  return '/placeholder-circuit.jpg';
}