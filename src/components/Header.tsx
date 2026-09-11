import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Moon, Sun, History, Receipt } from 'lucide-react';
import { CurrencyCode } from '../types';
import { CurrencyDropdown } from './CurrencyDropdown';

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
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-black/5 dark:border-transparent transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand (Simplified for Mobile) */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 focus:outline-none flex-shrink-0 group"
          title={t('header.goToHome')}
          aria-label={t('header.brand') + " " + t('header.goToHome')}
        >
          <div className="w-9 h-9 rounded-[14px] bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform flex-shrink-0">
            <Receipt className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight hidden min-[320px]:block">
            {t('header.brand')}
          </span>
        </button>

        {/* Action Controls (Responsive & Compact) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          
          {/* Custom iOS-style Currency Dropdown */}
          <CurrencyDropdown
            value={currency}
            onChange={onCurrencyChange}
            variant="compact"
            className="mr-0.5 sm:mr-1"
          />

          {/* History Icon */}
          <button
            onClick={onOpenRecent}
            className="relative p-2 rounded-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors focus:outline-none flex-shrink-0"
            title={t('header.recentBills')}
            aria-label={t('header.recentBills')}
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
            title={t('header.guidePrivacy')}
            aria-label={t('header.guidePrivacy')}
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            className="p-2 rounded-[14px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors focus:outline-none flex-shrink-0"
            title={isDark ? t('header.switchToLight') : t('header.switchToDark')}
            aria-label={isDark ? t('header.switchToLight') : t('header.switchToDark')}
          >
            {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
