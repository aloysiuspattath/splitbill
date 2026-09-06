import React from 'react';
import { Check, Users, Percent, DollarSign, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
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

    // Default mode is equal split
    const newAssignments = newAssigned.map(pid => {
      const existing = item.assignments?.find(a => a.personId === pid);
      return existing || { personId: pid, mode: 'equal' as SplitMode };
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

  // Set split mode for an item (equal, percentage, amount)
  const handleSetSplitMode = (item: BillItem, mode: SplitMode) => {
    const count = item.assignedPersonIds.length;
    if (count === 0) return;

    let newAssignments = [...(item.assignments || [])];

    if (mode === 'equal') {
      newAssignments = item.assignedPersonIds.map(pid => ({
        personId: pid,
        mode: 'equal',
      }));
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

          // Check custom validation if percentage or amount mode
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
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h3>
                    {assignedCount === 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Unassigned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {formatMoney(item.unitPricePaise, currency)}
                    {item.quantity > 1 && ` • ${item.quantity}x`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatMoney(item.totalPricePaise, currency)}
                  </span>
                  {assignedCount > 1 && (
                    <span className="block text-[11px] font-medium text-brand-600 dark:text-brand-400">
                      {currentMode === 'equal'
                        ? `~${formatMoney(Math.round(item.totalPricePaise / assignedCount), currency)} each`
                        : currentMode.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Friend Avatar Selection Pills */}
              <div className="pt-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Select Who Shared This:
                </p>

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
              </div>

              {/* Split Mode Selector (appears if 2+ people selected) */}
              {assignedCount > 1 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Split Mode:
                    </span>

                    <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#1c1c1e] rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleSetSplitMode(item, 'equal')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
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
                        onClick={() => handleSetSplitMode(item, 'percentage')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
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
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
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

                  {/* Advanced Configuration inputs if Percentage or Custom Amount */}
                  {currentMode !== 'equal' && (
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
