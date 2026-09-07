import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ArrowRight, Store, Calendar, Check, AlertCircle, Scissors } from 'lucide-react';
import { BillItem, CurrencyCode, BillCategory, BILL_CATEGORIES, Person } from '../types';
import { formatMoney, toPaise, fromPaise } from '../utils/currency';

interface ReviewReceiptStepProps {
  restaurantName: string;
  onUpdateRestaurantName: (name: string) => void;
  date: string;
  onUpdateDate: (date: string) => void;
  currency: CurrencyCode;
  items: BillItem[];
  onUpdateItems: (items: BillItem[]) => void;
  category?: BillCategory;
  onUpdateCategory?: (category: BillCategory) => void;
  people?: Person[];
  paidBy?: string;
  onUpdatePaidBy?: (personId: string) => void;
  groupName?: string;
  onQuickSaveToGroup?: () => void;
  onContinue: () => void;
  onBack: () => void;
  ocrNotice?: string;
}

export const ReviewReceiptStep: React.FC<ReviewReceiptStepProps> = ({
  restaurantName,
  onUpdateRestaurantName,
  date,
  onUpdateDate,
  currency,
  items,
  onUpdateItems,
  category,
  onUpdateCategory,
  people,
  paidBy,
  onUpdatePaidBy,
  groupName,
  onQuickSaveToGroup,
  onContinue,
  onBack,
  ocrNotice,
}) => {
  // Editing state for an item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState('');

  // New item modal/form
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState('');

  const subtotalPaise = items.reduce((sum, it) => sum + it.totalPricePaise, 0);

  const handleStartEdit = (item: BillItem) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditQty(item.quantity);
    setEditPrice(fromPaise(item.unitPricePaise, currency).toString());
  };

  const handleSaveEdit = () => {
    if (!editingItemId) return;
    const unitPricePaise = toPaise(editPrice, currency);
    const qty = Math.max(1, editQty);
    const updated = items.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          name: editName.trim() || 'Item',
          quantity: qty,
          unitPricePaise,
          totalPricePaise: unitPricePaise * qty,
        };
      }
      return item;
    });
    onUpdateItems(updated);
    setEditingItemId(null);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter(it => it.id !== id));
  };

  const handleSplitItem = (itemToSplit: BillItem) => {
    if (itemToSplit.quantity <= 1) return;
    const count = Math.floor(itemToSplit.quantity);
    const unitPrice = itemToSplit.unitPricePaise;
    const baseName = itemToSplit.name.replace(/\s*x\s*\d+$/i, '').trim();

    const newItems: BillItem[] = Array.from({ length: count }, (_, i) => ({
      id: `item-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
      name: `${baseName} #${i + 1}`,
      quantity: 1,
      unitPricePaise: unitPrice,
      totalPricePaise: unitPrice,
      assignedPersonIds: [],
      assignments: [],
    }));

    const itemIndex = items.findIndex(it => it.id === itemToSplit.id);
    if (itemIndex === -1) return;

    const updated = [
      ...items.slice(0, itemIndex),
      ...newItems,
      ...items.slice(itemIndex + 1),
    ];
    onUpdateItems(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const unitPricePaise = toPaise(newPrice, currency);
    const qty = Math.max(1, newQty);
    const newItem: BillItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newName.trim(),
      quantity: qty,
      unitPricePaise,
      totalPricePaise: unitPricePaise * qty,
      assignedPersonIds: [],
      assignments: [],
    };
    onUpdateItems([...items, newItem]);
    setNewName('');
    setNewQty(1);
    setNewPrice('');
    setIsAddingItem(false);
  };

  const isItemSuspicious = (item: BillItem) => {
    if (item.unitPricePaise <= 0) return true;
    if (!item.name || item.name.trim().length <= 1) return true;
    if (/^[\d\W_]+$/.test(item.name.trim())) return true;
    return false;
  };

  const suspiciousItems = items.filter(isItemSuspicious);
  const suspiciousCount = suspiciousItems.length;

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5">
      {/* Group Trip Banner */}
      {groupName && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 text-white flex items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-200 block">
              Group Trip Bill
            </span>
            <p className="text-sm font-extrabold truncate">
              {groupName} • {people?.length || 0} members
            </p>
          </div>
          {onQuickSaveToGroup && items.length > 0 && (
            <button
              onClick={onQuickSaveToGroup}
              className="px-3 py-1.5 rounded-xl bg-white text-brand-600 font-black text-xs shadow-sm hover:bg-brand-50 active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Split Equally & Add</span>
            </button>
          )}
        </div>
      )}

      {/* Step Header */}
      <div>
        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-1">
          {groupName ? `Step 1 of 4 • ${groupName}` : 'Step 1 of 4'}
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Your Receipt
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Confirm your items before we split the bill
        </p>
      </div>

      {/* Intelligent Scan Confidence Summary */}
      {(ocrNotice || suspiciousCount > 0) && (
        <div className="p-4 rounded-[24px] bg-slate-50 dark:bg-[#222225] border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-sm text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-500 dark:text-slate-400">
              Receipt Scan Summary
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Scan Complete
            </span>
          </div>

          <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              {restaurantName ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Restaurant: <strong className="text-slate-900 dark:text-white">{restaurantName}</strong></span>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Restaurant name not detected (type above)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{items.length} {items.length === 1 ? 'item' : 'items'} detected</span>
              </span>
            </div>

            {suspiciousCount > 0 ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 font-bold mt-1">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{suspiciousCount} {suspiciousCount === 1 ? 'item needs' : 'items need'} checking</span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Highlighted below
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>All items have valid prices and names</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Receipt Card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent">
        
        {/* Restaurant Header */}
        <div className="flex flex-col items-center pb-6 pt-2">
          <div className="relative w-16 h-16 rounded-[24px] bg-gradient-to-br from-slate-100 to-slate-50 dark:from-[#2c2c2e] dark:to-[#1c1c1e] flex items-center justify-center mb-4 shadow-inner border border-white dark:border-white/5">
            <Store className="w-7 h-7 text-slate-700 dark:text-slate-300" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-[2.5px] border-white dark:border-[#1c1c1e]" />
          </div>
          
          <input
            type="text"
            value={restaurantName}
            onChange={e => onUpdateRestaurantName(e.target.value)}
            placeholder="Restaurant Name"
            className="w-full text-2xl sm:text-3xl font-black text-center text-slate-900 dark:text-white bg-transparent outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-colors"
          />
          
          <div className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 border border-black/5 dark:border-transparent">
            <Calendar className="w-3.5 h-3.5" />
            <input
              type="date"
              value={date}
              onChange={e => onUpdateDate(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold focus:outline-none cursor-pointer uppercase tracking-wider"
            />
          </div>
        </div>

        {/* Category & Payer Selection */}
        <div className="pb-4 mb-4 border-b border-dashed border-black/5 dark:border-white/5 space-y-3">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 text-center">
              Category
            </span>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {BILL_CATEGORIES.map(cat => {
                const isSelected = (category || 'food') === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onUpdateCategory?.(cat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-500 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#2c2c2e] border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label.split('&')[0].trim()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who Paid (if people provided) */}
          {people && people.length > 0 && onUpdatePaidBy && (
            <div className="bg-slate-50 dark:bg-[#2c2c2e]/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Who paid this bill?
                </span>
                <select
                  value={paidBy || people[0]?.id || ''}
                  onChange={e => onUpdatePaidBy(e.target.value)}
                  className="bg-white dark:bg-[#1c1c1e] text-slate-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Section Heading */}
        <div className="flex items-center justify-between pb-2 px-1 border-b border-dashed border-black/5 dark:border-white/5 mb-3">
          <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Receipt Items
          </span>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-black/30 px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Items List Container */}
        <div className="bg-slate-50/50 dark:bg-black/20 rounded-[24px] p-2 space-y-1.5">
          {items.length === 0 ? (
            <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
              Receipt is empty. <br/>Tap below to add your first item.
            </div>
          ) : (
            items.map((item) => {
              const isEditing = editingItemId === item.id;

              if (isEditing) {
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-[20px] bg-white dark:bg-[#2c2c2e] border-2 border-brand-500/40 shadow-sm space-y-2 animate-fadeIn"
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Item name"
                      className="w-full text-sm font-bold bg-slate-50 dark:bg-black/30 px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={editQty}
                          onChange={e => setEditQty(parseInt(e.target.value) || 1)}
                          className="w-full text-xs font-bold bg-slate-50 dark:bg-black/30 px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">Price</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 dark:bg-black/30 px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-black/30 rounded-[12px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-[11px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] flex items-center gap-1.5 shadow-[0_4px_12px_rgb(37,99,235,0.2)]"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              const isSuspicious = isItemSuspicious(item);

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between group p-3.5 rounded-[20px] shadow-sm transition-all ${
                    isSuspicious
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300/80 dark:border-amber-700/70'
                      : 'bg-white dark:bg-[#2c2c2e] hover:bg-slate-50 dark:hover:bg-[#3c3c3e] border border-black/5 dark:border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                        {item.name}
                      </p>
                      {isSuspicious && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 shrink-0">
                          ⚠️ Check
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatMoney(item.unitPricePaise, currency)}
                      {item.quantity > 1 && <span className="text-brand-500 font-bold ml-1">x{item.quantity}</span>}
                    </p>
                    {item.quantity > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSplitItem(item)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 text-xs font-bold transition-all shadow-xs border border-brand-200/60 dark:border-brand-800/60"
                        title={`Split ${item.name} into ${item.quantity} individual single items`}
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Split into {item.quantity} items (#1…#{item.quantity})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatMoney(item.totalPricePaise, currency)}
                    </span>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.quantity > 1 && (
                        <button
                          onClick={() => handleSplitItem(item)}
                          className="p-2 rounded-[12px] text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-[#1c1c1e] transition-colors"
                          title={`Split into ${item.quantity} individual items`}
                        >
                          <Scissors className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-2 rounded-[12px] text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-[#1c1c1e] transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-[12px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#1c1c1e] transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Add Item Trigger / Form */}
          {isAddingItem ? (
            <form
              onSubmit={handleAddItem}
              className="p-3.5 rounded-[20px] bg-brand-50 dark:bg-black/30 border border-brand-200/50 dark:border-transparent space-y-2 animate-fadeIn mt-2"
            >
              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1 pl-1">
                New Item
              </h4>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Item name (e.g. Burger)"
                autoFocus
                className="w-full text-sm font-bold bg-white dark:bg-[#2c2c2e] px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <div className="flex items-center gap-2">
                <div className="w-20">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={newQty}
                    onChange={e => setNewQty(parseInt(e.target.value) || 1)}
                    className="w-full text-xs font-bold bg-white dark:bg-[#2c2c2e] px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block pl-1">Price</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-xs font-bold bg-white dark:bg-[#2c2c2e] px-3 py-2 rounded-[14px] border border-black/5 dark:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white/50 dark:bg-[#2c2c2e]/50 rounded-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-[11px] font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] shadow-[0_4px_12px_rgb(37,99,235,0.2)]"
                >
                  Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingItem(true)}
              className="w-full py-3.5 mt-2 rounded-[20px] bg-white dark:bg-[#2c2c2e] border border-black/5 dark:border-transparent hover:border-brand-300 dark:hover:bg-[#3c3c3e] text-slate-600 dark:text-slate-300 hover:text-brand-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Add Item Manually</span>
            </button>
          )}
        </div>

        {/* Subtotal Row */}
        <div className="flex justify-between items-center pt-5 pb-1 px-2">
          <span className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Subtotal
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {formatMoney(subtotalPaise, currency)}
          </span>
        </div>
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="pt-2 flex flex-col gap-2.5">
        {groupName && onQuickSaveToGroup && items.length > 0 && (
          <button
            onClick={onQuickSaveToGroup}
            className="w-full py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-[0_8px_20px_rgb(37,99,235,0.3)] flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>Split Equally & Add to {groupName}</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-5 py-3.5 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm border border-black/5 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors"
          >
            {groupName ? 'Cancel' : 'Back'}
          </button>

          <button
            disabled={items.length === 0}
            onClick={onContinue}
            className={`flex-1 py-3.5 px-6 rounded-[20px] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all ${
              groupName && onQuickSaveToGroup
                ? 'bg-slate-100 dark:bg-[#2c2c2e] hover:bg-slate-200 dark:hover:bg-[#38383a] text-slate-800 dark:text-slate-200'
                : 'bg-brand-600 hover:bg-brand-700 text-white shadow-[0_8px_16px_rgb(37,99,235,0.25)]'
            }`}
          >
            <span>{groupName ? 'Customize Item Splits' : 'Continue to Friends'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
