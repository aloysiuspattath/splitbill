import React, { useRef } from 'react';
import { X, Trash2, Pin, PinOff, ExternalLink, Upload, FileText } from 'lucide-react';
import { Bill } from '../types';
import { formatMoney } from '../utils/currency';
import { calculateBill } from '../features/calculation/engine';
import { validateAndSanitizeBillJson } from '../features/export/jsonTransfer';

interface RecentBillsModalProps {
  bills: Bill[];
  isOpen: boolean;
  onClose: () => void;
  onOpenBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onTogglePermanent: (id: string) => void;
  onImportBill: (bill: Bill) => void;
  onClearAllData?: () => void;
}

export function formatRelativeDate(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function getExpiryDetails(bill: Bill): { label: string; isExpiringSoon: boolean } {
  if (bill.isPermanent) {
    return { label: 'Pinned permanently', isExpiringSoon: false };
  }
  const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
  const ageMs = Date.now() - bill.createdAt;
  const remainingMs = EXPIRY_MS - ageMs;
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  if (remainingDays <= 0) {
    return { label: 'Expires today', isExpiringSoon: true };
  }
  if (remainingDays === 1) {
    return { label: 'Expires in 1 day', isExpiringSoon: true };
  }
  return { label: `Expires in ${remainingDays} days`, isExpiringSoon: remainingDays <= 2 };
}

export const RecentBillsModal: React.FC<RecentBillsModalProps> = ({
  bills,
  isOpen,
  onClose,
  onOpenBill,
  onDeleteBill,
  onTogglePermanent,
  onImportBill,
  onClearAllData,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  if (!isOpen) return null;

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const raw = JSON.parse(evt.target?.result as string);
        const sanitized = validateAndSanitizeBillJson(raw);
        onImportBill(sanitized);
        onClose();
      } catch (err: any) {
        alert(err.message || 'Failed to import bill JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Recent Bills
            </h3>
            <p className="text-xs text-slate-400">
              Stored locally on this device
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Import File Input */}
        <input
          ref={importInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Bills List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3">
          {bills.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold">No recent bills found</p>
              <p className="text-xs">Bills you save will appear here.</p>
            </div>
          ) : (
            bills.map(bill => {
              const total = calculateBill(bill).effectiveBillTotalPaise;
              const expiry = getExpiryDetails(bill);

              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-[20px] bg-slate-50 dark:bg-[#1c1c1e]/80 border border-slate-100 dark:border-slate-750 flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {bill.restaurantName || 'Restaurant Bill'}
                      </h4>
                      {bill.isPermanent && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                          <Pin className="w-2.5 h-2.5" />
                          Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {formatMoney(total, bill.currency)}
                      </span>
                      <span>•</span>
                      <span className={expiry.isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'}>
                        {expiry.label}
                      </span>
                      <span>•</span>
                      <span>{bill.people.length} people</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTogglePermanent(bill.id)}
                      className={`p-2 rounded-xl text-xs transition-colors ${
                        bill.isPermanent
                          ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-[#2c2c2e]'
                      }`}
                      title={bill.isPermanent ? 'Unpin (will auto-expire in 7d)' : 'Keep permanently (disable auto-expiry)'}
                    >
                      {bill.isPermanent ? <Pin className="w-4 h-4 fill-current" /> : <PinOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        onOpenBill(bill);
                        onClose();
                      }}
                      className="p-2 rounded-xl text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 transition-colors"
                      title="Open Bill"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteBill(bill.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      title="Delete Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer: Import button & Clear all local data */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => importInputRef.current?.click()}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-[#2c2c2e]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
            </button>

            {bills.length > 0 && onClearAllData && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 py-1.5 px-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                title="Wipe all local bills and data from this device"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all data</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400">
            Auto-expires in 7d unless pinned
          </span>
        </div>

        {/* Clear All Confirmation Dialog */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#252528] rounded-[24px] p-5 max-w-xs w-full shadow-2xl border border-black/10 dark:border-white/10 space-y-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Clear all local data?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This will permanently delete all saved bills and groups from this device. This cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#323235]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowClearConfirm(false);
                    onClearAllData?.();
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
