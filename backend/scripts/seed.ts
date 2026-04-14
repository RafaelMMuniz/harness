/**
 * MiniPanel Sample Data Seeder
 *
 * Generates realistic analytics data with:
 * - 50+ resolved users, 10+ never-identified devices, 5+ multi-device users
 * - 10,000+ events over 30 days with non-uniform distribution
 * - 5 event types with varied properties
 * - Identity resolution scenarios (anonymous-then-identified, multi-device, anonymous-only)
 */

import { getDb } from '../src/db.js';

// --- Seeded PRNG (Linear Congruential Generator) ---

class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    // LCG parameters from Numerical Recipes
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff;
    return (this.state >>> 0) / 0x100000000;
  }

  /** Returns an integer in [min, max] inclusive */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Pick a random element from an array */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick from weighted options: [[value, weight], ...] */
  weighted<T>(options: [T, number][]): T {
    const total = options.reduce((sum, [, w]) => sum + w, 0);
    let r = this.next() * total;
    for (const [value, weight] of options) {
      r -= weight;
      if (r <= 0) return value;
    }
    return options[options.length - 1][0];
  }

  /** Shuffle array in place (Fisher-Yates) */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// --- Constants ---

const SEED = 42;
const rng = new SeededRandom(SEED);

const TOTAL_EVENTS_TARGET = 12000;
const DAYS_BACK = 30;

const PAGES = [
  '/home', '/pricing', '/features', '/docs', '/blog',
  '/about', '/contact', '/signup', '/login', '/dashboard',
  '/settings', '/profile', '/integrations', '/api-docs', '/changelog',
];

const REFERRERS = [
  'google.com', 'twitter.com', 'linkedin.com', 'reddit.com',
  'hackernews', 'direct', 'producthunt.com', 'github.com',
];

const BUTTON_NAMES = [
  'cta_hero', 'cta_pricing', 'start_trial', 'signup_header',
  'learn_more', 'view_demo', 'contact_sales', 'download',
  'share', 'invite_team', 'upgrade_plan', 'add_integration',
];

const PLAN_TYPES = ['free', 'starter', 'pro', 'enterprise'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];

const FIRST_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank',
  'Ivy', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yara', 'Zach', 'Aria', 'Blake', 'Cleo', 'Devin', 'Elena', 'Finn',
  'Gabi', 'Hugo', 'Iris', 'Jay', 'Kira', 'Liam', 'Maya', 'Niko',
  'Opal', 'Petra', 'Reed', 'Sara', 'Tomas', 'Ulrich', 'Vera', 'Wren',
  'Xena', 'Yuki', 'Zoe', 'Amber', 'Boris', 'Coral', 'Dante',
];

const DOMAINS = ['example.com', 'testmail.org', 'acme.co', 'startup.io', 'corp.net'];

// --- Types ---

interface UserProfile {
  userId: string;
  deviceIds: string[];
  activityWeight: number; // higher = more events
  signupDay: number; // day offset from start (0-29)
  isAnonymousThenIdentified: boolean;
  anonymousDaysBeforeIdentify: number;
}

interface RawEvent {
  event_name: string;
  device_id: string | null;
  user_id: string | null;
  timestamp: string;
  properties: string | null;
}

// --- Helpers ---

function generateTimestamp(dayOffset: number, rng: SeededRandom): string {
  const now = new Date();
  const base = new Date(now);
  base.setUTCDate(base.getUTCDate() - (DAYS_BACK - dayOffset));
  base.setUTCHours(rng.int(6, 23), rng.int(0, 59), rng.int(0, 59), rng.int(0, 999));
  return base.toISOString();
}

function generateEmail(name: string, rng: SeededRandom): string {
  return `${name.toLowerCase()}@${rng.pick(DOMAINS)}`;
}

function generateDeviceId(rng: SeededRandom): string {
  const chars = 'abcdef0123456789';
  let id = 'dev_';
  for (let i = 0; i < 12; i++) {
    id += chars[rng.int(0, chars.length - 1)];
  }
  return id;
}

