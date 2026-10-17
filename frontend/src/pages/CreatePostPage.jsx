import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import {
  Camera, UploadCloud, X, Star, IndianRupee,
  MapPin, Calendar, Sparkles, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { processAndStripImage } from '../utils/imageCompressor';

export default function CreatePostPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const [places, setPlaces] = useState([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState(searchParams.get('place_id') || '');
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [monthVisited, setMonthVisited] = useState('October 2026');
  const [spendInr, setSpendInr] = useState('');

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadPlaces() {
      try {
        const res = await api.getPlaces();
        if (res.success) setPlaces(res.places || []);
      } catch (e) {
        console.warn('Failed to load places for dropdown:', e);
      }
    }
    loadPlaces();
  }, []);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (photos.length + files.length > 5) {
      alert('Maximum 5 photos allowed / ಗರಿಷ್ಠ 5 ಫೋಟೋಗಳಿಗೆ ಮಾತ್ರ ಅವಕಾಶ');
      return;
    }

    setIsProcessingPhotos(true);
    setErrorMsg('');

    try {
      const processed = await Promise.all(
        files.map(f => processAndStripImage(f))
      );
      setPhotos(prev => [...prev, ...processed.map(p => p.dataUrl)].slice(0, 5));
    } catch (err) {
      setErrorMsg(err.message || 'Image processing failed');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlaceId) {
      setErrorMsg('Please select a destination / ದಯವಿಟ್ಟು ತಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ');
      return;
    }
    if (!title.trim() || !reviewText.trim()) {
      setErrorMsg('Title and review text are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.createPost({
        place_id: selectedPlaceId,
        title: title.trim(),
        review_text: reviewText.trim(),
        rating,
        month_visited: monthVisited,
        spend_inr: parseFloat(spendInr) || 0,
        photos: photos.length > 0 ? photos : undefined,
        user_id: currentUser?.id || 'demo-user-id'
      });

      if (res.success) {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-5 pb-24">
      {/* Page Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100">
          {t('post.createTitle')}
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {i18n.language === 'kn' ? 'ನಿಮ್ಮ ಪ್ರವಾಸ ಕಥೆ ಮತ್ತು ಫೋಟೋಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ' : 'Share your journey with fellow travellers'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs font-semibold border border-red-200 dark:border-red-800">
          {errorMsg}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
        {/* Destination Picker */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              {t('post.selectPlace')}
            </span>
          </label>
          <select
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
            required
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- {t('post.selectPlacePlaceholder')} --</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {i18n.language === 'kn' ? p.name_kn : p.name} ({p.district})
              </option>
            ))}
          </select>
        </div>

        {/* Story Title */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            {t('post.reviewTitleLabel')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('post.reviewTitlePlaceholder')}
            required
            maxLength={150}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Rating (1-5 stars) */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            {t('post.ratingLabel')}
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? 'text-amber-500 fill-current' : 'text-stone-300 dark:text-stone-700'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 font-bold text-sm text-amber-600">
              {rating}/5
            </span>
          </div>
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            {t('post.reviewTextLabel')}
          </label>
          <textarea
            rows={4}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t('post.reviewTextPlaceholder')}
            required
            maxLength={2000}
            className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
          />
        </div>

        {/* Month & Spend Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {t('post.monthVisitedLabel')}
              </span>
            </label>
            <input
              type="text"
              value={monthVisited}
              onChange={(e) => setMonthVisited(e.target.value)}
              placeholder="e.g. October 2026"
              className="w-full text-xs px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                {t('post.spendLabel')}
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={spendInr}
              onChange={(e) => setSpendInr(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full text-xs px-3 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>
        </div>

        {/* Photo Upload with EXIF Stripping & Previews */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              {t('post.uploadPhotos')}
            </span>
          </label>

          {/* Privacy Notice Banner */}
          <div className="mb-2.5 p-2.5 rounded-xl bg-amber-50/70 dark:bg-stone-800/80 border border-amber-200/60 dark:border-stone-700 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{t('post.privacyNotice')}</span>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {photos.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={src} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-800/30">
              <UploadCloud className="w-7 h-7 text-stone-400 mb-1" />
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                {isProcessingPhotos ? t('common.loading') : 'Choose photo / ಫೋಟೋ ಆಯ್ಕೆಮಾಡಿ'}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5">
                {t('post.photoLimitNotice')}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                disabled={isProcessingPhotos}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isProcessingPhotos}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-red-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{t('post.publishing')}</span>
            </>
          ) : (
            <span>{t('post.publishButton')}</span>
          )}
        </button>
      </form>
    </div>
  );
}
