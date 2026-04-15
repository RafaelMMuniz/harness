import { useState, useRef, useEffect, useCallback } from 'react';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  'data-testid'?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  'data-testid': testId,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div ref={containerRef} className="relative inline-block text-sm">
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid={testId}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-bold text-neutral-900 hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 min-w-[160px]"
      >
        <span className={selectedLabel ? '' : 'text-neutral-500'}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded border border-neutral-300 bg-neutral-50 py-1 shadow-lg"
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              data-value={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`cursor-pointer px-3 py-1.5 text-sm font-bold hover:bg-neutral-200 ${
                opt.value === value
                  ? 'bg-neutral-200 text-neutral-900'
                  : 'text-neutral-900'
              }`}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && (
            <div className="px-3 py-1.5 text-sm font-bold text-neutral-500">
              No options
            </div>
          )}
        </div>
      )}
    </div>
  );
}
