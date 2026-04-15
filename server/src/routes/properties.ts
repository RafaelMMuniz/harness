import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

interface PropertyMeta {
  name: string;
  type: 'number' | 'string' | 'boolean';
  sample_values: unknown[];
}

// ── GET /api/events/:eventName/properties ────────────────────────────

router.get('/:eventName/properties', (req: Request, res: Response): void => {
  const eventName = req.params.eventName;
  const db = getDb();

  // Sample up to 500 recent events for this event name
  const result = db.exec(
    `SELECT properties FROM events
     WHERE event_name = ? AND properties IS NOT NULL
     ORDER BY timestamp DESC
     LIMIT 500`,
    [eventName]
  );

  if (result.length === 0) {
    res.json([]);
    return;
  }

  // Collect property metadata across all sampled events
  const propertyTypes = new Map<string, Set<string>>();
  const propertySamples = new Map<string, Set<string>>(); // stringified for dedup

  for (const row of result[0].values) {
    try {
      const props = JSON.parse(row[0] as string);
      if (typeof props !== 'object' || props === null) continue;

      for (const [key, value] of Object.entries(props)) {
        // Track types
        if (!propertyTypes.has(key)) propertyTypes.set(key, new Set());
        propertyTypes.get(key)!.add(typeof value);

        // Collect sample values (up to 10)
        if (!propertySamples.has(key)) propertySamples.set(key, new Set());
        const samples = propertySamples.get(key)!;
        if (samples.size < 10) {
          samples.add(JSON.stringify(value));
        }
      }
    } catch {
      // skip malformed JSON
    }
  }

  // Build response
  const properties: PropertyMeta[] = [];
  for (const [name, types] of propertyTypes.entries()) {
    // Determine dominant type
    let type: PropertyMeta['type'] = 'string';
    if (types.has('number') && !types.has('string') && !types.has('boolean')) {
      type = 'number';
    } else if (types.has('boolean') && !types.has('string') && !types.has('number')) {
      type = 'boolean';
    }

    const sampleValues = [...(propertySamples.get(name) ?? [])].map((s) => {
      try { return JSON.parse(s); } catch { return s; }
    });

    properties.push({ name, type, sample_values: sampleValues });
  }

  // Sort by property name for deterministic output
  properties.sort((a, b) => a.name.localeCompare(b.name));

  res.json(properties);
});

export default router;
