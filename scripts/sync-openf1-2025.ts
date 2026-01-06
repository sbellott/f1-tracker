/**
 * Sync 2025 race results from OpenF1 API
 * OpenF1 has real-time and recent F1 data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// Driver number to ergastId mapping (2025 grid)
const DRIVER_NUMBER_MAP: Record<number, string> = {
  1: 'max_verstappen',
  4: 'norris',
  5: 'antonelli', // Antonelli replaces Hamilton at Mercedes
  6: 'lawson', // Lawson at Red Bull
  10: 'gasly',
  11: 'perez', // If still racing
  12: 'colapinto', // Or whoever has #12
  14: 'alonso',
  16: 'leclerc',
  18: 'stroll',
  22: 'tsunoda',
  23: 'albon',
  27: 'hulkenberg',
  30: 'bortoleto', // Bortoleto at Sauber
  31: 'ocon',
  38: 'bearman', // Bearman at Haas
  43: 'colapinto',
  44: 'hamilton', // Hamilton at Ferrari
  55: 'sainz',
  63: 'russell',
  81: 'piastri',
  87: 'hadjar', // Hadjar at RB
};

interface OpenF1Session {
  session_key: number;
  meeting_key: number;
  circuit_short_name: string;
  date_start: string;
  session_type: string;
}

interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  year: number;
}

interface OpenF1Position {
  driver_number: number;
  position: number;
  date: string;
}

interface OpenF1Driver {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function getRaceSessions2025(): Promise<OpenF1Session[]> {
  const sessions = await fetchJSON<OpenF1Session[]>(
    `${OPENF1_BASE_URL}/sessions?year=2025&session_type=Race`
  );
  return sessions || [];
}

async function getMeeting(meetingKey: number): Promise<OpenF1Meeting | null> {
  const meetings = await fetchJSON<OpenF1Meeting[]>(
    `${OPENF1_BASE_URL}/meetings?meeting_key=${meetingKey}`
  );
  return meetings?.[0] || null;
}

async function getFinalPositions(sessionKey: number): Promise<Map<number, number>> {
  // Get all positions and find the final one for each driver
  const positions = await fetchJSON<OpenF1Position[]>(
    `${OPENF1_BASE_URL}/position?session_key=${sessionKey}`
  );
  
  if (!positions || positions.length === 0) return new Map();
  
  // Group by driver and get the last position (final)
  const driverPositions = new Map<number, number>();
  
  // Sort by date to ensure we get the final position
  const sorted = positions.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  for (const pos of sorted) {
    driverPositions.set(pos.driver_number, pos.position);
  }
  
  return driverPositions;
}

async function getDriverInfo(sessionKey: number): Promise<Map<number, OpenF1Driver>> {
  const drivers = await fetchJSON<OpenF1Driver[]>(
    `${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`
  );
  
  const driverMap = new Map<number, OpenF1Driver>();
  if (drivers) {
    for (const d of drivers) {
      driverMap.set(d.driver_number, d);
    }
  }
  return driverMap;
}

// Calculate points based on position (2025 scoring)
function calculatePoints(position: number, isSprint: boolean = false): number {
  if (isSprint) {
    const sprintPoints: Record<number, number> = {
      1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1
    };
    return sprintPoints[position] || 0;
  }
  
  const racePoints: Record<number, number> = {
    1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
    6: 8, 7: 6, 8: 4, 9: 2, 10: 1
  };
  return racePoints[position] || 0;
}

async function main() {
  console.log('🏎️  Syncing 2025 race results from OpenF1...\n');
  
  const sessions = await getRaceSessions2025();
  console.log(`Found ${sessions.length} race sessions in 2025\n`);
  
  // Group by meeting to identify sprints vs main races
  const meetingRaces = new Map<number, OpenF1Session[]>();
  for (const session of sessions) {
    const existing = meetingRaces.get(session.meeting_key) || [];
    existing.push(session);
    meetingRaces.set(session.meeting_key, existing);
  }
  
  let synced = 0;
  let skipped = 0;
  let round = 0;
  
  // Process each meeting
  for (const [meetingKey, raceSessions] of meetingRaces) {
    const meeting = await getMeeting(meetingKey);
    if (!meeting) continue;
    
    await delay(200);
    
    // Sort sessions by date - first is sprint (if 2), second is main race
    const sortedSessions = raceSessions.sort((a, b) => 
      new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );
    
    // Process main race (last session in the list)
    const mainRace = sortedSessions[sortedSessions.length - 1];
    round++;
    
    console.log(`Processing ${meeting.meeting_name} (Round ${round})...`);
    
    const positions = await getFinalPositions(mainRace.session_key);
    const driverInfo = await getDriverInfo(mainRace.session_key);
    
    if (positions.size === 0) {
      console.log(`  ⚠️ No results found for this race`);
      continue;
    }
    
    await delay(200);
    
    for (const [driverNum, position] of positions) {
      // Map driver number to ergastId
      let ergastId = DRIVER_NUMBER_MAP[driverNum];
      
      if (!ergastId) {
        // Try to guess from driver info
        const info = driverInfo.get(driverNum);
        if (info) {
          // Convert "Max VERSTAPPEN" to "max_verstappen"
          const nameParts = info.full_name.toLowerCase().split(' ');
          if (nameParts.length >= 2) {
            ergastId = nameParts.slice(1).join('_'); // Use last name
          }
        }
        
        if (!ergastId) continue;
      }
      
      // Find driver in our DB
      const driver = await prisma.driver.findUnique({
        where: { ergastId },
        select: { id: true },
      });
      
      if (!driver) continue;
      
      // Check if result exists
      const existing = await prisma.driverRaceResult.findUnique({
        where: {
          driverId_season_round: {
            driverId: driver.id,
            season: 2025,
            round,
          },
        },
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const info = driverInfo.get(driverNum);
      const points = calculatePoints(position);
      
      // Create result
      await prisma.driverRaceResult.create({
        data: {
          driverId: driver.id,
          season: 2025,
          round,
          raceName: meeting.meeting_official_name || meeting.meeting_name,
          circuitName: meeting.circuit_short_name,
          date: new Date(mainRace.date_start),
          position,
          positionText: String(position),
          points,
          grid: 0, // OpenF1 doesn't provide starting grid in position data
          laps: 0,
          status: position > 0 ? 'Finished' : 'DNF',
          time: null,
          fastestLap: false,
          fastestLapRank: null,
          constructorId: info?.team_name.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          constructorName: info?.team_name || 'Unknown',
        },
      });
      
      synced++;
    }
    
    await delay(300);
  }
  
  console.log(`\n✨ Sync complete!`);
  console.log(`   Synced: ${synced} results`);
  console.log(`   Skipped: ${skipped} existing`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
