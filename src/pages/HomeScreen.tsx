import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, PenLine, History, Sparkles, Shield, ArrowRight, Zap, RotateCcw, BookOpen } from 'lucide-react';
import { forceClearCacheAndReload } from '../utils/cacheManager';

interface HomeScreenProps {
  onStartManual: () => void;
  onStartScan: (file: File) => void;
  onOpenRecent: () => void;
  onOpenGroups: () => void;
  onLoadDemo: () => void;
  onOpenInfo?: (tab: 'guide' | 'faq' | 'about' | 'terms' | 'privacy') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartManual,
  onStartScan,
  onOpenRecent,
  onOpenGroups,
  onLoadDemo,
  onOpenInfo,
}) => {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onStartScan(e.target.files[0]);
      e.target.value = ''; // Reset so same file can be selected again
    }
  };

  // Clipboard Paste Support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            onStartScan(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onStartScan]);

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          onStartScan(file);
          return;
        }
      }
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative max-w-md lg:max-w-5xl mx-auto px-5 py-6 flex flex-col lg:flex-row lg:items-center text-center lg:text-left min-h-[85vh] justify-center lg:justify-between gap-10"
    >
      {/* Full-Screen Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-brand-600/90 dark:bg-brand-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-fadeIn pointer-events-none">
          <div className="w-24 h-24 rounded-3xl bg-white/20 border-2 border-dashed border-white flex items-center justify-center mb-4 animate-bounce">
            <Upload className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-1">{t('homeScreen.dropReceiptTitle')}</h2>
          <p className="text-sm font-medium text-white/80 text-center max-w-xs">
            {t('homeScreen.dropReceiptSubtitle')}
          </p>
        </div>
      )}
      {/* Camera capture input (opens camera directly on mobile) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        aria-label={t('homeScreen.captureCameraAria')}
        className="hidden"
      />

      {/* Gallery / File upload input (opens photo library or file browser) */}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        aria-label={t('homeScreen.chooseFileAria')}
        className="hidden"
      />

      {/* --- DESKTOP LEFT COLUMN --- */}
      <div className="flex flex-col items-center lg:items-start max-w-sm lg:w-1/2 lg:pl-10">
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
          <div className="absolute -bottom-3 -right-2 bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            <span>{t('homeScreen.instantBadge')}</span>
          </div>
        </div>
      </div>

      {/* Hero Headline & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
        {t('homeScreen.heroTitlePart1')} <br />
        <span className="bg-gradient-to-r from-brand-600 to-blue-500 bg-clip-text text-transparent">
          {t('homeScreen.heroTitlePart2')}
        </span>
      </h1>

      <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1.5">
        {t('homeScreen.heroSubtitle')}
      </p>

      <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300 max-w-xs lg:max-w-md mb-6 font-medium lg:text-left">
        {t('homeScreen.heroDescription')}
      </p>
      </div> {/* End Left Column */}

      {/* --- DESKTOP RIGHT COLUMN --- */}
      <div className="flex flex-col items-center w-full max-w-sm lg:w-1/2 lg:pr-10">
        {/* Main Action Buttons */}
        <div className="w-full space-y-3 mb-5">
        {/* Scan with Camera Button */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          aria-label={t('homeScreen.scanCameraAria')}
          className="w-full py-4 px-6 rounded-[22px] bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-[0_8px_20px_rgb(37,99,235,0.28)] flex items-center justify-center gap-3 active:scale-95 transition-all duration-300"
        >
          <Camera className="w-5 h-5" />
          <span>{t('homeScreen.scanCameraButton')}</span>
          <ArrowRight className="w-4 h-4 ml-auto opacity-70" />
        </button>

        {/* Dual Actions: Upload Image & Enter Manually */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => uploadInputRef.current?.click()}
            aria-label={t('homeScreen.uploadImageAria')}
            className="py-3 px-4 rounded-[18px] bg-white dark:bg-[#1c1c1e] text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all duration-300 border border-black/5 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[#2c2c2e]"
          >
            <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>{t('homeScreen.uploadImageButton')}</span>
          </button>

          <button
            onClick={onStartManual}
            aria-label={t('homeScreen.enterManuallyAria')}
            className="py-3 px-4 rounded-[18px] bg-slate-100/90 dark:bg-[#2c2c2e] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-[#3c3c3e] flex items-center justify-center gap-2 active:scale-95 transition-all duration-300"
          >
            <PenLine className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>{t('homeScreen.enterManuallyButton')}</span>
          </button>
        </div>

        {/* Drag & Drop / Paste Hint */}
        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 py-0.5">
          {t('homeScreen.dragDropHintStart')}<kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300">Ctrl+V</kbd>{t('homeScreen.dragDropHintEnd')}
        </p>
      </div>

      {/* Quick Start Demo Card */}
      <div className="w-full mb-5 p-4 rounded-[24px] bg-gradient-to-br from-brand-50 via-blue-50/50 to-indigo-50/60 dark:from-brand-950/40 dark:via-blue-950/20 dark:to-indigo-950/30 border border-brand-200/70 dark:border-brand-800/60 text-left shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {t('homeScreen.demoBadge')}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            {t('homeScreen.demoSubBadge')}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {t('homeScreen.demoRestaurantName')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {t('homeScreen.demoRestaurantDetails')}
            </p>
          </div>
          <button
            onClick={onLoadDemo}
            aria-label={t('homeScreen.demoButtonAria')}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all shrink-0 flex items-center gap-1"
          >
            <span>{t('homeScreen.demoButton')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Distinct Group Trips & Roommates Section */}
      <div className="w-full mb-6 p-4 rounded-[24px] bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-white/5 text-left shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg shrink-0">
              🌴
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{t('homeScreen.groupsTitle')}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t('homeScreen.groupsSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenGroups}
            aria-label={t('homeScreen.openButtonAria')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#3c3c3e] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors shrink-0 flex items-center gap-1"
          >
            <span>{t('homeScreen.openButton')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Secondary Actions: Recent Bills & Guide */}
      <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
        <button
          onClick={onOpenRecent}
          aria-label={t('homeScreen.recentBillsAria')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          <History className="w-4 h-4" />
          <span>{t('homeScreen.recentBills')}</span>
        </button>

        {onOpenInfo && (
          <button
            onClick={() => onOpenInfo('guide')}
            aria-label={t('homeScreen.guideFaqAria')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>{t('homeScreen.guideFaq')}</span>
          </button>
        )}
      </div>

      {/* Privacy Guarantee Badges */}
      <div className="w-full pt-6 border-t border-slate-100 dark:border-transparent/80 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('homeScreen.privacyGuarantee')}</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
          {t('homeScreen.featuresText')}
        </p>
        <button
          onClick={() => forceClearCacheAndReload()}
          aria-label={t('homeScreen.checkUpdatesTitle')}
          className="mt-1 text-[10px] text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 flex items-center gap-1 transition-colors hover:opacity-100"
          title={t('homeScreen.checkUpdatesTitle')}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>{t('homeScreen.checkUpdates')}</span>
        </button>
      </div>
      </div> {/* End Right Column */}
    </div>
  );
};
