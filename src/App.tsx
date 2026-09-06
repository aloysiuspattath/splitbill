import { useState, useEffect, lazy, Suspense } from 'react';
import { Bill, CalculatedBillResult } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StepIndicator } from './components/StepIndicator';
import { HomeScreen } from './pages/HomeScreen';
import { OcrLoadingModal } from './components/OcrLoadingModal';
import { createDemoBill } from './utils/demoBill';
import { calculateBill } from './features/calculation/engine';
import { recognizeReceipt, OcrProgress } from './features/receipt/ocrService';
import {
  saveBill,
  listRecentBills,
  deleteBill,
  toggleKeepPermanently,
} from './features/storage/db';

const ReviewReceiptStep = lazy(() =>
  import('./pages/ReviewReceiptStep').then(m => ({ default: m.ReviewReceiptStep }))
);
const PeopleStep = lazy(() =>
  import('./pages/PeopleStep').then(m => ({ default: m.PeopleStep }))
);
const AssignStep = lazy(() =>
  import('./pages/AssignStep').then(m => ({ default: m.AssignStep }))
);
const ReviewTaxDiscountStep = lazy(() =>
  import('./pages/ReviewTaxDiscountStep').then(m => ({ default: m.ReviewTaxDiscountStep }))
);
const ResultScreen = lazy(() =>
  import('./pages/ResultScreen').then(m => ({ default: m.ResultScreen }))
);
const RecentBillsModal = lazy(() =>
  import('./components/RecentBillsModal').then(m => ({ default: m.RecentBillsModal }))
);
const PrivacyModal = lazy(() =>
  import('./components/PrivacyModal').then(m => ({ default: m.PrivacyModal }))
);

