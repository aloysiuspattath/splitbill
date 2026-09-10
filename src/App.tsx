import { useState, useEffect, lazy, Suspense } from 'react';
import { Bill, CalculatedBillResult, Group } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { StepIndicator } from './components/StepIndicator';
import { HomeScreen } from './pages/HomeScreen';
import { OcrLoadingModal } from './components/OcrLoadingModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { GroupsModal } from './components/GroupsModal';
import { GroupDashboard } from './pages/GroupDashboard';
import { createDemoBill } from './utils/demoBill';
import { calculateBill } from './features/calculation/engine';
import { recognizeReceipt, OcrProgress } from './features/receipt/ocrService';
import {
  saveBill,
  listRecentBills,
  deleteBill,
  toggleKeepPermanently,
  saveGroup,
  listGroups,
  deleteGroup,
  getGroupBills,
  clearAllLocalData,
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
const InfoModal = lazy(() =>
  import('./components/InfoModal').then(m => ({ default: m.InfoModal }))
);
import type { InfoTabType } from './components/InfoModal';

const EMPTY_BILL: Bill = {
  id: `bill-${Date.now()}`,
  restaurantName: '',
  date: new Date().toISOString().split('T')[0],
  currency: 'INR',
  items: [],
  people: [],
  taxes: [],
  discount: { type: 'none', allocationMethod: 'proportional' },
  category: 'food',
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
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [infoTab, setInfoTab] = useState<InfoTabType>('guide');

  const openInfoModal = (tab: InfoTabType = 'guide') => {
    setInfoTab(tab);
    setIsInfoOpen(true);
  };

  // Sync browser URL hash with Info tabs (#guide, #faq, #about, #terms, #privacy)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (['#guide', '#faq', '#about', '#terms', '#privacy'].includes(hash)) {
        const tab = hash.slice(1) as InfoTabType;
        setInfoTab(tab);
        setIsInfoOpen(true);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Groups State
  const [appMode, setAppMode] = useState<'home' | 'bill' | 'group'>('home');
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupBills, setGroupBills] = useState<Bill[]>([]);
  const [isGroupsModalOpen, setIsGroupsModalOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false);

  const refreshGroups = async () => {
    try {
      const g = await listGroups();
      setGroups(g);
    } catch(e) { console.warn(e); }
  };
  
  const refreshGroupBills = async (groupId: string) => {
    try {
      const b = await getGroupBills(groupId);
      setGroupBills(b);
    } catch(e) { console.warn(e); }
  };

  useEffect(() => {
    refreshGroups();
  }, []);


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
  const handleStartManual = (groupId?: string, people?: typeof EMPTY_BILL.people) => {
    const cur = (groupId && activeGroup) ? activeGroup.currency : bill.currency;
    setBill({
      ...EMPTY_BILL,
      groupId,
      people: people || [],
      paidBy: people?.[0]?.id,
      category: 'food',
      id: `bill-${Date.now()}`,
      currency: cur,
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    setOcrNotice(undefined);
    setAppMode('bill');
    goToStep(1);
  };

  // 2. Start OCR Receipt Scan
  const handleStartScan = async (file: File, groupId?: string, people?: typeof EMPTY_BILL.people) => {
    setIsOcrLoading(true);
    setOcrPreviewUrl(URL.createObjectURL(file));
    setOcrNotice(undefined);

    const cur = (groupId && activeGroup) ? activeGroup.currency : bill.currency;

    try {
      const parsed = await recognizeReceipt(file, cur, prog => {
        setOcrProgress(prog);
      });

      const newBill: Bill = {
        ...EMPTY_BILL,
        groupId,
        people: people || [],
        paidBy: people?.[0]?.id,
        category: 'food',
        id: `bill-${Date.now()}`,
        currency: cur,
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
      setAppMode('bill');
      goToStep(1);
    } catch (err: any) {
      console.error('Receipt scan error:', err);
      setIsOcrLoading(false);
      alert(err.message || 'OCR failed. Starting manual entry.');
      handleStartManual(groupId, people);
    }
  };

  // 3. Load Demo Bill (Sulthan Veedu)
  const handleLoadDemo = () => {
    const demo = createDemoBill();
    setBill(demo);
    setOcrNotice(undefined);
    setAppMode('bill');
    setMaxAccessibleStep(5);
    goToStep(5); // Jump straight to Result for immediate preview!
  };

  // Quick Save Group Bill (splits all items equally among all group members)
  const handleQuickSaveGroupBill = async () => {
    if (!activeGroup) return;
    const memberIds = activeGroup.members.map(m => m.id);
    const updatedItems = bill.items.map(item => ({
      ...item,
      assignedPersonIds: memberIds,
      assignments: memberIds.map(id => ({ personId: id, mode: 'equal' as const })),
    }));

    const billToSave: Bill = {
      ...bill,
      items: updatedItems,
      people: activeGroup.members,
      groupId: activeGroup.id,
      paidBy: bill.paidBy || activeGroup.members[0]?.id,
      isPermanent: true,
      updatedAt: Date.now(),
    };

    await saveBill(billToSave);
    await refreshGroupBills(activeGroup.id);
    await refreshRecentBills();
    setAppMode('group');
    setStep(0);
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
    if (billToSave.groupId) {
      await refreshGroupBills(billToSave.groupId);
      setAppMode('group');
      setStep(0);
    } else {
      setAppMode('home');
      setStep(0);
    }
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
        onOpenPrivacy={() => openInfoModal('privacy')}
        onOpenRecent={() => {
          refreshRecentBills();
          setIsRecentOpen(true);
        }}
        onGoHome={() => {
          if (bill.groupId && activeGroup && appMode === 'bill') {
            setAppMode('group');
            setStep(0);
          } else {
            setAppMode('home');
            setStep(0);
          }
        }}
        savedBillsCount={recentBills.length}
      />

      {/* Step Indicator */}
      {appMode === 'bill' && step > 0 && (
        <StepIndicator
          currentStep={step}
          onStepClick={s => goToStep(s)}
          maxAccessibleStep={maxAccessibleStep}
        />
      )}

      {/* Main Screen Content */}

      <main className="flex-1 pb-12">
        {appMode === 'group' && activeGroup ? (
          <GroupDashboard
            group={activeGroup}
            bills={groupBills}
            onAddExpenseManual={() => handleStartManual(activeGroup.id, activeGroup.members)}
            onScanExpense={(file) => handleStartScan(file, activeGroup.id, activeGroup.members)}
            onQuickAddExpense={async (newBill) => {
              await saveBill(newBill);
              await refreshGroupBills(activeGroup.id);
            }}
            onEditExpense={(b) => { setBill(b); setAppMode('bill'); goToStep(1); }}
            onDeleteExpense={async (billId) => {
              await deleteBill(billId);
              await refreshGroupBills(activeGroup.id);
            }}
            onEditGroup={() => setIsEditGroupOpen(true)}
            onBack={() => setAppMode('home')}
          />
        ) : appMode === 'home' || appMode === 'bill' ? (
          <>
            {step === 0 && appMode === 'home' && (
              <HomeScreen
                onStartManual={() => handleStartManual()}
                onStartScan={(f) => handleStartScan(f)}
                onOpenRecent={() => { refreshRecentBills(); setIsRecentOpen(true); }}
                onOpenGroups={() => { refreshGroups(); setIsGroupsModalOpen(true); }}
                onLoadDemo={handleLoadDemo}
                onOpenInfo={openInfoModal}
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
              category={bill.category}
              onUpdateCategory={cat => setBill(prev => ({ ...prev, category: cat }))}
              people={bill.people}
              paidBy={bill.paidBy}
              onUpdatePaidBy={paidBy => setBill(prev => ({ ...prev, paidBy }))}
              groupName={bill.groupId && activeGroup ? activeGroup.name : undefined}
              onQuickSaveToGroup={bill.groupId ? handleQuickSaveGroupBill : undefined}
              onContinue={() => goToStep(2)}
              onBack={() => {
                if (bill.groupId) {
                  setAppMode('group');
                  setStep(0);
                } else {
                  setStep(0);
                }
              }}
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
              onUpdateCategory={cat => setBill(prev => ({ ...prev, category: cat }))}
              onUpdatePaidBy={paidBy => setBill(prev => ({ ...prev, paidBy }))}
              groupName={bill.groupId && activeGroup ? activeGroup.name : undefined}
              onSaveBill={handleSaveBill}
              onStartNewBill={() => {
                if (bill.groupId && activeGroup) {
                  setAppMode('group');
                  setStep(0);
                } else {
                  setAppMode('home');
                  setStep(0);
                }
              }}
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
                setAppMode('bill');
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
                setAppMode('bill');
    setMaxAccessibleStep(5);
                goToStep(5);
                saveBill(imported).then(refreshRecentBills);
              }}
              onClearAllData={async () => {
                await clearAllLocalData();
                await refreshRecentBills();
                await refreshGroups();
              }}
            />
          )}

          {/* Information & Documentation Modal (Guide, FAQ, About, Terms, Privacy) */}
          {isInfoOpen && (
            <InfoModal
              isOpen={isInfoOpen}
              onClose={() => setIsInfoOpen(false)}
              initialTab={infoTab}
            />
          )}
        </Suspense>
                </>
        ) : null}
      </main>


      {/* Group Modals */}
      <GroupsModal
        isOpen={isGroupsModalOpen}
        groups={groups}
        onClose={() => setIsGroupsModalOpen(false)}
        onCreateNew={() => { setIsGroupsModalOpen(false); setIsCreateGroupOpen(true); }}
        onOpenGroup={async (g) => {
          setActiveGroup(g);
          await refreshGroupBills(g.id);
          setAppMode('group');
          setIsGroupsModalOpen(false);
        }}
        onDeleteGroup={async (id) => {
          await deleteGroup(id);
          await refreshGroups();
        }}
        onImportTrip={async ({ group, bills }) => {
          await saveGroup(group);
          for (const b of bills) {
            await saveBill(b);
          }
          await refreshGroups();
          setActiveGroup(group);
          setGroupBills(bills);
          setAppMode('group');
          setIsGroupsModalOpen(false);
        }}
      />
      <CreateGroupModal
        isOpen={isCreateGroupOpen || isEditGroupOpen}
        initialGroup={isEditGroupOpen && activeGroup ? activeGroup : undefined}
        onClose={() => {
          setIsCreateGroupOpen(false);
          setIsEditGroupOpen(false);
        }}
        onCreate={async (g) => {
          await saveGroup(g);
          await refreshGroups();
          setIsCreateGroupOpen(false);
          setIsEditGroupOpen(false);
          setActiveGroup(g);
          if (!isEditGroupOpen) {
            setGroupBills([]);
          }
          setAppMode('group');
        }}
      />

      {/* App Footer */}
      <Footer 
        onOpenPrivacy={() => openInfoModal('privacy')} 
        onOpenInfo={openInfoModal} 
      />

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
