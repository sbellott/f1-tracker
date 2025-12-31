/**
 * Prisma Seed Script
 *
 * Seeds the database with initial F1 data for 2024/2025 seasons.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// ============================================
// 2024/2025 F1 Grid Data
// ============================================

const CONSTRUCTORS_2024 = [
  { ergastId: "red_bull", name: "Red Bull Racing", nationality: "Austrian", color: "#3671C6" },
  { ergastId: "mercedes", name: "Mercedes", nationality: "German", color: "#27F4D2" },
  { ergastId: "ferrari", name: "Ferrari", nationality: "Italian", color: "#E8002D" },
  { ergastId: "mclaren", name: "McLaren", nationality: "British", color: "#FF8000" },
  { ergastId: "aston_martin", name: "Aston Martin", nationality: "British", color: "#229971" },
  { ergastId: "alpine", name: "Alpine", nationality: "French", color: "#FF87BC" },
  { ergastId: "williams", name: "Williams", nationality: "British", color: "#64C4FF" },
  { ergastId: "rb", name: "RB", nationality: "Italian", color: "#6692FF" },
  { ergastId: "sauber", name: "Kick Sauber", nationality: "Swiss", color: "#52E252" },
  { ergastId: "haas", name: "Haas F1 Team", nationality: "American", color: "#B6BABD" },
];

const DRIVERS_2024 = [
  { ergastId: "max_verstappen", code: "VER", number: 1, firstName: "Max", lastName: "Verstappen", nationality: "Dutch", dateOfBirth: "1997-09-30", constructorId: "red_bull" },
  { ergastId: "perez", code: "PER", number: 11, firstName: "Sergio", lastName: "Pérez", nationality: "Mexican", dateOfBirth: "1990-01-26", constructorId: "red_bull" },
  { ergastId: "hamilton", code: "HAM", number: 44, firstName: "Lewis", lastName: "Hamilton", nationality: "British", dateOfBirth: "1985-01-07", constructorId: "mercedes" },
  { ergastId: "russell", code: "RUS", number: 63, firstName: "George", lastName: "Russell", nationality: "British", dateOfBirth: "1998-02-15", constructorId: "mercedes" },
  { ergastId: "leclerc", code: "LEC", number: 16, firstName: "Charles", lastName: "Leclerc", nationality: "Monegasque", dateOfBirth: "1997-10-16", constructorId: "ferrari" },
  { ergastId: "sainz", code: "SAI", number: 55, firstName: "Carlos", lastName: "Sainz", nationality: "Spanish", dateOfBirth: "1994-09-01", constructorId: "ferrari" },
  { ergastId: "norris", code: "NOR", number: 4, firstName: "Lando", lastName: "Norris", nationality: "British", dateOfBirth: "1999-11-13", constructorId: "mclaren" },
  { ergastId: "piastri", code: "PIA", number: 81, firstName: "Oscar", lastName: "Piastri", nationality: "Australian", dateOfBirth: "2001-04-06", constructorId: "mclaren" },
  { ergastId: "alonso", code: "ALO", number: 14, firstName: "Fernando", lastName: "Alonso", nationality: "Spanish", dateOfBirth: "1981-07-29", constructorId: "aston_martin" },
  { ergastId: "stroll", code: "STR", number: 18, firstName: "Lance", lastName: "Stroll", nationality: "Canadian", dateOfBirth: "1998-10-29", constructorId: "aston_martin" },
  { ergastId: "gasly", code: "GAS", number: 10, firstName: "Pierre", lastName: "Gasly", nationality: "French", dateOfBirth: "1996-02-07", constructorId: "alpine" },
  { ergastId: "ocon", code: "OCO", number: 31, firstName: "Esteban", lastName: "Ocon", nationality: "French", dateOfBirth: "1996-09-17", constructorId: "alpine" },
  { ergastId: "albon", code: "ALB", number: 23, firstName: "Alex", lastName: "Albon", nationality: "Thai", dateOfBirth: "1996-03-23", constructorId: "williams" },
  { ergastId: "sargeant", code: "SAR", number: 2, firstName: "Logan", lastName: "Sargeant", nationality: "American", dateOfBirth: "2000-12-31", constructorId: "williams" },
  { ergastId: "tsunoda", code: "TSU", number: 22, firstName: "Yuki", lastName: "Tsunoda", nationality: "Japanese", dateOfBirth: "2000-05-11", constructorId: "rb" },
  { ergastId: "ricciardo", code: "RIC", number: 3, firstName: "Daniel", lastName: "Ricciardo", nationality: "Australian", dateOfBirth: "1989-07-01", constructorId: "rb" },
  { ergastId: "bottas", code: "BOT", number: 77, firstName: "Valtteri", lastName: "Bottas", nationality: "Finnish", dateOfBirth: "1989-08-28", constructorId: "sauber" },
  { ergastId: "zhou", code: "ZHO", number: 24, firstName: "Guanyu", lastName: "Zhou", nationality: "Chinese", dateOfBirth: "1999-05-30", constructorId: "sauber" },
  { ergastId: "kevin_magnussen", code: "MAG", number: 20, firstName: "Kevin", lastName: "Magnussen", nationality: "Danish", dateOfBirth: "1992-10-05", constructorId: "haas" },
  { ergastId: "hulkenberg", code: "HUL", number: 27, firstName: "Nico", lastName: "Hülkenberg", nationality: "German", dateOfBirth: "1987-08-19", constructorId: "haas" },
];

const CIRCUITS_2024 = [
  { ergastId: "bahrain", name: "Bahrain International Circuit", location: "Sakhir", country: "Bahrain", latitude: 26.0325, longitude: 50.5106 },
  { ergastId: "jeddah", name: "Jeddah Corniche Circuit", location: "Jeddah", country: "Saudi Arabia", latitude: 21.6319, longitude: 39.1044 },
  { ergastId: "albert_park", name: "Albert Park Grand Prix Circuit", location: "Melbourne", country: "Australia", latitude: -37.8497, longitude: 144.968 },
  { ergastId: "suzuka", name: "Suzuka Circuit", location: "Suzuka", country: "Japan", latitude: 34.8431, longitude: 136.541 },
  { ergastId: "shanghai", name: "Shanghai International Circuit", location: "Shanghai", country: "China", latitude: 31.3389, longitude: 121.22 },
  { ergastId: "miami", name: "Miami International Autodrome", location: "Miami", country: "USA", latitude: 25.9581, longitude: -80.2389 },
  { ergastId: "imola", name: "Autodromo Enzo e Dino Ferrari", location: "Imola", country: "Italy", latitude: 44.3439, longitude: 11.7167 },
  { ergastId: "monaco", name: "Circuit de Monaco", location: "Monte-Carlo", country: "Monaco", latitude: 43.7347, longitude: 7.4206 },
  { ergastId: "villeneuve", name: "Circuit Gilles Villeneuve", location: "Montreal", country: "Canada", latitude: 45.5, longitude: -73.5228 },
  { ergastId: "catalunya", name: "Circuit de Barcelona-Catalunya", location: "Montmeló", country: "Spain", latitude: 41.57, longitude: 2.2611 },
  { ergastId: "red_bull_ring", name: "Red Bull Ring", location: "Spielberg", country: "Austria", latitude: 47.2197, longitude: 14.7647 },
  { ergastId: "silverstone", name: "Silverstone Circuit", location: "Silverstone", country: "UK", latitude: 52.0786, longitude: -1.0169 },
  { ergastId: "hungaroring", name: "Hungaroring", location: "Budapest", country: "Hungary", latitude: 47.5789, longitude: 19.2486 },
  { ergastId: "spa", name: "Circuit de Spa-Francorchamps", location: "Spa", country: "Belgium", latitude: 50.4372, longitude: 5.9714 },
  { ergastId: "zandvoort", name: "Circuit Park Zandvoort", location: "Zandvoort", country: "Netherlands", latitude: 52.3888, longitude: 4.5409 },
  { ergastId: "monza", name: "Autodromo Nazionale di Monza", location: "Monza", country: "Italy", latitude: 45.6156, longitude: 9.2811 },
  { ergastId: "baku", name: "Baku City Circuit", location: "Baku", country: "Azerbaijan", latitude: 40.3725, longitude: 49.8533 },
  { ergastId: "marina_bay", name: "Marina Bay Street Circuit", location: "Marina Bay", country: "Singapore", latitude: 1.2914, longitude: 103.864 },
  { ergastId: "americas", name: "Circuit of the Americas", location: "Austin", country: "USA", latitude: 30.1328, longitude: -97.6411 },
  { ergastId: "rodriguez", name: "Autódromo Hermanos Rodríguez", location: "Mexico City", country: "Mexico", latitude: 19.4042, longitude: -99.0907 },
  { ergastId: "interlagos", name: "Autódromo José Carlos Pace", location: "São Paulo", country: "Brazil", latitude: -23.7036, longitude: -46.6997 },
  { ergastId: "vegas", name: "Las Vegas Strip Circuit", location: "Las Vegas", country: "USA", latitude: 36.1147, longitude: -115.173 },
  { ergastId: "losail", name: "Losail International Circuit", location: "Al Daayen", country: "Qatar", latitude: 25.49, longitude: 51.4542 },
  { ergastId: "yas_marina", name: "Yas Marina Circuit", location: "Abu Dhabi", country: "UAE", latitude: 24.4672, longitude: 54.6031 },
];

// ============================================
// Seed Functions
// ============================================

async function seedConstructors(): Promise<void> {
  console.log("🏎️ Seeding constructors...");

  for (const constructor of CONSTRUCTORS_2024) {
    await prisma.constructor.upsert({
      where: { ergastId: constructor.ergastId },
      update: {
        name: constructor.name,
        nationality: constructor.nationality,
        color: constructor.color,
      },
      create: {
        ergastId: constructor.ergastId,
        name: constructor.name,
        nationality: constructor.nationality,
        color: constructor.color,
      },
    });
  }

  console.log(`  ✅ Seeded ${CONSTRUCTORS_2024.length} constructors`);
}

async function seedDrivers(): Promise<void> {
  console.log("👤 Seeding drivers...");

  // Get constructor mapping
  const constructors = await prisma.constructor.findMany();
  const constructorMap = new Map(constructors.map((c) => [c.ergastId, c.id]));

  for (const driver of DRIVERS_2024) {
    const constructorId = constructorMap.get(driver.constructorId);

    await prisma.driver.upsert({
      where: { ergastId: driver.ergastId },
      update: {
        code: driver.code,
        number: driver.number,
        firstName: driver.firstName,
        lastName: driver.lastName,
        nationality: driver.nationality,
        dateOfBirth: new Date(driver.dateOfBirth),
        constructorId,
      },
      create: {
        ergastId: driver.ergastId,
        code: driver.code,
        number: driver.number,
        firstName: driver.firstName,
        lastName: driver.lastName,
        nationality: driver.nationality,
        dateOfBirth: new Date(driver.dateOfBirth),
        constructorId,
      },
    });
  }

  console.log(`  ✅ Seeded ${DRIVERS_2024.length} drivers`);
}

async function seedCircuits(): Promise<void> {
  console.log("🏁 Seeding circuits...");

  for (const circuit of CIRCUITS_2024) {
    await prisma.circuit.upsert({
      where: { ergastId: circuit.ergastId },
      update: {
        name: circuit.name,
        location: circuit.location,
        country: circuit.country,
        latitude: circuit.latitude,
        longitude: circuit.longitude,
      },
      create: {
        ergastId: circuit.ergastId,
        name: circuit.name,
        location: circuit.location,
        country: circuit.country,
        latitude: circuit.latitude,
        longitude: circuit.longitude,
      },
    });
  }

  console.log(`  ✅ Seeded ${CIRCUITS_2024.length} circuits`);
}

async function seedTestUser(): Promise<void> {
  console.log("👤 Seeding test user...");

  const hashedPassword = await hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "test@f1tracker.com" },
    update: {},
    create: {
      email: "test@f1tracker.com",
      name: "Test User",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("  ✅ Test user created: test@f1tracker.com / password123");
}

// ============================================
// Main
// ============================================

async function main(): Promise<void> {
  console.log("🌱 F1 Tracker Database Seed");
  console.log("============================\n");

  const startTime = Date.now();

  try {
    await seedConstructors();
    await seedDrivers();
    await seedCircuits();
    await seedTestUser();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n============================");
    console.log(`✅ Seed complete! (${duration}s)`);
    console.log("\nNext steps:");
    console.log("  1. Run 'npm run sync:f1' to fetch full race calendar");
    console.log("  2. Run 'npm run dev' to start the development server");
  } catch (error) {
    console.error("\n❌ Seed failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
