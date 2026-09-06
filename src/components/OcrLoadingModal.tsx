import React from 'react';
import { Loader2, Camera, X } from 'lucide-react';
import { OcrProgress } from '../features/receipt/ocrService';

interface OcrLoadingModalProps {
  progress: OcrProgress;
  onCancel: () => void;
  imagePreviewUrl?: string;
}

export const OcrLoadingModal: React.FC<OcrLoadingModalProps> = ({
  progress,
  onCancel,
  imagePreviewUrl,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 flex flex-col items-center text-center relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Thumbnail Preview */}
        {imagePreviewUrl ? (
          <div className="w-24 h-32 rounded-[20px] overflow-hidden border-2 border-brand-500 shadow-md mb-4 relative">
            <img
              src={imagePreviewUrl}
              alt="Receipt preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-500/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-brand-600 animate-spin" />
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-[32px] bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-4">
            <Camera className="w-8 h-8 animate-pulse" />
          </div>
        )}

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Processing Receipt
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {progress.status || 'Analyzing receipt text on your device...'}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <div
            className="bg-brand-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress.progress)}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mb-4">
          {progress.progress}%
        </span>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4">
          🔒 Processed 100% locally. Receipt photo is not uploaded anywhere.
        </p>

        <button
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          Skip & enter manually
        </button>
      </div>
    </div>
  );
};
