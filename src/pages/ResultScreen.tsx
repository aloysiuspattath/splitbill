import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Share2,
  FileDown,
  Image as ImageIcon,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Pin,
  Sparkles,
  Download,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Bill, CalculatedBillResult, CurrencyCode } from '../types';
import { formatMoney } from '../utils/currency';
import { shareBillSummary, copyBillSummary } from '../features/export/shareService';
import { generateBillPdf } from '../features/export/pdfGenerator';
import { downloadElementAsImage } from '../features/export/imageExporter';
import { exportBillToJson } from '../features/export/jsonTransfer';

interface ResultScreenProps {
  bill: Bill;
  result: CalculatedBillResult;
  currency: CurrencyCode;
  onSaveBill: (keepPermanently: boolean) => Promise<void>;
  onStartNewBill: () => void;
  onEditBill: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  bill,
  result,
  currency,
  onSaveBill,
  onStartNewBill,
  onEditBill,
}) => {
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [keepPermanently, setKeepPermanently] = useState(bill.isPermanent ?? false);
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Trigger celebration confetti once when screen loads
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Ignored if blocked in environment
    }
  }, []);

  const handleCopy = async () => {
    const res = await copyBillSummary(bill, result, true);
    if (res.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    await shareBillSummary(bill, result, false);
  };

  const handleDownloadPdf = () => {
    generateBillPdf(bill, result);
  };

  const handleDownloadImage = async () => {
    if (!receiptCardRef.current) return;
    try {
      setIsExportingImage(true);
      const safeName = (bill.restaurantName || 'splitbill')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');
      await downloadElementAsImage(receiptCardRef.current, `${safeName}-split.png`);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleSave = async () => {
    await onSaveBill(keepPermanently);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const togglePersonExpand = (id: string) => {
    setExpandedPersonId(expandedPersonId === id ? null : id);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5">
      {/* Top Banner */}
      <div className="text-center">
        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center justify-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Split Completed
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Bill Split Summary
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Everything calculated down to the single paisa
        </p>
      </div>

      {/* Modern Printable Receipt Card */}
      <div
        ref={receiptCardRef}
        className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-transparent space-y-5"
      >
        {/* Receipt Header */}
        <div className="text-center pb-4 border-b border-dashed border-black/5 dark:border-white/5">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 block mb-1">
            BILL SPLIT RECEIPT
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {bill.restaurantName || 'Restaurant Bill'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {new Date(bill.date || bill.createdAt).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>

          <div className="mt-3 inline-block px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
              Total Bill:
            </span>
            <span className="text-base font-black text-brand-600 dark:text-brand-400">
              {formatMoney(result.effectiveBillTotalPaise, currency)}
            </span>
          </div>
        </div>

        {/* Individual Shares List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Friend's Share
            </span>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Amount Due
            </span>
          </div>

          {result.personShares.map(person => {
            const isExpanded = expandedPersonId === person.personId;

            return (
              <div
                key={person.personId}
                className="rounded-[20px] bg-slate-50/70 dark:bg-[#2c2c2e] border border-slate-100 dark:border-transparent transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => togglePersonExpand(person.personId)}
                  className="w-full p-3.5 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                      style={{ backgroundColor: `${person.color}20`, border: `1.5px solid ${person.color}` }}
                    >
                      <span>{person.avatar}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {person.personName}
                        {person.roundingAdjustmentPaise !== 0 && (
                          <span
                            className="text-[9px] font-semibold text-slate-400 bg-slate-200 dark:bg-[#3c3c3e] px-1.5 py-0.5 rounded"
                            title="Reconciliation adjustment"
                          >
                            {person.roundingAdjustmentPaise > 0 ? '+1p' : '-1p'}
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {person.assignedItems.length} {person.assignedItems.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatMoney(person.totalPaise, currency)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Itemized Breakdown */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-1 border-t border-black/5/60 dark:border-white/5 space-y-1.5 text-xs animate-fadeIn">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">
                      Itemized Breakdown:
                    </div>
                    {person.assignedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span className="truncate pr-2">
                          • {item.itemName} {item.details ? `(${item.details})` : ''}
                        </span>
                        <span className="font-semibold flex-shrink-0">
                          {formatMoney(item.sharePaise, currency)}
                        </span>
                      </div>
                    ))}
                    {person.taxSharePaise > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>• Share of Taxes</span>
                        <span className="font-semibold">+{formatMoney(person.taxSharePaise, currency)}</span>
                      </div>
                    )}
                    {person.discountSharePaise > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>• Proportional Discount</span>
                        <span className="font-semibold">-{formatMoney(person.discountSharePaise, currency)}</span>
                      </div>
                    )}
                    {person.roundingAdjustmentPaise !== 0 && (
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>• Deterministic paise reconciliation</span>
                        <span>
                          {person.roundingAdjustmentPaise > 0
                            ? `+${formatMoney(person.roundingAdjustmentPaise, currency)}`
                            : formatMoney(person.roundingAdjustmentPaise, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bill Summary Table */}
        <div className="pt-3 border-t border-dashed border-black/5 dark:border-white/5 space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatMoney(result.subtotalPaise, currency)}</span>
          </div>
          {result.taxesTotalPaise > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Taxes</span>
              <span>+{formatMoney(result.taxesTotalPaise, currency)}</span>
            </div>
          )}
          {result.discountTotalPaise > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span>-{formatMoney(result.discountTotalPaise, currency)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-black/5 dark:border-transparent flex justify-between text-sm font-black text-slate-900 dark:text-white">
            <span>TOTAL DUE</span>
            <span className="text-brand-600 dark:text-brand-400">
              {formatMoney(result.calculatedPersonsTotalPaise, currency)}
            </span>
          </div>
        </div>

        {/* Footer Guarantee */}
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
          🔒 SplitBill • Calculated 100% locally on this device
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="space-y-3">
        {/* Primary Share & Copy Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopy}
            className="py-3.5 px-4 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-[0_8px_16px_rgb(37,99,235,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Summary!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleShare}
            className="py-3.5 px-4 rounded-[20px] bg-slate-900 dark:bg-slate-750 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Bill</span>
          </button>
        </div>

        {/* Secondary Actions: PDF & Image */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="py-3 px-3 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs border border-black/5 dark:border-transparent flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4 text-rose-500" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isExportingImage}
            className="py-3 px-3 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold text-xs border border-black/5 dark:border-transparent flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>{isExportingImage ? 'Exporting...' : 'Save as Image'}</span>
          </button>
        </div>

        {/* Local Storage & Permanent Pinning Card */}
        <div className="p-4 rounded-[32px] bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-transparent space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-brand-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Save to Local Storage
              </span>
            </div>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold text-xs hover:bg-brand-100 transition-colors flex items-center gap-1"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Saved!' : 'Save Bill'}</span>
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={keepPermanently}
              onChange={e => setKeepPermanently(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <Pin className="w-3.5 h-3.5 text-amber-500" />
            <span>Keep permanently (by default bills auto-expire after 7 days)</span>
          </label>

          <div className="pt-2 border-t border-slate-100 dark:border-transparent flex justify-between items-center text-xs">
            <span className="text-slate-400">Transfer between devices:</span>
            <button
              onClick={() => exportBillToJson(bill)}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Edit or Start Fresh */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onEditBill}
            className="flex-1 py-3 rounded-[20px] bg-slate-100 dark:bg-[#1c1c1e] hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
          >
            ← Edit Bill Details
          </button>

          <button
            onClick={onStartNewBill}
            className="flex-1 py-3 rounded-[20px] bg-white dark:bg-[#1c1c1e] border border-black/5 dark:border-transparent hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Start New Bill</span>
          </button>
        </div>
      </div>
    </div>
  );
};
