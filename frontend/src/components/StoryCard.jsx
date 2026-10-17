import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Heart, Bookmark, MessageCircle, Share2, Star, MapPin,
  ChevronLeft, ChevronRight, ExternalLink, Flag, Sparkles, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { generateStoryShareCard, shareOrDownloadStory } from '../utils/shareCard';

export default function StoryCard({ post, onReport }) {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();

  // Optimistic UI state
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isSaved, setIsSaved] = useState(post.is_saved || false);
  const [savesCount, setSavesCount] = useState(post.saves_count || 0);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Photo carousel index
  const [photoIdx, setPhotoIdx] = useState(0);
  const photos = post.photos && post.photos.length > 0
    ? post.photos
    : ['https://images.unsplash.com/photo-1600100397608-f010e421e42e?auto=format&fit=crop&w=1200&q=80'];

  // AI Translation state
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Share card generating state
  const [isSharing, setIsSharing] = useState(false);

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await api.toggleLike(post.id, currentUser?.id || 'demo-user-id');
    } catch (err) {
      // Revert on failure
      setIsLiked(!nextState);
      setLikesCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleSave = async () => {
    const nextState = !isSaved;
    setIsSaved(nextState);
    setSavesCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await api.toggleSave(post.id, currentUser?.id || 'demo-user-id');
    } catch (err) {
      setIsSaved(!nextState);
      setSavesCount(prev => !nextState ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleLoadComments = async () => {
    if (!showComments) {
      try {
        const res = await api.getPostById(post.id, currentUser?.id);
        if (res.success && res.post?.comments) {
          setComments(res.post.comments);
        }
      } catch (e) {
        // quiet error
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(post.id, currentUser?.id || 'demo-user-id', commentText.trim());
      if (res.success && res.comment) {
        setComments(prev => [...prev, res.comment]);
        setCommentsCount(prev => prev + 1);
        setCommentText('');
      }
    } catch (err) {
      alert(err.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null); // toggle off
      return;
    }
    setIsTranslating(true);
    try {
      const res = await api.translateText(post.review_text, i18n.language);
      if (res.success) {
        setTranslatedText(res.translated_text);
      }
    } catch (err) {
      console.warn('Translate error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleShareStory = async () => {
    setIsSharing(true);
    try {
      const cardDataUrl = await generateStoryShareCard({
        title: post.title,
        placeNameKn: post.place?.name_kn || post.place?.name,
        placeNameEn: post.place?.name,
        district: post.place?.district || '',
        rating: post.rating,
        spend: post.spend_inr,
        author: post.author?.display_name,
        notes: post.review_text,
        imageUrl: photos[0]
      });

      await shareOrDownloadStory(cardDataUrl, post.title);
    } catch (err) {
      console.error('Share story error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const author = post.author || { display_name: 'ಪ್ರವಾಸಿಗ' };
  const showSocials = author.show_social_links && author.social_urls;

  return (
    <article className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden transition-all">
      {/* 1. Header: Author and Options */}
      <div className="p-4 flex items-center justify-between">
        <Link to={`/profile/${author.id || 'demo-user-id'}`} className="flex items-center gap-3 group">
          <img
            src={author.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={author.display_name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-400 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">
                {author.display_name}
              </span>
            </div>
            {author.home_city && (
              <span className="text-[11px] text-stone-400 block -mt-0.5">
                {author.home_city}
              </span>
            )}
          </div>
        </Link>

        {/* Report button */}
        <button
          onClick={() => onReport && onReport('post', post.id)}
          className="text-stone-400 hover:text-red-600 p-1.5 rounded-full transition-colors"
          title={t('common.report')}
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Photo Carousel */}
      <div className="relative aspect-[4/3] bg-stone-950 overflow-hidden group/carousel">
        <img
          src={photos[photoIdx]}
          alt={post.title}
          className="w-full h-full object-cover select-none transition-transform duration-300"
          loading="lazy"
        />

        {/* Prev / Next controls if multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicator Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
              {photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === photoIdx ? 'bg-amber-400 w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Place Tag Overlay Pill */}
        {post.place && (
          <Link
            to={`/places/${post.place_id}`}
            className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-md hover:bg-black/80 transition-all border border-white/20"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{i18n.language === 'kn' ? (post.place.name_kn || post.place.name) : post.place.name}</span>
            <span className="opacity-60">• {post.place.district}</span>
          </Link>
        )}
      </div>

      {/* 3. Action Row (Likes, Comments, Saves, Share Story Card) */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-xs font-bold transition-all active:scale-125 ${
                isLiked ? 'text-red-600' : 'text-stone-600 dark:text-stone-300 hover:text-red-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={handleLoadComments}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-amber-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{commentsCount}</span>
            </button>

            {/* Share to Instagram Story */}
            <button
              onClick={handleShareStory}
              disabled={isSharing}
              className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-300 hover:text-amber-600 transition-colors disabled:opacity-50"
              title={t('feed.downloadStoryCard')}
            >
              <Share2 className={`w-5 h-5 ${isSharing ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden xs:inline">{t('feed.shareStory')}</span>
            </button>
          </div>

          {/* Bookmark / Save */}
          <button
            onClick={handleSave}
            className={`p-1.5 rounded-full transition-all active:scale-125 ${
              isSaved ? 'text-amber-600' : 'text-stone-600 dark:text-stone-300 hover:text-amber-600'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Rating and Spend metadata */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          {/* Star rating */}
          <div className="flex items-center text-amber-500">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < post.rating ? 'fill-current' : 'text-stone-300 dark:text-stone-700'}`}
              />
            ))}
          </div>

          {post.month_visited && (
            <span className="text-stone-400 text-[11px]">• {post.month_visited}</span>
          )}

          {post.spend_inr > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-stone-800 dark:text-amber-300 text-[11px] font-semibold">
              ₹{post.spend_inr}
            </span>
          )}
        </div>

        {/* Title and Caption */}
        <div className="mt-2.5">
          <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
            {post.title}
          </h4>
          <p className="mt-1 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            {translatedText ? translatedText : post.review_text}
          </p>

          {/* AI Translation attribution */}
          {translatedText && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              <Sparkles className="w-3 h-3" />
              <span>{t('common.translatedByAi')}</span>
            </div>
          )}

          {/* Translate toggle link */}
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="mt-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline"
          >
            {isTranslating ? t('common.loading') : translatedText ? 'Show original / ಮೂಲ ನೋಡಿ' : t('common.translateLink')}
          </button>
        </div>

        {/* Author Social Media Links (if opted in) */}
        {showSocials && (
          <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2.5 text-xs text-stone-500">
            <span className="text-[11px] font-medium text-stone-400">ಸಾಮಾಜಿಕ ಕೊಂಡಿಗಳು:</span>
            {author.social_urls.instagram_url && (
              <a
                href={author.social_urls.instagram_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
              >
                Instagram <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {author.social_urls.youtube_url && (
              <a
                href={author.social_urls.youtube_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-red-600 hover:underline flex items-center gap-0.5"
              >
                YouTube <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {author.social_urls.x_url && (
              <a
                href={author.social_urls.x_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-stone-700 dark:text-stone-300 hover:underline flex items-center gap-0.5"
              >
                X <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        )}

        {/* 4. Comments Section */}
        {showComments && (
          <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2.5 animate-in fade-in duration-150">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="text-xs bg-stone-50 dark:bg-stone-800/50 p-2 rounded-xl">
                  <span className="font-bold text-stone-900 dark:text-stone-100 mr-1.5">
                    {c.user?.display_name || 'ಪ್ರವಾಸಿಗ'}:
                  </span>
                  <span className="text-stone-700 dark:text-stone-300">{c.text}</span>
                </div>
              ))}
            </div>

            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('feed.addCommentPlaceholder')}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
}
