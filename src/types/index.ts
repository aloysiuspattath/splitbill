export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'SGD' | 'AUD' | 'CAD' | 'JPY' | 'CHF';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  decimals: number;
}

export interface Person {
  id: string;
  name: string;
  avatar: string; // emoji or avatar identifier
  color: string;  // color class or hex for badge/avatar ring
  upiId?: string; // Optional UPI ID for direct GPay / PhonePe payments
}

export type SplitMode = 'equal' | 'percentage' | 'amount' | 'shares';

export interface ItemAssignment {
  personId: string;
  mode: SplitMode;
  value?: number; // percentage (0-100), amount in paise/cents, or shares/portions (e.g. 0.5, 1, 2)
}

export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unitPricePaise: number; // in smallest unit (e.g. paise / cents)
  totalPricePaise: number; // quantity * unitPricePaise
  assignedPersonIds: string[]; // convenience array for quick lookup
  assignments: ItemAssignment[];
}

export type TaxType = 'percentage' | 'fixed';

export interface TaxItem {
  id: string;
  name: string;
  type: TaxType;
  rate?: number; // e.g. 2.5 for 2.5%
  fixedAmountPaise?: number; // fixed tax in paise
}

export type DiscountType = 'none' | 'percentage' | 'fixed' | 'actual_paid';
export type DiscountAllocationMethod = 'proportional' | 'equal' | 'custom';

export interface DiscountConfig {
  type: DiscountType;
  rate?: number; // e.g. 10 for 10%
  fixedAmountPaise?: number; // in paise
  actualPaidPaise?: number; // user entered actual amount paid at counter
  allocationMethod: DiscountAllocationMethod;
  customAllocations?: Record<string, number>; // personId -> percentage or paise
}

export type BillCategory = 
  | 'food' 
  | 'bar' 
  | 'transport' 
  | 'hotel' 
  | 'groceries' 
  | 'entertainment' 
  | 'shopping' 
  | 'settlement'
  | 'other';

export interface CategoryInfo {
  id: BillCategory;
  label: string;
  emoji: string;
}

export const BILL_CATEGORIES: CategoryInfo[] = [
  { id: 'food', label: 'Food & Dining', emoji: '🍽️' },
  { id: 'bar', label: 'Bar & Drinks', emoji: '🍸' },
  { id: 'transport', label: 'Cab & Transit', emoji: '🚕' },
  { id: 'hotel', label: 'Hotel & Stay', emoji: '🏨' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒' },
  { id: 'entertainment', label: 'Activities & Events', emoji: '🎟️' },
  { id: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { id: 'settlement', label: 'Payment / Settlement', emoji: '💸' },
  { id: 'other', label: 'General / Other', emoji: '📦' },
];

export interface Bill {
  id: string;
  restaurantName: string;
  date: string; // ISO date string
  currency: CurrencyCode;
  items: BillItem[];
  people: Person[];
  taxes: TaxItem[];
  discount: DiscountConfig;
  customTipPaise?: number;
  isPermanent?: boolean;
  isSettlement?: boolean; // Flag to indicate if this is a person-to-person debt settlement
  groupId?: string; // If this bill belongs to a group
  paidBy?: string; // personId of the person who paid the bill (defaults to the first person or unassigned if not set)
  category?: BillCategory; // e.g. food, bar, transport...
  createdAt: number;
  updatedAt: number;
}

export interface Group {
  id: string;
  name: string;
  currency: CurrencyCode;
  members: Person[];
  createdAt: number;
  updatedAt: number;
}

export interface PersonItemShare {
  itemId: string;
  itemName: string;
  quantity: number;
  mode: SplitMode;
  sharePaise: number;
  details?: string;
}

export interface PersonShareResult {
  personId: string;
  personName: string;
  avatar: string;
  color: string;
  itemsSharePaise: number;
  taxSharePaise: number;
  discountSharePaise: number;
  tipSharePaise: number;
  roundingAdjustmentPaise: number;
  totalPaise: number;
  assignedItems: PersonItemShare[];
}

export interface CalculatedBillResult {
  subtotalPaise: number;
  assignedSubtotalPaise: number;
  unassignedSubtotalPaise: number;
  taxesTotalPaise: number;
  discountTotalPaise: number;
  effectiveBillTotalPaise: number;
  calculatedPersonsTotalPaise: number;
  roundingDifferencePaise: number;
  isBalanced: boolean;
  unassignedItems: BillItem[];
  personShares: PersonShareResult[];
}
