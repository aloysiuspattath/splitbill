import { Bill } from '../types';

export function createDemoBill(): Bill {
  const now = Date.now();
  return {
    id: `demo-${now}`,
    restaurantName: 'Sulthan Veedu',
    date: new Date().toISOString().split('T')[0],
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
        name: 'Pal Kappa With Beef',
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
        totalPricePaise: 4000, // ₹40 (Amal)
        assignedPersonIds: ['amal'],
        assignments: [{ personId: 'amal', mode: 'equal' }],
      },
      {
        id: 'i-lime-2',
        name: 'Fresh Lime Juice',
        quantity: 1,
        unitPricePaise: 4000,
        totalPricePaise: 4000, // ₹40 (Aloysius)
        assignedPersonIds: ['aloysius'],
        assignments: [{ personId: 'aloysius', mode: 'equal' }],
      },
      {
        id: 'i-kuboos',
        name: 'Kuboos',
        quantity: 2,
        unitPricePaise: 1200,
        totalPricePaise: 2400, // ₹24 (Joel & Sharon)
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
      actualPaidPaise: 141100, // Target is ₹1,411.00 paid
      allocationMethod: 'proportional',
    },
    isPermanent: true,
    createdAt: now,
    updatedAt: now,
  };
}
