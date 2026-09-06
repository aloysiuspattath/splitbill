import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxAccessibleStep: number;
}

const STEPS = [
  { step: 1, label: 'Items' },
  { step: 2, label: 'Friends' },
  { step: 3, label: 'Assign' },
  { step: 4, label: 'Tax & Disc' },
  { step: 5, label: 'Result' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxAccessibleStep,
}) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 py-3 bg-[#f2f2f7]/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute left-4 right-4 top-[14px] -translate-y-1/2 h-[2px] bg-slate-200 dark:bg-[#1c1c1e] -z-0" />

        {STEPS.map(({ step, label }) => {
          const isDone = currentStep > step;
          const isCurrent = currentStep === step;
          const isClickable = step <= maxAccessibleStep;

          return (
            <button
              key={step}
              disabled={!isClickable}
              onClick={() => onStepClick(step)}
              className={`relative z-10 flex flex-col items-center group transition-transform ${
                isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-950/80 scale-110'
                    : 'bg-white dark:bg-[#1c1c1e] text-slate-400 dark:text-slate-500 border border-black/5 dark:border-white/10'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step}
              </div>
              <span
                className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-brand-600 dark:text-brand-400 font-bold'
                    : isDone
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
