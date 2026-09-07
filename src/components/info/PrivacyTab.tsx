import React from 'react';
import { ShieldCheck, Lock, HardDrive, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { forceClearCacheAndReload } from '../../utils/cacheManager';

export const PrivacyTab: React.FC = () => {
  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-base">
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
        <h3>Privacy &amp; Data Guarantee</h3>
      </div>

      <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-xs leading-relaxed flex items-start gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">100% Client-Side Privacy Guarantee</strong>
          SplitBill operates entirely inside your web browser. No bills, receipt images, names, or financial calculations are ever sent to any remote server.
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white block font-bold text-xs">
              No User Accounts, No Passwords, No Cloud Server
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We do not maintain user databases, email lists, or login requirements. You are completely anonymous.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white block font-bold text-xs">
              Local Browser Storage (IndexedDB)
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bills and trips you save stay strictly on your device. Temporary individual bills automatically expire after 7 days unless marked as permanent. You can wipe all local storage anytime.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white block font-bold text-xs">
              Local OCR WebAssembly Engine
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Receipt photos are parsed directly on your device CPU using client-side Tesseract.js WebAssembly. Photos are never uploaded to any cloud vision API or external service.
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white block font-bold text-xs">
              Zero Tracking, Zero Analytics &amp; Zero Third-Party Cookies
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No tracking pixels, no advertising beacons, and no behavioral surveillance.
            </span>
          </div>
        </div>
      </div>

      {/* Force Reload Utility Button */}
      <div className="pt-2">
        <button
          onClick={() => forceClearCacheAndReload()}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#252528] dark:hover:bg-[#2e2e32] text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          title="Clear Service Worker cache and reload latest application bundle"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
          <span>Clear Service Worker Cache &amp; Reload Latest Build</span>
        </button>
      </div>
    </div>
  );
};
