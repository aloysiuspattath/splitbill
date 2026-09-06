import React, { useRef } from 'react';
import { X, Trash2, Pin, PinOff, ExternalLink, Upload, FileText, Calendar } from 'lucide-react';
import { Bill } from '../types';
import { formatMoney } from '../utils/currency';
import { validateAndSanitizeBillJson } from '../features/export/jsonTransfer';

interface RecentBillsModalProps {
  bills: Bill[];
  isOpen: boolean;
  onClose: () => void;
  onOpenBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onTogglePermanent: (id: string) => void;
  onImportBill: (bill: Bill) => void;
}

export function formatRelativeDate(timestamp: number): string {
  const diffDays = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export const RecentBillsModal: React.FC<RecentBillsModalProps> = ({
  bills,
  isOpen,
  onClose,
  onOpenBill,
  onDeleteBill,
  onTogglePermanent,
  onImportBill,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

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
              const subtotal = bill.items.reduce((sum, it) => sum + it.totalPricePaise, 0);

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

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {formatMoney(subtotal, bill.currency)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeDate(bill.updatedAt || bill.createdAt)}
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
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                      }`}
                      title={bill.isPermanent ? 'Remove permanent pin' : 'Keep permanently'}
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

        {/* Modal Footer: Import button & storage policy notice */}
        <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
          <button
            onClick={() => importInputRef.current?.click()}
            className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-[#1c1c1e]"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
          </button>

          <span className="text-[11px] text-slate-400">
            Auto-expires in 7 days unless pinned
          </span>
        </div>
      </div>
    </div>
  );
};
