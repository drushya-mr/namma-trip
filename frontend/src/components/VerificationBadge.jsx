import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function VerificationBadge({ verifiedOn, className = '' }) {
  const { t, i18n } = useTranslation();
  const isVerified = Boolean(verifiedOn);

  if (isVerified) {
    const dateText = verifiedOn.split(' ')[0];
    const label = i18n.language === 'kn'
      ? `${dateText} ${t('place.verifiedOn')}`
      : `${t('place.verifiedOn')} ${dateText}`;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
        title={`Verified online on ${dateText}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 ${className}`}
      title="Fees and timings unconfirmed. Confirm with authorities before travel."
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
      <span>{t('place.verifyBeforeTravel')}</span>
    </span>
  );
}