const EMPTY_BILL: Bill = {
  id: `bill-${Date.now()}`,
  restaurantName: '',
  date: new Date().toISOString().split('T')[0],
  currency: 'INR',
  items: [],
  people: [],
  taxes: [],
  discount: { type: 'none', allocationMethod: 'proportional' },
  isPermanent: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('splitbill_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('splitbill_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('splitbill_theme', 'light');
    }
  }, [isDark]);

  // Main Bill State
  const [bill, setBill] = useState<Bill>(EMPTY_BILL);
  const [step, setStep] = useState<number>(0);
  const [maxAccessibleStep, setMaxAccessibleStep] = useState<number>(1);

  // Modals & Progress
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [ocrPreviewUrl, setOcrPreviewUrl] = useState<string | undefined>();
  const [ocrNotice, setOcrNotice] = useState<string | undefined>();

  const [recentBills, setRecentBills] = useState<Bill[]>([]);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  // Load recent bills on startup
  const refreshRecentBills = async () => {
    try {
      const bills = await listRecentBills();
      setRecentBills(bills);
    } catch (e) {
      console.warn('Could not load recent bills:', e);
    }
  };

  useEffect(() => {
    refreshRecentBills();
  }, []);

  // Update max accessible step as user progresses
  const goToStep = (newStep: number) => {
    setStep(newStep);
    if (newStep > maxAccessibleStep) {
      setMaxAccessibleStep(newStep);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Start Manual Bill
  const handleStartManual = () => {
    setBill({
      ...EMPTY_BILL,
      id: `bill-${Date.now()}`,
      currency: bill.currency,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setOcrNotice(undefined);
    goToStep(1);
  };

  // 2. Start OCR Receipt Scan
  const handleStartScan = async (file: File) => {
    setIsOcrLoading(true);
    setOcrPreviewUrl(URL.createObjectURL(file));
    setOcrNotice(undefined);

    try {
      const parsed = await recognizeReceipt(file, bill.currency, prog => {
        setOcrProgress(prog);
      });

      const newBill: Bill = {
        ...EMPTY_BILL,
        id: `bill-${Date.now()}`,
        currency: bill.currency,
        restaurantName: parsed.restaurantName || '',
        date: new Date().toISOString().split('T')[0],
        items: parsed.items,
        taxes: parsed.detectedTaxes,
        discount: parsed.detectedDiscountPaise
          ? {
              type: 'fixed',
              fixedAmountPaise: parsed.detectedDiscountPaise,
              allocationMethod: 'proportional',
            }
          : { type: 'none', allocationMethod: 'proportional' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setBill(newBill);
      if (parsed.items.length === 0) {
        setOcrNotice(
          "We couldn't confidently read some items. Please check or add items manually."
        );
      }
      setIsOcrLoading(false);
      goToStep(1);
    } catch (err: any) {
      console.error('Receipt scan error:', err);
      setIsOcrLoading(false);
      alert(err.message || 'OCR failed. Starting manual entry.');
      handleStartManual();
    }
  };

  // 3. Load Demo Bill (Sulthan Veedu)
  const handleLoadDemo = () => {
    const demo = createDemoBill();
    setBill(demo);
    setOcrNotice(undefined);
    setMaxAccessibleStep(5);
    goToStep(5); // Jump straight to Result for immediate preview!
  };

  // Save Bill to IndexedDB
  const handleSaveBill = async (keepPermanently: boolean) => {
    const billToSave: Bill = {
      ...bill,
      isPermanent: keepPermanently,
      updatedAt: Date.now(),
    };
    await saveBill(billToSave);
    setBill(billToSave);
    await refreshRecentBills();
  };

  // Calculation Result
  const calculationResult: CalculatedBillResult = calculateBill(bill);

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f2f7] dark:bg-black text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* App Header */}
      <Header
        currency={bill.currency}
        onCurrencyChange={c => setBill(prev => ({ ...prev, currency: c }))}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenRecent={() => {
          refreshRecentBills();
          setIsRecentOpen(true);
        }}
        onGoHome={() => setStep(0)}
        savedBillsCount={recentBills.length}
      />

      {/* Step Indicator (shown during workflow steps 1 through 5) */}
      {step > 0 && (
        <StepIndicator
          currentStep={step}
          onStepClick={s => goToStep(s)}
          maxAccessibleStep={maxAccessibleStep}
        />
      )}

      {/* Main Screen Content */}
      <main className="flex-1 pb-12">
        {step === 0 && (
          <HomeScreen
            onStartManual={handleStartManual}
            onStartScan={handleStartScan}
            onOpenRecent={() => {
              refreshRecentBills();
              setIsRecentOpen(true);
            }}
            onLoadDemo={handleLoadDemo}
          />
        )}

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-3">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-400">Loading...</span>
            </div>
          }
        >
          {step === 1 && (
            <ReviewReceiptStep
              restaurantName={bill.restaurantName}
              onUpdateRestaurantName={name => setBill(prev => ({ ...prev, restaurantName: name }))}
              date={bill.date}
              onUpdateDate={d => setBill(prev => ({ ...prev, date: d }))}
              currency={bill.currency}
              items={bill.items}
              onUpdateItems={items => setBill(prev => ({ ...prev, items }))}
              onContinue={() => goToStep(2)}
              onBack={() => setStep(0)}
              ocrNotice={ocrNotice}
            />
          )}

          {step === 2 && (
            <PeopleStep
              people={bill.people}
              items={bill.items}
              onUpdatePeople={people => setBill(prev => ({ ...prev, people }))}
              onUpdateItems={items => setBill(prev => ({ ...prev, items }))}
              onContinue={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          )}

          {step === 3 && (
            <AssignStep
              items={bill.items}
              people={bill.people}
              currency={bill.currency}
              onUpdateItems={items => setBill(prev => ({ ...prev, items }))}
              onContinue={() => goToStep(4)}
              onBack={() => goToStep(2)}
            />
          )}

          {step === 4 && (
            <ReviewTaxDiscountStep
              bill={bill}
              currency={bill.currency}
              onUpdateTaxes={taxes => setBill(prev => ({ ...prev, taxes }))}
              onUpdateDiscount={discount => setBill(prev => ({ ...prev, discount }))}
              onUpdateTip={tipPaise => setBill(prev => ({ ...prev, customTipPaise: tipPaise }))}
              onContinue={() => goToStep(5)}
              onBack={() => goToStep(3)}
            />
          )}

          {step === 5 && (
            <ResultScreen
              bill={bill}
              result={calculationResult}
              currency={bill.currency}
              onSaveBill={handleSaveBill}
              onStartNewBill={handleStartManual}
              onEditBill={() => goToStep(1)}
            />
          )}

          {/* Recent Bills Drawer Modal */}
          {isRecentOpen && (
            <RecentBillsModal
              isOpen={isRecentOpen}
              bills={recentBills}
              onClose={() => setIsRecentOpen(false)}
              onOpenBill={opened => {
                setBill(opened);
                setMaxAccessibleStep(5);
                goToStep(5);
              }}
              onDeleteBill={async id => {
                await deleteBill(id);
                await refreshRecentBills();
              }}
              onTogglePermanent={async id => {
                await toggleKeepPermanently(id);
                await refreshRecentBills();
              }}
              onImportBill={imported => {
                setBill(imported);
                setMaxAccessibleStep(5);
                goToStep(5);
                saveBill(imported).then(refreshRecentBills);
              }}
            />
          )}

          {/* Privacy Policy Modal */}
          {isPrivacyOpen && (
            <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
          )}
        </Suspense>
      </main>

      {/* App Footer */}
      <Footer onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      {/* OCR Progress Modal */}
      {isOcrLoading && (
        <OcrLoadingModal
          progress={ocrProgress}
          onCancel={() => {
            setIsOcrLoading(false);
            handleStartManual();
          }}
          imagePreviewUrl={ocrPreviewUrl}
        />
      )}
    </div>
  );
}
export default App;
