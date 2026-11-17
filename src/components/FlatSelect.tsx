import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface FlatSelectOption {
  value: string;
  label: string;
  meta?: string;
  statusLabel?: string;
  statusTone?: 'emerald' | 'amber' | 'rose' | 'gold' | 'neutral';
  disabled?: boolean;
}

interface FlatSelectProps {
  id?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: FlatSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
  triggerBgClassName?: string;
}

const TONE_CLASS: Record<NonNullable<FlatSelectOption['statusTone']>, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  gold: 'text-[#D4AF37]',
  neutral: 'text-zinc-400',
};

export function FlatSelect({
  id,
  ariaLabel,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Seleccionar...',
  className = '',
  menuClassName = '',
  align = 'left',
  size = 'md',
  triggerBgClassName = 'bg-[#0D0D10]',
}: FlatSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === value && !o.disabled);
    setHighlightedIndex(idx >= 0 ? idx : options.findIndex((o) => !o.disabled));

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, options, value]);

  const selectOption = (opt: FlatSelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const moveHighlight = (delta: number) => {
    if (options.length === 0) return;
    let next = highlightedIndex;
    for (let i = 0; i < options.length; i++) {
      next = (next + delta + options.length) % options.length;
      if (!options[next]?.disabled) {
        setHighlightedIndex(next);
        break;
      }
    }
  };

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        moveHighlight(1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else {
        moveHighlight(-1);
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (highlightedIndex >= 0 && options[highlightedIndex]) {
        selectOption(options[highlightedIndex]);
      }
    } else if (e.key === 'Tab' && open) {
      setOpen(false);
    }
  };

  const heightClass =
    size === 'sm'
      ? 'min-h-[42px] sm:min-h-[38px] py-2 sm:py-1.5 text-xs sm:text-sm'
      : 'min-h-[44px] sm:min-h-[42px] py-2 text-sm';

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full ${heightClass} flex items-center justify-between gap-2 rounded-lg border px-3 text-left font-medium transition-colors duration-150 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer touch-manipulation ${triggerBgClassName} ${
          open
            ? 'border-[#D4AF37] text-[#F5F5F4]'
            : 'border-white/[0.12] text-[#F5F5F4] hover:border-white/25 focus-visible:border-[#D4AF37]'
        }`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : <span className="text-zinc-500">{placeholder}</span>}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180 text-[#D4AF37]' : 'text-zinc-400'
          }`}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-[60] mt-1.5 min-w-full w-full sm:w-max max-w-[calc(100vw-1.75rem)] max-h-64 overflow-y-auto overscroll-contain rounded-lg border border-white/[0.14] bg-[#141418] p-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-xs text-zinc-400">Sin opciones disponibles</li>
          ) : (
            options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                  onClick={() => selectOption(opt)}
                  className={`flex items-center justify-between gap-2.5 rounded-md px-3 py-2.5 sm:py-2 text-xs sm:text-sm transition-colors duration-100 touch-manipulation ${
                    opt.disabled
                      ? 'opacity-40 cursor-not-allowed text-zinc-500'
                      : isSelected
                        ? 'bg-[#D4AF37]/12 text-[#F5F5F4] cursor-pointer'
                        : isHighlighted
                          ? 'bg-white/[0.06] text-white cursor-pointer'
                          : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white cursor-pointer'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate ${isSelected ? 'font-semibold text-[#F5F5F4]' : 'font-medium'}`}>
                      {opt.label}
                    </div>
                    {(opt.meta || opt.statusLabel) && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-zinc-400">
                        {opt.meta && <span>{opt.meta}</span>}
                        {opt.meta && opt.statusLabel && <span aria-hidden="true">·</span>}
                        {opt.statusLabel && (
                          <span className={TONE_CLASS[opt.statusTone ?? 'neutral']}>
                            {opt.statusLabel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
