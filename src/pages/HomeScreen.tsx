import React, { useRef } from 'react';
import { Camera, PenLine, History, Sparkles, Shield, ArrowRight, Zap } from 'lucide-react';

interface HomeScreenProps {
  onStartManual: () => void;
  onStartScan: (file: File) => void;
  onOpenRecent: () => void;
  onLoadDemo: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartManual,
  onStartScan,
  onOpenRecent,
  onLoadDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onStartScan(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-md mx-auto px-5 py-6 flex flex-col items-center text-center">
      {/* Hidden camera / file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero Visual: 3D Bill Illustration matching the reference mockup */}
      <div className="relative w-56 h-56 mb-4 flex items-center justify-center">
        {/* Soft atmospheric gradient blob behind */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-400/20 via-blue-500/20 to-purple-400/20 rounded-full blur-2xl transform -scale-95 animate-pulse" />

        {/* 3D-styled receipt container */}
        <div className="relative w-44 h-48 bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent flex flex-col justify-between transform -rotate-3 hover:rotate-0 transition-transform duration-500 ease-out">
          <div className="flex items-center justify-between pb-2 border-b border-dashed border-black/5 dark:border-transparent">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <span className="font-black text-sm">₹</span>
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-400" />
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
            </div>
          </div>

          <div className="space-y-2 py-1">
            <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-2 w-16 bg-slate-100 dark:bg-slate-700/60 rounded-full" />
            <div className="h-2 w-28 bg-brand-100 dark:bg-brand-950 rounded-full" />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-transparent flex justify-between items-center">
            <div className="h-3 w-12 bg-slate-300 dark:bg-slate-600 rounded-full" />
            <div className="h-3.5 w-14 bg-brand-600 rounded-full" />
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-3 -right-2 bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            <span>Instant</span>
          </div>
        </div>
      </div>

      {/* Hero Headline & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
        Best Way <br />
        <span className="bg-gradient-to-r from-brand-600 to-blue-500 bg-clip-text text-transparent">
          To Split Your Bill
        </span>{' '}
        Easily
      </h1>

      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xs mb-8">
        Split a restaurant bill with your friends in seconds.
        Snap a receipt or enter items manually.
      </p>

      {/* Main Action Buttons */}
      <div className="w-full space-y-3 mb-6">
        {/* Scan Receipt Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-[0_8px_16px_rgb(37,99,235,0.25)] flex items-center justify-center gap-3 active:scale-95 transition-all duration-300"
        >
          <Camera className="w-5 h-5" />
          <span>Scan Receipt</span>
          <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
        </button>

        {/* Enter Bill Manually Button */}
        <button
          onClick={onStartManual}
          className="w-full py-4 px-6 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-slate-100 font-bold text-base shadow-[0_2px_8px_rgb(0,0,0,0.08)] flex items-center justify-center gap-2.5 active:scale-95 transition-all duration-300"
        >
          <PenLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Enter Bill Manually</span>
        </button>

        {/* Try Demo Button */}
        <button
          onClick={onLoadDemo}
          className="w-full py-2.5 px-4 rounded-xl bg-brand-50 dark:bg-brand-950/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-semibold text-xs border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center gap-1.5 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try Demo: Sulthan Veedu Restaurant</span>
        </button>
      </div>

      {/* Secondary: Recent Bills */}
      <button
        onClick={onOpenRecent}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 mb-8 transition-colors"
      >
        <History className="w-4 h-4" />
        <span>View Recent Bills</span>
      </button>

      {/* Privacy Guarantee Badges */}
      <div className="w-full pt-6 border-t border-slate-100 dark:border-transparent/80 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>🔒 Your bills stay on this device. No account required.</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Free • Private • No signup • 100% Offline Capable
        </p>
      </div>
    </div>
  );
};