function generateEventProperties(
  eventName: string,
  rng: SeededRandom
): Record<string, string | number | boolean> {
  switch (eventName) {
    case 'Page Viewed':
      return {
        url: rng.pick(PAGES),
        referrer: rng.pick(REFERRERS),
      };
    case 'Button Clicked':
      return {
        button_name: rng.pick(BUTTON_NAMES),
        page: rng.pick(PAGES),
      };
    case 'Sign Up Completed':
      return {
        plan_type: rng.pick(PLAN_TYPES),
        referrer: rng.pick(REFERRERS),
      };
    case 'Purchase Completed': {
      const plan = rng.weighted<string>([
        ['starter', 40],
        ['pro', 35],
        ['enterprise', 25],
      ]);
      const amounts: Record<string, number[]> = {
        starter: [9, 12, 15, 19],
        pro: [29, 39, 49, 59],
        enterprise: [99, 149, 199, 299],
      };
      return {
        amount: rng.pick(amounts[plan]),
        currency: rng.pick(CURRENCIES),
        plan_type: plan,
      };
    }
    case 'Subscription Renewed': {
      const renewPlan = rng.weighted<string>([
        ['starter', 30],
        ['pro', 45],
        ['enterprise', 25],
      ]);
      const renewAmounts: Record<string, number[]> = {
        starter: [9, 12, 15],
        pro: [29, 39, 49],
        enterprise: [99, 149, 199],
      };
      return {
        amount: rng.pick(renewAmounts[renewPlan]),
        duration_months: rng.pick([1, 3, 6, 12]),
        plan_type: renewPlan,
      };
    }
    default:
      return {};
  }
}

// --- Main ---

