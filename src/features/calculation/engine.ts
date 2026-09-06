import { Bill, BillItem, CalculatedBillResult, PersonShareResult } from '../../types';
import { distributeIntegerPaise } from './rounding';

/**
 * Calculates item-level shares for each person.
 */
function calculateItemAssignments(
  item: BillItem,
  personMap: Map<string, PersonShareResult>
): void {
  const { assignedPersonIds, assignments, totalPricePaise, name, id, quantity } = item;

  if (!assignedPersonIds || assignedPersonIds.length === 0) {
    return; // unassigned
  }

  // Filter only valid people that currently exist in bill
  const validPersonIds = assignedPersonIds.filter(pid => personMap.has(pid));
  if (validPersonIds.length === 0) return;

  // Determine split mode from assignments if specified, or default to equal
  const firstAssignment = assignments?.find(a => validPersonIds.includes(a.personId));
  const mode = firstAssignment?.mode || 'equal';

  if (mode === 'equal') {
    const shares = distributeIntegerPaise(
      totalPricePaise,
      new Array(validPersonIds.length).fill(1),
      validPersonIds
    );

    validPersonIds.forEach((pid, idx) => {
      const share = shares[idx];
      const person = personMap.get(pid)!;
      person.itemsSharePaise += share;
      person.assignedItems.push({
        itemId: id,
        itemName: name,
        quantity,
        mode: 'equal',
        sharePaise: share,
        details: validPersonIds.length > 1 ? `Split equally among ${validPersonIds.length}` : undefined,
      });
    });
  } else if (mode === 'percentage') {
    // Collect percentages
    const weights = validPersonIds.map(pid => {
      const asgn = assignments?.find(a => a.personId === pid);
      return asgn?.value !== undefined && asgn.value > 0 ? asgn.value : 0;
    });

    const shares = distributeIntegerPaise(totalPricePaise, weights, validPersonIds);

    validPersonIds.forEach((pid, idx) => {
      const share = shares[idx];
      const person = personMap.get(pid)!;
      person.itemsSharePaise += share;
      person.assignedItems.push({
        itemId: id,
        itemName: name,
        quantity,
        mode: 'percentage',
        sharePaise: share,
        details: `${weights[idx]}% share`,
      });
    });
  } else if (mode === 'shares') {
    // Split by portions / shares (e.g. 0.5, 1, 1.5, 2)
    const weights = validPersonIds.map(pid => {
      const asgn = assignments?.find(a => a.personId === pid);
      return asgn?.value !== undefined && asgn.value > 0 ? asgn.value : 0;
    });

    const totalShares = weights.reduce((sum, w) => sum + w, 0);
    const effectiveWeights = totalShares > 0 ? weights : new Array(validPersonIds.length).fill(1);
    const divisor = totalShares > 0 ? totalShares : validPersonIds.length;

    const shares = distributeIntegerPaise(totalPricePaise, effectiveWeights, validPersonIds);

    validPersonIds.forEach((pid, idx) => {
      const share = shares[idx];
      const person = personMap.get(pid)!;
      person.itemsSharePaise += share;
      const portionCount = totalShares > 0 ? weights[idx] : 1;
      person.assignedItems.push({
        itemId: id,
        itemName: name,
        quantity,
        mode: 'shares',
        sharePaise: share,
        details: `${portionCount} of ${divisor} portion${divisor === 1 ? '' : 's'}`,
      });
    });
  } else if (mode === 'amount') {
    // Custom amounts in paise
    validPersonIds.forEach(pid => {
      const asgn = assignments?.find(a => a.personId === pid);
      const share = asgn?.value !== undefined ? Math.round(asgn.value) : 0;
      const person = personMap.get(pid)!;
      person.itemsSharePaise += share;
      person.assignedItems.push({
        itemId: id,
        itemName: name,
        quantity,
        mode: 'amount',
        sharePaise: share,
        details: 'Custom amount',
      });
    });
  }
}

