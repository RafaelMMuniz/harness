import { Router, type Request, type Response } from 'express';
import { queryAll, queryOne } from '../db.js';

const router = Router();

interface PropertyDescriptor {
  name: string;
  type: 'string' | 'number' | 'boolean';
  sample_values: (string | number | boolean)[];
}

router.get('/:eventName/properties', (req: Request, res: Response) => {
  const { eventName } = req.params;

  const exists = queryOne('SELECT 1 as v FROM events WHERE event_name = ? LIMIT 1', [eventName]);
  if (!exists) {
    res.json([]);
    return;
  }

  const rows = queryAll(`
    SELECT properties FROM events
    WHERE event_name = ? AND properties IS NOT NULL
    ORDER BY timestamp DESC LIMIT 500
  `, [eventName]);

  const propValues = new Map<string, Set<string>>();
  const propTypes = new Map<string, Set<string>>();

  for (const row of rows) {
    const propsStr = row.properties as string;
    if (!propsStr) continue;
    const props = JSON.parse(propsStr);
    for (const [key, val] of Object.entries(props)) {
      if (val === null || val === undefined) continue;

      if (!propValues.has(key)) {
        propValues.set(key, new Set());
        propTypes.set(key, new Set());
      }

      propValues.get(key)!.add(String(val));
      propTypes.get(key)!.add(typeof val);
    }
  }

  const descriptors: PropertyDescriptor[] = [];
  for (const [name, types] of propTypes.entries()) {
    let type: 'string' | 'number' | 'boolean';
    if (types.size === 1 && types.has('number')) type = 'number';
    else if (types.size === 1 && types.has('boolean')) type = 'boolean';
    else type = 'string';

    const sampleSet = propValues.get(name)!;
    const samples = [...sampleSet].slice(0, 10);
    const sample_values: (string | number | boolean)[] = type === 'number'
      ? samples.map(Number)
      : type === 'boolean'
        ? samples.map(s => s === 'true')
        : samples;

    descriptors.push({ name, type, sample_values });
  }

  descriptors.sort((a, b) => a.name.localeCompare(b.name));
  res.json(descriptors);
});

export default router;
