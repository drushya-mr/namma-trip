import React from 'react';
import { useTranslation } from 'react-i18next';
import { IndianRupee, AlertCircle, CheckCircle2, Utensils, Bus } from 'lucide-react';

export default function BudgetSummary({ breakdown }) {
  const { t, i18n } = useTranslation();
  if (!breakdown) return null;

  const totalMin = (breakdown.total_entry_fees_inr || 0) +
                   (breakdown.estimated_daily_travel_inr || 0) +
                   (breakdown.estimated_daily_food_inr || 0);

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-850 rounded-3xl p-5 sm:p-6 border border-amber-200 dark:border-stone-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-amber-600" />
          {t('planner.budgetBreakdown')}
        </h4>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
          ₹{totalMin} {breakdown.has_unverified_fees ? '(Min)' : ''}
        </span>
      </div>

      {/* Breakdown Items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Entry Fees */}
        <div className="bg-white/80 dark:bg-stone-800/80 p-3 rounded-2xl border border-amber-100 dark:border-stone-700/60">
          <span className="text-stone-500 dark:text-stone-400 block mb-1 font-medium">
            {t('planner.entryFee')}
          </span>
          <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
            ₹{breakdown.total_entry_fees_inr || 0}
          </span>
          {breakdown.has_unverified_fees && (
            <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">
              + {i18n.language === 'kn' ? 'ದೃಢಪಡದ ಶುಲ್ಕಗಳು' : 'unconfirmed fees'}
            </span>
          )}
        </div>

        {/* Travel & Transit */}
        <div className="bg-white/80 dark:bg-stone-800/80 p-3 rounded-2xl border border-amber-100 dark:border-stone-700/60">
          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 mb-1 font-medium">
            <Bus className="w-3 h-3 text-amber-600" />
            <span>{i18n.language === 'kn' ? 'ಸ್ಥಳೀಯ ಸಾರಿಗೆ' : 'Local Travel'}</span>
          </div>
          <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
            ₹{breakdown.estimated_daily_travel_inr || 1000}
          </span>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            {i18n.language === 'kn' ? 'ಅಂದಾಜು ದಿನದ ವೆಚ್ಚ' : 'approx. per day'}
          </span>
        </div>

        {/* Food & Refreshment */}
        <div className="bg-white/80 dark:bg-stone-800/80 p-3 rounded-2xl border border-amber-100 dark:border-stone-700/60">
          <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 mb-1 font-medium">
            <Utensils className="w-3 h-3 text-amber-600" />
            <span>{i18n.language === 'kn' ? 'ಆಹಾರ & ಪಾನೀಯ' : 'Food & Snacks'}</span>
          </div>
          <span className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
            ₹{breakdown.estimated_daily_food_inr || 1200}
          </span>
          <span className="text-[10px] text-stone-400 block mt-0.5">
            {i18n.language === 'kn' ? 'ಕರುನಾಡ ಸಾಂಪ್ರದಾಯಿಕ ಊಟ' : 'approx. per day'}
          </span>
        </div>
      </div>

      {/* Critical Verification Warning Notice */}
      <div className={`mt-3.5 p-3 rounded-2xl flex items-start gap-2 text-xs leading-relaxed ${
        breakdown.has_unverified_fees
          ? 'bg-amber-100/70 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800'
          : 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200'
      }`}>
        {breakdown.has_unverified_fees ? (
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-bold block">
            {breakdown.budget_note}
          </span>
          <span className="text-[11px] opacity-90">
            {breakdown.has_unverified_fees
              ? (i18n.language === 'kn'
                  ? 'ಕೆಲವು ತಾಣಗಳ ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ಲಭ್ಯವಿಲ್ಲ ಅಥವಾ ಪರಸ್ಪರ ವ್ಯತ್ಯಾಸವಿರುವುದರಿಂದ, ಪ್ರಯಾಣಿಸುವ ಮುನ್ನ ಅಧಿಕೃತ ಕೌಂಟರ್‌ನಲ್ಲಿ ವಿಚಾರಿಸಿ.'
                  : 'Because some attraction fees are unverified or conflicting online, confirm exact pricing locally before booking.')
              : (i18n.language === 'kn'
                  ? 'ಎಲ್ಲಾ ಶುಲ್ಕಗಳನ್ನು ಅಧಿಕೃತ ಮೂಲಗಳಿಂದ ತಾಳೆ ನೋಡಲಾಗಿದೆ.'
                  : 'All fees confirmed against verified sources.')}
          </span>
        </div>
      </div>
    </div>
  );
}
