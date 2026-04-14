import { initDb, execute, transaction, closeDb } from './db.js';

// Deterministic PRNG (mulberry32)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.round((rand() * (max - min) + min) * 100) / 100;
}

const EVENT_TYPES = [
  { name: 'Page Viewed', weight: 0.40 },
  { name: 'Button Clicked', weight: 0.25 },
  { name: 'Sign Up Completed', weight: 0.15 },
  { name: 'Purchase Completed', weight: 0.12 },
  { name: 'Subscription Renewed', weight: 0.08 },
];

const PAGES = ['/home', '/pricing', '/features', '/docs', '/blog', '/signup', '/dashboard', '/settings'];
const REFERRERS = ['google', 'twitter', 'direct', 'email', 'linkedin', 'github'];
const BUTTONS = ['signup_cta', 'learn_more', 'start_free', 'upgrade', 'download', 'share', 'settings'];
const PLAN_TYPES = ['free', 'basic', 'pro', 'enterprise'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];

function pickWeighted(): string {
  const r = rand();
  let cumulative = 0;
  for (const et of EVENT_TYPES) {
    cumulative += et.weight;
    if (r <= cumulative) return et.name;
  }
  return EVENT_TYPES[EVENT_TYPES.length - 1].name;
}

function generateProperties(eventName: string): Record<string, string | number | boolean> {
  switch (eventName) {
    case 'Page Viewed':
      return { url: pick(PAGES), referrer: pick(REFERRERS), duration_seconds: randInt(1, 300) };
    case 'Button Clicked':
      return { button_name: pick(BUTTONS), url: pick(PAGES) };
    case 'Sign Up Completed':
      return { plan_type: pick(PLAN_TYPES), referrer: pick(REFERRERS) };
    case 'Purchase Completed':
      return { amount: randFloat(9.99, 499.99), currency: pick(CURRENCIES), quantity: randInt(1, 5), plan_type: pick(PLAN_TYPES) };
    case 'Subscription Renewed':
      return { amount: randFloat(9.99, 99.99), plan_type: pick(PLAN_TYPES), duration_months: pick([1, 3, 6, 12]) };
    default:
      return {};
  }
}

async function main() {
  await initDb();

  // Clear existing data
  execute('DELETE FROM events');
  execute('DELETE FROM identity_mappings');
  execute('DELETE FROM saved_analyses');
  console.log('Cleared existing data');

  const now = new Date();
  // Place seed data 90–120 days ago to avoid interfering with E2E UI tests
  // that filter on recent dates. The 30-day spread requirement (BR-102) is still met.
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 120);

  const users: Array<{ userId: string; devices: string[]; activityLevel: number }> = [];

  for (let i = 0; i < 80; i++) {
    const activityLevel = i < 5 ? randInt(20, 40) : i < 20 ? randInt(8, 18) : randInt(2, 6);
    const deviceCount = i < 5 ? 2 : (rand() < 0.1 ? 2 : 1);
    const devices: string[] = [];
    for (let d = 0; d < deviceCount; d++) {
      devices.push(`device-${i}-${d}`);
    }

    users.push({
      userId: i < 60 ? `user-${i}@example.com` : '',
      devices,
      activityLevel,
    });
  }

  let totalEvents = 0;

  transaction(() => {
    for (const user of users) {
      const identifyDay = user.userId ? randInt(5, 25) : -1;

      for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
        if (rand() < 0.3) continue;

        const eventsToday = Math.max(1, Math.round(user.activityLevel * (0.5 + rand())));

        for (let e = 0; e < eventsToday; e++) {
          const device = pick(user.devices);
          const eventName = pickWeighted();
          const properties = generateProperties(eventName);

          const eventDate = new Date(thirtyDaysAgo);
          eventDate.setDate(eventDate.getDate() + dayOffset);
          eventDate.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));
          const timestamp = eventDate.toISOString();

          const isIdentified = user.userId && dayOffset >= identifyDay;

          execute(
            'INSERT INTO events (event_name, device_id, user_id, timestamp, properties) VALUES (?, ?, ?, ?, ?)',
            [eventName, device, isIdentified ? user.userId : null, timestamp, JSON.stringify(properties)],
          );
          totalEvents++;

          if (isIdentified && user.userId) {
            // INSERT OR IGNORE for identity mappings
            try {
              execute(
                'INSERT OR IGNORE INTO identity_mappings (device_id, user_id, created_at) VALUES (?, ?, ?)',
                [device, user.userId, timestamp],
              );
            } catch {
              // Ignore duplicate constraint violations
            }
          }
        }
      }
    }
  });

  // Verify
  const { queryOne, queryAll } = await import('./db.js');
  const eventCount = (queryOne('SELECT COUNT(*) as c FROM events') as { c: number })?.c || 0;
  const userCount = (queryOne('SELECT COUNT(DISTINCT user_id) as c FROM identity_mappings') as { c: number })?.c || 0;

  console.log(`Seeded ${eventCount} events`);
  console.log(`${userCount} resolved users`);

  const types = queryAll('SELECT event_name, COUNT(*) as c FROM events GROUP BY event_name ORDER BY c DESC');
  for (const t of types) {
    console.log(`  ${t.event_name}: ${t.c} (${(((t.c as number) / eventCount) * 100).toFixed(1)}%)`);
  }

  closeDb();
}

main().catch(console.error);
