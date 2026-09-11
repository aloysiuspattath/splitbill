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
import { WhatsAppIcon } from '../components/icons/WhatsAppIcon';
import { PersonSelect } from '../components/PersonSelect';
import { Bill, CalculatedBillResult, CurrencyCode, BillCategory, BILL_CATEGORIES } from '../types';
import { formatMoney } from '../utils/currency';
import { shareBillSummary, copyBillSummary, openWhatsAppShare } from '../features/export/shareService';
import { generateBillPdf } from '../features/export/pdfGenerator';
import { downloadElementAsImage } from '../features/export/imageExporter';
import { exportBillToJson } from '../features/export/jsonTransfer';

interface ResultScreenProps {
  bill: Bill;
  result: CalculatedBillResult;
  currency: CurrencyCode;
  onUpdatePaidBy?: (personId: string) => void;
  onUpdateCategory?: (category: BillCategory) => void;
  groupName?: string;
  onSaveBill: (keepPermanently: boolean) => Promise<void>;
  onStartNewBill: () => void;
  onEditBill: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  bill,
  result,
  currency,
  onUpdatePaidBy,
  onUpdateCategory,
  groupName,
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
    import('canvas-confetti')
      .then(({ default: confetti }) => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        });
      })
      .catch(() => {});
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

  const handleDownloadPdf = async () => {
    await generateBillPdf(bill, result);
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
    <div className="max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-4 py-4 space-y-5">
      {/* Group Action Banner */}
      {bill.groupId && groupName && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-200 block">
              Trip Expense • {groupName}
            </span>
            <h3 className="font-extrabold text-sm sm:text-base truncate">
              Ready to add this bill!
            </h3>
          </div>
          <button
            onClick={() => onSaveBill(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-brand-600 font-black text-xs sm:text-sm shadow-md hover:bg-brand-50 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save & Done</span>
          </button>
        </div>
      )}

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

        {bill.groupId && (
          <div className="bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl mb-4 border border-brand-100 dark:border-brand-800 space-y-3">
            {onUpdateCategory && (
              <div>
                <label className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <div className="flex flex-wrap gap-1">
                  {BILL_CATEGORIES.map(cat => {
                    const isSelected = (bill.category || 'food') === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onUpdateCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                            : 'bg-white dark:bg-[#1c1c1e] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {cat.emoji} {cat.label.split('&')[0].trim()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {onUpdatePaidBy && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider block">
                  Who paid the bill?
                </label>
                <PersonSelect
                  people={bill.people}
                  selectedPersonId={bill.paidBy || bill.people[0]?.id}
                  onSelect={onUpdatePaidBy}
                  variant="full"
                />
              </div>
            )}
          </div>
        )}

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
                    {currency === 'INR' && person.personId !== (bill.paidBy || bill.people[0]?.id) && (() => {
                      const payer = bill.people.find(p => p.id === (bill.paidBy || bill.people[0]?.id));
                      if (payer && payer.upiId) {
                        return (
                          <a 
                            href={`upi://pay?pa=${payer.upiId}&pn=${payer.name}&am=${(person.totalPaise / 100).toFixed(2)}&cu=INR`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors mr-2"
                          >
                            Pay via UPI
                          </a>
                        );
                      }
                      return null;
                    })()}
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
          🔒 SplitBill • splitbill.techfliq.com • Calculated 100% locally
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="space-y-3">
        {/* Primary Share Action Grid: WhatsApp, Copy, PDF, Image */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {/* WhatsApp Direct Share */}
          <button
            onClick={() => openWhatsAppShare(bill, result, false)}
            aria-label="Share bill on WhatsApp"
            className="py-2.5 px-1.5 sm:px-2 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 sm:gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
            <span>WhatsApp</span>
          </button>

          {/* Copy Summary */}
          <button
            onClick={handleCopy}
            aria-label="Copy summary to clipboard"
            className="py-2.5 px-1.5 sm:px-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[11px] sm:text-xs shadow-md flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            aria-label="Download itemized PDF"
            className="py-2.5 px-1.5 sm:px-2 rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] font-bold text-[11px] sm:text-xs border border-black/5 dark:border-transparent flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <FileDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
            <span>PDF</span>
          </button>

          {/* Save Image */}
          <button
            onClick={handleDownloadImage}
            disabled={isExportingImage}
            aria-label="Save receipt as PNG image"
            className="py-2.5 px-1.5 sm:px-2 rounded-2xl bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#2c2c2e] font-bold text-[11px] sm:text-xs border border-black/5 dark:border-transparent flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
            <span>{isExportingImage ? 'Exporting...' : 'Image'}</span>
          </button>
        </div>

        {/* Generic Web Share API fallback */}
        <button
          onClick={handleShare}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
        >
          <Share2 className="w-4 h-4" />
          <span>More Share Options…</span>
        </button>

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
        {bill.groupId && groupName ? (
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => onSaveBill(true)}
              className="w-full py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-[0_8px_20px_rgb(37,99,235,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>Save Bill to {groupName}</span>
            </button>

            <div className="flex items-center gap-3">
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
                <span>Return to Group</span>
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
