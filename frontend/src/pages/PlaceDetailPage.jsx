import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Clock, IndianRupee, Calendar, ExternalLink,
  Star, Share2, Compass, AlertTriangle, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import VerificationBadge from '../components/VerificationBadge';
import AskAiBox from '../components/AskAiBox';
import LeafletMap from '../components/LeafletMap';
import StoryCard from '../components/StoryCard';
import { generateStoryShareCard, shareOrDownloadStory } from '../utils/shareCard';

export default function PlaceDetailPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();

  const [place, setPlace] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    async function loadPlaceData() {
      try {
        const [placeRes, postsRes] = await Promise.all([
          api.getPlaceById(id),
          api.getFeed({ place_id: id })
        ]);

        if (placeRes.success) setPlace(placeRes.place);
        if (postsRes.success) setPosts(postsRes.posts || []);
      } catch (err) {
        console.error('Failed to load place:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlaceData();
  }, [id]);

  const handleSharePlace = async () => {
    if (!place) return;
    setSharing(true);
    try {
      const cardDataUrl = await generateStoryShareCard({
        title: place.name,
        placeNameKn: place.name_kn,
        placeNameEn: place.name,
        district: place.district,
        spend: place.fee_inr || '',
        notes: place.notes || place.description_kn
      });
      await shareOrDownloadStory(cardDataUrl, place.name);
    } catch (e) {
      console.warn('Share place card failed:', e);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center text-xs text-stone-500 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  if (!place) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-3">
        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">Place not found / ತಾಣ ಕಂಡುಬಂದಿಲ್ಲ</p>
        <Link to="/explore" className="text-xs text-amber-600 font-bold hover:underline">
          ← Back to Explore / ಹಿಂದಿರುಗಿ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Back button & Action bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-amber-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{i18n.language === 'kn' ? 'ಅನ್ವೇಷಣೆಗೆ ಮರಳಿ' : 'Back'}</span>
        </Link>

        <button
          onClick={handleSharePlace}
          disabled={sharing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 dark:bg-stone-800 dark:text-amber-300 dark:border-stone-700 transition-all shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{t('feed.shareStory')}</span>
        </button>
      </div>

      {/* Place Banner Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        {/* Verification Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
            {place.category}
          </span>
          <VerificationBadge verifiedOn={place.verified_on} />
        </div>

        {/* Place Names */}
        <div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 leading-snug">
            {place.name_kn}
          </h2>
          <p className="text-sm font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
            {place.name}
          </p>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{place.district} District • {place.cluster}</span>
          </p>
        </div>

        {/* Kannada Description */}
        {place.description_kn && (
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-amber-50/40 dark:bg-stone-800/40 p-3 rounded-2xl border border-amber-100/60 dark:border-stone-800">
            {place.description_kn}
          </p>
        )}

        {/* Key Place Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          {/* Timings */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('place.timings')}</span>
            </div>
            <p className="font-extrabold text-stone-900 dark:text-stone-100">
              {place.timings || 'ಸ್ಥಳೀಯವಾಗಿ ಪರಿಶೀಲಿಸಿ'}
            </p>
            {place.visit_hours && (
              <span className="text-[10px] text-stone-400 block mt-0.5">
                ~{place.visit_hours}h {t('planner.visitDuration')}
              </span>
            )}
          </div>

          {/* Entry Fee with strict grounding rule */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1 font-semibold">
              <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('place.entryFee')}</span>
            </div>
            {place.fee_inr === 0 ? (
              <p className="font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹0 ({i18n.language === 'kn' ? 'ಉಚಿತ ಪ್ರವೇಶ' : 'Free Entry'})
              </p>
            ) : place.fee_inr !== null ? (
              <p className="font-extrabold text-stone-900 dark:text-stone-100">
                ₹{place.fee_inr}
              </p>
            ) : (
              <p className="font-bold text-amber-700 dark:text-amber-400 text-[11px] italic">
                {t('place.verifyBeforeTravel')}
              </p>
            )}
            {place.fee_text && (
              <span className="text-[10px] text-stone-400 block mt-0.5 line-clamp-1" title={place.fee_text}>
                {place.fee_text}
              </span>
            )}
          </div>

          {/* Best Months */}
          {place.best_months && (
            <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
              <div className="flex items-center gap-1.5 text-stone-400 mb-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('place.bestMonths')}</span>
              </div>
              <p className="font-extrabold text-stone-900 dark:text-stone-100">
                {place.best_months}
              </p>
            </div>
          )}

          {/* Base City */}
          <div className="bg-stone-50 dark:bg-stone-800/60 p-3 rounded-2xl border border-stone-200/60 dark:border-stone-700/60">
            <div className="flex items-center gap-1.5 text-stone-400 mb-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('place.baseCity')}</span>
            </div>
            <p className="font-extrabold text-stone-900 dark:text-stone-100 truncate">
              {place.base_city}
            </p>
          </div>
        </div>

        {/* Source Hint & URL */}
        {(place.source_hint || place.source_url) && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{t('place.officialSource')}:</span>
              <span>{place.source_hint || 'Karnataka Tourism'}</span>
            </div>
            {place.source_url && (
              <a
                href={place.source_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 truncate font-medium"
              >
                {place.source_url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Map if coordinates are present */}
      {place.lat && place.lng ? (
        <div className="space-y-2">
          <h4 className="font-extrabold text-xs text-stone-700 dark:text-stone-300 px-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>ಸ್ಥಳ ನಕ್ಷೆ / Location Map</span>
          </h4>
          <LeafletMap stops={[place]} className="h-56 w-full rounded-3xl overflow-hidden shadow-sm" />
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-900 dark:bg-stone-800 dark:text-amber-300 text-xs flex items-center gap-2 border border-amber-200/60 dark:border-stone-700">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            {i18n.language === 'kn'
              ? 'ಈ ತಾಣದ ನಿಖರ ಭೌಗೋಳಿಕ ಅಕ್ಷಾಂಶ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ನಕ್ಷೆಯಿಂದ ಬಿಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ಥಳೀಯವಾಗಿ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.'
              : 'Exact GPS coordinates unconfirmed for this place; skipped on map to prevent inaccuracy.'}
          </span>
        </div>
      )}

      {/* Ask a Question (AI + Community) */}
      <AskAiBox placeId={place.id} place={place} />

      {/* Community Stories & Reviews for this place */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span>{t('place.reviewsCount')} ({posts.length})</span>
          </h3>
          <Link
            to={`/post?place_id=${place.id}`}
            className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
          >
            + {t('post.createTitle')}
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
            {i18n.language === 'kn'
              ? 'ಈ ತಾಣಕ್ಕೆ ಇನ್ನೂ ಯಾರೂ ವಿಮರ್ಶೆ ನೀಡಿಲ್ಲ. ಮೊದಲಿಗರಾಗಿ ನಿಮ್ಮ ಅನುಭವ ಹಂಚಿಕೊಳ್ಳಿ!'
              : 'No reviews yet for this place. Be the first to share your trip story!'}
          </div>
        ) : (
          posts.map((p) => (
            <StoryCard key={p.id} post={p} />
          ))
        )}
      </div>
    </div>
  );
}
