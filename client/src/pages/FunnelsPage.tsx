import { useState, useEffect } from 'react';
import { fetchEventNames, fetchFunnelQuery, type FunnelResponse } from '../lib/api';
import { DATE_PRESETS, formatDateForAPI } from '../lib/date-presets';
import { Select } from '../components/Select';
import { Skeleton } from '../components/Skeleton';

const MAX_STEPS = 5;
const MIN_STEPS = 2;

export default function FunnelsPage() {
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [datePreset, setDatePreset] = useState('90d');
  const [result, setResult] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEventNames()
      .then(setEventNames)
      .catch(() => {});
  }, []);

  const addStep = () => {
    if (steps.length < MAX_STEPS) {
      setSteps([...steps, '']);
    }
  };

  const removeStep = (index: number) => {
    if (steps.length <= MIN_STEPS) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index] = value;
    setSteps(updated);
  };

  const analyze = async () => {
    const validSteps = steps.filter((s) => s !== '');
    if (validSteps.length < 2) return;

    setLoading(true);
    try {
      const preset = DATE_PRESETS.find((p) => p.value === datePreset);
      const dates = preset?.getDates?.();
      const body = {
        steps: validSteps,
        start_date: dates ? formatDateForAPI(dates.start) : '2000-01-01',
        end_date: dates ? formatDateForAPI(dates.end) : formatDateForAPI(new Date()),
      };
      const data = await fetchFunnelQuery(body);
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const eventOptions = eventNames.map((n) => ({ value: n, label: n }));

  const getConversionColor = (rate: number) => {
    if (rate > 50) return 'text-green-600';
    if (rate >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">
        Funnel Analysis
      </h1>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {DATE_PRESETS.filter((p) => p.value !== 'custom').map((preset) => (
          <button
            key={preset.value}
            onClick={() => setDatePreset(preset.value)}
            className={`rounded px-3 py-1.5 text-sm font-bold transition-colors ${
              datePreset === preset.value
                ? 'bg-neutral-900 text-neutral-100'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Step builder */}
      <div className="space-y-3 mb-6">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm font-bold text-neutral-500 w-14 shrink-0">
              Step {index + 1}
            </span>
            <Select
              value={step}
              onChange={(v) => updateStep(index, v)}
              options={eventOptions}
              placeholder="Select event..."
              data-testid={`funnel-step-${index}`}
            />
            <button
              data-testid={`remove-step-${index}`}
              disabled={steps.length <= MIN_STEPS}
              onClick={() => removeStep(index)}
              className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <button
          data-testid="add-step"
          disabled={steps.length >= MAX_STEPS}
          onClick={addStep}
          className="rounded border border-neutral-900 px-4 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Add Step
        </button>
        <button
          data-testid="analyze-funnel"
          onClick={analyze}
          className="rounded bg-neutral-900 px-5 py-1.5 text-sm font-bold text-neutral-100 hover:bg-neutral-800 transition-colors"
        >
          Analyze
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div data-testid="loading">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="space-y-6">
          {/* Overall conversion */}
          <div className="rounded-lg border border-neutral-300 bg-neutral-50 p-6">
            <div className="text-sm font-bold text-neutral-500 mb-1">
              Overall Conversion Rate
            </div>
            <div
              className={`text-2xl font-black ${getConversionColor(result.overall_conversion_rate * 100)}`}
            >
              {(result.overall_conversion_rate * 100).toFixed(1)}%
            </div>
            {result.steps.length > 0 && result.steps[0].count > 0 && (
              <div className="text-sm font-bold text-neutral-500 mt-1">
                {result.steps[result.steps.length - 1].count} of{' '}
                {result.steps[0].count} users completed the funnel
              </div>
            )}
            {result.steps.length > 0 && result.steps[0].count === 0 && (
              <div className="text-sm font-bold text-neutral-500 mt-1">
                No users matched the first step
              </div>
            )}
          </div>

          {/* Funnel bars */}
          <div className="space-y-4">
            {result.steps.map((step, i) => {
              const maxCount = result.steps[0].count || 1;
              const widthPercent = Math.max(
                (step.count / maxCount) * 100,
                2
              );
              const stepToStep =
                i > 0 && result.steps[i - 1].count > 0
                  ? (
                      (step.count / result.steps[i - 1].count) *
                      100
                    ).toFixed(1)
                  : null;

              return (
                <div key={i}>
                  {/* Step-to-step annotation */}
                  {i > 0 && stepToStep !== null && (
                    <div className="flex items-center gap-2 mb-2 ml-14">
                      <svg
                        className="h-4 w-4 text-neutral-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-bold text-neutral-500">
                        {stepToStep}% conversion
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-neutral-500 w-14 shrink-0 text-right tabular-nums">
                      Step {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-neutral-900">
                          {step.event_name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-neutral-900 tabular-nums">
                            {step.count} users
                          </span>
                          <span
                            className={`text-sm font-bold tabular-nums ${getConversionColor(step.conversion_rate * 100)}`}
                          >
                            {(step.conversion_rate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-8 rounded bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: '#FF7F11',
                          }}
                        />
                      </div>
                      {i > 0 && step.drop_off > 0 && (
                        <div className="text-xs font-bold text-neutral-500 mt-1">
                          {step.drop_off} dropped off
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
