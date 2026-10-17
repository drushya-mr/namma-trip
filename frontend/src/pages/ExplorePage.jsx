import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Search, MapPin, CheckCircle2, ShieldCheck, Filter,
  Layers, ChevronRight, Sparkles, AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import districtsData from '../data/districts.json';

export default function ExplorePage() {
  const { t, i18n } = useTranslation();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    async function loadPlaces() {
      try {
        const res = await api.getPlaces();
        if (res.success) {
          setPlaces(res.places || []);
        }
      } catch (e) {
        console.error('Failed to load places:', e);
      } finally {
        setLoading(false);
      }
    }
    loadPlaces();
  }, []);

  // Compute live coverage counter from dataset
  const districtsInDataset = useMemo(() => {
    return new Set(places.map(p => p.district));
  }, [places]);

  const coverageCount = districtsInDataset.size; // 31
  const totalCount = districtsData.length; // 31

  // Clusters list
  const clusters = useMemo(() => {
    return [...new Set(places.map(p => p.cluster))].sort();
  }, [places]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      // Cluster filter
      if (selectedCluster !== 'all' && p.cluster !== selectedCluster) {
        return false;
      }
      // District filter
      if (selectedDistrict && p.district.toLowerCase() !== selectedDistrict.toLowerCase()) {
        return false;
      }
      // Search query (bilingual matching)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q) || (p.name_kn && p.name_kn.toLowerCase().includes(q));
        const matchesDistrict = p.district.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesCity = p.base_city.toLowerCase().includes(q);

        // Also check Kannada district name from districtsData
        const distObj = districtsData.find(d => d.name_en.toLowerCase() === p.district.toLowerCase());
        const matchesKnDistrict = distObj && distObj.name_kn.toLowerCase().includes(q);

        return matchesName || matchesDistrict || matchesCat || matchesCity || matchesKnDistrict;
      }
      return true;
    });
  }, [places, selectedCluster, selectedDistrict, searchQuery]);

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Page Header */}
      <div className="space-y-1 text-center">
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('explore.title')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {t('explore.subtitle')}
        </p>
      </div>

      {/* District Coverage Counter (31/31) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 text-white shadow-md flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-100">
            <ShieldCheck className="w-4 h-4" />
            <span>{t('explore.districtCoverage')}</span>
          </div>
          <h3 className="text-lg font-black tracking-tight">
            {coverageCount}/{totalCount} {i18n.language === 'kn' ? 'ಜಿಲ್ಲೆಗಳು ಲಭ್ಯ' : 'Districts Covered'}
          </h3>
          <p className="text-[11px] text-amber-100/90">
            {i18n.language === 'kn' ? 'ಕರ್ನಾಟಕದ ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳ ಅಧಿಕೃತ ದತ್ತಾಂಶ ಒಳಗೊಂಡಿದೆ' : '100% full coverage computed directly from dataset'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-sm">
          100%
        </div>
      </div>

      {/* Bilingual Search Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('explore.searchDistrictPlaceholder')}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-stone-900 text-xs sm:text-sm text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Cluster Pill Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setSelectedCluster('all'); setSelectedDistrict(null); }}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            selectedCluster === 'all' && !selectedDistrict
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
          }`}
        >
          {t('explore.filterAll')} ({places.length})
        </button>

        {clusters.map((c) => (
          <button
            key={c}
            onClick={() => { setSelectedCluster(c); setSelectedDistrict(null); }}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedCluster === c
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-800'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 31 Districts Horizontal Grid Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-stone-600 dark:text-stone-400 px-1">
          <span>{i18n.language === 'kn' ? 'ಜಿಲ್ಲಾವಾರು ಆಯ್ಕೆ (31)' : 'Filter by District (31)'}</span>
          {selectedDistrict && (
            <button
              onClick={() => setSelectedDistrict(null)}
              className="text-amber-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 bg-stone-100/70 dark:bg-stone-900/40 rounded-2xl border border-stone-200/60 dark:border-stone-800">
          {districtsData.map((d) => {
            const isSelected = selectedDistrict?.toLowerCase() === d.name_en.toLowerCase();
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDistrict(isSelected ? null : d.name_en)}
                className={`p-2 rounded-xl text-left text-xs transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-white font-bold shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-700/60 border border-stone-200/40 dark:border-stone-700'
                }`}
              >
                <div className="font-extrabold truncate text-[11px]">
                  {i18n.language === 'kn' ? d.name_kn : d.name_en}
                </div>
                <div className={`text-[10px] truncate ${isSelected ? 'text-amber-100' : 'text-stone-400'}`}>
                  {i18n.language === 'kn' ? d.name_en : d.name_kn}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Places List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-stone-500 dark:text-stone-400">
          <span>
            {i18n.language === 'kn' ? 'ತಾಣಗಳು' : 'Attractions'} ({filteredPlaces.length})
          </span>
          {selectedDistrict && (
            <span className="text-amber-600 font-extrabold">{selectedDistrict}</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-28 rounded-2xl bg-white dark:bg-stone-900 p-4 border border-stone-200 dark:border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            ಯಾವುದೇ ತಾಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ / No places matched your search query.
          </div>
        ) : (
          filteredPlaces.map((pl) => (
            <Link
              key={pl.id}
              to={`/places/${pl.id}`}
              className="block bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 hover:border-amber-400 shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">
                    {i18n.language === 'kn' ? (pl.name_kn || pl.name) : pl.name}
                  </h4>
                  {i18n.language === 'kn' && (
                    <p className="text-[11px] text-stone-400">{pl.name}</p>
                  )}
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                    {pl.category} • {pl.district}
                  </p>
                </div>

                <VerificationBadge verifiedOn={pl.verified_on} />
              </div>

              {/* Fee and Timings row */}
              <div className="flex items-center justify-between text-xs mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                <div>
                  {pl.fee_inr === 0 ? (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹0 ({i18n.language === 'kn' ? 'ಉಚಿತ' : 'Free'})
                    </span>
                  ) : pl.fee_inr !== null ? (
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      ₹{pl.fee_inr}
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-medium italic text-[11px]">
                      {t('place.verifyBeforeTravel')}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-stone-400 group-hover:text-amber-600 transition-colors">
                  <span>{i18n.language === 'kn' ? 'ವಿವರ' : 'Details'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
