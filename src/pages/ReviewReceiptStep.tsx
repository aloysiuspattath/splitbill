import React, { useState } from 'react';
import { Plus, Trash2, Edit3, ArrowRight, Store, Calendar, Check, AlertCircle } from 'lucide-react';
import { BillItem, CurrencyCode } from '../types';
import { formatMoney, toPaise, fromPaise } from '../utils/currency';

interface ReviewReceiptStepProps {
  restaurantName: string;
  onUpdateRestaurantName: (name: string) => void;
  date: string;
  onUpdateDate: (date: string) => void;
  currency: CurrencyCode;
  items: BillItem[];
  onUpdateItems: (items: BillItem[]) => void;
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

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5">
      {/* Step Header */}
      <div>
        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-1">
          Step 1 of 4
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Your Receipt
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Confirm your items before we split the bill
        </p>
      </div>

      {/* OCR confidence notice if any */}
      {ocrNotice && (
        <div className="p-3.5 rounded-[20px] bg-amber-50 dark:bg-[#2c2c2e] border border-amber-200/50 dark:border-transparent flex items-start gap-3 text-xs text-amber-800 dark:text-amber-400 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{ocrNotice}</span>
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

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between group p-3.5 bg-white dark:bg-[#2c2c2e] hover:bg-slate-50 dark:hover:bg-[#3c3c3e] rounded-[20px] shadow-sm border border-black/5 dark:border-transparent transition-all"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatMoney(item.unitPricePaise, currency)}
                      {item.quantity > 1 && <span className="text-brand-500 font-bold ml-1">x{item.quantity}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatMoney(item.totalPricePaise, currency)}
                    </span>

                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-4 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 font-bold text-sm border border-black/5 dark:border-transparent hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors"
        >
          Back
        </button>

        <button
          disabled={items.length === 0}
          onClick={onContinue}
          className="flex-1 py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-[0_8px_16px_rgb(37,99,235,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Continue to Friends</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
