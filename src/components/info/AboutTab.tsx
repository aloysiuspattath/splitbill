import React from 'react';
import { 
  Github, 
  Linkedin, 
  Instagram, 
  Globe, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  Scale, 
  ExternalLink 
} from 'lucide-react';

export const AboutTab: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
      {/* Hero Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 text-white space-y-2.5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-200 block">
            About SplitBill
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Fair splits without math debates or account signups.
          </h2>
          <p className="text-xs text-white/90 leading-relaxed pt-1">
            Built as an open, private alternative to invasive bill-splitting apps. Everything happens on your device with 0 server dependency.
          </p>
        </div>
      </div>

      {/* The Story */}
      <section className="space-y-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Why We Built SplitBill
        </h3>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-2.5 leading-relaxed text-xs text-slate-600 dark:text-slate-300 shadow-2xs">
          <p>
            Have you ever been at a table of 6 friends after an enjoyable dinner, only to spend the next 20 minutes haggling over a paper bill, recalculating GST on a calculator, or being forced to download an app that requires a phone number, SMS verification, and password?
          </p>
          <p>
            We created <strong>SplitBill</strong> to end that frustration forever. No logins, no downloads required for friends, no ad popups, and no cloud server storing your financial history.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="space-y-2.5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
          Our Core Pillars
        </h3>
        
        <div className="grid gap-2.5">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">100% Client-Side Privacy</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Zero backend database. Receipt photos are read directly in your browser using local WebAssembly. Your bills never touch any server.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">Paise-Perfect Math (0 Discrepancy)</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                We calculate everything in smallest integer units using the Largest Remainder algorithm. The sum of all shares equals the printed receipt total to the exact single paisa.
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">100% Free &amp; Uncluttered</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                No ads, no subscriptions, no monthly limits. Built as a public service utility for everyday diners and travelers.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Creator & Tech Stack */}
      <section className="p-4 rounded-2xl bg-slate-50 dark:bg-[#222225] border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-600" />
            <span className="font-bold text-slate-900 dark:text-white text-xs">Built by Aloysius Pattath</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
            TechFliq
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Crafted with care using React, TypeScript, Tailwind CSS, Tesseract.js (WASM OCR), jsPDF, and IndexedDB as an offline-first Progressive Web App (PWA).
        </p>

        {/* Creator Socials */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-2">
          <a
            href="https://github.com/aloysiuspattath"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:text-brand-600 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
          </a>

          <a
            href="https://www.linkedin.com/in/aloysius-pattath/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:text-blue-600 transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5 text-blue-600" />
            <span>LinkedIn</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
          </a>

          <a
            href="https://www.instagram.com/iam.__.batman"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:text-pink-600 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>Instagram</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
          </a>

          <a
            href="https://techfliq.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-bold hover:bg-brand-100 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>TechFliq</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-50" />
          </a>
        </div>
      </section>
    </div>
  );
};
