import { useState, useEffect } from 'react';
import { Plus, Minus, Save, BookOpen, TrendingDown } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

import {
  getEventNames, queryFunnel, getSavedAnalyses, createSavedAnalysis,
  type FunnelStep, type SavedAnalysis,
} from '@/lib/api';
import { DATE_PRESETS, formatDateForAPI } from '@/lib/date-presets';
import { formatNumber, cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────

type DatePresetValue = '7d' | '30d' | '90d' | 'custom';

// ── Helpers ────────────────────────────────────────────────────────────────────

function conversionColor(rate: number): string {
  if (rate >= 50) return 'text-green-700';
  if (rate >= 20) return 'text-yellow-700';
  return 'text-red-700';
}

function dropOffColor(dropOff: number): string {
  if (dropOff <= 10) return 'text-neutral-500';
  if (dropOff <= 30) return 'text-yellow-700';
  return 'text-red-700';
}

// ── Funnel Visualization ───────────────────────────────────────────────────────

interface FunnelVisualizationProps {
  steps: FunnelStep[];
  overallConversionRate: number;
}

function FunnelVisualization({ steps, overallConversionRate }: FunnelVisualizationProps) {
  const maxCount = steps[0]?.count ?? 1;

  return (
    <div data-testid="funnel-visualization" className="space-y-1">
      {steps.map((step, idx) => {
        const ratePct = step.conversion_rate * 100;
        const widthPct = maxCount > 0 ? Math.max(4, (step.count / maxCount) * 100) : 4;
        const isFirst = idx === 0;
        const prevCount = idx > 0 ? steps[idx - 1].count : 0;
        const dropPct = prevCount > 0 ? ((prevCount - step.count) / prevCount) * 100 : 0;

        return (
          <div key={idx}>
            {/* Drop-off annotation between steps */}
            {!isFirst && (
              <div className={`flex items-center gap-1.5 py-1 pl-2 text-sm font-bold ${dropOffColor(dropPct)}`}>
                <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                <span>↓ {Math.round(dropPct)}% drop-off</span>
              </div>
            )}

            {/* Bar row */}
            <div
              data-testid="funnel-bar"
              data-value={ratePct}
              className="flex items-center gap-3"
            >
              {/* Step number */}
              <span className="w-16 shrink-0 text-sm font-bold text-neutral-500 text-right tabular-nums">
                Step {idx + 1}
              </span>

              {/* Bar + labels */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-0.5">
                  <span className="text-sm font-bold text-neutral-900 truncate">
                    {step.event_name}
                  </span>
                  <span
                    data-testid="funnel-conversion-rate"
                    className={`text-sm font-bold tabular-nums shrink-0 ${conversionColor(ratePct)}`}
                  >
                    {Math.round(ratePct)}%
                  </span>
                  <span className="text-sm font-medium text-neutral-500 tabular-nums shrink-0">
                    {formatNumber(step.count)}
                  </span>
                </div>
                {/* The bar itself */}
                <div className="h-8 w-full bg-neutral-200 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 ease-out"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: '#FF7F11',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Overall conversion rate */}
      <div
        data-testid="funnel-overall-conversion"
        className="mt-6 pt-4 border-t border-neutral-300 flex items-center justify-between"
      >
        <span className="text-sm font-bold text-neutral-600">Overall conversion rate</span>
        <span className={`text-2xl font-black tabular-nums ${conversionColor(overallConversionRate * 100)}`}>
          {Math.round(overallConversionRate * 100)}%
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FunnelsPage() {
  // ── Step state ──
  const [steps, setSteps] = useState<string[]>(['', '']);

  // ── Date range ──
  const [datePreset, setDatePreset] = useState<DatePresetValue>('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // ── Remote data ──
  const [eventNames, setEventNames] = useState<string[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);

  // ── Results ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[] | null>(null);
  const [overallConversion, setOverallConversion] = useState(0);

  // ── Save dialog ──
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Load menu ──
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);

  // ── Fetch event names on mount ──
  useEffect(() => {
    getEventNames().then(setEventNames).catch(() => {});
    getSavedAnalyses().then(setSavedAnalyses).catch(() => {});
  }, []);

  // ── Date range computation ──
  function getDateRange(): { start: string; end: string } {
    if (datePreset === 'custom') {
      return { start: customStart, end: customEnd };
    }
    const preset = DATE_PRESETS.find(p => p.value === datePreset);
    const dates = preset?.getDates?.();
    if (!dates) return { start: '', end: '' };
    return {
      start: formatDateForAPI(dates.start),
      end: formatDateForAPI(dates.end),
    };
  }

  // ── Analyze ──
  async function handleAnalyze() {
    const filledSteps = steps.filter(s => s.trim() !== '');
    if (filledSteps.length < 2) return;

    const { start, end } = getDateRange();
    if (!start || !end) return;

    setLoading(true);
    setError(null);
    setFunnelSteps(null);

    try {
      const result = await queryFunnel({
        steps: filledSteps.map(s => ({ event_name: s })),
        start_date: start,
        end_date: end,
      });
      setFunnelSteps(result.steps);
      setOverallConversion(result.overall_conversion_rate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze funnel');
    } finally {
      setLoading(false);
    }
  }

  // ── Step management ──
  function handleAddStep() {
    if (steps.length >= 5) return;
    setSteps(prev => [...prev, '']);
  }

  function handleRemoveStep(idx: number) {
    if (steps.length <= 2) return;
    setSteps(prev => prev.filter((_, i) => i !== idx));
  }

  function handleStepChange(idx: number, val: string) {
    setSteps(prev => prev.map((s, i) => (i === idx ? val : s)));
  }

  // ── Save ──
  async function handleSave() {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const { start, end } = getDateRange();
      const config: Record<string, unknown> = {
        steps,
        datePreset,
        customStart,
        customEnd,
        start_date: start,
        end_date: end,
      };
      const saved = await createSavedAnalysis({ name: saveName.trim(), type: 'funnel', config });
      setSavedAnalyses(prev => [saved, ...prev]);
      setSaveDialogOpen(false);
      setSaveName('');
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  // ── Load saved analysis ──
  function handleLoadAnalysis(analysis: SavedAnalysis) {
    const c = analysis.config as Record<string, unknown>;
    if (Array.isArray(c.steps)) setSteps(c.steps as string[]);
    if (typeof c.datePreset === 'string') setDatePreset(c.datePreset as DatePresetValue);
    if (typeof c.customStart === 'string') setCustomStart(c.customStart);
    if (typeof c.customEnd === 'string') setCustomEnd(c.customEnd);
    setFunnelSteps(null);
    setLoadMenuOpen(false);
  }

  const filledStepCount = steps.filter(s => s.trim() !== '').length;
  const canAnalyze = filledStepCount >= 2;

  // ── Render ──
  return (
    <>
      <h1 className="text-2xl font-black text-neutral-900 mb-6">Funnel Analysis</h1>

      {/* ── Controls Card ── */}
      <Card className="mb-6 bg-neutral-50 border-neutral-300">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Date range preset buttons */}
            <div className="flex gap-1">
              {(['7d', '30d', '90d', 'custom'] as const).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={datePreset === p ? 'default' : 'outline'}
                  className={datePreset === p
                    ? 'bg-neutral-900 text-neutral-100 hover:bg-neutral-800'
                    : 'border-neutral-300 text-neutral-900 hover:bg-neutral-200'}
                  onClick={() => setDatePreset(p)}
                >
                  {p === 'custom' ? 'Custom' : p}
                </Button>
              ))}
            </div>

            {/* Custom date inputs */}
            {datePreset === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={customStart}
                  onChange={e => setCustomStart(e.target.value)}
                  className="w-36 text-sm border-neutral-300"
                />
                <span className="text-sm text-neutral-500">—</span>
                <Input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={customEnd}
                  onChange={e => setCustomEnd(e.target.value)}
                  className="w-36 text-sm border-neutral-300"
                />
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {/* Save button */}
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
                onClick={() => setSaveDialogOpen(true)}
                disabled={filledStepCount < 2}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>

              {/* Load saved analyses */}
              <div className="relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
                  onClick={() => setLoadMenuOpen(v => !v)}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Saved
                </Button>
                {loadMenuOpen && savedAnalyses.filter(a => a.type === 'funnel').length > 0 && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded border border-neutral-300 bg-neutral-50 shadow-md">
                    <div className="max-h-48 overflow-y-auto p-1">
                      {savedAnalyses
                        .filter(a => a.type === 'funnel')
                        .map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleLoadAnalysis(a)}
                            className="w-full text-left rounded px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-200 transition-colors truncate"
                          >
                            {a.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {loadMenuOpen && savedAnalyses.filter(a => a.type === 'funnel').length === 0 && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded border border-neutral-300 bg-neutral-50 shadow-md p-3">
                    <p className="text-sm text-neutral-500">No saved funnels</p>
                  </div>
                )}
              </div>

              {/* Analyze button */}
              <Button
                variant="default"
                className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
                onClick={handleAnalyze}
                disabled={!canAnalyze || loading}
                data-testid="funnel-analyze-btn"
              >
                {loading ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Split Card: Steps + Visualization ── */}
      <Card className="bg-neutral-50 border-neutral-300">
        <CardContent className="p-0">
          <div className="grid grid-cols-[280px_1fr] divide-x divide-neutral-300">

            {/* ── Left: Step Builder ── */}
            <div data-testid="funnel-step-builder" className="p-6 space-y-4">
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-wide">Steps</p>

              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {/* Step label */}
                    <span className="w-14 shrink-0 text-sm font-bold text-neutral-500">
                      Step {idx + 1}
                    </span>

                    {/* Event selector — native <select> for Playwright compatibility */}
                    <select
                      data-testid="funnel-step-select"
                      value={step}
                      onChange={e => handleStepChange(idx, e.target.value)}
                      className={cn(
                        'flex h-9 flex-1 min-w-0 items-center rounded border bg-white px-3 py-2 text-sm font-medium',
                        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'border-neutral-300 text-neutral-900'
                      )}
                    >
                      <option value="">Select event</option>
                      {eventNames.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>

                    {/* Remove button */}
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-9 w-9 border-neutral-300 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-30"
                      onClick={() => handleRemoveStep(idx)}
                      disabled={steps.length <= 2}
                      data-testid="funnel-remove-step"
                      title="Remove step"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Step button */}
              <Button
                size="sm"
                variant="outline"
                className="border-neutral-300 text-neutral-900 hover:bg-neutral-200 disabled:opacity-40 w-full"
                onClick={handleAddStep}
                disabled={steps.length >= 5}
                data-testid="funnel-add-step"
              >
                <Plus className="h-3.5 w-3.5" />
                Add step
              </Button>
            </div>

            {/* ── Right: Funnel Visualization ── */}
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full bg-neutral-200" />
                  <Skeleton className="h-12 w-4/5 bg-neutral-200" />
                  <Skeleton className="h-12 w-3/5 bg-neutral-200" />
                </div>
              ) : error ? (
                <div className="rounded-lg bg-neutral-200 border border-neutral-900 p-4">
                  <p className="text-sm font-bold text-neutral-900">Failed to analyze funnel</p>
                  <p className="text-sm font-medium text-neutral-600 mt-1">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-neutral-900 text-neutral-900 hover:bg-neutral-200"
                    onClick={handleAnalyze}
                  >
                    Retry
                  </Button>
                </div>
              ) : funnelSteps !== null && funnelSteps.length > 0 && funnelSteps[0].count > 0 ? (
                <FunnelVisualization
                  steps={funnelSteps}
                  overallConversionRate={overallConversion}
                />
              ) : (
                <div
                  data-testid="funnel-empty-state"
                  className="flex flex-col items-center justify-center h-full min-h-[200px] text-center py-12"
                >
                  <TrendingDown className="h-12 w-12 text-neutral-300 mb-4" />
                  <p className="text-sm font-bold text-neutral-600 mb-1">No funnel results yet</p>
                  <p className="text-sm font-bold text-neutral-500">
                    Select at least 2 events and click Analyze
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Save Dialog ── */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogClose onOpenChange={setSaveDialogOpen} />
          <DialogHeader>
            <DialogTitle>Save Funnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-neutral-600">Give this funnel a name to load it later.</p>
            <Input
              placeholder="e.g. Signup to purchase funnel"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              className="border-neutral-300"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-neutral-300 text-neutral-900 hover:bg-neutral-200"
              onClick={() => setSaveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-neutral-900 text-neutral-100 hover:bg-neutral-800"
              onClick={handleSave}
              disabled={!saveName.trim() || saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
