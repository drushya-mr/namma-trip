import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import {
  Compass, Sparkles, MapPin, Calendar, IndianRupee, Users,
  Activity, Check, Bookmark, Share2, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PlanCard from '../components/PlanCard';
import BudgetSummary from '../components/BudgetSummary';
import LeafletMap from '../components/LeafletMap';

export default function PlanPage() {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();

  // Planner Form State
  const [startingCity, setStartingCity] = useState('Bengaluru');
  const [days, setDays] = useState(2);
  const [budget, setBudget] = useState(5000);
  const [travelStyle, setTravelStyle] = useState('relaxed');
  const [groupType, setGroupType] = useState('friends');
  const [selectedInterests, setSelectedInterests] = useState(['heritage', 'nature']);

  // Generation & Results State
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingDayNumber, setRegeneratingDayNumber] = useState(null);
  const [plan, setPlan] = useState(null);
  const [savedTrip, setSavedTrip] = useState(false);

  const interestOptions = [
    { id: 'heritage', label: t('planner.interests.heritage'), icon: '🏛️' },
    { id: 'nature', label: t('planner.interests.nature'), icon: '🌿' },
    { id: 'waterfalls', label: t('planner.interests.waterfalls'), icon: '💧' },
    { id: 'temples', label: t('planner.interests.temples'), icon: '🛕' },
    { id: 'beaches', label: t('planner.interests.beaches'), icon: '🏖️' },
    { id: 'adventure', label: t('planner.interests.adventure'), icon: '🧗' },
    { id: 'palaces', label: t('planner.interests.palaces'), icon: '👑' },
    { id: 'wildlife', label: t('planner.interests.wildlife'), icon: '🐅' }
  ];

  const cityOptions = [
    'Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Badami / Vijayapura',
    'Chikkamagaluru', 'Madikeri (Kodagu)', 'Hampi (Hosapete)', 'Kalaburagi / Bidar', 'Chitradurga / Davanagere'
  ];

  const toggleInterest = (id) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setSavedTrip(false);

    try {
      const res = await api.generatePlan({
        startingCity,
        days: parseInt(days),
        budget: parseInt(budget),
        travelStyle,
        groupType,
        interests: selectedInterests,
        language: i18n.language
      });

      if (res.success && res.plan) {
        setPlan(res.plan);
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      alert(err.message || 'Plan generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateDay = async (dayNumber) => {
    if (!plan) return;
    setRegeneratingDayNumber(dayNumber);

    try {
      const res = await api.regenerateDay({
        plan,
        dayNumber,
        language: i18n.language
      });

      if (res.success && res.plan) {
        setPlan(res.plan);
      }
    } catch (err) {
      alert(err.message || 'Regeneration failed');
    } finally {
      setRegeneratingDayNumber(null);
    }
  };

  const handleSaveTrip = async () => {
    if (!plan) return;
    try {
      await api.saveTrip(plan, currentUser?.id || 'demo-user-id');
      setSavedTrip(true);
    } catch (err) {
      alert(err.message || 'Failed to save trip');
    }
  };

  // Collect all stops from all days for map display
  const allStopsForMap = plan?.days ? plan.days.flatMap(d => d.stops || []) : [];

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold mb-1">
          <Compass className="w-3.5 h-3.5 text-amber-600" />
          <span>{t('planner.title')}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {i18n.language === 'kn' ? 'ನಿಮ್ಮ ಕನಸಿನ ಕರ್ನಾಟಕ ಪ್ರವಾಸ' : 'AI Travel Planner for Karnataka'}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {t('planner.subtitle')}
        </p>
      </div>

      {/* Planner Form */}
      <form onSubmit={handleGeneratePlan} className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        {/* Starting City Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {t('planner.startingCityLabel')}
            </span>
          </label>
          <select
            value={startingCity}
            onChange={(e) => setStartingCity(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
          >
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Days & Budget Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Days count */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {t('planner.daysLabel')}
              </span>
            </label>
            <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800 rounded-2xl p-1 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setDays(Math.max(1, days - 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold flex items-center justify-center hover:bg-amber-100 transition-colors shadow-sm"
              >
                -
              </button>
              <span className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                {days} {i18n.language === 'kn' ? 'ದಿನ' : 'Days'}
              </span>
              <button
                type="button"
                onClick={() => setDays(Math.min(7, days + 1))}
                className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-bold flex items-center justify-center hover:bg-amber-100 transition-colors shadow-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                {t('planner.budgetLabel')}
              </span>
            </label>
            <input
              type="number"
              min="1000"
              step="500"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
            />
          </div>
        </div>

        {/* Travel Style & Group Type */}
        <div className="grid grid-cols-2 gap-3">
          {/* Style */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                {t('planner.travelStyleLabel')}
              </span>
            </label>
            <div className="flex rounded-2xl bg-stone-50 dark:bg-stone-800 p-1 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setTravelStyle('relaxed')}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  travelStyle === 'relaxed'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-stone-500'
                }`}
              >
                {t('planner.relaxed')}
              </button>
              <button
                type="button"
                onClick={() => setTravelStyle('packed')}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  travelStyle === 'packed'
                    ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                    : 'text-stone-500'
                }`}
              >
                {t('planner.packed')}
              </button>
            </div>
          </div>

          {/* Group */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                {t('planner.groupTypeLabel')}
              </span>
            </label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold"
            >
              <option value="solo">{t('planner.solo')}</option>
              <option value="friends">{t('planner.friends')}</option>
              <option value="family">{t('planner.family')}</option>
            </select>
          </div>
        </div>

        {/* Interests Multi-Select Chips */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
            {t('planner.interestsLabel')}
          </label>
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((opt) => {
              const active = selectedInterests.includes(opt.id);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggleInterest(opt.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm shadow-amber-500/20'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Generate Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              <span>{t('planner.generating')}</span>
            </>
          ) : (
            <>
              <Compass className="w-5 h-5" />
              <span>{t('planner.generateButton')}</span>
            </>
          )}
        </button>
      </form>

      {/* Generated Itinerary Output Section */}
      {plan && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Plan Header & Action Bar */}
          <div className="bg-amber-100/60 dark:bg-stone-800/60 p-4 rounded-3xl border border-amber-200 dark:border-stone-700 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                {plan.title}
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                {plan.summary}
              </p>
            </div>

            <button
              onClick={handleSaveTrip}
              className={`p-2.5 rounded-2xl flex items-center gap-1 text-xs font-bold transition-all ${
                savedTrip
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-stone-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-stone-700 hover:bg-amber-50'
              }`}
            >
              {savedTrip ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{savedTrip ? t('planner.tripSaved') : t('planner.saveTrip')}</span>
            </button>
          </div>

          {/* Interactive Route Map */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-stone-700 dark:text-stone-300 px-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              {t('planner.interactiveRouteMap')}
            </h4>
            <LeafletMap stops={allStopsForMap} />
          </div>

          {/* Day-by-Day Plan Cards */}
          <div className="space-y-4">
            {plan.days.map((day) => (
              <PlanCard
                key={day.day_number}
                day={day}
                onRegenerateDay={handleRegenerateDay}
                isRegenerating={regeneratingDayNumber === day.day_number}
              />
            ))}
          </div>

          {/* Budget Summary with explicit unverified fees notice */}
          <BudgetSummary breakdown={plan.budget_breakdown} />
        </div>
      )}
    </div>
  );
}
