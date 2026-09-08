import React, { useState, useRef, useEffect } from 'react';
import { CurrencyCode } from '../types';
import { CURRENCIES } from '../utils/currency';
import { Check, ChevronDown } from 'lucide-react';

interface CurrencyDropdownProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  variant?: 'compact' | 'form';
  className?: string;
}

export const CurrencyDropdown: React.FC<CurrencyDropdownProps> = ({
  value,
  onChange,
  variant = 'compact',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentCurrency = CURRENCIES[value] || CURRENCIES.INR;

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (code: CurrencyCode) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select currency, currently ${currentCurrency.code}`}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px] text-xs font-bold transition-all ${
            isOpen
              ? 'bg-slate-200 dark:bg-[#2c2c2e] text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
              : 'bg-slate-100 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#2c2c2e]'
          }`}
        >
          <span className="text-slate-400 dark:text-slate-500 font-semibold">{currentCurrency.symbol}</span>
          <span>{currentCurrency.code}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select currency, currently ${currentCurrency.name}`}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            isOpen
              ? 'bg-white dark:bg-[#2c2c2e] border-brand-500 ring-2 ring-brand-500/20 text-slate-900 dark:text-white'
              : 'bg-slate-100 dark:bg-[#2c2c2e] border-transparent text-slate-900 dark:text-white hover:bg-slate-200/60 dark:hover:bg-[#38383a]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-white dark:bg-[#1c1c1e] flex items-center justify-center font-bold text-xs text-brand-600 dark:text-brand-400 shadow-2xs">
              {currentCurrency.symbol}
            </span>
            <span className="font-bold">{currentCurrency.code}</span>
            <span className="text-xs text-slate-400 font-normal truncate max-w-[150px]">
              • {currentCurrency.name}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
            }`}
          />
        </button>
      )}

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Currencies"
          className={`absolute z-50 mt-2 py-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn ${
            variant === 'compact' ? 'right-0 w-64' : 'left-0 right-0 w-full'
          }`}
        >
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span>Select Currency</span>
            <span className="text-[9px] font-semibold text-slate-400">{Object.keys(CURRENCIES).length} supported</span>
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin">
            {Object.values(CURRENCIES).map(curr => {
              const isSelected = curr.code === value;
              return (
                <button
                  key={curr.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {curr.symbol}
                    </span>
                    <div className="min-w-0 flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{curr.code}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                        {curr.name}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 stroke-[2.5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
