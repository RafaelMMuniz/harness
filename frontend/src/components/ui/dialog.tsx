import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Root ─────────────────────────────────────────────────────────────────────

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Lock body scroll while open
  React.useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <DialogPortal onOpenChange={onOpenChange}>
      {children}
    </DialogPortal>
  );
}

// ── Portal (rendered into document.body via a React portal) ──────────────────

interface DialogPortalProps {
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function DialogPortal({ onOpenChange, children }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  // We render inline but fixed-positioned — avoids createPortal complexity
  // while achieving the same visual result.
  return (
    <DialogOverlay onOpenChange={onOpenChange}>
      {children}
    </DialogOverlay>
  );
}

// ── Overlay ───────────────────────────────────────────────────────────────────

interface DialogOverlayProps {
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

function DialogOverlay({ onOpenChange, children, className }: DialogOverlayProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/40 backdrop-blur-[2px]',
        className
      )}
      onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
      aria-modal="true"
      role="dialog"
    >
      {children}
    </div>
  );
}

// ── Content ───────────────────────────────────────────────────────────────────

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-50 w-full max-w-lg rounded-lg border border-neutral-300 bg-neutral-50 p-6 shadow-xl',
        'flex flex-col gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

// ── Header ────────────────────────────────────────────────────────────────────

const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  )
);
DialogHeader.displayName = 'DialogHeader';

// ── Title ─────────────────────────────────────────────────────────────────────

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-base font-semibold text-neutral-900 leading-tight', className)}
      {...props}
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

// ── Footer ────────────────────────────────────────────────────────────────────

const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 pt-2', className)}
      {...props}
    />
  )
);
DialogFooter.displayName = 'DialogFooter';

// ── Close Button (convenience) ────────────────────────────────────────────────

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onOpenChange?: (open: boolean) => void;
}

function DialogClose({ onOpenChange, className, ...props }: DialogCloseProps) {
  return (
    <button
      type="button"
      onClick={() => onOpenChange?.(false)}
      className={cn(
        'absolute right-4 top-4 rounded p-1 text-neutral-500 transition-colors',
        'hover:bg-neutral-200 hover:text-neutral-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900',
        className
      )}
      aria-label="Close dialog"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogOverlay,
};
