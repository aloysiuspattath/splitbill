import React from 'react';
import { Check, Users, Percent, DollarSign, ArrowRight, AlertCircle, Sparkles, PieChart, Scissors, Minus, Plus } from 'lucide-react';
import { BillItem, Person, SplitMode, CurrencyCode } from '../types';
import { formatMoney, fromPaise, toPaise } from '../utils/currency';

interface AssignStepProps {
  items: BillItem[];
  people: Person[];
  currency: CurrencyCode;
  onUpdateItems: (items: BillItem[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const AssignStep: React.FC<AssignStepProps> = ({
  items,
  people,
  currency,
  onUpdateItems,
  onContinue,
  onBack,
}) => {
  // Toggle person on an item
  const handleTogglePerson = (item: BillItem, personId: string) => {
    const isCurrentlyAssigned = item.assignedPersonIds.includes(personId);
    let newAssigned: string[];

    if (isCurrentlyAssigned) {
      newAssigned = item.assignedPersonIds.filter(id => id !== personId);
    } else {
      newAssigned = [...item.assignedPersonIds, personId];
    }

    const currentMode = item.assignments?.[0]?.mode || 'equal';

    const newAssignments = newAssigned.map(pid => {
      const existing = item.assignments?.find(a => a.personId === pid);
      if (existing) return existing;
      if (currentMode === 'shares') {
        return { personId: pid, mode: 'shares' as SplitMode, value: 1 };
      }
      return { personId: pid, mode: currentMode as SplitMode };
    });

    const updated = items.map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          assignedPersonIds: newAssigned,
          assignments: newAssignments,
        };
      }
      return it;
    });

