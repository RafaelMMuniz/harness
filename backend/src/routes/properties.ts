import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';

const router = Router();

interface PropertyMeta {
  name: string;
  type: 'string' | 'number' | 'boolean';
  sample_values: Array<string | number | boolean>;
}

/**
 * GET /api/events/:eventName/properties - Property metadata for an event type
 *
 * Scans up to 500 recent events and infers property types and sample values.
 */
router.get(
  '/api/events/:eventName/properties',
  (req: Request, res: Response): void => {
    const db = getDb();
    const eventName = req.params.eventName;

    const rows = db
      .prepare(
        `SELECT properties FROM events
         WHERE event_name = ? AND properties IS NOT NULL
         ORDER BY timestamp DESC
         LIMIT 500`
      )
      .all(eventName) as Array<{ properties: string }>;

    if (rows.length === 0) {
      res.json([]);
      return;
    }

    // Collect all values per property key
    const propertyValues = new Map<string, Set<string>>();
    const propertyRawValues = new Map<string, Array<unknown>>();

    for (const row of rows) {
      let props: Record<string, unknown>;
      try {
        props = JSON.parse(row.properties);
      } catch {
        continue;
      }

      for (const [key, value] of Object.entries(props)) {
        if (value === null || value === undefined) continue;

        if (!propertyValues.has(key)) {
          propertyValues.set(key, new Set());
          propertyRawValues.set(key, []);
        }

        const strVal = String(value);
        propertyValues.get(key)!.add(strVal);
        propertyRawValues.get(key)!.push(value);
      }
    }

    // Determine types
    const result: PropertyMeta[] = [];

    for (const [key, rawValues] of propertyRawValues) {
      const nonNullValues = rawValues.filter(
        (v) => v !== null && v !== undefined
      );

      let type: 'string' | 'number' | 'boolean' = 'string';

      if (nonNullValues.length > 0) {
        const allNumeric = nonNullValues.every((v) => {
          if (typeof v === 'number') return true;
          if (typeof v === 'string') return !isNaN(Number(v)) && v.trim() !== '';
          return false;
        });

        const allBoolean = nonNullValues.every((v) => {
          if (typeof v === 'boolean') return true;
          if (typeof v === 'string')
            return v === 'true' || v === 'false';
          return false;
        });

        if (allNumeric) {
          type = 'number';
        } else if (allBoolean) {
          type = 'boolean';
        }
      }

      // Get up to 10 distinct sample values
      const distinctValues = Array.from(propertyValues.get(key)!);
      const sampleValues = distinctValues.slice(0, 10).map((v) => {
        if (type === 'number') return Number(v);
        if (type === 'boolean') return v === 'true';
        return v;
      });

      result.push({
        name: key,
        type,
        sample_values: sampleValues,
      });
    }

    // Sort by property name for consistent output
    result.sort((a, b) => a.name.localeCompare(b.name));

    res.json(result);
  }
);

export default router;
