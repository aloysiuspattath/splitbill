import React from 'react';
import { ShieldCheck, Moon, Sun, History, Receipt } from 'lucide-react';
import { CurrencyCode } from '../types';
import { CURRENCIES } from '../utils/currency';

interface HeaderProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenPrivacy: () => void;
  onOpenRecent: () => void;
  onGoHome: () => void;
  savedBillsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currency,
  onCurrencyChange,
  isDark,
  onToggleDark,
  onOpenPrivacy,
  onOpenRecent,
  onGoHome,
  savedBillsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-black/5 dark:border-transparent transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand (Simplified for Mobile) */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 focus:outline-none flex-shrink-0 group"
          title="Go to Home"
          aria-label="SplitBill Home"
        >
          <div className="w-9 h-9 rounded-[14px] bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <Receipt className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight hidden min-[320px]:block">
            SplitBill
          </span>
        </button>

        {/* Action Controls (Responsive & Compact) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          
          {/* Currency Dropdown */}
          <div className="relative flex items-center bg-slate-100 dark:bg-[#1c1c1e] hover:bg-slate-200 dark:hover:bg-[#2c2c2e] rounded-[14px] px-2 py-1.5 mr-0.5 sm:mr-1 transition-colors">
            <select
              value={currency}
              onChange={e => onCurrencyChange(e.target.value as CurrencyCode)}
              className="text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer appearance-none pr-4"
              title="Select Currency"
              aria-label="Select Currency"
            >
              {Object.values(CURRENCIES).map(curr => (
                <option key={curr.code} value={curr.code} className="bg-white dark:bg-[#1c1c1e]">
                  {curr.symbol} {curr.code}
                </option>
              ))}
            </select>
            {/* Custom dropdown arrow */}
            <div className="absolute right-2 pointer-events-none text-slate-400">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          {/* History Icon */}
          <button
            onClick={onOpenRecent}
            className="relative p-2 rounded-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors focus:outline-none flex-shrink-0"
            title="Recent Bills"
            aria-label="Recent Bills"
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            {savedBillsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600 ring-2 ring-white dark:ring-black" />
            )}
          </button>

          {/* Privacy & Info */}
          <button
            onClick={onOpenPrivacy}
            className="p-2 rounded-[14px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors focus:outline-none flex-shrink-0"
            title="Guide, FAQ & Privacy Policy"
            aria-label="Guide, FAQ and Privacy Policy"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors focus:outline-none flex-shrink-0"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