/**
 * Main deterministic calculation engine for SplitBill.
 * Runs completely locally using integer paise arithmetic.
 */
export function calculateBill(bill: Bill): CalculatedBillResult {
  // 1. Initialize person results
  const personMap = new Map<string, PersonShareResult>();
  (bill.people || []).forEach(p => {
    personMap.set(p.id, {
      personId: p.id,
      personName: p.name,
      avatar: p.avatar,
      color: p.color,
      itemsSharePaise: 0,
      taxSharePaise: 0,
      discountSharePaise: 0,
      tipSharePaise: 0,
      roundingAdjustmentPaise: 0,
      totalPaise: 0,
      assignedItems: [],
    });
  });

  // 2. Compute item subtotal & unassigned items
  let subtotalPaise = 0;
  const unassignedItems: BillItem[] = [];

  (bill.items || []).forEach(item => {
    const itemTotal = item.totalPricePaise || item.quantity * item.unitPricePaise;
    subtotalPaise += itemTotal;

    const validAssigned = item.assignedPersonIds?.filter(pid => personMap.has(pid)) || [];
    if (validAssigned.length === 0) {
      unassignedItems.push(item);
    } else {
      calculateItemAssignments(item, personMap);
    }
  });

  const assignedSubtotalPaise = Array.from(personMap.values()).reduce(
    (sum, p) => sum + p.itemsSharePaise,
    0
  );
  const unassignedSubtotalPaise = subtotalPaise - assignedSubtotalPaise;

  // 3. Compute taxes
  let taxesTotalPaise = 0;
  (bill.taxes || []).forEach(tax => {
    if (tax.type === 'percentage' && tax.rate) {
      taxesTotalPaise += Math.round((subtotalPaise * tax.rate) / 100);
    } else if (tax.type === 'fixed' && tax.fixedAmountPaise) {
      taxesTotalPaise += Math.round(tax.fixedAmountPaise);
    }
  });

  // 4. Compute pre-discount bill total
  const preDiscountBillTotalPaise = subtotalPaise + taxesTotalPaise;

  // 5. Compute discount
  let discountTotalPaise = 0;
  const discountConfig = bill.discount || { type: 'none', allocationMethod: 'proportional' };

  if (discountConfig.type === 'percentage' && discountConfig.rate) {
    discountTotalPaise = Math.round((subtotalPaise * discountConfig.rate) / 100);
  } else if (discountConfig.type === 'fixed' && discountConfig.fixedAmountPaise) {
    discountTotalPaise = Math.round(discountConfig.fixedAmountPaise);
  } else if (discountConfig.type === 'actual_paid' && discountConfig.actualPaidPaise !== undefined) {
    // Effective discount is difference between printed bill and amount actually paid
    if (discountConfig.actualPaidPaise < preDiscountBillTotalPaise) {
      discountTotalPaise = preDiscountBillTotalPaise - discountConfig.actualPaidPaise;
    }
  }

  // Ensure discount cannot exceed pre-discount total
  discountTotalPaise = Math.min(discountTotalPaise, preDiscountBillTotalPaise);

  // Tip
  const tipTotalPaise = bill.customTipPaise || 0;

  // 6. Effective grand total of the bill
  const effectiveBillTotalPaise = preDiscountBillTotalPaise - discountTotalPaise + tipTotalPaise;

  // 7. Distribute taxes among people
  // Proportionate to each person's item share of total subtotal
  const peopleWithItems = Array.from(personMap.values()).filter(p => p.itemsSharePaise > 0);
  const peopleIds = peopleWithItems.map(p => p.personId);

  if (taxesTotalPaise > 0 && peopleWithItems.length > 0) {
    // Proportionate to item shares
    const assignedTaxTotal = Math.round((taxesTotalPaise * assignedSubtotalPaise) / (subtotalPaise || 1));
    const taxShares = distributeIntegerPaise(
      assignedTaxTotal,
      peopleWithItems.map(p => p.itemsSharePaise),
      peopleIds
    );

    peopleWithItems.forEach((p, idx) => {
      p.taxSharePaise = taxShares[idx];
    });
  }

  // 8. Distribute discount among people
  if (discountTotalPaise > 0 && peopleWithItems.length > 0) {
    // Scale discount to assigned portion
    const assignedDiscountTotal = Math.round(
      (discountTotalPaise * assignedSubtotalPaise) / (subtotalPaise || 1)
    );

    if (discountConfig.allocationMethod === 'equal') {
      const discountShares = distributeIntegerPaise(
        assignedDiscountTotal,
        new Array(peopleWithItems.length).fill(1),
        peopleIds
      );
      peopleWithItems.forEach((p, idx) => {
        p.discountSharePaise = discountShares[idx];
      });
    } else if (discountConfig.allocationMethod === 'custom' && discountConfig.customAllocations) {
      const weights = peopleWithItems.map(p => discountConfig.customAllocations![p.personId] || 0);
      const discountShares = distributeIntegerPaise(assignedDiscountTotal, weights, peopleIds);
      peopleWithItems.forEach((p, idx) => {
        p.discountSharePaise = discountShares[idx];
      });
    } else {
      // DEFAULT: proportional to pre-discount share (items + tax)
      const weights = peopleWithItems.map(p => p.itemsSharePaise + p.taxSharePaise);
      const discountShares = distributeIntegerPaise(assignedDiscountTotal, weights, peopleIds);
      peopleWithItems.forEach((p, idx) => {
        p.discountSharePaise = discountShares[idx];
      });
    }
  }

  // 9. Distribute tips equally or proportionally among eating people
  if (tipTotalPaise > 0 && peopleWithItems.length > 0) {
    const tipShares = distributeIntegerPaise(
      tipTotalPaise,
      peopleWithItems.map(p => p.itemsSharePaise),
      peopleIds
    );
    peopleWithItems.forEach((p, idx) => {
      p.tipSharePaise = tipShares[idx];
    });
  }

  // 10. Calculate each person's preliminary net total
  peopleWithItems.forEach(p => {
    p.totalPaise = p.itemsSharePaise + p.taxSharePaise - p.discountSharePaise + p.tipSharePaise;
  });

  // 11. RECONCILIATION:
  // If ALL items are assigned, guarantee SUM(person.totalPaise) == effectiveBillTotalPaise to the exact paisa!
  let calculatedPersonsTotalPaise = Array.from(personMap.values()).reduce(
    (sum, p) => sum + p.totalPaise,
    0
  );

  let roundingDifferencePaise = 0;
  if (unassignedItems.length === 0 && peopleWithItems.length > 0) {
    const difference = effectiveBillTotalPaise - calculatedPersonsTotalPaise;
    if (difference !== 0) {
      // Reconcile difference deterministically using the Largest Remainder on totalPaise weights
      const adjustedShares = distributeIntegerPaise(
        effectiveBillTotalPaise,
        peopleWithItems.map(p => Math.max(0, p.totalPaise)),
        peopleIds
      );

      peopleWithItems.forEach((p, idx) => {
        const adjustment = adjustedShares[idx] - p.totalPaise;
        p.roundingAdjustmentPaise = adjustment;
        p.totalPaise = adjustedShares[idx];
      });

      calculatedPersonsTotalPaise = effectiveBillTotalPaise;
    }
    roundingDifferencePaise = 0;
  } else {
    // If some items are unassigned, difference is the unassigned balance
    roundingDifferencePaise = effectiveBillTotalPaise - calculatedPersonsTotalPaise;
  }

  const isBalanced = unassignedItems.length === 0 && roundingDifferencePaise === 0;

  return {
    subtotalPaise,
    assignedSubtotalPaise,
    unassignedSubtotalPaise,
    taxesTotalPaise,
    discountTotalPaise,
    effectiveBillTotalPaise,
    calculatedPersonsTotalPaise,
    roundingDifferencePaise,
    isBalanced,
    unassignedItems,
    personShares: Array.from(personMap.values()),
  };
}
