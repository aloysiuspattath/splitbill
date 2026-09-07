import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  HelpCircle, 
  Info, 
  FileText, 
  ShieldCheck, 
  Receipt 
} from 'lucide-react';
import { GuideTab } from './info/GuideTab';
import { FaqTab } from './info/FaqTab';
import { AboutTab } from './info/AboutTab';
import { TermsTab } from './info/TermsTab';
import { PrivacyTab } from './info/PrivacyTab';

export type InfoTabType = 'guide' | 'faq' | 'about' | 'terms' | 'privacy';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InfoTabType;
}

interface TabConfig {
  id: InfoTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'about', label: 'About', icon: Info },
  { id: 'terms', label: 'Terms', icon: FileText },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck },
];

export const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'guide',
}) => {
  const [activeTab, setActiveTab] = useState<InfoTabType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabClick = (tabId: InfoTabType) => {
    setActiveTab(tabId);
    // Optionally update window hash for easy link sharing
    try {
      window.history.replaceState(null, '', `#${tabId}`);
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    // Clear hash if it matches an info tab
    if (['#guide', '#faq', '#about', '#terms', '#privacy'].includes(window.location.hash)) {
      try {
        window.history.replaceState(null, '', window.location.pathname);
      } catch {
        // ignore
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-slideUp border border-black/5 dark:border-white/10">
        
        {/* Sticky Header with Title and Close Button */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                SplitBill Information
              </h2>
              <span className="text-[10px] font-bold text-slate-400">
                100% Free &amp; Private Bill Splitter
              </span>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2c2c2e] transition-colors"
            title="Close"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#161618] border-b border-slate-100 dark:border-slate-800/80 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex gap-1.5 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/25 scale-[1.02]'
                      : 'bg-white dark:bg-[#252528] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/60 dark:border-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'guide' && <GuideTab />}
          {activeTab === 'faq' && <FaqTab />}
          {activeTab === 'about' && <AboutTab />}
          {activeTab === 'terms' && <TermsTab />}
          {activeTab === 'privacy' && <PrivacyTab />}
        </div>

        {/* Bottom Bar */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1c1c1e] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-semibold text-slate-400">
            https://splitbill.techfliq.com
          </span>
          <button
            onClick={handleClose}
            className="py-2 px-4 rounded-xl bg-slate-200 dark:bg-[#2c2c2e] hover:bg-slate-300 dark:hover:bg-[#38383a] text-slate-800 dark:text-white font-bold text-xs active:scale-95 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
