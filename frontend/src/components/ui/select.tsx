import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Context ──────────────────────────────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder?: string;
  displayLabel: string;
  setDisplayLabel: (label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext(): SelectContextValue {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Select subcomponents must be used inside <Select>');
  return ctx;
}

// ── Root ─────────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}

function Select({ value, onValueChange, placeholder, children }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState('');

  // Close on outside click
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, placeholder, displayLabel, setDisplayLabel }}
    >
      <div ref={containerRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen, placeholder, displayLabel } = useSelectContext();

    const label = displayLabel || placeholder || 'Select…';
    const isPlaceholder = !displayLabel;

    return (
      <button
        ref={ref}
        type="button"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 transition-colors',
          'hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isPlaceholder && 'text-neutral-400',
          className
        )}
        {...props}
      >
        <span className="truncate">{children ?? label}</span>
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn('shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

// ── Value (renders current label inside trigger) ───────────────────────────

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { displayLabel } = useSelectContext();
  return <span>{displayLabel || placeholder || ''}</span>;
}

// ── Content (dropdown list) ────────────────────────────────────────────────

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

function SelectContent({ className, children }: SelectContentProps) {
  const { open } = useSelectContext();

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded border border-neutral-300 bg-white shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      role="listbox"
    >
      <div className="max-h-60 overflow-y-auto p-1">{children}</div>
    </div>
  );
}

// ── Item ──────────────────────────────────────────────────────────────────────

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

function SelectItem({ value, children, className, disabled }: SelectItemProps) {
  const { value: selectedValue, onValueChange, setOpen, setDisplayLabel } = useSelectContext();
  const isSelected = selectedValue === value;

  function handleSelect() {
    if (disabled) return;
    onValueChange(value);
    setDisplayLabel(typeof children === 'string' ? children : value);
    setOpen(false);
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={handleSelect}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-sm text-neutral-900 transition-colors',
        'hover:bg-neutral-100',
        isSelected && 'bg-neutral-100 font-medium',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      {/* Check mark */}
      <span className="mr-2 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn('-mx-1 my-1 h-px bg-neutral-200', className)} />;
}

// ── Label ─────────────────────────────────────────────────────────────────────

function SelectLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-2 py-1.5 text-xs font-semibold text-neutral-500', className)}>
      {children}
    </div>
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectLabel,
};
