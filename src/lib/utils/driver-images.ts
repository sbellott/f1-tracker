// F1 Official Driver Image Utilities
// Uses Formula 1 media CDN for official driver photos

// Team colors (official 2025 palette)
export const teamColors: Record<string, string> = {
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

/**
 * Get team color from team name (with fuzzy matching)
 */
export function getTeamColor(name: string | null | undefined): string {
  if (!name) return '#333';
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
  return '#333';
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
};

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
  'Daniel Ricciardo': 'danric01',
  'Kevin Magnussen': 'kevmag01',
  'Zhou Guanyu': 'guazho01',
  'Logan Sargeant': 'logsar01',
  'Nyck de Vries': 'nycdev01',
};

// Special driver image overrides for drivers who changed teams
// Maps "FirstName LastName" to team-specific images
const driverImageOverrides: Record<string, Record<string, { year: string; teamSlug: string; driverCode: string }>> = {
  'Carlos Sainz': {
    'Ferrari': { year: '2024', teamSlug: 'ferrari', driverCode: 'carsai01' },
    'Williams': { year: '2025', teamSlug: 'williams', driverCode: 'carsai01' },
    'default': { year: '2025', teamSlug: 'williams', driverCode: 'carsai01' },
  },
  'Isack Hadjar': {
    'Racing Bulls': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
    'RB': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
    'Red Bull Racing': { year: '2026', teamSlug: 'redbullracing', driverCode: 'isahad01' },
    'Red Bull': { year: '2026', teamSlug: 'redbullracing', driverCode: 'isahad01' },
    'default': { year: '2025', teamSlug: 'racingbulls', driverCode: 'isahad01' },
  },
  'Lewis Hamilton': {
    'Ferrari': { year: '2025', teamSlug: 'ferrari', driverCode: 'lewham01' },
    'Mercedes': { year: '2024', teamSlug: 'mercedes', driverCode: 'lewham01' },
    'default': { year: '2025', teamSlug: 'ferrari', driverCode: 'lewham01' },
  },
  'Valtteri Bottas': {
    'Kick Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
    'Sauber': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
    'Alfa Romeo': { year: '2023', teamSlug: 'alfaromeo', driverCode: 'valbot01' },
    'Mercedes': { year: '2021', teamSlug: 'mercedes', driverCode: 'valbot01' },
    'default': { year: '2024', teamSlug: 'kicksauber', driverCode: 'valbot01' },
  },
  'Nico Hülkenberg': {
    'Kick Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Haas': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'Haas F1 Team': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'default': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
  },
  'Nico Hulkenberg': {
    'Kick Sauber': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
    'Haas': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'Haas F1 Team': { year: '2024', teamSlug: 'haasf1team', driverCode: 'nichul01' },
    'default': { year: '2025', teamSlug: 'kicksauber', driverCode: 'nichul01' },
  },
};

/**
 * Get driver code from full name
 */
export function getDriverCode(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`;
  return driverCodeMap[fullName] || `${firstName.substring(0, 3).toLowerCase()}${lastName.substring(0, 3).toLowerCase()}01`;
}

/**
 * Get team slug from team name
 */
export function getTeamSlug(teamName: string): string {
  return teamToSlug[teamName] || teamName.toLowerCase().replace(/\s+/g, '');
}

/**
 * Get small circular headshot (64px) - for standings tables
 */
export function getDriverHeadshotUrl(firstName: string, lastName: string, teamName: string): string {
  const fullName = `${firstName} ${lastName}`;
  
  // Check for special override
  const driverOverrides = driverImageOverrides[fullName];
  if (driverOverrides) {
    const teamOverride = driverOverrides[teamName] || driverOverrides['default'];
    if (teamOverride) {
      return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/v1740000000/common/f1/${teamOverride.year}/${teamOverride.teamSlug}/${teamOverride.driverCode}/${teamOverride.year}${teamOverride.teamSlug}${teamOverride.driverCode}right.webp`;
    }
  }
  
  const driverCode = getDriverCode(firstName, lastName);
  const teamSlug = getTeamSlug(teamName);
  return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/${teamSlug}/${driverCode}/2025${teamSlug}${driverCode}right.webp`;
}

/**
 * Get medium portrait (240px) - for driver cards in explorer
 */
export function getDriverPortraitUrl(firstName: string, lastName: string, teamName: string): string {
  const fullName = `${firstName} ${lastName}`;
  
  // Check for special override
  const driverOverrides = driverImageOverrides[fullName];
  if (driverOverrides) {
    const teamOverride = driverOverrides[teamName] || driverOverrides['default'];
    if (teamOverride) {
      return `https://media.formula1.com/image/upload/c_fill,w_480,h_480,g_face/q_auto/v1740000000/common/f1/${teamOverride.year}/${teamOverride.teamSlug}/${teamOverride.driverCode}/${teamOverride.year}${teamOverride.teamSlug}${teamOverride.driverCode}right.webp`;
    }
  }
  
  const driverCode = getDriverCode(firstName, lastName);
  const teamSlug = getTeamSlug(teamName);
  return `https://media.formula1.com/image/upload/c_fill,w_480,h_480,g_face/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/${teamSlug}/${driverCode}/2025${teamSlug}${driverCode}right.webp`;
}

/**
 * Get large hero image (1080px) - for driver detail view hero section
 */
export function getDriverHeroUrl(firstName: string, lastName: string, teamName: string): string {
  const fullName = `${firstName} ${lastName}`;
  
  // Check for special override
  const driverOverrides = driverImageOverrides[fullName];
  if (driverOverrides) {
    const teamOverride = driverOverrides[teamName] || driverOverrides['default'];
    if (teamOverride) {
      return `https://media.formula1.com/image/upload/c_fill,w_1080,h_720,g_face/q_auto/v1740000000/common/f1/${teamOverride.year}/${teamOverride.teamSlug}/${teamOverride.driverCode}/${teamOverride.year}${teamOverride.teamSlug}${teamOverride.driverCode}right.webp`;
    }
  }
  
  const driverCode = getDriverCode(firstName, lastName);
  const teamSlug = getTeamSlug(teamName);
  return `https://media.formula1.com/image/upload/c_fill,w_1080,h_720,g_face/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdriverright.webp/v1740000000/common/f1/2025/${teamSlug}/${driverCode}/2025${teamSlug}${driverCode}right.webp`;
}

/**
 * Get full cutout image (transparent background) - for special displays
 */
export function getDriverCutoutUrl(firstName: string, lastName: string, teamName: string): string {
  const fullName = `${firstName} ${lastName}`;
  
  // Check for special override
  const driverOverrides = driverImageOverrides[fullName];
  if (driverOverrides) {
    const teamOverride = driverOverrides[teamName] || driverOverrides['default'];
    if (teamOverride) {
      return `https://media.formula1.com/image/upload/c_limit,w_600/q_auto/v1740000000/common/f1/${teamOverride.year}/${teamOverride.teamSlug}/${teamOverride.driverCode}/${teamOverride.year}${teamOverride.teamSlug}${teamOverride.driverCode}cutout.webp`;
    }
  }
  
  const driverCode = getDriverCode(firstName, lastName);
  const teamSlug = getTeamSlug(teamName);
  return `https://media.formula1.com/image/upload/c_limit,w_600/q_auto/d_common:f1:2025:fallback:driver:2025fallbackdrivercutout.webp/v1740000000/common/f1/2025/${teamSlug}/${driverCode}/2025${teamSlug}${driverCode}cutout.webp`;
}