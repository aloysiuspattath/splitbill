import React from 'react';
import { Github, Linkedin, Instagram, ShieldCheck, Heart, Coffee } from 'lucide-react';
import { RegionDropdown } from './RegionDropdown';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  onOpenPrivacy?: () => void;
  onOpenInfo?: (tab: 'guide' | 'faq' | 'about' | 'terms' | 'privacy') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenInfo }) => {
  const { t } = useTranslation();
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
      <div className="max-w-md lg:max-w-5xl mx-auto flex flex-col items-center space-y-4">
        
        {/* Creator Attribution */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
          <span className="text-slate-300 dark:text-slate-600">|</span>
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
          {/* Buy Me a Coffee */}
          <a
            href="https://buymeacoffee.com/aloyziuz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy Aloysius a Coffee"
            className="w-11 h-11 rounded-2xl bg-[#FFDD00] text-[#000000] hover:scale-105 hover:bg-[#FFEA4D] border border-black/5 shadow-2xs hover:shadow-md flex items-center justify-center transition-all active:scale-95"
            title="Buy me a coffee"
          >
            <Coffee className="w-5 h-5" />
          </a>

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
          <a
            href="/receipt-scanner.html"
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            {t('footer.receiptScanner', 'Receipt Scanner')}
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/splitwise-alternative.html"
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            {t('footer.splitwiseAlt', 'Splitwise Alternative')}
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/guide/"
            onClick={(e) => { e.preventDefault(); handleOpenTab('guide'); }}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            Guide
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/faq/"
            onClick={(e) => { e.preventDefault(); handleOpenTab('faq'); }}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            FAQ
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/about/"
            onClick={(e) => { e.preventDefault(); handleOpenTab('about'); }}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            About Us
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/terms/"
            onClick={(e) => { e.preventDefault(); handleOpenTab('terms'); }}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            Terms
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/privacy/"
            onClick={(e) => { e.preventDefault(); handleOpenTab('privacy'); }}
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-slate-300 dark:text-slate-600">|</span>
          </a>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
          >
            Sitemap
          </a>
        </div>
        
        {/* Regional Links for SEO */}
                <RegionDropdown />

        {/* Copyright */}
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          (c) {currentYear} SplitBill | Free, private &amp; open bill splitter. Zero data collected.
        </p>
      </div>
    </footer>
  );
};