    onUpdateItems(updated);
  };

  // Split an item with quantity > 1 into individual items of quantity 1
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

  // Set split mode for an item (equal, shares, percentage, amount)
  const handleSetSplitMode = (item: BillItem, mode: SplitMode) => {
    const count = item.assignedPersonIds.length;
    if (count === 0) return;

    let newAssignments = [...(item.assignments || [])];

    if (mode === 'equal') {
      newAssignments = item.assignedPersonIds.map(pid => ({
        personId: pid,
        mode: 'equal',
      }));
    } else if (mode === 'shares') {
      // Initialize 1 portion each by default
      newAssignments = item.assignedPersonIds.map(pid => {
        const existing = item.assignments?.find(a => a.personId === pid);
        return {
          personId: pid,
          mode: 'shares',
          value: existing?.mode === 'shares' && existing.value ? existing.value : 1,
        };
      });
    } else if (mode === 'percentage') {
      // Initialize equal percentages summing to 100
      const defaultPct = Math.floor(100 / count);
      const remainder = 100 - defaultPct * count;
      newAssignments = item.assignedPersonIds.map((pid, idx) => ({
        personId: pid,
        mode: 'percentage',
        value: idx === 0 ? defaultPct + remainder : defaultPct,
      }));
    } else if (mode === 'amount') {
      // Initialize equal amounts
      const defaultPaise = Math.floor(item.totalPricePaise / count);
      const remainder = item.totalPricePaise - defaultPaise * count;
      newAssignments = item.assignedPersonIds.map((pid, idx) => ({
        personId: pid,
        mode: 'amount',
        value: idx === 0 ? defaultPaise + remainder : defaultPaise,
      }));
    }

    const updated = items.map(it => {
      if (it.id === item.id) {
        return {
          ...it,
          assignments: newAssignments,
        };
      }
      return it;
    });

    onUpdateItems(updated);
  };

  // Quick action: Assign all items equally to everyone
  const handleAssignAllToEveryone = () => {
    const allPersonIds = people.map(p => p.id);
    const updated = items.map(it => ({
      ...it,
      assignedPersonIds: [...allPersonIds],
      assignments: allPersonIds.map(pid => ({ personId: pid, mode: 'equal' as SplitMode })),
    }));
    onUpdateItems(updated);
  };

  // Update specific assignment value (e.g. percentage or amount)
  const handleUpdateAssignmentValue = (itemId: string, personId: string, val: number) => {
    const updated = items.map(item => {
      if (item.id === itemId) {
        const assignments = (item.assignments || []).map(a => {
          if (a.personId === personId) {
            return { ...a, value: val };
          }
          return a;
        });
        return { ...item, assignments };
      }
      return item;
    });
    onUpdateItems(updated);
  };

  // Check how many items are unassigned
  const unassignedCount = items.filter(it => it.assignedPersonIds.length === 0).length;

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block mb-1">
            Step 3 of 4
          </span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Assign Items
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Tap friends to assign who ate each item
          </p>
        </div>

        {items.length > 1 && people.length > 1 && (
          <button
            onClick={handleAssignAllToEveryone}
            className="px-3 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs font-bold flex items-center gap-1 hover:bg-brand-100 transition-colors shadow-sm"
            title="Split all items equally with everyone"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Split All Equal</span>
          </button>
        )}
      </div>

      {/* Unassigned Warning Notice */}
      {unassignedCount > 0 && (
        <div className="p-3 rounded-[20px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              <strong>{unassignedCount}</strong> {unassignedCount === 1 ? 'item is' : 'items are'} unassigned.
            </span>
          </div>
        </div>
      )}

      {/* Item Assignment Cards */}
      <div className="space-y-3.5">
        {items.map(item => {
          const assignedCount = item.assignedPersonIds.length;
          const currentMode = item.assignments?.[0]?.mode || 'equal';

          // Check custom validation if percentage, amount, or shares mode
          let validationError: string | null = null;
          if (assignedCount > 1) {
            if (currentMode === 'percentage') {
              const totalPct = item.assignments?.reduce((sum, a) => sum + (a.value || 0), 0) || 0;
              if (totalPct !== 100) {
                validationError = `Percentages sum to ${totalPct}%, must equal 100%`;
              }
            } else if (currentMode === 'amount') {
              const totalAmtPaise = item.assignments?.reduce((sum, a) => sum + (a.value || 0), 0) || 0;
              if (totalAmtPaise !== item.totalPricePaise) {
                validationError = `Amounts sum to ${formatMoney(totalAmtPaise, currency)}, must equal ${formatMoney(item.totalPricePaise, currency)}`;
              }
            } else if (currentMode === 'shares') {
              const totalShares = item.assignments?.reduce((sum, a) => sum + (a.value || 0), 0) || 0;
              if (totalShares <= 0) {
                validationError = `Total portions must be greater than 0`;
              }
            }
          }

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-[#1c1c1e] rounded-[32px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border transition-all ${
                assignedCount === 0
                  ? 'border-amber-300/80 dark:border-amber-800/60'
                  : 'border-slate-100 dark:border-transparent'
              }`}
            >
              {/* Item Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h3>
                    {assignedCount === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {formatMoney(item.unitPricePaise, currency)}
                      {item.quantity > 1 && ` • ${item.quantity}x`}
                    </p>
                    {item.quantity > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSplitItem(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-600 dark:text-brand-400 text-[10px] font-extrabold transition-all border border-brand-200/60 dark:border-brand-800/60 active:scale-95 shadow-2xs"
                        title={`Split ${item.name} into ${item.quantity} separate items`}
                      >
                        <Scissors className="w-3 h-3 stroke-[2.5]" />
                        <span>Split into {item.quantity}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatMoney(item.totalPricePaise, currency)}
                  </span>
                  {assignedCount > 1 && (
                    <span className="block text-[11px] font-bold text-brand-600 dark:text-brand-400">
                      {currentMode === 'equal'
                        ? `~${formatMoney(Math.round(item.totalPricePaise / assignedCount), currency)} each`
                        : currentMode === 'shares'
                        ? 'PORTIONS'
                        : currentMode.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* "Who had this?" Dominant Interaction */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Who had this?</span>
                    {assignedCount === 0 && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 lowercase font-sans">
                        (tap friends below)
                      </span>
                    )}
                  </span>

                  {/* Quick per-item selectors */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = people.map(p => p.id);
                        const updated = items.map(it => {
                          if (it.id === item.id) {
                            return {
                              ...it,
                              assignedPersonIds: allIds,
                              assignments: allIds.map(pid => ({ personId: pid, mode: currentMode as SplitMode })),
                            };
                          }
                          return it;
                        });
                        onUpdateItems(updated);
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#2c2c2e] dark:hover:bg-[#3c3c3e] text-slate-700 dark:text-slate-300 transition-colors"
                      title="Assign this item to everyone"
                    >
                      All
                    </button>
                    {assignedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = items.map(it => {
                            if (it.id === item.id) {
                              return {
                                ...it,
                                assignedPersonIds: [],
                                assignments: [],
                              };
                            }
                            return it;
                          });
                          onUpdateItems(updated);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                        title="Clear selection for this item"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Friend Avatar Selection Pills */}
                <div className="flex flex-wrap gap-2">
                  {people.map(person => {
                    const isSelected = item.assignedPersonIds.includes(person.id);

                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handleTogglePerson(item, person.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[20px] text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 scale-[1.02]'
                            : 'bg-slate-100 dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <span className="text-sm">{person.avatar}</span>
                        <span>{person.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] ml-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Live Instant Cost Breakdown under item */}
                {assignedCount > 0 && (
                  <div className="mt-2.5 p-2.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-black/5 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        Live Split:
                      </span>
                      {item.assignedPersonIds.map(pid => {
                        const person = people.find(p => p.id === pid);
                        if (!person) return null;

                        let sharePaise = 0;
                        if (currentMode === 'equal') {
                          sharePaise = Math.round(item.totalPricePaise / assignedCount);
                        } else if (currentMode === 'shares') {
                          const asgn = item.assignments?.find(a => a.personId === pid);
                          const shares = asgn?.value !== undefined ? asgn.value : 1;
                          const totalShares = item.assignments?.reduce((sum, a) => sum + (a.value || 0), 0) || 1;
                          sharePaise = Math.round((item.totalPricePaise * shares) / totalShares);
                        } else if (currentMode === 'percentage') {
                          const asgn = item.assignments?.find(a => a.personId === pid);
                          const pct = asgn?.value !== undefined ? asgn.value : 0;
                          sharePaise = Math.round((item.totalPricePaise * pct) / 100);
                        } else if (currentMode === 'amount') {
                          const asgn = item.assignments?.find(a => a.personId === pid);
                          sharePaise = asgn?.value || 0;
                        }

                        return (
                          <span key={pid} className="font-semibold text-slate-700 dark:text-slate-200">
                            {person.name}: <strong className="text-brand-600 dark:text-brand-400 font-extrabold">{formatMoney(sharePaise, currency)}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Split Mode Selector (appears if 2+ people selected) */}
              {assignedCount > 1 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Split Mode:
                    </span>

                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#1c1c1e] rounded-xl overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => handleSetSplitMode(item, 'equal')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                          currentMode === 'equal'
                            ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>Equal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetSplitMode(item, 'shares')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                          currentMode === 'shares'
                            ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <PieChart className="w-3 h-3" />
                        <span>Portions</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetSplitMode(item, 'percentage')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                          currentMode === 'percentage'
                            ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        <span>% Share</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetSplitMode(item, 'amount')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 ${
                          currentMode === 'amount'
                            ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Amount</span>
                      </button>
                    </div>
                  </div>

                  {/* Configuration inputs if Portions mode */}
                  {currentMode === 'shares' && (
                    <div className="mt-2.5 p-3.5 rounded-[22px] bg-slate-50 dark:bg-[#1c1c1e]/80 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pb-1 border-b border-black/5 dark:border-white/5">
                        <span>Portion per person:</span>
                        <span className="text-brand-600 dark:text-brand-400 font-extrabold">
                          {(() => {
                            const totalPortions = item.assignments?.reduce((sum, a) => sum + (a.value || 0), 0) || 0;
                            return `${totalPortions} / ${item.quantity} portion${item.quantity > 1 ? 's' : ''}`;
                          })()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {item.assignedPersonIds.map(pid => {
                          const person = people.find(p => p.id === pid);
                          if (!person) return null;
                          const asgn = item.assignments?.find(a => a.personId === pid);
                          const currentVal = asgn?.value !== undefined ? asgn.value : 1;

                          return (
                            <div
                              key={pid}
                              className="flex items-center justify-between bg-white dark:bg-slate-800/90 p-2.5 rounded-[16px] shadow-2xs border border-black/5 dark:border-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base">{person.avatar}</span>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  {person.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Quick 0.5 chip */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAssignmentValue(item.id, pid, 0.5)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                                    currentVal === 0.5
                                      ? 'bg-brand-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="Half portion (0.5)"
                                >
                                  ½
                                </button>

                                {/* Quick 1 chip */}
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAssignmentValue(item.id, pid, 1)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                                    currentVal === 1
                                      ? 'bg-brand-600 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                  }`}
                                  title="1 full portion (1.0)"
                                >
                                  1
                                </button>

                                {/* Stepper [-] */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateAssignmentValue(
                                      item.id,
                                      pid,
                                      Math.max(0.5, Math.round((currentVal - 0.5) * 10) / 10)
                                    )
                                  }
                                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
                                  title="Decrease portion by 0.5"
                                >
                                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>

                                {/* Manual number input */}
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.1"
                                  value={currentVal}
                                  onChange={e =>
                                    handleUpdateAssignmentValue(
                                      item.id,
                                      pid,
                                      Math.max(0, parseFloat(e.target.value) || 0)
                                    )
                                  }
                                  className="w-12 py-1 text-center font-black text-xs bg-slate-50 dark:bg-slate-900/80 rounded-lg border border-black/5 dark:border-white/5 outline-none focus:ring-1 focus:ring-brand-500"
                                />

                                {/* Stepper [+] */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateAssignmentValue(
                                      item.id,
                                      pid,
                                      Math.round((currentVal + 0.5) * 10) / 10
                                    )
                                  }
                                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 active:scale-95 transition-transform"
                                  title="Increase portion by 0.5"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {validationError && (
                        <p className="text-[11px] font-bold text-rose-500 pt-1">
                          ⚠️ {validationError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Advanced Configuration inputs if Percentage or Custom Amount */}
                  {(currentMode === 'percentage' || currentMode === 'amount') && (
                    <div className="mt-2.5 p-3 rounded-[20px] bg-slate-50 dark:bg-[#1c1c1e]/80 space-y-2">
                      {item.assignedPersonIds.map(pid => {
                        const person = people.find(p => p.id === pid);
                        if (!person) return null;
                        const asgn = item.assignments?.find(a => a.personId === pid);

                        return (
                          <div key={pid} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              <span>{person.avatar}</span>
                              <span>{person.name}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {currentMode === 'percentage' ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={asgn?.value !== undefined ? asgn.value : 0}
                                    onChange={e =>
                                      handleUpdateAssignmentValue(
                                        item.id,
                                        pid,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 px-2 py-1 text-right font-bold text-xs bg-white dark:bg-slate-700 rounded-lg border border-black/5 dark:border-slate-600 outline-none"
                                  />
                                  <span className="font-bold text-slate-500">%</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-bold text-slate-500">{currency}</span>
                                  <input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={fromPaise(asgn?.value || 0, currency)}
                                    onChange={e =>
                                      handleUpdateAssignmentValue(
                                        item.id,
                                        pid,
                                        toPaise(e.target.value, currency)
                                      )
                                    }
                                    className="w-20 px-2 py-1 text-right font-bold text-xs bg-white dark:bg-slate-700 rounded-lg border border-black/5 dark:border-slate-600 outline-none"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {validationError && (
                        <p className="text-[11px] font-bold text-rose-500 pt-1">
                          ⚠️ {validationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
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
          <span>Continue to Taxes & Discounts</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
