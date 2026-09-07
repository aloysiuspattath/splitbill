import React from 'react';
import { 
  Camera, 
  Users, 
  Percent, 
  Share2, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone,
  Sparkles,
  PieChart
} from 'lucide-react';

export const GuideTab: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
      {/* Intro Banner */}
      <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200/60 dark:border-brand-900/40 space-y-1.5">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-extrabold text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Welcome to SplitBill Guide</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          SplitBill is designed to be the fastest, simplest, and most mathematically accurate way to divide restaurant checks, grocery bills, and multi-day group trips without accounts or math disputes.
        </p>
      </div>

      {/* Mode 1: Single Bill Split */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
            1
          </div>
          <h3>Single Restaurant Bill Split</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Perfect for dining out with friends, drinks at a pub, or shared takeout.
        </p>

        <div className="grid gap-3 pt-1">
          {/* Step 1 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Camera className="w-4 h-4 text-brand-600" />
              <span>Step 1: Scan or Type Items</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Take a photo of your receipt for instant local OCR reading, or type items manually. Tip: If an item has multiple quantities (e.g. 3x Burgers), tap <strong>"Split into individual items"</strong> to assign them to different people!
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Step 2: Add Friends</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Type the names of everyone at the table. Avatars and custom colors are automatically assigned to each person for easy visual recognition.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <PieChart className="w-4 h-4 text-amber-600" />
              <span>Step 3: Assign Items (Equal or Portions)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tap the friends who ate each dish. If two people shared a curry, tap both to split it 50/50. If someone ate half a portion, toggle <strong>Portion/Shares mode</strong> and enter 0.5!
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Percent className="w-4 h-4 text-purple-600" />
              <span>Step 4: Taxes, Discounts &amp; Tips</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Add GST, VAT, service charges, or coupons. SplitBill allocates taxes and discounts <strong>proportionally</strong> to what each person ate, so drinks or desserts carry their fair share of tax without burdening non-drinkers.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
              <Share2 className="w-4 h-4 text-rose-600" />
              <span>Step 5: Share Instantly</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Get an exact receipt breakdown with zero rounding errors. Send to WhatsApp with one tap, copy the breakdown, or download a printable PDF or PNG image.
            </p>
          </div>
        </div>
      </section>

      {/* Mode 2: Trips & Group Splitting */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
            2
          </div>
          <h3>Group Trips &amp; Multi-Bill Events</h3>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Ideal for road trips, vacations, roommates, and multi-day celebrations where multiple people pay for different expenses.
        </p>

        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#222225] border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">Multiple Bills in One Trip</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Create a trip (e.g. "Goa Vacation" or "Flat 402"). Add as many bills as needed across your entire journey.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#222225] border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">Specify Who Paid &amp; Category</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Mark who settled the bill (e.g., Alex paid for cab, Priya paid for dinner) and categorize by Food, Transport, Hotel, or Activities.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#222225] border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">10-Second Quick Expense</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Don't have a physical receipt for roadside coconut water or auto-rickshaw? Use Quick Expense to log amount, payer, and category in seconds.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#222225] border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
            <ArrowRight className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
            <div>
              <strong className="text-slate-900 dark:text-white block font-bold text-xs">Smart "Settle Up" Simplification</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">Eliminates confusing circles of debt. If 6 people owe each other back and forth, our debt minimization algorithm calculates the absolute fewest payments needed to settle everyone to zero.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mode 3: Offline PWA */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black text-base border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
            3
          </div>
          <h3>Installing as an App &amp; Offline Use</h3>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200/50 dark:border-purple-900/30 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span>Install on iOS or Android (No App Store Needed)</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <li><strong>iPhone (Safari):</strong> Tap the <em>Share button</em> (square with arrow) at the bottom, then select <em>"Add to Home Screen"</em>.</li>
            <li><strong>Android (Chrome):</strong> Tap the <em>three-dot menu</em> in the top corner and tap <em>"Install App"</em> or <em>"Add to Home Screen"</em>.</li>
            <li><strong>Works 100% Offline:</strong> Once installed or visited, SplitBill works during flights, road trips with zero signal, or remote spots without requiring internet!</li>
          </ul>
        </div>
      </section>
    </div>
  );
};
