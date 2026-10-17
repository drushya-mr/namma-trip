import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, IndianRupee, RefreshCw, MessageSquareQuote, ArrowDown, MapPin, ExternalLink } from 'lucide-react';
import VerificationBadge from './VerificationBadge';

export default function PlanCard({ day, onRegenerateDay, isRegenerating = false }) {
  const { t, i18n } = useTranslation();

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 border border-amber-200/70 dark:border-stone-800 shadow-sm relative overflow-hidden">
      {/* Top Day Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-600 text-white font-extrabold text-xs shadow-sm">
              {t('planner.day')} {day.day_number}
            </span>
            <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
              {day.theme}
            </h3>
          </div>
        </div>

        {/* Regenerate this day button */}
        <button
          onClick={() => onRegenerateDay(day.day_number)}
          disabled={isRegenerating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-stone-800 dark:text-amber-300 dark:border-stone-700 transition-colors disabled:opacity-50"
          title={t('planner.regenerateDay')}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-amber-600' : ''}`} />
          <span className="hidden sm:inline">{t('planner.regenerateDay')}</span>
        </button>
      </div>

      {/* Day Stops Timeline */}
      <div className="mt-5 space-y-6">
        {day.stops.map((stop, sIdx) => {
          const isLastStop = sIdx === day.stops.length - 1;

          return (
            <div key={`${stop.place_id}-${sIdx}`} className="relative pl-7 group">
              {/* Timeline Vertical Line & Dot */}
              <div className="absolute left-2.5 top-2.5 w-3 h-3 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 ring-4 ring-amber-100 dark:ring-stone-800 z-10" />
              {!isLastStop && (
                <div className="absolute left-[15px] top-6 bottom-0 w-0.5 bg-stone-200 dark:bg-stone-800" />
              )}

              {/* Stop Card */}
              <div className="bg-amber-50/40 dark:bg-stone-800/40 rounded-2xl p-4 border border-amber-100/70 dark:border-stone-800/80">
                {/* Title & Place link */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to={`/places/${stop.place_id}`}
                      className="group/link inline-flex items-center gap-1 font-bold text-base text-stone-900 dark:text-stone-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <span>{i18n.language === 'kn' ? (stop.name_kn || stop.name) : stop.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </Link>
                    {i18n.language === 'kn' && (
                      <p className="text-xs text-stone-500 dark:text-stone-400">{stop.name}</p>
                    )}
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5">
                      {stop.category} • {stop.district}
                    </p>
                  </div>

                  {/* Verification Badge */}
                  <VerificationBadge verifiedOn={stop.verified_on} />
                </div>

                {/* Timings and Fees row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200/40 dark:border-stone-800/60 text-xs">
                  {/* Timings */}
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{stop.timings || t('place.timings')}</span>
                    {stop.visit_hours && (
                      <span className="text-stone-400">({stop.visit_hours}h {t('planner.visitDuration')})</span>
                    )}
                  </div>

                  {/* Entry Fee */}
                  <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {stop.fee_inr === 0 ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {t('planner.entryFee')}: ₹0 ({i18n.language === 'kn' ? 'ಉಚಿತ' : 'Free'})
                      </span>
                    ) : stop.fee_inr !== null ? (
                      <span className="font-semibold text-stone-900 dark:text-stone-100">
                        {t('planner.entryFee')}: ₹{stop.fee_inr}
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300 font-medium italic">
                        {t('planner.feeNotConfirmed')} {stop.fee_text ? `(${stop.fee_text})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes / Activity */}
                {stop.notes && (
                  <p className="mt-2.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed bg-white/60 dark:bg-stone-900/60 p-2.5 rounded-xl border border-stone-100 dark:border-stone-800">
                    {stop.notes}
                  </p>
                )}

                {/* Destination Kannada Phrase Card */}
                {stop.phrase && (
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-100/60 via-amber-50 to-orange-50 dark:from-stone-900 dark:to-amber-950/30 border border-amber-200/50 dark:border-stone-800 text-xs">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 mb-1">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('planner.travelPhrase')}</span>
                    </div>
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      "{stop.phrase.phrase_kn}"
                    </div>
                    <div className="text-stone-500 dark:text-stone-400 italic text-[11px]">
                      {stop.phrase.transliteration}
                    </div>
                    <div className="text-stone-700 dark:text-stone-300 text-[11px] mt-0.5">
                      Meaning: {stop.phrase.phrase_en}
                    </div>
                  </div>
                )}
              </div>

              {/* Travel Time to Next Stop Banner */}
              {!isLastStop && stop.travel_time_to_next_mins && (
                <div className="my-2.5 ml-4 flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                  <ArrowDown className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                  <span>
                    {t('planner.travelTime')}: ~{stop.travel_time_to_next_mins} mins
                    {stop.dist_to_next_km ? ` (${stop.dist_to_next_km} km)` : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
