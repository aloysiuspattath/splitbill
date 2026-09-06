import React from 'react';
import { X, ShieldCheck, Lock, HardDrive, WifiOff, RefreshCw } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Privacy & Data Policy
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Principles */}
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">
                No Accounts, No Passwords, No Cloud Server
              </strong>
              SplitBill has no backend, no database server, and no user accounts. Your data never touches any remote server.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <HardDrive className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">
                Local Storage & Auto-Expiry
              </strong>
              Bills you save are stored in your device's private browser database (IndexedDB). Temporary bills automatically delete after 7 days unless you toggle "Keep Permanently".
            </div>
          </div>

          <div className="flex items-start gap-3">
            <WifiOff className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">
                Local OCR Image Processing
              </strong>
              Receipt photos are read completely inside your browser using client-side WebAssembly OCR. Photos are never uploaded to any cloud or third-party service.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold">
                Zero Tracking & Zero Cookies
              </strong>
              No Google Analytics, no marketing SDKs, and no tracking scripts. You can export your bills as clean JSON anytime.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20"
        >
          Got It, Thanks!
        </button>
      </div>
    </div>
  );
};
