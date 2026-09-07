import React, { useState, useRef } from 'react';
import { Group, Bill, BILL_CATEGORIES, BillCategory } from '../types';
import { calculateSettleUp, calculateDetailedBalances, calculateCategoryTotals } from '../features/calculation/settleUp';
import { 
  ArrowLeft, 
  Plus, 
  Receipt, 
  ArrowRight, 
  Wallet, 
  Trash2, 
  Camera, 
  Upload, 
  Zap, 
  PenLine, 
  Share2, 
  X,
  PieChart
} from 'lucide-react';
import { formatMoney } from '../utils/currency';
import { QuickExpenseModal } from '../components/QuickExpenseModal';
import { GroupShareModal } from '../components/GroupShareModal';

interface GroupDashboardProps {
  group: Group;
  bills: Bill[];
  onAddExpenseManual: () => void;
  onScanExpense: (file: File) => void;
  onQuickAddExpense: (bill: Bill) => Promise<void>;
  onEditExpense: (bill: Bill) => void;
  onDeleteExpense: (billId: string) => Promise<void>;
  onBack: () => void;
}

export const GroupDashboard: React.FC<GroupDashboardProps> = ({
  group,
  bills,
  onAddExpenseManual,
  onScanExpense,
  onQuickAddExpense,
  onEditExpense,
  onDeleteExpense,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settle'>('expenses');
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<BillCategory | 'all'>('all');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detailedBalances = calculateDetailedBalances(bills);
  const categoryTotals = calculateCategoryTotals(bills);
  const transactions = calculateSettleUp(bills);
  
  const totalGroupSpentPaise = bills.reduce((sum, b) => {
    return sum + b.items.reduce((itemSum, item) => itemSum + item.totalPricePaise, 0);
  }, 0);

  // Filter bills by category if selected
  const filteredBills = selectedCategoryFilter === 'all' 
    ? bills 
    : bills.filter(b => (b.category || 'other') === selectedCategoryFilter);

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsActionSheetOpen(false);
      onScanExpense(file);
    }
    e.target.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsActionSheetOpen(false);
      onScanExpense(file);
    }
    e.target.value = '';
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f2f2f7] dark:bg-black text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Hidden file inputs for OCR scanning directly into group */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="bg-white dark:bg-[#1c1c1e] px-4 pt-5 pb-3 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onBack} 
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">{group.name}</h1>
              <p className="text-xs font-semibold text-slate-400">
                {group.members.length} members • {bills.length} bills
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#38383a] text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-2 rounded-xl active:scale-95 transition-all"
              title="Share Trip Report"
            >
              <Share2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Share</span>
            </button>

            <button
              onClick={() => setIsActionSheetOpen(true)}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Bill</span>
            </button>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-4 text-white flex flex-col justify-center items-center shadow-md mb-3 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <span className="text-white/80 text-[11px] font-bold uppercase tracking-wider block mb-0.5">Total Group Spend</span>
            <span className="text-3xl font-black tracking-tight">{formatMoney(totalGroupSpentPaise, group.currency)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 dark:bg-[#2c2c2e] p-1 rounded-xl">
          {(['expenses', 'balances', 'settle'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'settle' ? 'Settle Up' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          <div className="space-y-3 pb-24">
            {/* Category Breakdown Bar */}
            {bills.length > 0 && Object.keys(categoryTotals).length > 0 && (
              <div className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <PieChart className="w-3.5 h-3.5" />
                    <span>SPEND BY CATEGORY</span>
                  </div>
                  {selectedCategoryFilter !== 'all' && (
                    <button 
                      onClick={() => setSelectedCategoryFilter('all')}
                      className="text-[11px] font-bold text-brand-600 dark:text-brand-400"
                    >
                      Show All
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {BILL_CATEGORIES.map(cat => {
                    const total = categoryTotals[cat.id];
                    if (!total) return null;
                    const isSelected = selectedCategoryFilter === cat.id;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500'
                            : 'bg-slate-50 dark:bg-[#2c2c2e] border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label.split('&')[0].trim()}:</span>
                        <span className="font-extrabold">{formatMoney(total, group.currency)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Expenses List */}
            {bills.length === 0 ? (
              <div className="text-center py-12 px-6 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 mt-2">
                <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">No bills added yet</h3>
                <p className="text-xs text-slate-500 mb-5 max-w-xs mx-auto">
                  Scan a restaurant receipt, add a quick cab fare, or record drinks paid by friends.
                </p>
                <div className="flex flex-col gap-2 max-w-xs mx-auto">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan Receipt with Camera</span>
                  </button>
                  <button
                    onClick={() => setIsQuickExpenseOpen(true)}
                    className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#38383a] text-slate-800 dark:text-slate-200 font-bold py-3 px-4 rounded-xl text-sm active:scale-95 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-500 fill-current" />
                    <span>Quick Expense (Cab, Bar, etc.)</span>
                  </button>
                </div>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-xs font-semibold">No expenses in this category.</p>
                <button 
                  onClick={() => setSelectedCategoryFilter('all')}
                  className="mt-2 text-xs font-bold text-brand-600"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              filteredBills.map(bill => {
                const payer = group.members.find(m => m.id === bill.paidBy) || group.members[0];
                const catInfo = BILL_CATEGORIES.find(c => c.id === (bill.category || 'other')) || BILL_CATEGORIES[0];
                const billTotal = bill.items.reduce((sum, item) => sum + item.totalPricePaise, 0);

                return (
                  <div
                    key={bill.id}
                    className="w-full bg-white dark:bg-[#1c1c1e] p-3.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 group transition-all"
                  >
                    {/* Clickable Area to Edit */}
                    <button
                      onClick={() => onEditExpense(bill)}
                      className="flex items-center gap-3 flex-1 text-left min-w-0"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0 shadow-inner">
                        {catInfo.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-slate-900 dark:text-white truncate text-sm">
                            {bill.restaurantName || 'Untitled Bill'}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {catInfo.label.split('&')[0].trim()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                          <span>{bill.date}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            Paid by {payer?.name || 'Someone'}
                          </span>
                        </p>
                      </div>
                    </button>

                    {/* Amount & Delete */}
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {formatMoney(billTotal, bill.currency)}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${bill.restaurantName || 'this bill'}"?`)) {
                            onDeleteExpense(bill.id);
                          }
                        }}
                        title="Delete bill"
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* BALANCES TAB */}
        {activeTab === 'balances' && (
          <div className="space-y-3 pb-24">
            <div className="px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Member Balances
            </div>
            {group.members.map(member => {
              const details = detailedBalances[member.id] || { totalPaidPaise: 0, totalSharePaise: 0, netPaise: 0 };
              const net = details.netPaise;
              const isPositive = net > 0;
              const isNegative = net < 0;

              return (
                <div 
                  key={member.id} 
                  className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                      {member.avatar || '🧑‍💻'}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm block">
                        {member.name}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">
                        Paid {formatMoney(details.totalPaidPaise, group.currency)} • Share {formatMoney(details.totalSharePaise, group.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isPositive && <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Gets back</p>}
                    {isNegative && <p className="text-[11px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">Owes</p>}
                    {net === 0 && <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Settled</p>}
                    <p className={`font-black text-sm ${
                      isPositive ? 'text-emerald-600 dark:text-emerald-400' : 
                      isNegative ? 'text-rose-600 dark:text-rose-400' : 
                      'text-slate-400'
                    }`}>
                      {formatMoney(Math.abs(net), group.currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SETTLE UP TAB */}
        {activeTab === 'settle' && (
          <div className="space-y-3 pb-24">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Optimal Debt Payments
              </span>
              {transactions.length > 0 && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Settle-Up</span>
                </button>
              )}
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-slate-100 dark:border-slate-800 text-emerald-500">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-60" />
                <p className="font-bold text-base">All balances are settled!</p>
                <p className="text-xs text-slate-400 mt-1">Nobody owes any money in this trip.</p>
              </div>
            ) : (
              transactions.map((tx, idx) => {
                const from = group.members.find(m => m.id === tx.fromPersonId);
                const to = group.members.find(m => m.id === tx.toPersonId);
                if (!from || !to) return null;

                return (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg border border-rose-100 dark:border-rose-900/40">
                        {from.avatar || '🧑‍💻'}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                        {from.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-[2] px-2">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-sm mb-1">
                        {formatMoney(tx.amountPaise, group.currency)}
                      </span>
                      <div className="w-full flex items-center gap-1">
                        <div className="h-0.5 bg-slate-200 dark:bg-slate-700 flex-1" />
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="h-0.5 bg-slate-200 dark:bg-slate-700 flex-1" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 mt-1">pays</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg border border-emerald-100 dark:border-emerald-900/40">
                        {to.avatar || '🧑‍💻'}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                        {to.name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {transactions.length > 0 && (
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Settlement (WhatsApp, PDF, Image)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Expense Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setIsActionSheetOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-full pl-4 pr-5 py-3.5 font-bold shadow-floating flex items-center gap-2 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Add Expense Action Sheet Modal */}
      {isActionSheetOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setIsActionSheetOpen(false)}
        >
          <div 
            className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl p-5 space-y-3 animate-slideUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add Expense to {group.name}</h3>
                <p className="text-xs text-slate-400">Choose how to add this bill</p>
              </div>
              <button 
                onClick={() => setIsActionSheetOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {/* Quick Expense */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  setIsQuickExpenseOpen(true);
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Quick Expense</h4>
                  <p className="text-xs text-slate-500">Cab, bar drinks, snacks, entry tickets (10 seconds)</p>
                </div>
              </button>

              {/* Scan Camera */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 text-left hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Scan Receipt (Camera)</h4>
                  <p className="text-xs text-slate-500">Take a photo of restaurant or store bill</p>
                </div>
              </button>

              {/* Upload Receipt */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100 dark:hover:bg-[#38383a] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Upload Bill Image / PDF</h4>
                  <p className="text-xs text-slate-500">Select saved receipt photo or digital bill</p>
                </div>
              </button>

              {/* Itemized Manual Bill */}
              <button
                onClick={() => {
                  setIsActionSheetOpen(false);
                  onAddExpenseManual();
                }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-[#2c2c2e] border border-slate-200 dark:border-slate-800 text-left hover:bg-slate-100 dark:hover:bg-[#38383a] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-400 text-white flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Detailed Itemized Bill</h4>
                  <p className="text-xs text-slate-500">Type items, quantities, taxes, and custom shares</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Expense Modal */}
      {isQuickExpenseOpen && (
        <QuickExpenseModal
          isOpen={isQuickExpenseOpen}
          onClose={() => setIsQuickExpenseOpen(false)}
          currency={group.currency}
          members={group.members}
          groupId={group.id}
          onSaveExpense={onQuickAddExpense}
        />
      )}

      {/* Group Share Modal */}
      {isShareModalOpen && (
        <GroupShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          group={group}
          bills={bills}
        />
      )}
    </div>
  );
};
