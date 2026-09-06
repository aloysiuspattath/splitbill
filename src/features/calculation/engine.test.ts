import { describe, it, expect } from 'vitest';
import { calculateBill } from './engine';
import { distributeIntegerPaise } from './rounding';
import { Bill } from '../../types';

describe('Calculation Engine - Rounding Algorithm', () => {
  it('distributes 100 paise equally among 3 people deterministically', () => {
    const keys = ['alice', 'bob', 'carol'];
    const shares = distributeIntegerPaise(100, [1, 1, 1], keys);
    expect(shares).toHaveLength(3);
    expect(shares.reduce((a, b) => a + b, 0)).toBe(100);
    // Two people get 33, one gets 34
    expect(shares.sort()).toEqual([33, 33, 34]);
  });

  it('distributes large amounts with fractional percentages exactly', () => {
    const totalPaise = 29500; // ₹295.00
    const keys = ['aloysius', 'prajul'];
    const shares = distributeIntegerPaise(totalPaise, [1, 1], keys);
    expect(shares).toEqual([14750, 14750]); // ₹147.50 each
    expect(shares[0] + shares[1]).toBe(totalPaise);
  });
});

describe('Calculation Engine - Business Scenarios', () => {
  it('calculates single person bill correctly with tax and discount', () => {
    const bill: Bill = {
      id: 'test-1',
      restaurantName: 'Cafe Coffee Day',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'item-1',
          name: 'Cappuccino',
          quantity: 1,
          unitPricePaise: 18000, // ₹180
          totalPricePaise: 18000,
          assignedPersonIds: ['p1'],
          assignments: [{ personId: 'p1', mode: 'equal' }],
        },
      ],
      people: [{ id: 'p1', name: 'Hafeez', avatar: '☕', color: '#2563eb' }],
      taxes: [{ id: 'tax-1', name: 'GST', type: 'percentage', rate: 5 }],
      discount: { type: 'fixed', fixedAmountPaise: 2000, allocationMethod: 'proportional' }, // ₹20
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);
    expect(res.subtotalPaise).toBe(18000); // ₹180
    expect(res.taxesTotalPaise).toBe(900); // 5% of 180 = ₹9
    expect(res.discountTotalPaise).toBe(2000); // ₹20
    expect(res.effectiveBillTotalPaise).toBe(18000 + 900 - 2000); // 16900 = ₹169
    expect(res.calculatedPersonsTotalPaise).toBe(16900);
    expect(res.isBalanced).toBe(true);
    expect(res.personShares[0].totalPaise).toBe(16900);
  });

  it('handles percentage splitting and validates exact total', () => {
    const bill: Bill = {
      id: 'test-2',
      restaurantName: 'Pizza Hut',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'item-1',
          name: 'Large Pizza',
          quantity: 1,
          unitPricePaise: 60000, // ₹600
          totalPricePaise: 60000,
          assignedPersonIds: ['p1', 'p2', 'p3'],
          assignments: [
            { personId: 'p1', mode: 'percentage', value: 50 }, // 50%
            { personId: 'p2', mode: 'percentage', value: 30 }, // 30%
            { personId: 'p3', mode: 'percentage', value: 20 }, // 20%
          ],
        },
      ],
      people: [
        { id: 'p1', name: 'Aloysius', avatar: '🍕', color: '#2563eb' },
        { id: 'p2', name: 'Prajul', avatar: '🍔', color: '#10b981' },
        { id: 'p3', name: 'Amal', avatar: '🥗', color: '#f59e0b' },
      ],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);
    expect(res.subtotalPaise).toBe(60000);
    const aloysius = res.personShares.find(p => p.personId === 'p1')!;
    const prajul = res.personShares.find(p => p.personId === 'p2')!;
    const amal = res.personShares.find(p => p.personId === 'p3')!;

    expect(aloysius.totalPaise).toBe(30000); // ₹300
    expect(prajul.totalPaise).toBe(18000);   // ₹180
    expect(amal.totalPaise).toBe(12000);     // ₹120
    expect(res.calculatedPersonsTotalPaise).toBe(60000);
    expect(res.isBalanced).toBe(true);
  });

  it('handles custom amount splitting properly', () => {
    const bill: Bill = {
      id: 'test-3',
      restaurantName: 'Steakhouse',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'item-1',
          name: 'T-Bone Steak',
          quantity: 1,
          unitPricePaise: 60000, // ₹600
          totalPricePaise: 60000,
          assignedPersonIds: ['p1', 'p2', 'p3'],
          assignments: [
            { personId: 'p1', mode: 'amount', value: 30000 }, // ₹300
            { personId: 'p2', mode: 'amount', value: 18000 }, // ₹180
            { personId: 'p3', mode: 'amount', value: 12000 }, // ₹120
          ],
        },
      ],
      people: [
        { id: 'p1', name: 'Aloysius', avatar: '🥩', color: '#2563eb' },
        { id: 'p2', name: 'Prajul', avatar: '🍖', color: '#10b981' },
        { id: 'p3', name: 'Amal', avatar: '🍗', color: '#f59e0b' },
      ],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);
    expect(res.personShares.find(p => p.personId === 'p1')!.totalPaise).toBe(30000);
    expect(res.personShares.find(p => p.personId === 'p2')!.totalPaise).toBe(18000);
    expect(res.personShares.find(p => p.personId === 'p3')!.totalPaise).toBe(12000);
    expect(res.calculatedPersonsTotalPaise).toBe(60000);
  });

  it('handles duplicate item names as separate distinct line items', () => {
    // Lime ₹40 to Aloysius, Lime ₹40 to Hafeez
    const bill: Bill = {
      id: 'test-4',
      restaurantName: 'Juice Bar',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'lime-1',
          name: 'Lime',
          quantity: 1,
          unitPricePaise: 4000, // ₹40
          totalPricePaise: 4000,
          assignedPersonIds: ['p1'],
          assignments: [{ personId: 'p1', mode: 'equal' }],
        },
        {
          id: 'lime-2',
          name: 'Lime',
          quantity: 1,
          unitPricePaise: 4000, // ₹40
          totalPricePaise: 4000,
          assignedPersonIds: ['p2'],
          assignments: [{ personId: 'p2', mode: 'equal' }],
        },
      ],
      people: [
        { id: 'p1', name: 'Aloysius', avatar: '🍋', color: '#2563eb' },
        { id: 'p2', name: 'Hafeez', avatar: '🍋', color: '#10b981' },
      ],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);
    expect(res.subtotalPaise).toBe(8000);
    expect(res.personShares.find(p => p.personId === 'p1')!.totalPaise).toBe(4000);
    expect(res.personShares.find(p => p.personId === 'p2')!.totalPaise).toBe(4000);
    expect(res.isBalanced).toBe(true);
  });

  it('detects unassigned items and flags isBalanced as false', () => {
    const bill: Bill = {
      id: 'test-5',
      restaurantName: 'Bistro',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'item-1',
          name: 'Coffee',
          quantity: 1,
          unitPricePaise: 5000,
          totalPricePaise: 5000,
          assignedPersonIds: ['p1'],
          assignments: [{ personId: 'p1', mode: 'equal' }],
        },
        {
          id: 'item-2',
          name: 'Pastry',
          quantity: 1,
          unitPricePaise: 3000,
          totalPricePaise: 3000,
          assignedPersonIds: [], // UNASSIGNED
          assignments: [],
        },
      ],
      people: [{ id: 'p1', name: 'Hafeez', avatar: '☕', color: '#2563eb' }],
      taxes: [],
      discount: { type: 'none', allocationMethod: 'proportional' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);
    expect(res.subtotalPaise).toBe(8000);
    expect(res.assignedSubtotalPaise).toBe(5000);
    expect(res.unassignedSubtotalPaise).toBe(3000);
    expect(res.unassignedItems).toHaveLength(1);
    expect(res.isBalanced).toBe(false);
  });

  it('executes the full Sulthan Veedu real test scenario with exact reconciliation', () => {
    // Receipt:
    // Erachi Choru ×2 = ₹480 (Hafeez & Aloysius share)
    // Lebanese Al Faham = ₹370 (Joel & Sharon share)
    // Beef Rib = ₹295 (Aloysius & Prajul share)
    // Pal Kappa = ₹349 (Amal)
    // Lime ×2 = ₹80 (Amal & Aloysius get 1 lime each = ₹40 each)
    // Kuboos ×2 = ₹24 (Joel & Sharon share)
    //
    // Subtotal: 480 + 370 + 295 + 349 + 80 + 24 = ₹1,598
    // Taxes: CGST 2.5% (₹39.95 -> ₹40), SGST 2.5% (₹39.95 -> ₹40) = ₹80 tax
    // Printed/Calculated Total: ₹1,678
    // Actual Paid at Counter: ₹1,411 (giving ₹267 effective discount)
    const bill: Bill = {
      id: 'sulthan-veedu-1',
      restaurantName: 'Sulthan Veedu',
      date: '2026-09-06',
      currency: 'INR',
      items: [
        {
          id: 'i-erachi',
          name: 'Erachi Choru',
          quantity: 2,
          unitPricePaise: 24000,
          totalPricePaise: 48000, // ₹480
          assignedPersonIds: ['hafeez', 'aloysius'],
          assignments: [
            { personId: 'hafeez', mode: 'equal' },
            { personId: 'aloysius', mode: 'equal' },
          ],
        },
        {
          id: 'i-alfaham',
          name: 'Lebanese Al Faham',
          quantity: 1,
          unitPricePaise: 37000,
          totalPricePaise: 37000, // ₹370
          assignedPersonIds: ['joel', 'sharon'],
          assignments: [
            { personId: 'joel', mode: 'equal' },
            { personId: 'sharon', mode: 'equal' },
          ],
        },
        {
          id: 'i-beefrib',
          name: 'Beef Rib',
          quantity: 1,
          unitPricePaise: 29500,
          totalPricePaise: 29500, // ₹295
          assignedPersonIds: ['aloysius', 'prajul'],
          assignments: [
            { personId: 'aloysius', mode: 'equal' },
            { personId: 'prajul', mode: 'equal' },
          ],
        },
        {
          id: 'i-palkappa',
          name: 'Pal Kappa',
          quantity: 1,
          unitPricePaise: 34900,
          totalPricePaise: 34900, // ₹349
          assignedPersonIds: ['amal'],
          assignments: [{ personId: 'amal', mode: 'equal' }],
        },
        {
          id: 'i-lime-1',
          name: 'Fresh Lime Juice',
          quantity: 1,
          unitPricePaise: 4000,
          totalPricePaise: 4000, // ₹40
          assignedPersonIds: ['amal'],
          assignments: [{ personId: 'amal', mode: 'equal' }],
        },
        {
          id: 'i-lime-2',
          name: 'Fresh Lime Juice',
          quantity: 1,
          unitPricePaise: 4000,
          totalPricePaise: 4000, // ₹40
          assignedPersonIds: ['aloysius'],
          assignments: [{ personId: 'aloysius', mode: 'equal' }],
        },
        {
          id: 'i-kuboos',
          name: 'Kuboos',
          quantity: 2,
          unitPricePaise: 1200,
          totalPricePaise: 2400, // ₹24
          assignedPersonIds: ['joel', 'sharon'],
          assignments: [
            { personId: 'joel', mode: 'equal' },
            { personId: 'sharon', mode: 'equal' },
          ],
        },
      ],
      people: [
        { id: 'hafeez', name: 'Hafeez', avatar: '👨', color: '#3b82f6' },
        { id: 'joel', name: 'Joel', avatar: '🧔', color: '#10b981' },
        { id: 'sharon', name: 'Sharon', avatar: '👩', color: '#ec4899' },
        { id: 'amal', name: 'Amal', avatar: '🧑', color: '#f59e0b' },
        { id: 'aloysius', name: 'Aloysius', avatar: '😎', color: '#6366f1' },
        { id: 'prajul', name: 'Prajul', avatar: '🤠', color: '#14b8a6' },
      ],
      taxes: [
        { id: 'cgst', name: 'CGST', type: 'percentage', rate: 2.5 },
        { id: 'sgst', name: 'SGST', type: 'percentage', rate: 2.5 },
      ],
      discount: {
        type: 'actual_paid',
        actualPaidPaise: 141100, // Target is EXACTLY ₹1,411.00 paid
        allocationMethod: 'proportional',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const res = calculateBill(bill);

    // 1. Check Subtotal
    expect(res.subtotalPaise).toBe(159800); // ₹1,598
    expect(res.unassignedSubtotalPaise).toBe(0);

    // 2. Check Taxes
    // 2.5% of 159800 is 3995 paise each = 7990 paise total
    expect(res.taxesTotalPaise).toBe(7990);

    // 3. Effective Total must be EXACTLY ₹1,411.00
    expect(res.effectiveBillTotalPaise).toBe(141100);

    // 4. CRITICAL: The sum of every person's final share MUST equal 141100 paise!
    const sumFinalShares = res.personShares.reduce((s, p) => s + p.totalPaise, 0);
    expect(sumFinalShares).toBe(141100);
    expect(res.calculatedPersonsTotalPaise).toBe(141100);
    expect(res.roundingDifferencePaise).toBe(0);
    expect(res.isBalanced).toBe(true);

    // 5. Verify every person has a positive, fair share
    res.personShares.forEach(p => {
      expect(p.totalPaise).toBeGreaterThan(0);
      expect(p.assignedItems.length).toBeGreaterThan(0);
    });
  });
});
