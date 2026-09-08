import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';
import { Check, ChevronDown } from 'lucide-react';

interface PersonSelectProps {
  people: Person[];
  selectedPersonId?: string;
  onSelect: (personId: string) => void;
  variant?: 'compact' | 'full';
  className?: string;
  label?: string;
}

export const PersonSelect: React.FC<PersonSelectProps> = ({
  people,
  selectedPersonId,
  onSelect,
  variant = 'compact',
  className = '',
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedPerson = people.find(p => p.id === selectedPersonId) || people[0];

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

  const handleSelect = (personId: string) => {
    onSelect(personId);
    setIsOpen(false);
  };

  if (!people || people.length === 0) return null;

  return (
    <div ref={dropdownRef} className={`relative ${variant === 'full' ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider block mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      {variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`Select payer, currently ${selectedPerson?.name || 'Someone'}`}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            isOpen
              ? 'bg-white dark:bg-[#1c1c1e] border-brand-500 ring-2 ring-brand-500/20 text-brand-600 dark:text-brand-400'
              : 'bg-white dark:bg-[#1c1c1e] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2c2c2e]'
          }`}
        >
          <span className="text-sm">{selectedPerson?.avatar || '👤'}</span>
          <span className="truncate max-w-[120px]">{selectedPerson?.name || 'Someone'}</span>
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
          aria-label={`Select payer, currently ${selectedPerson?.name || 'Someone'}`}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            isOpen
              ? 'bg-white dark:bg-[#1c1c1e] border-brand-500 ring-2 ring-brand-500/20 text-slate-900 dark:text-white'
              : 'bg-white dark:bg-[#1c1c1e] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#2c2c2e]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 shadow-2xs"
              style={{
                backgroundColor: selectedPerson?.color ? `${selectedPerson.color}20` : undefined,
                border: selectedPerson?.color ? `1.5px solid ${selectedPerson.color}` : undefined,
              }}
            >
              {selectedPerson?.avatar || '👤'}
            </span>
            <div className="min-w-0 text-left">
              <span className="font-bold text-slate-900 dark:text-white block truncate">
                {selectedPerson?.name || 'Someone'}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Paid the bill</span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
            }`}
          />
        </button>
      )}

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Friends"
          className={`absolute z-50 mt-1.5 py-1.5 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] overflow-hidden animate-fadeIn ${
            variant === 'compact' ? 'right-0 w-52' : 'left-0 right-0 w-full'
          }`}
        >
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <span>Select Payer</span>
            <span className="text-[9px] font-semibold text-slate-400">{people.length} friends</span>
          </div>

          <div className="max-h-56 overflow-y-auto overscroll-contain p-1 space-y-0.5 scrollbar-thin">
            {people.map(person => {
              const isSelected = person.id === selectedPerson?.id;
              return (
                <button
                  key={person.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(person.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: person.color ? `${person.color}20` : undefined,
                        border: person.color ? `1.5px solid ${person.color}` : undefined,
                      }}
                    >
                      {person.avatar || '👤'}
                    </span>
                    <span className="truncate">{person.name}</span>
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
