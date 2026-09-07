import React from 'react';
import { FileText, ShieldAlert } from 'lucide-react';

export const TermsTab: React.FC = () => {
  return (
    <div className="space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
      {/* Header Banner */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-base">
        <FileText className="w-5 h-5 text-brand-600" />
        <h3>Terms &amp; Conditions</h3>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Last updated: September 2026. Please read these terms carefully before using SplitBill.
      </p>

      {/* Sections */}
      <div className="space-y-4 text-xs leading-relaxed">
        {/* 1. Acceptance */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">1.</span> Acceptance of Terms
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            By accessing or using SplitBill (splitbill.techfliq.com) or installing it as a Progressive Web Application, you agree to be bound by these Terms and Conditions. If you disagree with any portion of these terms, please do not use the application.
          </p>
        </div>

        {/* 2. Nature of Service */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">2.</span> Description of Service &amp; Client-Side Operation
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            SplitBill is a free, client-side utility tool designed to help individuals calculate, allocate, and organize informal bill splits and group trip expenses. SplitBill operates entirely within your web browser. No user accounts are maintained on any remote servers.
          </p>
        </div>

        {/* 3. Non-Financial Institution Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5">
          <h4 className="font-black text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>3. No Financial Services or Payment Processing</span>
          </h4>
          <p className="text-amber-800/90 dark:text-amber-300/90">
            SplitBill is an expense calculator, NOT a bank, payment gateway, money transmitter, or financial intermediary. SplitBill does not collect, hold, transfer, or process actual currency. Any monetary settlements or transfers between parties (e.g. via cash, UPI, bank transfer, or third-party payment apps) occur strictly between users off-platform.
          </p>
        </div>

        {/* 4. Accuracy & Verification */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">4.</span> Calculation Accuracy &amp; OCR Verification
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            While our calculation engine adheres to strict mathematical integrity (integer-based Largest Remainder method with 0 rounding drift), OCR receipt scanning is an automated visual aid. Receipt quality, lighting, and restaurant fonts may affect OCR accuracy. Users are responsible for reviewing and confirming extracted item names and prices before finalizing any split.
          </p>
        </div>

        {/* 5. User Data & Local Storage */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">5.</span> Data Ownership &amp; Local Retention
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            All bill records and group databases are stored locally on your device in your browser's IndexedDB. Because SplitBill maintains no central server, clearing your browser history or site data may remove locally stored bills unless you have exported them as JSON or PDF files. Users are solely responsible for exporting backups.
          </p>
        </div>

        {/* 6. Limitation of Liability */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">6.</span> "As Is" Warranty &amp; Limitation of Liability
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            SplitBill is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. Under no circumstances shall TechFliq, its developers, or contributors be held liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use this service.
          </p>
        </div>

        {/* 7. Modifications */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252528] border border-slate-100 dark:border-slate-800 space-y-1 shadow-2xs">
          <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
            <span className="text-brand-600">7.</span> Changes to Terms
          </h4>
          <p className="text-slate-600 dark:text-slate-300">
            We reserve the right to revise or modify these terms at any time by updating this page. Continued use of SplitBill after any changes constitutes your agreement to the modified terms.
          </p>
        </div>
      </div>
    </div>
  );
};
