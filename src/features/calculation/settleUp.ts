import { Bill } from '../../types';
import { calculateBill } from './engine';

export interface PersonBalance {
  personId: string;
  netPaise: number; // > 0 means they are owed this much; < 0 means they owe this much
}

export interface SettlementTransaction {
  fromPersonId: string;
  toPersonId: string;
  amountPaise: number;
}

/**
 * Calculates the net balances for all people across a set of bills.
 */
export function calculateBalances(bills: Bill[]): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const bill of bills) {
    const result = calculateBill(bill);
    
    // Who paid this bill?
    // If paidBy is provided, that person paid the whole effective total.
    // Otherwise, fallback to the first person in the bill if it exists, or just none if people is empty.
    const payerId = bill.paidBy || (bill.people.length > 0 ? bill.people[0].id : null);
    
    if (payerId) {
      balances[payerId] = (balances[payerId] || 0) + result.effectiveBillTotalPaise;
    }

    // Deduct what everyone owes
    for (const share of result.personShares) {
      balances[share.personId] = (balances[share.personId] || 0) - share.totalPaise;
    }
  }

  return balances;
}

/**
 * Given a set of bills, calculates the minimum number of transactions needed to settle all debts.
 */
export function calculateSettleUp(bills: Bill[]): SettlementTransaction[] {
  const balancesMap = calculateBalances(bills);
  
  // Convert to array of { personId, netPaise }
  const balances: PersonBalance[] = Object.entries(balancesMap)
    .map(([personId, netPaise]) => ({ personId, netPaise }))
    .filter(b => b.netPaise !== 0);

  // Separate debtors and creditors
  const debtors = balances.filter(b => b.netPaise < 0).sort((a, b) => a.netPaise - b.netPaise); // most negative first
  const creditors = balances.filter(b => b.netPaise > 0).sort((a, b) => b.netPaise - a.netPaise); // most positive first

  const transactions: SettlementTransaction[] = [];
  
  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(-debtor.netPaise, creditor.netPaise);

    transactions.push({
      fromPersonId: debtor.personId,
      toPersonId: creditor.personId,
      amountPaise: amount,
    });

    debtor.netPaise += amount;
    creditor.netPaise -= amount;

    if (debtor.netPaise === 0) i++;
    if (creditor.netPaise === 0) j++;
  }

  return transactions;
}

export interface DetailedPersonBalance {
  personId: string;
  totalPaidPaise: number;
  totalSharePaise: number;
  netPaise: number;
}

/**
 * Returns a breakdown of total paid, total share owed, and net balance for each person.
 */
export function calculateDetailedBalances(bills: Bill[]): Record<string, DetailedPersonBalance> {
  const result: Record<string, DetailedPersonBalance> = {};

  for (const bill of bills) {
    const calc = calculateBill(bill);
    const payerId = bill.paidBy || (bill.people.length > 0 ? bill.people[0].id : null);

    if (payerId) {
      if (!result[payerId]) {
        result[payerId] = { personId: payerId, totalPaidPaise: 0, totalSharePaise: 0, netPaise: 0 };
      }
      result[payerId].totalPaidPaise += calc.effectiveBillTotalPaise;
      result[payerId].netPaise += calc.effectiveBillTotalPaise;
    }

    for (const share of calc.personShares) {
      if (!result[share.personId]) {
        result[share.personId] = { personId: share.personId, totalPaidPaise: 0, totalSharePaise: 0, netPaise: 0 };
      }
      result[share.personId].totalSharePaise += share.totalPaise;
      result[share.personId].netPaise -= share.totalPaise;
    }
  }

  return result;
}

/**
 * Returns total expenditure aggregated by category.
 */
export function calculateCategoryTotals(bills: Bill[]): Partial<Record<string, number>> {
  const totals: Partial<Record<string, number>> = {};

  for (const bill of bills) {
    const calc = calculateBill(bill);
    const cat = bill.category || 'other';
    totals[cat] = (totals[cat] || 0) + calc.effectiveBillTotalPaise;
  }

  return totals;
}

