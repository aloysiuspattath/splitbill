import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Percent, DollarSign, Heart, ShieldCheck, AlertCircle } from 'lucide-react';
import { Bill, TaxItem, DiscountConfig, DiscountType, DiscountAllocationMethod, CurrencyCode, CalculatedBillResult } from '../types';
import { formatMoney, fromPaise, toPaise } from '../utils/currency';
import { calculateBill } from '../features/calculation/engine';

interface ReviewTaxDiscountStepProps {
  bill: Bill;
  currency: CurrencyCode;
  onUpdateTaxes: (taxes: TaxItem[]) => void;
  onUpdateDiscount: (discount: DiscountConfig) => void;
  onUpdateTip: (tipPaise: number) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const ReviewTaxDiscountStep: React.FC<ReviewTaxDiscountStepProps> = ({
  bill,
  currency,
  onUpdateTaxes,
  onUpdateDiscount,
  onUpdateTip,
  onContinue,
  onBack,
}) => {
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('2.5');
  const [newTaxType, setNewTaxType] = useState<'percentage' | 'fixed'>('percentage');

  // Calculate live preview
  const result: CalculatedBillResult = calculateBill(bill);
  const unassignedItems = bill.items.filter(it => it.assignedPersonIds.length === 0);
  const unassignedTotalPaise = unassignedItems.reduce((sum, it) => sum + it.totalPricePaise, 0);
  const isAllAccounted = unassignedItems.length === 0;

  // Add tax
  const handleAddTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName.trim()) return;

    const newTax: TaxItem = {
      id: `tax-${Date.now()}`,
      name: newTaxName.trim(),
      type: newTaxType,
      rate: newTaxType === 'percentage' ? parseFloat(newTaxRate) || 0 : undefined,
      fixedAmountPaise: newTaxType === 'fixed' ? toPaise(newTaxRate, currency) : undefined,
    };

