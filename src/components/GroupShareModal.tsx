import React, { useState, useRef } from 'react';
import { Group, Bill } from '../types';
import { formatMoney } from '../utils/currency';
import { calculateSettleUp } from '../features/calculation/settleUp';
import { 
  generateGroupShareText, 
  openWhatsApp, 
  copyToClipboard, 
  exportGroupToJson 
} from '../features/export/groupShareService';
import { generateGroupPdf } from '../features/export/groupPdfGenerator';
import { downloadElementAsImage } from '../features/export/imageExporter';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  FileDown, 
  Image as ImageIcon, 
  Download, 
  Send,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface GroupShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  bills: Bill[];
}

export const GroupShareModal: React.FC<GroupShareModalProps> = ({
  isOpen,
  onClose,
  group,
  bills,
}) => {
  const [shareMode, setShareMode] = useState<'full' | 'settlement'>('full');
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalGroupSpentPaise = bills.reduce((sum, b) => {
    return sum + b.items.reduce((itemSum, item) => itemSum + item.totalPricePaise, 0);
  }, 0);

  const transactions = calculateSettleUp(bills);

  const currentText = generateGroupShareText(group, bills, {
    includeBillsList: true,
    includeCategoryBreakdown: true,
    includeMemberBalances: true,
    settlementOnly: shareMode === 'settlement',
  });

  const handleCopy = async () => {
    const success = await copyToClipboard(currentText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    openWhatsApp(currentText);
  };

  const handlePdf = async () => {
    try {
      setIsExportingPdf(true);
      await generateGroupPdf(group, bills);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      const safeName = group.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      await downloadElementAsImage(cardRef.current, `${safeName}-summary.png`);
    } catch (err) {
      console.error('Failed to save image:', err);
      alert('Failed to export image. Please try downloading PDF instead.');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportJson = () => {
    exportGroupToJson(group, bills);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${group.name} Split Summary`,
          text: currentText,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-slideUp">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Share Trip Summary</h2>
              <p className="text-xs text-slate-400 font-medium">{group.name} • {bills.length} bills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Main Share Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* WhatsApp Direct */}
            <button
              onClick={handleWhatsApp}
              className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-left hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">WhatsApp</span>
                <span className="text-[10px] text-slate-500 font-medium">Send directly</span>
              </div>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopy}
              className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 text-left hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                  {copied ? 'Copied!' : 'Copy Text'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">For any messenger</span>
              </div>
            </button>

            {/* Download PDF */}
            <button
              onClick={handlePdf}
              disabled={isExportingPdf}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-left hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex flex-col justify-between group active:scale-95 disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <FileDown className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                  {isExportingPdf ? 'Building...' : 'PDF Statement'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Full ledger report</span>
              </div>
            </button>

            {/* Save as Image */}
            <button
              onClick={handleSaveImage}
              disabled={isExportingImage}
              className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-left hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex flex-col justify-between group active:scale-95 disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                  {isExportingImage ? 'Exporting...' : 'Save as Image'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">PNG summary card</span>
              </div>
            </button>

            {/* Export JSON (Backup / Sync) */}
            <button
              onClick={handleExportJson}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all flex flex-col justify-between group active:scale-95"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white block">Export Data</span>
                <span className="text-[10px] text-slate-500 font-medium">Send to friends</span>
              </div>
            </button>

            {/* Native Mobile Share */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#2c2c2e] border border-slate-200 dark:border-slate-700 text-left hover:bg-slate-200 dark:hover:bg-[#38383a] transition-all flex flex-col justify-between group active:scale-95"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-700 dark:bg-slate-500 text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">More Options</span>
                  <span className="text-[10px] text-slate-500 font-medium">System share sheet</span>
                </div>
              </button>
            )}
          </div>

          {/* Mode Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Summary Content
              </span>
            </div>
            <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1 rounded-xl">
              <button
                onClick={() => setShareMode('full')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  shareMode === 'full'
                    ? 'bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Full Trip Breakdown
              </button>
              <button
                onClick={() => setShareMode('settlement')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  shareMode === 'settlement'
                    ? 'bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Quick Settle-Up Only
              </button>
            </div>
          </div>

          {/* Live Text Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Message Preview
              </span>
              <button
                onClick={handleCopy}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e]/60 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed selection:bg-brand-100">
              {currentText}
            </pre>
          </div>

          {/* Visual Card (Used for Image Export & Visual Preview) */}
          <div className="pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Image Card Preview
            </span>
            <div 
              ref={cardRef}
              className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl space-y-4 border border-white/10"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    SplitBill Trip
                  </span>
                  <h3 className="text-xl font-black tracking-tight">{group.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold">TOTAL SPEND</span>
                  <span className="text-xl font-black text-brand-400">
                    {formatMoney(totalGroupSpentPaise, group.currency)}
                  </span>
                </div>
              </div>

              {/* Settle Up Section */}
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Settlement Plan
                </span>
                {transactions.length === 0 ? (
                  <p className="text-xs font-bold text-emerald-400">🎉 Everyone is settled up!</p>
                ) : (
                  transactions.slice(0, 4).map((tx, idx) => {
                    const from = group.members.find(m => m.id === tx.fromPersonId)?.name || 'Someone';
                    const to = group.members.find(m => m.id === tx.toPersonId)?.name || 'Someone';
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-300">{from}</span>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span>pays</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-slate-300">{to}</span>
                        <span className="font-extrabold text-emerald-400 ml-2">
                          {formatMoney(tx.amountPaise, group.currency)}
                        </span>
                      </div>
                    );
                  })
                )}
                {transactions.length > 4 && (
                  <p className="text-[10px] text-slate-400 text-center pt-1">+ {transactions.length - 4} more payments</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-white/10">
                <span>{group.members.length} members • {bills.length} bills</span>
                <span>splitbill.techfliq.com • 100% Private</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1c1c1e] flex gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>
          <button
            onClick={handleCopy}
            className="py-3.5 px-5 rounded-2xl bg-slate-200 dark:bg-[#2c2c2e] hover:bg-slate-300 dark:hover:bg-[#38383a] text-slate-800 dark:text-white font-bold text-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
