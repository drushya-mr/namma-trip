import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Sparkles, TrendingUp, MapPin, Flame } from 'lucide-react';
import { api } from '../services/api';
import StoryCard from '../components/StoryCard';
import ReportModal from '../components/ReportModal';

export default function HomeFeedPage() {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [trendingPlaces, setTrendingPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Moderation report modal
  const [reportModal, setReportModal] = useState({ isOpen: false, type: '', id: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [feedRes, placesRes] = await Promise.all([
          api.getFeed(),
          api.getPlaces({ limit: 8 })
        ]);

        if (feedRes.success) setPosts(feedRes.posts || []);
        if (placesRes.success) {
          // Select 6 well-known places for trending row
          const trendingIds = ['virupaksha-temple-hampi', 'mysore-palace', 'jog-falls', 'mullayanagiri', 'gokarna-mahabaleshwar-temple-beaches', 'badami-cave-temples'];
          const matched = placesRes.places.filter(p => trendingIds.includes(p.id));
          setTrendingPlaces(matched.length > 0 ? matched : placesRes.places.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load feed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenReport = (type, id) => {
    setReportModal({ isOpen: true, type, id });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Welcome & Hackathon Banner */}
      <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 text-white shadow-lg shadow-amber-500/20">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider">
              {t('app.greeting')}
            </span>
            <span className="text-[11px] font-semibold text-amber-100">
              31/31 {i18n.language === 'kn' ? 'ಜಿಲ್ಲೆಗಳು' : 'Districts'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold leading-snug">
            {i18n.language === 'kn'
              ? 'ಕರುನಾಡಿನ ಪ್ರವಾಸವನ್ನು ಸುಲಭವಾಗಿ ಯೋಜಿಸಿ'
              : 'Discover & Plan Karnataka Like Never Before'}
          </h2>

          <p className="text-xs text-amber-100 leading-relaxed max-w-sm">
            {t('app.onboardingNotice')}
          </p>

          <div className="pt-2">
            <Link
              to="/plan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-stone-900 font-extrabold text-xs shadow-md hover:bg-amber-50 transition-all active:scale-95"
            >
              <Compass className="w-4 h-4 text-amber-600" />
              <span>{t('planner.generateButton')}</span>
            </Link>
          </div>
        </div>

        {/* Decorative corner icon */}
        <Sparkles className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 pointer-events-none" />
      </div>

      {/* Trending Places Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-red-600 animate-pulse" />
            <span>{t('feed.trending')}</span>
          </h3>
          <Link
            to="/explore"
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            {t('explore.filterAll')} →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {trendingPlaces.map((pl) => (
            <Link
              key={pl.id}
              to={`/places/${pl.id}`}
              className="flex-shrink-0 w-36 snap-start bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 p-2.5 shadow-sm hover:border-amber-400 transition-all group"
            >
              <div className="w-full h-24 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white mb-2 shadow-inner font-bold text-xs p-2 text-center">
                {i18n.language === 'kn' ? (pl.name_kn || pl.name) : pl.name}
              </div>
              <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-600 transition-colors">
                {i18n.language === 'kn' ? (pl.name_kn || pl.name) : pl.name}
              </h4>
              <p className="text-[10px] text-stone-400 truncate mt-0.5">
                {pl.district}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stories Feed */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2 px-1">
          <TrendingUp className="w-4 h-4 text-amber-600" />
          <span>{t('feed.storiesTitle')}</span>
        </h3>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white dark:bg-stone-900 rounded-3xl p-4 space-y-3 animate-pulse border border-stone-200 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 dark:bg-stone-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-24 h-3 rounded bg-stone-200 dark:bg-stone-800" />
                    <div className="w-16 h-2 rounded bg-stone-200 dark:bg-stone-800" />
                  </div>
                </div>
                <div className="aspect-[4/3] rounded-2xl bg-stone-200 dark:bg-stone-800" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            {t('feed.emptyFeed')}
          </div>
        ) : (
          posts.map((post) => (
            <StoryCard
              key={post.id}
              post={post}
              onReport={handleOpenReport}
            />
          ))
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, type: '', id: '' })}
        targetType={reportModal.type}
        targetId={reportModal.id}
      />
    </div>
  );
}