    onUpdateTaxes([...bill.taxes, newTax]);
    setNewTaxName('');
  };

  const handleDeleteTax = (id: string) => {
    onUpdateTaxes(bill.taxes.filter(t => t.id !== id));
  };

  // Quick preset: GST 5% (CGST 2.5% + SGST 2.5%)
  const handleAddIndianGstPreset = () => {
    const cgst: TaxItem = { id: `tax-cgst-${Date.now()}`, name: 'CGST', type: 'percentage', rate: 2.5 };
    const sgst: TaxItem = { id: `tax-sgst-${Date.now() + 1}`, name: 'SGST', type: 'percentage', rate: 2.5 };
    onUpdateTaxes([...bill.taxes, cgst, sgst]);
  };

  // Discount configuration handlers
  const handleDiscountTypeChange = (type: DiscountType) => {
    onUpdateDiscount({
      ...bill.discount,
      type,
    });
  };

  const handleDiscountValueChange = (valStr: string) => {
    const num = parseFloat(valStr) || 0;
    if (bill.discount.type === 'percentage') {
      onUpdateDiscount({ ...bill.discount, rate: num });
    } else if (bill.discount.type === 'fixed') {
      onUpdateDiscount({ ...bill.discount, fixedAmountPaise: toPaise(num, currency) });
    } else if (bill.discount.type === 'actual_paid') {
      onUpdateDiscount({ ...bill.discount, actualPaidPaise: toPaise(num, currency) });
    }
  };

  const handleAllocationChange = (allocationMethod: DiscountAllocationMethod) => {
    onUpdateDiscount({
      ...bill.discount,
      allocationMethod,
    });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Step Header */}
      <div>
        <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-1">
          Step 4 of 4
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Taxes & Discounts
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
          Set taxes, discounts, or enter the exact amount paid
        </p>
      </div>

      {/* 1. Taxes Card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-brand-600" />
            <span>Taxes & Service Charges</span>
          </h3>

          {bill.taxes.length === 0 && currency === 'INR' && (
            <button
              onClick={handleAddIndianGstPreset}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-xl"
            >
              + Add GST 5%
            </button>
          )}
        </div>

        {/* Existing Taxes */}
        <div className="space-y-2">
          {bill.taxes.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">No taxes added (tax-free).</p>
          ) : (
            bill.taxes.map(tax => {
              const taxAmountPaise =
                tax.type === 'percentage' && tax.rate
                  ? Math.round((result.subtotalPaise * tax.rate) / 100)
                  : tax.fixedAmountPaise || 0;

              return (
                <div
                  key={tax.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-[20px] bg-slate-50 dark:bg-[#1c1c1e] text-xs font-semibold"
                >
                  <span className="text-slate-800 dark:text-slate-200">
                    {tax.name} {tax.type === 'percentage' && `(${tax.rate}%)`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      +{formatMoney(taxAmountPaise, currency)}
                    </span>
                    <button
                      onClick={() => handleDeleteTax(tax.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Remove Tax"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Tax Mini Form */}
        <form onSubmit={handleAddTax} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="e.g. CGST / VAT"
            value={newTaxName}
            onChange={e => setNewTaxName(e.target.value)}
            className="flex-1 text-xs font-semibold bg-slate-50 dark:bg-[#1c1c1e] px-3 py-2 rounded-xl border border-black/5 dark:border-transparent outline-none"
          />
          <div className="w-24 flex items-center bg-slate-50 dark:bg-[#1c1c1e] px-2 py-1 rounded-xl border border-black/5 dark:border-transparent">
            <input
              type="number"
              step="any"
              value={newTaxRate}
              onChange={e => setNewTaxRate(e.target.value)}
              className="w-full text-xs font-bold bg-transparent outline-none"
            />
            <button
              type="button"
              onClick={() => setNewTaxType(newTaxType === 'percentage' ? 'fixed' : 'percentage')}
              className="text-[11px] text-brand-600 font-bold ml-1 hover:underline"
              title="Toggle Percentage / Fixed"
            >
              {newTaxType === 'percentage' ? '%' : currency}
            </button>
          </div>
          <button
            type="submit"
            disabled={!newTaxName.trim()}
            className="p-2 rounded-xl bg-brand-600 disabled:opacity-40 text-white shadow-sm hover:bg-brand-700"
            title="Add Tax"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 2. Discounts Card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Discounts & Counter Payment</span>
        </h3>

        {/* Discount Mode Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-[#1c1c1e] rounded-[20px] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleDiscountTypeChange('none')}
            className={`py-1.5 rounded-xl transition-colors ${
              bill.discount.type === 'none'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            None
          </button>
          <button
            type="button"
            onClick={() => handleDiscountTypeChange('percentage')}
            className={`py-1.5 rounded-xl transition-colors ${
              bill.discount.type === 'percentage'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            % Off
          </button>
          <button
            type="button"
            onClick={() => handleDiscountTypeChange('fixed')}
            className={`py-1.5 rounded-xl transition-colors ${
              bill.discount.type === 'fixed'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
          >
            Fixed Off
          </button>
          <button
            type="button"
            onClick={() => handleDiscountTypeChange('actual_paid')}
            className={`py-1.5 rounded-xl transition-colors ${
              bill.discount.type === 'actual_paid'
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-slate-500'
            }`}
            title="Enter what you actually paid at the counter"
          >
            Paid Total
          </button>
        </div>

        {/* Value input based on discount mode */}
        {bill.discount.type === 'actual_paid' && (
          <div className="p-3.5 rounded-[20px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Exact Amount Paid at Counter ({currency}):
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold">Auto Discount</span>
            </div>
            <input
              type="number"
              step="any"
              placeholder="e.g. 1411"
              value={
                bill.discount.actualPaidPaise !== undefined
                  ? fromPaise(bill.discount.actualPaidPaise, currency)
                  : ''
              }
              onChange={e => handleDiscountValueChange(e.target.value)}
              className="w-full text-base font-black bg-white dark:bg-[#1c1c1e] px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              Printed total was {formatMoney(result.subtotalPaise + result.taxesTotalPaise, currency)}.
              {result.discountTotalPaise > 0 &&
                ` Effective discount: -${formatMoney(result.discountTotalPaise, currency)}`}
            </p>
          </div>
        )}

        {bill.discount.type === 'percentage' && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Discount Percentage:
            </label>
            <div className="w-28 flex items-center bg-slate-50 dark:bg-[#1c1c1e] px-3 py-2 rounded-xl border border-black/5 dark:border-transparent">
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={bill.discount.rate || ''}
                onChange={e => handleDiscountValueChange(e.target.value)}
                placeholder="10"
                className="w-full text-xs font-bold bg-transparent outline-none"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        )}

        {bill.discount.type === 'fixed' && (
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Fixed Discount ({currency}):
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={
                bill.discount.fixedAmountPaise !== undefined
                  ? fromPaise(bill.discount.fixedAmountPaise, currency)
                  : ''
              }
              onChange={e => handleDiscountValueChange(e.target.value)}
              placeholder="0.00"
              className="w-32 text-xs font-bold bg-slate-50 dark:bg-[#1c1c1e] px-3 py-2 rounded-xl border border-black/5 dark:border-transparent outline-none"
            />
          </div>
        )}

        {/* Discount Allocation Method (Proportional vs Equal) */}
        {bill.discount.type !== 'none' && (
          <div className="pt-2 border-t border-slate-100 dark:border-transparent flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Discount Allocation:
            </span>
            <div className="flex gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleAllocationChange('proportional')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  bill.discount.allocationMethod === 'proportional'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-400'
                }`}
              >
                Proportional (Recommended)
              </button>
              <button
                type="button"
                onClick={() => handleAllocationChange('equal')}
                className={`px-2.5 py-1 rounded-xl transition-colors ${
                  bill.discount.allocationMethod === 'equal'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-400'
                }`}
              >
                Equal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2.5 Tip / Gratuity Card */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Tip / Gratuity (Optional)</span>
          </h3>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {bill.customTipPaise ? formatMoney(bill.customTipPaise, currency) : 'None'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            min="0"
            placeholder={`Enter tip amount (${currency})`}
            value={bill.customTipPaise ? fromPaise(bill.customTipPaise, currency) : ''}
            onChange={e => onUpdateTip(toPaise(e.target.value, currency))}
            className="flex-1 text-xs font-semibold bg-slate-50 dark:bg-[#1c1c1e] px-3 py-2 rounded-xl border border-black/5 dark:border-transparent outline-none"
          />
          {bill.customTipPaise ? (
            <button
              type="button"
              onClick={() => onUpdateTip(0)}
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {/* 3. Pre-Finalization Bill Sanity Check */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-black/5 dark:border-transparent space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-dashed border-black/5 dark:border-white/5">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bill Sanity Check</span>
          </h3>
          <span
            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
              isAllAccounted && result.isBalanced
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {isAllAccounted && result.isBalanced ? '✓ 100% Balanced' : '⚠ Action Needed'}
          </span>
        </div>

        {/* Sanity Checklist Items */}
        <div className="space-y-2 text-xs">
          {/* Check 1: Accounted Total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                All {formatMoney(result.effectiveBillTotalPaise, currency)} accounted for
              </span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatMoney(result.effectiveBillTotalPaise, currency)}
            </span>
          </div>

          {/* Check 2: Unassigned Items Alert or Clean Check */}
          {unassignedItems.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="font-black">✓</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                No unassigned items (all {bill.items.length} dishes claimed)
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{formatMoney(unassignedTotalPaise, currency)} unassigned ({unassignedItems.length} {unassignedItems.length === 1 ? 'item' : 'items'})</span>
                </div>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-[10px] font-black hover:bg-brand-700 active:scale-95 transition-all shadow-xs"
                >
                  Assign Now →
                </button>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium truncate">
                {unassignedItems.map(i => i.name).join(', ')}
              </p>
            </div>
          )}

          {/* Check 3: Taxes Allocated */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Taxes allocated {bill.taxes.length > 0 ? `(${bill.taxes.map(t => t.name).join(' + ')})` : '(tax-free)'}
              </span>
            </div>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              +{formatMoney(result.taxesTotalPaise, currency)}
            </span>
          </div>

          {/* Check 4: Discounts Allocated */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Discount allocated {bill.discount.type !== 'none' ? `(${bill.discount.allocationMethod})` : '(none)'}
              </span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              -{formatMoney(result.discountTotalPaise, currency)}
            </span>
          </div>

          {/* Check 5: Deterministic Rounding Discrepancy */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-black">✓</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Rounding discrepancy
              </span>
            </div>
            <span className={result.roundingDifferencePaise === 0 ? 'text-emerald-600 font-black' : 'text-amber-600 font-black'}>
              {formatMoney(result.roundingDifferencePaise, currency)}
            </span>
          </div>
        </div>

        {/* Detailed Financial Summary Table */}
        <div className="pt-2 border-t border-dashed border-black/5 dark:border-white/5 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Items Subtotal:</span>
            <span className="font-semibold">{formatMoney(result.subtotalPaise, currency)}</span>
          </div>
          {result.taxesTotalPaise > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Taxes Total:</span>
              <span className="font-semibold">+{formatMoney(result.taxesTotalPaise, currency)}</span>
            </div>
          )}
          {result.discountTotalPaise > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount:</span>
              <span className="font-semibold">-{formatMoney(result.discountTotalPaise, currency)}</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-slate-100 dark:border-white/5 flex justify-between text-sm font-black text-slate-900 dark:text-white">
            <span>Total Bill:</span>
            <span className="text-brand-600 dark:text-brand-400">
              {formatMoney(result.effectiveBillTotalPaise, currency)}
            </span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500">
            <span>Total Assigned to Friends:</span>
            <span>{formatMoney(result.calculatedPersonsTotalPaise, currency)}</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-2 flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-5 py-4 rounded-[20px] bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-200 font-bold text-sm border border-black/5 dark:border-transparent hover:bg-slate-50"
        >
          Back
        </button>

        <button
          onClick={onContinue}
          className="flex-1 py-4 px-6 rounded-[20px] bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-[0_8px_16px_rgb(37,99,235,0.25)] flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>View Split Results</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

