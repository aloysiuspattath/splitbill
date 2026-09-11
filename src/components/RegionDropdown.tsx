import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const REGIONS = [
  { code: 'in', name: 'India', flag: '🇮🇳', lang: 'en-IN', currency: 'INR' },
  { code: 'us', name: 'United States', flag: '🇺🇸', lang: 'en-US', currency: 'USD' },
  { code: 'uk', name: 'United Kingdom', flag: '🇬🇧', lang: 'en-GB', currency: 'GBP' },
  { code: 'au', name: 'Australia', flag: '🇦🇺', lang: 'en-AU', currency: 'AUD' },
  { code: 'ca', name: 'Canada', flag: '🇨🇦', lang: 'en-CA', currency: 'CAD' },
  { code: 'sg', name: 'Singapore', flag: '🇸🇬', lang: 'en-SG', currency: 'SGD' },
  { code: 'eu', name: 'Europe', flag: '🇪🇺', lang: 'en-IE', currency: 'EUR' },
  { code: 'ae', name: 'UAE', flag: '🇦🇪', lang: 'en-AE', currency: 'AED' },
  { code: 'es', name: 'España', flag: '🇪🇸', lang: 'es-ES', currency: 'EUR' },
  { code: 'mx', name: 'México', flag: '🇲🇽', lang: 'es-MX', currency: 'MXN' },
  { code: 'br', name: 'Brasil', flag: '🇧🇷', lang: 'pt-BR', currency: 'BRL' },
  { code: 'de', name: 'Deutschland', flag: '🇩🇪', lang: 'de-DE', currency: 'EUR' },
  { code: 'jp', name: '日本', flag: '🇯🇵', lang: 'ja-JP', currency: 'JPY' },
  { code: 'id', name: 'Indonesia', flag: '🇮🇩', lang: 'id-ID', currency: 'IDR' },
  { code: 'fr', name: 'France', flag: '🇫🇷', lang: 'fr-FR', currency: 'EUR' },
  { code: 'it', name: 'Italia', flag: '🇮🇹', lang: 'it-IT', currency: 'EUR' },
];

export const RegionDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getActiveRegion = () => {
    if (typeof window === 'undefined') return REGIONS[1]; // default US
    const match = window.location.pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    const code = match ? match[1] : 'us';
    return REGIONS.find(r => r.code === code) || REGIONS.find(r => r.code === 'us')!;
  };

  const activeRegion = getActiveRegion();

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

  return (
    <div ref={dropdownRef} className="relative inline-block mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-slate-200/60 dark:border-slate-800/80 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-all shadow-sm"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{activeRegion.flag} {activeRegion.name}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 max-h-[300px] overflow-y-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-xl shadow-slate-200/20 dark:shadow-black/40 z-50 p-1">
          {REGIONS.map((region) => (
            <button
              key={region.code}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsOpen(false);
                // Dispatch custom event for App.tsx to catch and handle SPA routing!
                window.dispatchEvent(new CustomEvent('regionChange', { detail: region }));
              }}
              className={`flex items-center justify-between w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeRegion.code === region.code
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{region.flag}</span>
                <span>{region.name}</span>
              </div>
              {activeRegion.code === region.code && (
                <Check className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

