import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: 'general' | 'privacy' | 'splitting' | 'groups';
}

const FAQ_ITEMS: FaqItem[] = [
  {
    category: 'general',
    question: 'Is SplitBill completely free? Are there subscriptions or ads?',
    answer:
      'Yes, SplitBill is 100% free with zero ads, zero in-app purchases, and no locked tiers. We built this as an open public utility tool.',
  },
  {
    category: 'general',
    question: 'Do my friends need to install an app or create an account?',
    answer:
      'No! None of your friends need an account or app. When you split a bill or trip, you can share an instant breakdown directly via WhatsApp, copy as text for Telegram/SMS, or download a crisp PDF statement or image card.',
  },
  {
    category: 'privacy',
    question: 'Where is my data stored? Are my receipts sent to a server?',
    answer:
      'Your data never leaves your device. SplitBill operates 100% client-side. Optical Character Recognition (OCR) is powered by local WebAssembly that runs directly inside your browser. No receipt photos, personal names, or financial numbers are ever uploaded or transmitted.',
  },
  {
    category: 'splitting',
    question: 'How does SplitBill eliminate 1-paisa / 1-cent rounding errors?',
    answer:
      'Traditional apps compute shares in floating-point decimals and round individually, resulting in totals that are off by 1 or 2 cents. SplitBill uses integer math in smallest currency units (paise/cents) and allocates remaining odd cents using the Largest Remainder (Hare-Niemeyer) method. The sum of all individual shares is mathematically guaranteed to match the grand total.',
  },
  {
    category: 'splitting',
    question: 'Can I split a dish by portions (e.g. 0.5 portion for someone who ate half)?',
    answer:
      'Yes! When assigning an item, you can switch from Equal mode to Portion/Shares mode. You can enter fractional shares like 0.5, 1, 1.5, or 2 portions. The cost of that dish is divided precisely according to those weights.',
  },
  {
    category: 'splitting',
    question: 'How are taxes, service charges, discounts, and tips calculated?',
    answer:
      'SplitBill divides taxes, service fees, and discounts PROPORTIONALLY according to each person\'s subtotal of items consumed. If someone only ordered a ₹100 soup while another ordered ₹900 steak, tax is divided 10% / 90% rather than 50/50. Nobody subsidizes someone else\'s luxury items.',
  },
  {
    category: 'groups',
    question: 'How do Group Trips work when multiple people pay for different things?',
    answer:
      'In a Group Trip, you can add multiple expenses across days (hotel, cabs, bar, dinners). For each expense, select which member paid. SplitBill maintains a live ledger of who paid what, who consumed what, and computes the exact net balance for each person.',
  },
  {
    category: 'groups',
    question: 'What is "Settle Up" and how does it minimize payments?',
    answer:
      'If 5 friends all paid for various expenses, settling up directly could require dozens of confusing transactions. SplitBill runs a greedy debt minimization algorithm that simplifies the web of debt down to the absolute minimum number of payments to settle everyone to zero.',
  },
  {
    category: 'groups',
    question: 'Can I export or backup a trip and send it to a friend?',
    answer:
      'Yes! Open the Share modal for any group trip and tap "Export Data" to download a clean JSON backup file. Another user can tap "Import Trip from JSON" in the Groups list to import the complete trip and all its bills immediately.',
  },
  {
    category: 'general',
    question: 'Does SplitBill work without an internet connection?',
    answer:
      'Yes. SplitBill is a certified Progressive Web App (PWA). All application assets, fonts, and the client-side OCR engine are cached locally in your browser. You can split bills on planes, trains, or in remote spots with no cell reception.',
  },
  {
    category: 'general',
    question: 'What currencies are supported?',
    answer:
      'We support INR (₹), USD ($), EUR (€), GBP (£), AED (AED), CAD (C$), AUD (A$), SGD (S$), JPY (¥), and CHF (CHF). You can switch your active currency anytime in the top header.',
  },
];

export const FaqTab: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0, 1]); // first two open by default
  const [searchQuery, setSearchQuery] = useState('');

  const toggleIndex = (idx: number) => {
    setOpenIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const filteredFaqs = FAQ_ITEMS.filter(
    item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base">
          <HelpCircle className="w-5 h-5 text-brand-600" />
          <h3>Frequently Asked Questions</h3>
        </div>
      </div>

      {/* Quick Search */}
      <div>
        <input
          type="text"
          placeholder="Search question or keyword..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#252528] border border-transparent focus:border-brand-500 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none transition-all"
        />
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-2.5 pt-1">
        {filteredFaqs.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">
            No questions match "{searchQuery}".
          </p>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => toggleIndex(idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-full text-slate-400 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-brand-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-white/5">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
