import React, { useState, useRef, useEffect } from 'react';
import { AVATAR_EMOJIS } from '../features/people/avatarHelper';
import { ChevronDown } from 'lucide-react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Select avatar emoji, currently ${value}`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all ${
          isOpen
            ? 'bg-white dark:bg-[#1c1c1e] border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
            : 'bg-slate-100 dark:bg-[#1c1c1e] border-transparent hover:bg-slate-200 dark:hover:bg-[#2c2c2e]'
        }`}
      >
        <span className="text-base leading-none">{value}</span>
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Pick an emoji avatar"
          className="absolute right-0 z-50 mt-1.5 p-2 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.5)] animate-fadeIn w-52"
        >
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 px-1">
            Choose Avatar
          </div>
          <div className="grid grid-cols-4 gap-1">
            {AVATAR_EMOJIS.map(emoji => {
              const isSelected = emoji === value;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform active:scale-90 ${
                    isSelected
                      ? 'bg-brand-100 dark:bg-brand-950/80 ring-2 ring-brand-500 scale-105 shadow-2xs'
                      : 'hover:bg-slate-100 dark:hover:bg-white/5 hover:scale-110'
                  }`}
                >
                  <span>{emoji}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
