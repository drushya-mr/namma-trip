import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function ReportModal({ isOpen, onClose, targetType, targetId }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await api.submitReport({
        target_type: targetType,
        target_id: targetId,
        reason: reason.trim()
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.message || 'Report submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-amber-600 mb-3">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
            {t('common.reportModalTitle')}
          </h3>
        </div>

        {success ? (
          <div className="py-6 text-center text-xs font-bold text-emerald-600">
            {t('common.reportSuccess')}!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('common.reportReasonPlaceholder')}
              className="w-full text-xs p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting || !reason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
              >
                {submitting ? t('common.loading') : t('common.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
