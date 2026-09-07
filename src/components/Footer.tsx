import React from 'react';
import { Github, Linkedin, Instagram, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenInfo?: (tab: 'guide' | 'faq' | 'about' | 'terms' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenInfo }) => {
  const currentYear = new Date().getFullYear();

  const handleOpenTab = (tab: 'guide' | 'faq' | 'about' | 'terms' | 'privacy') => {
    if (onOpenInfo) {
      onOpenInfo(tab);
    } else if (onOpenPrivacy) {
      onOpenPrivacy();
    }
  };

  return (
    <footer className="w-full mt-auto pt-10 pb-8 px-4 border-t border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-black/20 text-center transition-colors">
      <div className="max-w-md mx-auto flex flex-col items-center space-y-4">
        
        {/* Creator Attribution */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span>by</span>
          <a
            href="https://github.com/aloysiuspattath"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
          >
            Aloysius Pattath
          </a>
        </div>

        {/* Social Icons Bar (Touch-friendly 44x44px buttons for 100 a11y score) */}
        <div className="flex items-center justify-center gap-3">
          {/* GitHub */}
          <a
            href="https://github.com/aloysiuspattath"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aloysius Pattath on GitHub"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 border border-black/5 dark:border-white/5 shadow-2xs hover:shadow-md flex items-center justify-center transition-all active:scale-95"
            title="GitHub Profile"
          >
            <Github className="w-5 h-5" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/aloysius-pattath/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aloysius Pattath on LinkedIn"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 border border-black/5 dark:border-white/5 shadow-2xs hover:shadow-md flex items-center justify-center transition-all active:scale-95"
            title="LinkedIn Profile"
          >
            <Linkedin className="w-5 h-5" />
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/iam.__.batman"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Aloysius Pattath on Instagram"
            className="w-11 h-11 rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:text-pink-600 dark:hover:text-pink-400 border border-black/5 dark:border-white/5 shadow-2xs hover:shadow-md flex items-center justify-center transition-all active:scale-95"
            title="Instagram Profile"
          >
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        {/* Navigation & Documentation Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => handleOpenTab('guide')}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            Guide
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenTab('faq')}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            FAQ
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenTab('about')}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            About Us
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenTab('terms')}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            Terms
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => handleOpenTab('privacy')}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Privacy</span>
          </button>
          <span>•</span>
          <a
            href="https://techfliq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            TechFliq
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          © {currentYear} SplitBill • Free, private &amp; open bill splitter. Zero data collected.
        </p>
      </div>
    </footer>
  );
};
