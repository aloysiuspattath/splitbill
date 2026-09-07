import React, { useState } from 'react';
import { Bill, BillCategory, BILL_CATEGORIES, CurrencyCode, Person } from '../types';
import { formatMoney, toPaise } from '../utils/currency';
import { X, Check, Zap } from 'lucide-react';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  members: Person[];
  groupId: string;
  onSaveExpense: (bill: Bill) => Promise<void>;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  members,
  groupId,
  onSaveExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<BillCategory>('transport');
  const [paidBy, setPaidBy] = useState<string>(members[0]?.id || '');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map(m => m.id));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length === 1) return; // Must have at least one person
      setSelectedMemberIds(selectedMemberIds.filter(mId => mId !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const selectAllMembers = () => {
    setSelectedMemberIds(members.map(m => m.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountPaise = toPaise(amountInput, currency);
    if (!amountPaise || amountPaise <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!paidBy) {
      alert('Please select who paid this expense');
      return;
    }

    if (selectedMemberIds.length === 0) {
      alert('Please select at least one person sharing this expense');
      return;
    }

    const expenseTitle = title.trim() || BILL_CATEGORIES.find(c => c.id === category)?.label || 'Quick Expense';

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      restaurantName: expenseTitle,
      date: new Date().toISOString().split('T')[0],
      currency,
      category,
      groupId,
      paidBy,
      people: members,
      items: [
        {
          id: `item-${Date.now()}`,
          name: expenseTitle,
          quantity: 1,
          unitPricePaise: amountPaise,
          totalPricePaise: amountPaise,
          assignedPersonIds: selectedMemberIds,
          assignments: selectedMemberIds.map(id => ({ personId: id, mode: 'equal' })),
        },
      ],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      setIsSaving(true);
      await onSaveExpense(newBill);
      onClose();
      // Reset form
      setTitle('');
      setAmountInput('');
      setCategory('transport');
      setSelectedMemberIds(members.map(m => m.id));
    } catch (err) {
      console.error('Failed to save quick expense:', err);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const amountPaise = toPaise(amountInput, currency);
  const perPersonPaise = selectedMemberIds.length > 0 && amountPaise > 0 
    ? Math.round(amountPaise / selectedMemberIds.length) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Expense</h2>
              <p className="text-xs text-slate-500">Cab, drinks, snacks & quick payments</p>
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Category Selector */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2">
              {BILL_CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl text-center border transition-all ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#2c2c2e]/60 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2c2c2e]'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.emoji}</span>
                    <span className="text-[11px] font-bold truncate max-w-full leading-tight">
                      {cat.label.split('&')[0].trim()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Title */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Total Amount ({currency})
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  onChange={e => setAmountInput(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full bg-slate-100 dark:bg-[#2c2c2e] text-slate-900 dark:text-white px-4 py-3.5 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-brand-500 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                Note / Description (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={category === 'transport' ? 'e.g. Airport Uber' : category === 'bar' ? 'e.g. Drinks at Pub' : 'e.g. Snacks, Groceries'}
                className="w-full bg-slate-100 dark:bg-[#2c2c2e] text-slate-900 dark:text-white px-4 py-3 rounded-2xl font-semibold outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Who Paid */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Who paid this bill?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {members.map(member => {
                const isPayer = paidBy === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPaidBy(member.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isPayer
                        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20 font-bold'
                        : 'bg-slate-50 dark:bg-[#2c2c2e]/60 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="text-xl">{member.avatar || '👤'}</span>
                    <span className="text-sm truncate flex-1">{member.name}</span>
                    {isPayer && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split With Whom */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Split With ({selectedMemberIds.length} of {members.length})
              </label>
              {selectedMemberIds.length < members.length && (
                <button
                  type="button"
                  onClick={selectAllMembers}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Select Everyone
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              {members.map(member => {
                const isIncluded = selectedMemberIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    className={`w-full flex items-center justify-between p-2.5 px-3.5 rounded-xl border transition-all text-left ${
                      isIncluded
                        ? 'bg-slate-50 dark:bg-[#2c2c2e] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                        : 'bg-transparent border-dashed border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{member.avatar || '👤'}</span>
                      <span className="text-sm font-semibold">{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isIncluded && perPersonPaise > 0 && (
                        <span className="text-xs font-bold text-slate-500">
                          {formatMoney(perPersonPaise, currency)}
                        </span>
                      )}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isIncluded 
                          ? 'bg-brand-600 border-brand-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isIncluded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#1c1c1e] flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-xs text-slate-400 block font-medium">Split share</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {perPersonPaise > 0 ? `${formatMoney(perPersonPaise, currency)} / person` : '—'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !amountInput || toPaise(amountInput, currency) <= 0}
            className="flex-1 max-w-[200px] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3.5 px-5 rounded-2xl active:scale-95 transition-all shadow-md shadow-brand-500/25 flex items-center justify-center gap-2"
          >
            {isSaving ? 'Saving...' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};
