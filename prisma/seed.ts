import { PrismaClient, SessionType, StandingType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// F1 2025 Constructors
const constructors = [
  { ergastId: 'red_bull', name: 'Red Bull Racing', shortName: 'Red Bull', nationality: 'Austrian', base: 'Milton Keynes, UK', teamPrincipal: 'Christian Horner', engine: 'Honda RBPT', color: '#3671C6' },
  { ergastId: 'ferrari', name: 'Scuderia Ferrari', shortName: 'Ferrari', nationality: 'Italian', base: 'Maranello, Italy', teamPrincipal: 'Frederic Vasseur', engine: 'Ferrari', color: '#E80020' },
  { ergastId: 'mclaren', name: 'McLaren F1 Team', shortName: 'McLaren', nationality: 'British', base: 'Woking, UK', teamPrincipal: 'Andrea Stella', engine: 'Mercedes', color: '#FF8000' },
  { ergastId: 'mercedes', name: 'Mercedes-AMG Petronas', shortName: 'Mercedes', nationality: 'German', base: 'Brackley, UK', teamPrincipal: 'Toto Wolff', engine: 'Mercedes', color: '#27F4D2' },
  { ergastId: 'aston_martin', name: 'Aston Martin Aramco', shortName: 'Aston Martin', nationality: 'British', base: 'Silverstone, UK', teamPrincipal: 'Mike Krack', engine: 'Mercedes', color: '#229971' },
  { ergastId: 'alpine', name: 'Alpine F1 Team', shortName: 'Alpine', nationality: 'French', base: 'Enstone, UK', teamPrincipal: 'Oliver Oakes', engine: 'Renault', color: '#0093CC' },
  { ergastId: 'williams', name: 'Williams Racing', shortName: 'Williams', nationality: 'British', base: 'Grove, UK', teamPrincipal: 'James Vowles', engine: 'Mercedes', color: '#64C4FF' },
  { ergastId: 'rb', name: 'Visa Cash App RB', shortName: 'RB', nationality: 'Italian', base: 'Faenza, Italy', teamPrincipal: 'Laurent Mekies', engine: 'Honda RBPT', color: '#6692FF' },
  { ergastId: 'kick_sauber', name: 'Stake F1 Team Kick Sauber', shortName: 'Sauber', nationality: 'Swiss', base: 'Hinwil, Switzerland', teamPrincipal: 'Mattia Binotto', engine: 'Ferrari', color: '#52E252' },
  { ergastId: 'haas', name: 'MoneyGram Haas F1 Team', shortName: 'Haas', nationality: 'American', base: 'Kannapolis, USA', teamPrincipal: 'Ayao Komatsu', engine: 'Ferrari', color: '#B6BABD' },
];

// F1 2025 Drivers
const drivers = [
  // Red Bull
  { ergastId: 'max_verstappen', code: 'VER', number: 1, firstName: 'Max', lastName: 'Verstappen', nationality: 'Dutch', constructorId: 'red_bull', totalWins: 63, totalPoles: 40, championships: 4 },
  { ergastId: 'lawson', code: 'LAW', number: 30, firstName: 'Liam', lastName: 'Lawson', nationality: 'New Zealander', constructorId: 'red_bull', totalWins: 0, totalPoles: 0, championships: 0 },
  // Ferrari
  { ergastId: 'leclerc', code: 'LEC', number: 16, firstName: 'Charles', lastName: 'Leclerc', nationality: 'Monegasque', constructorId: 'ferrari', totalWins: 8, totalPoles: 26, championships: 0 },
  { ergastId: 'hamilton', code: 'HAM', number: 44, firstName: 'Lewis', lastName: 'Hamilton', nationality: 'British', constructorId: 'ferrari', totalWins: 105, totalPoles: 104, championships: 7 },
  // McLaren
  { ergastId: 'norris', code: 'NOR', number: 4, firstName: 'Lando', lastName: 'Norris', nationality: 'British', constructorId: 'mclaren', totalWins: 4, totalPoles: 8, championships: 0 },
  { ergastId: 'piastri', code: 'PIA', number: 81, firstName: 'Oscar', lastName: 'Piastri', nationality: 'Australian', constructorId: 'mclaren', totalWins: 2, totalPoles: 1, championships: 0 },
  // Mercedes
  { ergastId: 'russell', code: 'RUS', number: 63, firstName: 'George', lastName: 'Russell', nationality: 'British', constructorId: 'mercedes', totalWins: 3, totalPoles: 5, championships: 0 },
  { ergastId: 'antonelli', code: 'ANT', number: 12, firstName: 'Andrea Kimi', lastName: 'Antonelli', nationality: 'Italian', constructorId: 'mercedes', totalWins: 0, totalPoles: 0, championships: 0 },
  // Aston Martin
  { ergastId: 'alonso', code: 'ALO', number: 14, firstName: 'Fernando', lastName: 'Alonso', nationality: 'Spanish', constructorId: 'aston_martin', totalWins: 32, totalPoles: 22, championships: 2 },
  { ergastId: 'stroll', code: 'STR', number: 18, firstName: 'Lance', lastName: 'Stroll', nationality: 'Canadian', constructorId: 'aston_martin', totalWins: 0, totalPoles: 1, championships: 0 },
  // Alpine
  { ergastId: 'gasly', code: 'GAS', number: 10, firstName: 'Pierre', lastName: 'Gasly', nationality: 'French', constructorId: 'alpine', totalWins: 1, totalPoles: 0, championships: 0 },
  { ergastId: 'doohan', code: 'DOO', number: 7, firstName: 'Jack', lastName: 'Doohan', nationality: 'Australian', constructorId: 'alpine', totalWins: 0, totalPoles: 0, championships: 0 },
  // Williams
  { ergastId: 'sainz', code: 'SAI', number: 55, firstName: 'Carlos', lastName: 'Sainz', nationality: 'Spanish', constructorId: 'williams', totalWins: 4, totalPoles: 6, championships: 0 },
  { ergastId: 'albon', code: 'ALB', number: 23, firstName: 'Alexander', lastName: 'Albon', nationality: 'Thai', constructorId: 'williams', totalWins: 0, totalPoles: 0, championships: 0 },
  // RB
  { ergastId: 'tsunoda', code: 'TSU', number: 22, firstName: 'Yuki', lastName: 'Tsunoda', nationality: 'Japanese', constructorId: 'rb', totalWins: 0, totalPoles: 0, championships: 0 },
  { ergastId: 'hadjar', code: 'HAD', number: 20, firstName: 'Isack', lastName: 'Hadjar', nationality: 'French', constructorId: 'rb', totalWins: 0, totalPoles: 0, championships: 0 },
  // Sauber
  { ergastId: 'hulkenberg', code: 'HUL', number: 27, firstName: 'Nico', lastName: 'Hulkenberg', nationality: 'German', constructorId: 'kick_sauber', totalWins: 0, totalPoles: 1, championships: 0 },
  { ergastId: 'bortoleto', code: 'BOR', number: 5, firstName: 'Gabriel', lastName: 'Bortoleto', nationality: 'Brazilian', constructorId: 'kick_sauber', totalWins: 0, totalPoles: 0, championships: 0 },
  // Haas
  { ergastId: 'ocon', code: 'OCO', number: 31, firstName: 'Esteban', lastName: 'Ocon', nationality: 'French', constructorId: 'haas', totalWins: 1, totalPoles: 0, championships: 0 },
  { ergastId: 'bearman', code: 'BEA', number: 87, firstName: 'Oliver', lastName: 'Bearman', nationality: 'British', constructorId: 'haas', totalWins: 0, totalPoles: 0, championships: 0 },
];

// F1 2025 Circuits
const circuits = [
  { ergastId: 'albert_park', name: 'Albert Park Circuit', officialName: 'Melbourne Grand Prix Circuit', country: 'Australia', city: 'Melbourne', length: 5.278, turns: 14, lapRecord: '1:19.813', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2024, drsZones: 3, firstGP: 1996 },
  { ergastId: 'shanghai', name: 'Shanghai International Circuit', officialName: 'Shanghai International Circuit', country: 'China', city: 'Shanghai', length: 5.451, turns: 16, lapRecord: '1:32.238', lapRecordHolder: 'Michael Schumacher', lapRecordYear: 2004, drsZones: 2, firstGP: 2004 },
  { ergastId: 'suzuka', name: 'Suzuka Circuit', officialName: 'Suzuka International Racing Course', country: 'Japan', city: 'Suzuka', length: 5.807, turns: 18, lapRecord: '1:30.983', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2019, drsZones: 2, firstGP: 1987 },
  { ergastId: 'bahrain', name: 'Bahrain International Circuit', officialName: 'Bahrain International Circuit', country: 'Bahrain', city: 'Sakhir', length: 5.412, turns: 15, lapRecord: '1:31.447', lapRecordHolder: 'Pedro de la Rosa', lapRecordYear: 2005, drsZones: 3, firstGP: 2004 },
  { ergastId: 'jeddah', name: 'Jeddah Corniche Circuit', officialName: 'Jeddah Corniche Circuit', country: 'Saudi Arabia', city: 'Jeddah', length: 6.174, turns: 27, lapRecord: '1:30.734', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, drsZones: 3, firstGP: 2021 },
  { ergastId: 'miami', name: 'Miami International Autodrome', officialName: 'Miami International Autodrome', country: 'United States', city: 'Miami', length: 5.412, turns: 19, lapRecord: '1:29.708', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, drsZones: 3, firstGP: 2022 },
  { ergastId: 'imola', name: 'Autodromo Enzo e Dino Ferrari', officialName: 'Autodromo Internazionale Enzo e Dino Ferrari', country: 'Italy', city: 'Imola', length: 4.909, turns: 19, lapRecord: '1:15.484', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2020, drsZones: 2, firstGP: 1980 },
  { ergastId: 'monaco', name: 'Circuit de Monaco', officialName: 'Circuit de Monaco', country: 'Monaco', city: 'Monte Carlo', length: 3.337, turns: 19, lapRecord: '1:12.909', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, drsZones: 1, firstGP: 1950 },
  { ergastId: 'catalunya', name: 'Circuit de Barcelona-Catalunya', officialName: 'Circuit de Barcelona-Catalunya', country: 'Spain', city: 'Montmelo', length: 4.657, turns: 16, lapRecord: '1:16.330', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, drsZones: 2, firstGP: 1991 },
  { ergastId: 'villeneuve', name: 'Circuit Gilles Villeneuve', officialName: 'Circuit Gilles Villeneuve', country: 'Canada', city: 'Montreal', length: 4.361, turns: 14, lapRecord: '1:13.078', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2019, drsZones: 3, firstGP: 1978 },
  { ergastId: 'red_bull_ring', name: 'Red Bull Ring', officialName: 'Red Bull Ring', country: 'Austria', city: 'Spielberg', length: 4.318, turns: 10, lapRecord: '1:05.619', lapRecordHolder: 'Carlos Sainz', lapRecordYear: 2020, drsZones: 3, firstGP: 1970 },
  { ergastId: 'silverstone', name: 'Silverstone Circuit', officialName: 'Silverstone Circuit', country: 'United Kingdom', city: 'Silverstone', length: 5.891, turns: 18, lapRecord: '1:27.097', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2020, drsZones: 2, firstGP: 1950 },
  { ergastId: 'hungaroring', name: 'Hungaroring', officialName: 'Hungaroring', country: 'Hungary', city: 'Budapest', length: 4.381, turns: 14, lapRecord: '1:16.627', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2020, drsZones: 2, firstGP: 1986 },
  { ergastId: 'spa', name: 'Circuit de Spa-Francorchamps', officialName: 'Circuit de Spa-Francorchamps', country: 'Belgium', city: 'Spa', length: 7.004, turns: 19, lapRecord: '1:46.286', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018, drsZones: 2, firstGP: 1950 },
  { ergastId: 'zandvoort', name: 'Circuit Zandvoort', officialName: 'Circuit Zandvoort', country: 'Netherlands', city: 'Zandvoort', length: 4.259, turns: 14, lapRecord: '1:11.097', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2021, drsZones: 2, firstGP: 1952 },
  { ergastId: 'monza', name: 'Autodromo Nazionale Monza', officialName: 'Autodromo Nazionale Monza', country: 'Italy', city: 'Monza', length: 5.793, turns: 11, lapRecord: '1:21.046', lapRecordHolder: 'Rubens Barrichello', lapRecordYear: 2004, drsZones: 2, firstGP: 1950 },
  { ergastId: 'baku', name: 'Baku City Circuit', officialName: 'Baku City Circuit', country: 'Azerbaijan', city: 'Baku', length: 6.003, turns: 20, lapRecord: '1:43.009', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019, drsZones: 2, firstGP: 2016 },
  { ergastId: 'marina_bay', name: 'Marina Bay Street Circuit', officialName: 'Marina Bay Street Circuit', country: 'Singapore', city: 'Singapore', length: 4.940, turns: 19, lapRecord: '1:35.867', lapRecordHolder: 'Lewis Hamilton', lapRecordYear: 2023, drsZones: 3, firstGP: 2008 },
  { ergastId: 'americas', name: 'Circuit of the Americas', officialName: 'Circuit of the Americas', country: 'United States', city: 'Austin', length: 5.513, turns: 20, lapRecord: '1:36.169', lapRecordHolder: 'Charles Leclerc', lapRecordYear: 2019, drsZones: 2, firstGP: 2012 },
  { ergastId: 'rodriguez', name: 'Autodromo Hermanos Rodriguez', officialName: 'Autodromo Hermanos Rodriguez', country: 'Mexico', city: 'Mexico City', length: 4.304, turns: 17, lapRecord: '1:17.774', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2021, drsZones: 3, firstGP: 1963 },
  { ergastId: 'interlagos', name: 'Autodromo Jose Carlos Pace', officialName: 'Autodromo Jose Carlos Pace', country: 'Brazil', city: 'Sao Paulo', length: 4.309, turns: 15, lapRecord: '1:10.540', lapRecordHolder: 'Valtteri Bottas', lapRecordYear: 2018, drsZones: 2, firstGP: 1973 },
  { ergastId: 'vegas', name: 'Las Vegas Strip Circuit', officialName: 'Las Vegas Strip Circuit', country: 'United States', city: 'Las Vegas', length: 6.201, turns: 17, lapRecord: '1:35.490', lapRecordHolder: 'Oscar Piastri', lapRecordYear: 2023, drsZones: 2, firstGP: 2023 },
  { ergastId: 'losail', name: 'Losail International Circuit', officialName: 'Losail International Circuit', country: 'Qatar', city: 'Lusail', length: 5.419, turns: 16, lapRecord: '1:24.319', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2023, drsZones: 2, firstGP: 2021 },
  { ergastId: 'yas_marina', name: 'Yas Marina Circuit', officialName: 'Yas Marina Circuit', country: 'UAE', city: 'Abu Dhabi', length: 5.281, turns: 16, lapRecord: '1:26.103', lapRecordHolder: 'Max Verstappen', lapRecordYear: 2021, drsZones: 2, firstGP: 2009 },
];

// F1 2025 Calendar
const races2025 = [
  { round: 1, name: 'Australian Grand Prix', circuitId: 'albert_park', date: '2025-03-16', hasSprint: false },
  { round: 2, name: 'Chinese Grand Prix', circuitId: 'shanghai', date: '2025-03-23', hasSprint: true },
  { round: 3, name: 'Japanese Grand Prix', circuitId: 'suzuka', date: '2025-04-06', hasSprint: false },
  { round: 4, name: 'Bahrain Grand Prix', circuitId: 'bahrain', date: '2025-04-13', hasSprint: false },
  { round: 5, name: 'Saudi Arabian Grand Prix', circuitId: 'jeddah', date: '2025-04-20', hasSprint: false },
  { round: 6, name: 'Miami Grand Prix', circuitId: 'miami', date: '2025-05-04', hasSprint: true },
  { round: 7, name: 'Emilia Romagna Grand Prix', circuitId: 'imola', date: '2025-05-18', hasSprint: false },
  { round: 8, name: 'Monaco Grand Prix', circuitId: 'monaco', date: '2025-05-25', hasSprint: false },
  { round: 9, name: 'Spanish Grand Prix', circuitId: 'catalunya', date: '2025-06-01', hasSprint: false },
  { round: 10, name: 'Canadian Grand Prix', circuitId: 'villeneuve', date: '2025-06-15', hasSprint: false },
  { round: 11, name: 'Austrian Grand Prix', circuitId: 'red_bull_ring', date: '2025-06-29', hasSprint: true },
  { round: 12, name: 'British Grand Prix', circuitId: 'silverstone', date: '2025-07-06', hasSprint: false },
  { round: 13, name: 'Hungarian Grand Prix', circuitId: 'hungaroring', date: '2025-07-27', hasSprint: false },
  { round: 14, name: 'Belgian Grand Prix', circuitId: 'spa', date: '2025-08-03', hasSprint: true },
  { round: 15, name: 'Dutch Grand Prix', circuitId: 'zandvoort', date: '2025-08-31', hasSprint: false },
  { round: 16, name: 'Italian Grand Prix', circuitId: 'monza', date: '2025-09-07', hasSprint: false },
  { round: 17, name: 'Azerbaijan Grand Prix', circuitId: 'baku', date: '2025-09-21', hasSprint: false },
  { round: 18, name: 'Singapore Grand Prix', circuitId: 'marina_bay', date: '2025-10-05', hasSprint: false },
  { round: 19, name: 'United States Grand Prix', circuitId: 'americas', date: '2025-10-19', hasSprint: true },
  { round: 20, name: 'Mexico City Grand Prix', circuitId: 'rodriguez', date: '2025-10-26', hasSprint: false },
  { round: 21, name: 'Sao Paulo Grand Prix', circuitId: 'interlagos', date: '2025-11-09', hasSprint: true },
  { round: 22, name: 'Las Vegas Grand Prix', circuitId: 'vegas', date: '2025-11-22', hasSprint: false },
  { round: 23, name: 'Qatar Grand Prix', circuitId: 'losail', date: '2025-11-30', hasSprint: true },
  { round: 24, name: 'Abu Dhabi Grand Prix', circuitId: 'yas_marina', date: '2025-12-07', hasSprint: false },
];

// Badges for gamification
const badges = [
  { code: 'first_prediction', name: 'First Prediction', description: 'Made your first prediction', icon: '🏁', condition: 'Make 1 prediction' },
  { code: 'podium_master', name: 'Podium Master', description: 'Predicted exact podium', icon: '🏆', condition: 'Predict exact podium (3 positions)' },
  { code: 'pole_prophet', name: 'Pole Prophet', description: 'Predicted pole position 3 times', icon: '⚡', condition: 'Predict pole position 3 times' },
  { code: 'consistent', name: 'Consistent Predictor', description: 'Made predictions for 5 consecutive races', icon: '📊', condition: '5 consecutive race predictions' },
  { code: 'group_leader', name: 'Group Leader', description: 'Top of group leaderboard', icon: '👑', condition: 'Finish #1 in group standings' },
  { code: 'perfect_ten', name: 'Perfect Ten', description: 'Scored 100+ points in one race', icon: '💯', condition: 'Score 100+ points in a single race' },
  { code: 'early_bird', name: 'Early Bird', description: 'Submitted prediction 24h before deadline', icon: '🐦', condition: 'Submit prediction 24h early' },
  { code: 'social_butterfly', name: 'Social Butterfly', description: 'Joined 3 different groups', icon: '🦋', condition: 'Be member of 3 groups' },
];

async function main() {
  console.log('🏎️ Seeding F1 Tracker database...\n');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.standing.deleteMany();
  await prisma.circuitHistory.deleteMany();
  await prisma.raceSession.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.race.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.constructor.deleteMany();
  await prisma.circuit.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Seed Constructors
  console.log('🏢 Seeding constructors...');
  const constructorMap: Record<string, string> = {};
  for (const constructor of constructors) {
    const created = await prisma.constructor.create({
      data: constructor,
    });
    constructorMap[constructor.ergastId] = created.id;
  }
  console.log(`   ✅ Created ${constructors.length} constructors`);

  // Seed Drivers
  console.log('👤 Seeding drivers...');
  const driverMap: Record<string, string> = {};
  for (const driver of drivers) {
    const { constructorId, ...driverData } = driver;
    const created = await prisma.driver.create({
      data: {
        ...driverData,
        constructorId: constructorMap[constructorId],
      },
    });
    driverMap[driver.ergastId] = created.id;
  }
  console.log(`   ✅ Created ${drivers.length} drivers`);

  // Seed Circuits
  console.log('🏟️ Seeding circuits...');
  const circuitMap: Record<string, string> = {};
  for (const circuit of circuits) {
    const created = await prisma.circuit.create({
      data: circuit,
    });
    circuitMap[circuit.ergastId] = created.id;
  }
  console.log(`   ✅ Created ${circuits.length} circuits`);

  // Seed Races with Sessions
  console.log('🏁 Seeding 2025 races and sessions...');
  for (const race of races2025) {
    const raceDate = new Date(race.date);

    const createdRace = await prisma.race.create({
      data: {
        season: 2025,
        round: race.round,
        name: race.name,
        circuitId: circuitMap[race.circuitId],
        date: raceDate,
        hasSprint: race.hasSprint,
      },
    });

    // Create sessions for each race
    const sessions: { type: SessionType; dayOffset: number; hour: number }[] = race.hasSprint
      ? [
          { type: SessionType.FP1, dayOffset: -2, hour: 13 },
          { type: SessionType.SPRINT_QUALIFYING, dayOffset: -1, hour: 11 },
          { type: SessionType.SPRINT, dayOffset: -1, hour: 15 },
          { type: SessionType.QUALIFYING, dayOffset: -1, hour: 19 },
          { type: SessionType.RACE, dayOffset: 0, hour: 15 },
        ]
      : [
          { type: SessionType.FP1, dayOffset: -2, hour: 13 },
          { type: SessionType.FP2, dayOffset: -2, hour: 17 },
          { type: SessionType.FP3, dayOffset: -1, hour: 13 },
          { type: SessionType.QUALIFYING, dayOffset: -1, hour: 16 },
          { type: SessionType.RACE, dayOffset: 0, hour: 15 },
        ];

    for (const session of sessions) {
      const sessionDate = new Date(raceDate);
      sessionDate.setDate(sessionDate.getDate() + session.dayOffset);
      sessionDate.setHours(session.hour, 0, 0, 0);

      await prisma.raceSession.create({
        data: {
          raceId: createdRace.id,
          type: session.type,
          dateTime: sessionDate,
          completed: false,
        },
      });
    }
  }
  console.log(`   ✅ Created ${races2025.length} races with sessions`);

  // Seed Initial Standings (simulated for 2025 after round 0)
  console.log('📊 Seeding initial standings...');
  const driverStandings = [
    { ergastId: 'max_verstappen', points: 0, position: 1 },
    { ergastId: 'leclerc', points: 0, position: 2 },
    { ergastId: 'norris', points: 0, position: 3 },
    { ergastId: 'hamilton', points: 0, position: 4 },
    { ergastId: 'piastri', points: 0, position: 5 },
    { ergastId: 'russell', points: 0, position: 6 },
    { ergastId: 'sainz', points: 0, position: 7 },
    { ergastId: 'alonso', points: 0, position: 8 },
    { ergastId: 'tsunoda', points: 0, position: 9 },
    { ergastId: 'gasly', points: 0, position: 10 },
    { ergastId: 'lawson', points: 0, position: 11 },
    { ergastId: 'stroll', points: 0, position: 12 },
    { ergastId: 'hulkenberg', points: 0, position: 13 },
    { ergastId: 'albon', points: 0, position: 14 },
    { ergastId: 'ocon', points: 0, position: 15 },
    { ergastId: 'antonelli', points: 0, position: 16 },
    { ergastId: 'hadjar', points: 0, position: 17 },
    { ergastId: 'doohan', points: 0, position: 18 },
    { ergastId: 'bearman', points: 0, position: 19 },
    { ergastId: 'bortoleto', points: 0, position: 20 },
  ];

  for (const standing of driverStandings) {
    await prisma.standing.create({
      data: {
        season: 2025,
        round: 0,
        type: StandingType.DRIVER,
        position: standing.position,
        driverId: driverMap[standing.ergastId],
        points: standing.points,
        wins: 0,
      },
    });
  }

  const constructorStandings = [
    { ergastId: 'red_bull', points: 0, position: 1 },
    { ergastId: 'ferrari', points: 0, position: 2 },
    { ergastId: 'mclaren', points: 0, position: 3 },
    { ergastId: 'mercedes', points: 0, position: 4 },
    { ergastId: 'aston_martin', points: 0, position: 5 },
    { ergastId: 'alpine', points: 0, position: 6 },
    { ergastId: 'rb', points: 0, position: 7 },
    { ergastId: 'williams', points: 0, position: 8 },
    { ergastId: 'haas', points: 0, position: 9 },
    { ergastId: 'kick_sauber', points: 0, position: 10 },
  ];

  for (const standing of constructorStandings) {
    await prisma.standing.create({
      data: {
        season: 2025,
        round: 0,
        type: StandingType.CONSTRUCTOR,
        position: standing.position,
        constructorId: constructorMap[standing.ergastId],
        points: standing.points,
        wins: 0,
      },
    });
  }
  console.log(`   ✅ Created ${driverStandings.length} driver standings`);
  console.log(`   ✅ Created ${constructorStandings.length} constructor standings`);

  // Seed Badges
  console.log('🏅 Seeding badges...');
  for (const badge of badges) {
    await prisma.badge.create({
      data: badge,
    });
  }
  console.log(`   ✅ Created ${badges.length} badges`);

  // Seed Test User
  console.log('👤 Creating test user...');
  const hashedPassword = await hash('password123', 12);
  const testUser = await prisma.user.create({
    data: {
      email: 'test@f1tracker.com',
      password: hashedPassword,
      pseudo: 'TestDriver',
      emailVerified: new Date(),
    },
  });
  console.log('   ✅ Test user: test@f1tracker.com / password123');

  // Create a test group
  console.log('👥 Creating test group...');
  await prisma.group.create({
    data: {
      name: 'F1 Fans',
      createdById: testUser.id,
      members: {
        create: {
          userId: testUser.id,
          totalPoints: 0,
        },
      },
    },
  });
  console.log('   ✅ Created test group: F1 Fans');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log(`
Summary:
- ${constructors.length} constructors
- ${drivers.length} drivers
- ${circuits.length} circuits
- ${races2025.length} races (2025 calendar)
- ${driverStandings.length} driver standings
- ${constructorStandings.length} constructor standings
- ${badges.length} badges
- 1 test user (test@f1tracker.com / password123)
- 1 test group (F1 Fans)
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
