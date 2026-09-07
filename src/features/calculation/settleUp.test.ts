import { expect, test, describe } from 'vitest';
import { calculateBalances, calculateSettleUp } from './settleUp';
import { Bill } from '../../types';
import { createDemoBill } from '../../utils/demoBill';

describe('Group Settle Up Logic', () => {
  test('single bill where one person pays and one person owes', () => {
    const bill: Bill = {
      ...createDemoBill(), // has 3 people, but let's override them for simplicity
      paidBy: 'person-1',
      items: [
        {
          id: 'item-1',
          name: 'Food',
          quantity: 1,
          unitPricePaise: 10000,
          totalPricePaise: 10000,
          assignedPersonIds: ['person-2'],
          assignments: [{ personId: 'person-2', mode: 'equal' }],
        },
      ],
      people: [
        { id: 'person-1', name: 'Alice', avatar: '', color: '' },
        { id: 'person-2', name: 'Bob', avatar: '', color: '' },
      ],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
    };

    const balances = calculateBalances([bill]);
    expect(balances['person-1']).toBe(10000);
    expect(balances['person-2']).toBe(-10000);

    const transactions = calculateSettleUp([bill]);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toEqual({
      fromPersonId: 'person-2',
      toPersonId: 'person-1',
      amountPaise: 10000,
    });
  });

  test('complex multi-bill scenario', () => {
    // A: person-1, B: person-2, C: person-3
    // Bill 1: A pays 300, splits equally (100 each) -> Balances: A=+200, B=-100, C=-100
    // Bill 2: B pays 150, splits B and C (75 each) -> Balances: A=+200, B=-100 + 150 - 75 = -25, C=-100 - 75 = -175
    // Total Balances: A: +200, B: -25, C: -175

    const basePeople = [
      { id: 'person-1', name: 'A', avatar: '', color: '' },
      { id: 'person-2', name: 'B', avatar: '', color: '' },
      { id: 'person-3', name: 'C', avatar: '', color: '' },
    ];

    const bill1: Bill = {
      ...createDemoBill(),
      id: 'b1',
      paidBy: 'person-1',
      items: [
        {
          id: 'i1', name: 'Dinner', quantity: 1, unitPricePaise: 30000, totalPricePaise: 30000,
          assignedPersonIds: ['person-1', 'person-2', 'person-3'],
          assignments: [
            { personId: 'person-1', mode: 'equal' },
            { personId: 'person-2', mode: 'equal' },
            { personId: 'person-3', mode: 'equal' }
          ],
        }
      ],
      people: basePeople,
      taxes: [], discount: { type: 'none', allocationMethod: 'proportional' },
    };

    const bill2: Bill = {
      ...createDemoBill(),
      id: 'b2',
      paidBy: 'person-2',
      items: [
        {
          id: 'i2', name: 'Lunch', quantity: 1, unitPricePaise: 15000, totalPricePaise: 15000,
          assignedPersonIds: ['person-2', 'person-3'],
          assignments: [
            { personId: 'person-2', mode: 'equal' },
            { personId: 'person-3', mode: 'equal' }
          ],
        }
      ],
      people: basePeople,
      taxes: [], discount: { type: 'none', allocationMethod: 'proportional' },
    };

    const balances = calculateBalances([bill1, bill2]);
    expect(balances['person-1']).toBe(20000);
    expect(balances['person-2']).toBe(-2500);
    expect(balances['person-3']).toBe(-17500);

    const tx = calculateSettleUp([bill1, bill2]);
    // C owes 17500. C pays A 17500.
    // B owes 2500. B pays A 2500.
    expect(tx).toHaveLength(2);
    // order of greedy match: most negative to most positive
    // C (-17500) pays A (+20000). Remaining A = +2500.
    // B (-2500) pays A (+2500). Remaining A = 0.
    expect(tx.some(t => t.fromPersonId === 'person-3' && t.toPersonId === 'person-1' && t.amountPaise === 17500)).toBe(true);
    expect(tx.some(t => t.fromPersonId === 'person-2' && t.toPersonId === 'person-1' && t.amountPaise === 2500)).toBe(true);
  });

  test('calculates category totals and detailed member balances', async () => {
    const { calculateCategoryTotals, calculateDetailedBalances } = await import('./settleUp');

    const people = [
      { id: 'u1', name: 'Alex', avatar: '', color: '' },
      { id: 'u2', name: 'Brian', avatar: '', color: '' },
    ];

    const barBill: Bill = {
      ...createDemoBill(),
      id: 'bar-1',
      category: 'bar',
      paidBy: 'u1',
      people,
      items: [
        {
          id: 'i1', name: 'Drinks', quantity: 1, unitPricePaise: 5000, totalPricePaise: 5000,
          assignedPersonIds: ['u1', 'u2'],
          assignments: [{ personId: 'u1', mode: 'equal' }, { personId: 'u2', mode: 'equal' }],
        }
      ],
      taxes: [], discount: { type: 'none', allocationMethod: 'proportional' },
    };

    const cabBill: Bill = {
      ...createDemoBill(),
      id: 'cab-1',
      category: 'transport',
      paidBy: 'u2',
      people,
      items: [
        {
          id: 'i2', name: 'Uber', quantity: 1, unitPricePaise: 2000, totalPricePaise: 2000,
          assignedPersonIds: ['u1', 'u2'],
          assignments: [{ personId: 'u1', mode: 'equal' }, { personId: 'u2', mode: 'equal' }],
        }
      ],
      taxes: [], discount: { type: 'none', allocationMethod: 'proportional' },
    };

    const categories = calculateCategoryTotals([barBill, cabBill]);
    expect(categories.bar).toBe(5000);
    expect(categories.transport).toBe(2000);

    const detailed = calculateDetailedBalances([barBill, cabBill]);
    // Alex (u1): Paid 5000 (bar), consumed 2500 (bar) + 1000 (cab) = 3500 share -> Net = +1500
    expect(detailed['u1'].totalPaidPaise).toBe(5000);
    expect(detailed['u1'].totalSharePaise).toBe(3500);
    expect(detailed['u1'].netPaise).toBe(1500);

    // Brian (u2): Paid 2000 (cab), consumed 2500 (bar) + 1000 (cab) = 3500 share -> Net = -1500
    expect(detailed['u2'].totalPaidPaise).toBe(2000);
    expect(detailed['u2'].totalSharePaise).toBe(3500);
    expect(detailed['u2'].netPaise).toBe(-1500);
  });

  test('correctly accounts for taxes and tips in group settle up and balances', async () => {
    const { calculateBalances, calculateSettleUp, calculateDetailedBalances, calculateCategoryTotals } = await import('./settleUp');
    const { calculateBill } = await import('./engine');

    const people = [
      { id: 'p1', name: 'Alice', avatar: '', color: '' },
      { id: 'p2', name: 'Bob', avatar: '', color: '' },
    ];

    // Dinner bill: Items = ₹1,000 (100000 paise). Tax = 5% (₹50 = 5000 paise). Tip = ₹100 (10000 paise).
    // Total effective bill = ₹1,150 (115000 paise).
    // Alice and Bob split food equally (₹500 each + ₹25 tax + ₹50 tip = ₹575 each).
    // Alice paid the whole bill (₹1,150).
    const dinnerBill: Bill = {
      ...createDemoBill(),
      id: 'dinner-1',
      category: 'food',
      paidBy: 'p1',
      people,
      items: [
        {
          id: 'dish-1',
          name: 'Steak & Salad',
          quantity: 1,
          unitPricePaise: 100000,
          totalPricePaise: 100000,
          assignedPersonIds: ['p1', 'p2'],
          assignments: [{ personId: 'p1', mode: 'equal' }, { personId: 'p2', mode: 'equal' }],
        },
      ],
      taxes: [{ id: 'tax-1', name: 'GST', type: 'percentage', rate: 5 }],
      discount: { type: 'none', allocationMethod: 'proportional' },
      customTipPaise: 10000,
    };

    const calc = calculateBill(dinnerBill);
    expect(calc.effectiveBillTotalPaise).toBe(115000);

    const balances = calculateBalances([dinnerBill]);
    // Alice paid 115000, her share is 57500 -> Net = +57500
    // Bob paid 0, his share is 57500 -> Net = -57500
    expect(balances['p1']).toBe(57500);
    expect(balances['p2']).toBe(-57500);

    const tx = calculateSettleUp([dinnerBill]);
    expect(tx).toHaveLength(1);
    expect(tx[0]).toEqual({
      fromPersonId: 'p2',
      toPersonId: 'p1',
      amountPaise: 57500,
    });

    const detailed = calculateDetailedBalances([dinnerBill]);
    expect(detailed['p1'].totalPaidPaise).toBe(115000);
    expect(detailed['p1'].totalSharePaise).toBe(57500);
    expect(detailed['p1'].netPaise).toBe(57500);

    const catTotals = calculateCategoryTotals([dinnerBill]);
    expect(catTotals.food).toBe(115000);
  });
});

