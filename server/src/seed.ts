import { initDatabase, getDb, saveDb } from './db.js';

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(42);

function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(random() * arr.length)];
}

/**
 * Power-law weighted index selection (favors lower indices).
 */
function powerLawIndex(length: number, exponent = 1.5): number {
  const u = random();
  return Math.min(Math.floor(Math.pow(u, exponent) * length), length - 1);
}

// ── Data templates ───────────────────────────────────────────────────

const EVENT_TYPES = [
  'Page Viewed',
  'Button Clicked',
  'Sign Up Completed',
  'Purchase Completed',
  'Subscription Renewed',
] as const;

const PAGES = ['/home', '/pricing', '/docs', '/blog', '/dashboard', '/settings', '/features', '/about'];
const BUTTONS = ['cta-hero', 'nav-signup', 'add-to-cart', 'checkout', 'upgrade', 'share', 'download'];
const PLANS = ['free', 'starter', 'pro', 'enterprise'];
const SOURCES = ['google', 'twitter', 'direct', 'email', 'referral', 'producthunt', 'hackernews'];
const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge'];
const COUNTRIES = ['US', 'GB', 'DE', 'FR', 'JP', 'BR', 'IN', 'CA', 'AU', 'NL'];

function generateProperties(eventType: string): Record<string, unknown> {
  switch (eventType) {
    case 'Page Viewed':
      return {
        page: pick(PAGES),
        referrer: pick(SOURCES),
        browser: pick(BROWSERS),
        country: pick(COUNTRIES),
        load_time_ms: randomInt(80, 3500),
      };
    case 'Button Clicked':
      return {
        button_id: pick(BUTTONS),
        page: pick(PAGES),
        browser: pick(BROWSERS),
      };
    case 'Sign Up Completed':
      return {
        plan: pick(PLANS),
        source: pick(SOURCES),
        country: pick(COUNTRIES),
      };
    case 'Purchase Completed':
      return {
        amount: Math.round((random() * 200 + 5) * 100) / 100,
        currency: 'USD',
        plan: pick(PLANS),
        country: pick(COUNTRIES),
      };
    case 'Subscription Renewed':
      return {
        amount: Math.round((random() * 100 + 10) * 100) / 100,
        plan: pick(PLANS),
        months: pick([1, 3, 6, 12]),
      };
    default:
      return {};
  }
}

// ── Generate identities ─────────────────────────────────────────────

interface Identity {
  userId: string | null;
  deviceIds: string[];
}

function generateIdentities(): Identity[] {
  const identities: Identity[] = [];

  // 20 users who start anonymous then get identified
  for (let i = 1; i <= 20; i++) {
    identities.push({
      userId: `user-${String(i).padStart(3, '0')}`,
      deviceIds: [`device-anon-${String(i).padStart(3, '0')}`],
    });
  }

  // 5 multi-device users (2-3 devices each)
  for (let i = 21; i <= 25; i++) {
    const numDevices = randomInt(2, 3);
    const deviceIds: string[] = [];
    for (let d = 1; d <= numDevices; d++) {
      deviceIds.push(`device-multi-${i}-${d}`);
    }
    identities.push({
      userId: `user-${String(i).padStart(3, '0')}`,
      deviceIds,
    });
  }

  // 25 more identified users (simple, 1 device each)
  for (let i = 26; i <= 50; i++) {
    identities.push({
      userId: `user-${String(i).padStart(3, '0')}`,
      deviceIds: [`device-${String(i).padStart(3, '0')}`],
    });
  }

  // 10 never-identified anonymous devices
  for (let i = 1; i <= 10; i++) {
    identities.push({
      userId: null,
      deviceIds: [`device-unknown-${String(i).padStart(3, '0')}`],
    });
  }

  return identities;
}

// ── Main seed logic ─────────────────────────────────────────────────

async function seed() {
  await initDatabase();
  const db = getDb();

  console.log('Clearing existing data...');
  db.run('DELETE FROM events');
  db.run('DELETE FROM identity_mappings');
  db.run('DELETE FROM saved_analyses');

  const identities = generateIdentities();
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Insert identity mappings for identified users
  console.log('Creating identity mappings...');
  db.run('BEGIN TRANSACTION');

  for (const identity of identities) {
    if (!identity.userId) continue;
    for (const deviceId of identity.deviceIds) {
      const createdAt = new Date(now - randomInt(0, thirtyDaysMs)).toISOString();
      db.run(
        `INSERT INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)`,
        [deviceId, identity.userId, createdAt]
      );
    }
  }

  db.run('COMMIT');

  // Generate events with power-law distribution
  console.log('Generating events...');
  const TARGET_EVENTS = 12000;

  // Event type weights (power-law: page views dominate)
  const eventWeights: Array<{ event: string; weight: number }> = [
    { event: 'Page Viewed', weight: 0.50 },
    { event: 'Button Clicked', weight: 0.25 },
    { event: 'Sign Up Completed', weight: 0.10 },
    { event: 'Purchase Completed', weight: 0.10 },
    { event: 'Subscription Renewed', weight: 0.05 },
  ];

  function pickWeightedEvent(): string {
    let r = random();
    for (const { event, weight } of eventWeights) {
      r -= weight;
      if (r <= 0) return event;
    }
    return eventWeights[eventWeights.length - 1].event;
  }

  db.run('BEGIN TRANSACTION');

  for (let i = 0; i < TARGET_EVENTS; i++) {
    // Pick an identity with power-law (some users are much more active)
    const identityIdx = powerLawIndex(identities.length, 1.3);
    const identity = identities[identityIdx];

    const eventType = pickWeightedEvent();
    const timestamp = new Date(now - randomInt(0, thirtyDaysMs)).toISOString();
    const properties = generateProperties(eventType);
    const deviceId = pick(identity.deviceIds);

    // For the first 20 identities (anonymous→identified), some early events have no user_id
    const isEarlyAnonymous = identityIdx < 20 && random() < 0.3;

    db.run(
      `INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)`,
      [
        eventType,
        deviceId,
        isEarlyAnonymous ? null : identity.userId,
        timestamp,
        JSON.stringify(properties),
      ]
    );
  }

  db.run('COMMIT');

  // Verify counts
  const eventCount = db.exec('SELECT COUNT(*) FROM events');
  const mappingCount = db.exec('SELECT COUNT(*) FROM identity_mappings');
  const userCount = db.exec('SELECT COUNT(DISTINCT user_id) FROM identity_mappings');

  console.log(`Seeded:`);
  console.log(`  ${eventCount[0].values[0][0]} events`);
  console.log(`  ${mappingCount[0].values[0][0]} identity mappings`);
  console.log(`  ${userCount[0].values[0][0]} resolved users`);

  // Event breakdown
  const breakdown = db.exec(
    'SELECT event_name, COUNT(*) FROM events GROUP BY event_name ORDER BY COUNT(*) DESC'
  );
  if (breakdown.length > 0) {
    console.log('  Event breakdown:');
    for (const row of breakdown[0].values) {
      console.log(`    ${row[0]}: ${row[1]}`);
    }
  }

  saveDb();
  console.log('Done. Database saved to minipanel.db');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