function seed() {
  console.log('Seeding MiniPanel database...');
  const db = getDb();

  // Clear existing data
  console.log('Clearing existing data...');
  db.exec('DELETE FROM events');
  db.exec('DELETE FROM identity_mappings');
  db.exec('DELETE FROM saved_analyses');

  // --- Generate user profiles ---

  const users: UserProfile[] = [];

  // 25 anonymous-then-identified users (single device)
  for (let i = 0; i < 25; i++) {
    const name = FIRST_NAMES[i % FIRST_NAMES.length];
    const deviceId = generateDeviceId(rng);
    users.push({
      userId: generateEmail(name, rng),
      deviceIds: [deviceId],
      activityWeight: Math.pow(rng.next(), 0.5) * 4 + 0.5, // power-law: range ~0.5-4.5
      signupDay: rng.int(0, 20), // sign up in first 20 days
      isAnonymousThenIdentified: true,
      anonymousDaysBeforeIdentify: rng.int(1, 5),
    });
  }

  // 8 multi-device users (2-3 devices each)
  for (let i = 0; i < 8; i++) {
    const name = FIRST_NAMES[(25 + i) % FIRST_NAMES.length];
    const numDevices = rng.int(2, 3);
    const deviceIds: string[] = [];
    for (let d = 0; d < numDevices; d++) {
      deviceIds.push(generateDeviceId(rng));
    }
    users.push({
      userId: generateEmail(name, rng),
      deviceIds,
      activityWeight: Math.pow(rng.next(), 0.3) * 5 + 1, // multi-device users tend to be more active
      signupDay: rng.int(0, 15),
      isAnonymousThenIdentified: true,
      anonymousDaysBeforeIdentify: rng.int(1, 3),
    });
  }

  // 20 immediately-identified users (have user_id from the start)
  for (let i = 0; i < 20; i++) {
    const name = FIRST_NAMES[(33 + i) % FIRST_NAMES.length];
    const deviceId = generateDeviceId(rng);
    users.push({
      userId: generateEmail(name, rng),
      deviceIds: [deviceId],
      activityWeight: Math.pow(rng.next(), 0.5) * 3 + 0.3,
      signupDay: rng.int(0, 25),
      isAnonymousThenIdentified: false,
      anonymousDaysBeforeIdentify: 0,
    });
  }

  // 15 never-identified devices (anonymous only)
  const anonymousDevices: string[] = [];
  for (let i = 0; i < 15; i++) {
    anonymousDevices.push(generateDeviceId(rng));
  }

  console.log(
    `Generated ${users.length} user profiles + ${anonymousDevices.length} anonymous devices`
  );

  // --- Generate events ---

  const events: RawEvent[] = [];
  const identityMappings: Array<{ device_id: string; user_id: string }> = [];

  // Event type weights
  const eventTypes: [string, number][] = [
    ['Page Viewed', 40],
    ['Button Clicked', 25],
    ['Sign Up Completed', 15],
    ['Purchase Completed', 12],
    ['Subscription Renewed', 8],
  ];

  // Day weights: more recent days have more events (exponential growth pattern)
  const dayWeights: number[] = [];
  for (let d = 0; d < DAYS_BACK; d++) {
    // Exponential-ish curve: day 0 weight ~0.5, day 29 weight ~3.0
    dayWeights.push(0.5 + 2.5 * Math.pow(d / (DAYS_BACK - 1), 1.5));
  }
  const totalDayWeight = dayWeights.reduce((a, b) => a + b, 0);
  const dayProbabilities = dayWeights.map((w) => w / totalDayWeight);

  function pickDay(): number {
    let r = rng.next();
    for (let d = 0; d < DAYS_BACK; d++) {
      r -= dayProbabilities[d];
      if (r <= 0) return d;
    }
    return DAYS_BACK - 1;
  }

  // Generate events for identified users
  for (const user of users) {
    const eventCount = Math.round(
      (TOTAL_EVENTS_TARGET / (users.length + anonymousDevices.length)) *
        user.activityWeight
    );

    for (let e = 0; e < eventCount; e++) {
      const day = pickDay();
      const deviceId = rng.pick(user.deviceIds);
      const eventName = rng.weighted(eventTypes);
      const timestamp = generateTimestamp(day, rng);
      const properties = generateEventProperties(eventName, rng);

      if (user.isAnonymousThenIdentified) {
        const identifyDay = user.signupDay + user.anonymousDaysBeforeIdentify;
        if (day < identifyDay) {
          // Anonymous phase: only device_id
          events.push({
            event_name: eventName,
            device_id: deviceId,
            user_id: null,
            timestamp,
            properties: JSON.stringify(properties),
          });
        } else if (day === identifyDay && e === 0) {
          // Identification event: both device_id and user_id
          // For multi-device users, identify each device
          events.push({
            event_name: eventName,
            device_id: deviceId,
            user_id: user.userId,
            timestamp,
            properties: JSON.stringify(properties),
          });
        } else {
          // Post-identification: both ids
          events.push({
            event_name: eventName,
            device_id: deviceId,
            user_id: user.userId,
            timestamp,
            properties: JSON.stringify(properties),
          });
        }
      } else {
        // Immediately identified: all events have both ids
        if (day >= user.signupDay) {
          events.push({
            event_name: eventName,
            device_id: deviceId,
            user_id: user.userId,
            timestamp,
            properties: JSON.stringify(properties),
          });
        }
      }
    }

    // Ensure each device gets an identification event
    for (const deviceId of user.deviceIds) {
      if (!identityMappings.some((m) => m.device_id === deviceId)) {
        identityMappings.push({ device_id: deviceId, user_id: user.userId });
      }
    }
  }

  // Generate events for anonymous devices
  for (const deviceId of anonymousDevices) {
    const eventCount = rng.int(10, 80);
    for (let e = 0; e < eventCount; e++) {
      const day = pickDay();
      const eventName = rng.weighted([
        ['Page Viewed', 60],
        ['Button Clicked', 30],
        ['Sign Up Completed', 5],
        ['Purchase Completed', 3],
        ['Subscription Renewed', 2],
      ]);
      const timestamp = generateTimestamp(day, rng);
      const properties = generateEventProperties(eventName, rng);

      events.push({
        event_name: eventName,
        device_id: deviceId,
        user_id: null,
        timestamp,
        properties: JSON.stringify(properties),
      });
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  console.log(`Generated ${events.length} events`);
  console.log(`Generated ${identityMappings.length} identity mappings`);

  // --- Insert into database ---

  console.log('Inserting identity mappings...');
  const insertMapping = db.prepare(
    'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)'
  );
  const mappingTransaction = db.transaction(() => {
    for (const mapping of identityMappings) {
      insertMapping.run(
        mapping.device_id,
        mapping.user_id,
        new Date().toISOString()
      );
    }
  });
  mappingTransaction();

  console.log('Inserting events in batches...');
  const insertEvent = db.prepare(
    'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)'
  );

  const BATCH_SIZE = 2000;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const batchTransaction = db.transaction(() => {
      for (const event of batch) {
        insertEvent.run(
          event.event_name,
          event.device_id,
          event.user_id,
          event.timestamp,
          event.properties
        );
      }
    });
    batchTransaction();
    console.log(
      `  Inserted ${Math.min(i + BATCH_SIZE, events.length)}/${events.length} events`
    );
  }

  // --- Summary ---

  const totalEventsCount = (
    db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }
  ).c;
  const totalMappings = (
    db.prepare('SELECT COUNT(*) as c FROM identity_mappings').get() as { c: number }
  ).c;
  const distinctUsers = (
    db
      .prepare(
        `SELECT COUNT(DISTINCT resolved_id) as c FROM (
          SELECT COALESCE(
            (SELECT im.user_id FROM identity_mappings im WHERE im.device_id = e.device_id),
            e.user_id,
            e.device_id
          ) AS resolved_id FROM events e
        )`
      )
      .get() as { c: number }
  ).c;
  const eventNames = db
    .prepare(
      'SELECT event_name, COUNT(*) as c FROM events GROUP BY event_name ORDER BY c DESC'
    )
    .all() as Array<{ event_name: string; c: number }>;

  console.log('\n--- Seed Complete ---');
  console.log(`Total events: ${totalEventsCount}`);
  console.log(`Identity mappings: ${totalMappings}`);
  console.log(`Distinct resolved users: ${distinctUsers}`);
  console.log('\nEvent distribution:');
  for (const row of eventNames) {
    const pct = ((row.c / totalEventsCount) * 100).toFixed(1);
    console.log(`  ${row.event_name}: ${row.c} (${pct}%)`);
  }
}

seed();
