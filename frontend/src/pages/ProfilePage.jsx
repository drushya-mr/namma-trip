import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Settings, ExternalLink, Globe, MapPin, Edit3,
  Bookmark, Grid, LogIn, Check, Sparkles, Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StoryCard from '../components/StoryCard';

export default function ProfilePage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { currentUser, loginAsDemo, updateUserProfile, toggleLanguage } = useAuth();

  const isOwnProfile = !id || id === currentUser?.id;
  const targetUserId = id || currentUser?.id || 'demo-user-id';

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'trips'

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    home_city: '',
    instagram_handle: '',
    youtube_handle: '',
    x_handle: '',
    facebook_handle: '',
    website_url: '',
    show_social_links: true,
    preferred_language: 'kn'
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.getProfile(targetUserId);
        if (res.success) {
          setProfile(res.profile);
          setPosts(res.posts || []);
          setTrips(res.trips || []);
          setEditForm({
            display_name: res.profile.display_name || '',
            bio: res.profile.bio || '',
            home_city: res.profile.home_city || '',
            instagram_handle: res.profile.instagram_handle || '',
            youtube_handle: res.profile.youtube_handle || '',
            x_handle: res.profile.x_handle || '',
            facebook_handle: res.profile.facebook_handle || '',
            website_url: res.profile.website_url || '',
            show_social_links: res.profile.show_social_links ?? true,
            preferred_language: res.profile.preferred_language || 'kn'
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [targetUserId, currentUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateUserProfile(editForm);
      setProfile(prev => ({ ...prev, ...updated }));
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Profile update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center text-xs text-stone-500 animate-pulse">
        {t('common.loading')}
      </div>
    );
  }

  const socialUrls = profile?.social_urls || {};

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6 pb-24">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-5">
        {/* Avatar and Stats */}
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
            alt={profile?.display_name}
            className="w-16 h-16 rounded-full object-cover ring-4 ring-amber-400/40 shadow-sm"
          />
          <div className="flex-1">
            <h2 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100">
              {profile?.display_name}
            </h2>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{profile?.home_city || 'Bengaluru'}</span>
            </p>
          </div>

          {/* Edit Profile or Demo Login Button */}
          {isOwnProfile ? (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 rounded-xl bg-amber-50 dark:bg-stone-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-stone-700 transition-colors"
              title={t('profile.editProfile')}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={loginAsDemo}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-sm"
            >
              {t('profile.demoLogin')}
            </button>
          )}
        </div>

        {/* Bio */}
        {profile?.bio && (
          <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-amber-50/40 dark:bg-stone-800/40 p-3 rounded-2xl border border-amber-100/60 dark:border-stone-800">
            {profile.bio}
          </p>
        )}

        {/* Social Media Links (Handles only, opening safely in new tab) */}
        {profile?.show_social_links && (
          <div className="pt-1">
            <span className="text-[11px] font-bold text-stone-400 block mb-2">
              {t('profile.socialMedia')}:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {socialUrls.instagram_url && (
                <a
                  href={socialUrls.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 hover:scale-105 transition-transform"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {socialUrls.youtube_url && (
                <a
                  href={socialUrls.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 hover:scale-105 transition-transform"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {socialUrls.x_url && (
                <a
                  href={socialUrls.x_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-200 hover:scale-105 transition-transform"
                >
                  <span>X</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
              {socialUrls.website_url && (
                <a
                  href={socialUrls.website_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 hover:scale-105 transition-transform"
                >
                  <span>Website</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Hackathon Judge Demo Login Notice */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-300/60 dark:border-amber-800 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-stone-900 dark:text-stone-100 block">
              {t('profile.demoNotice')}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              Puneeth Gowda (puneeth_travels_ka)
            </span>
          </div>
          <button
            onClick={loginAsDemo}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition-all"
          >
            {t('profile.demoLogin')}
          </button>
        </div>
      </div>

      {/* Edit Profile Form (Collapse/Expand) */}
      {isEditing && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-stone-900 rounded-3xl p-5 border border-amber-300 dark:border-stone-700 shadow-md space-y-4 animate-in fade-in duration-200">
          <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
            {t('profile.editProfile')}
          </h3>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={editForm.display_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
              {t('profile.bio')}
            </label>
            <textarea
              rows={2}
              value={editForm.bio}
              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full text-xs p-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {t('profile.homeCity')}
              </label>
              <input
                type="text"
                value={editForm.home_city}
                onChange={(e) => setEditForm(prev => ({ ...prev, home_city: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 mb-1">
                {t('profile.preferredLanguage')}
              </label>
              <select
                value={editForm.preferred_language}
                onChange={(e) => setEditForm(prev => ({ ...prev, preferred_language: e.target.value }))}
                className="w-full text-xs px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              >
                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Social Handles Inputs */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Social Media Handles (URLs or @usernames)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder={t('profile.instagram')}
                value={editForm.instagram_handle}
                onChange={(e) => setEditForm(prev => ({ ...prev, instagram_handle: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder={t('profile.youtube')}
                value={editForm.youtube_handle}
                onChange={(e) => setEditForm(prev => ({ ...prev, youtube_handle: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder={t('profile.xTwitter')}
                value={editForm.x_handle}
                onChange={(e) => setEditForm(prev => ({ ...prev, x_handle: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
              <input
                type="text"
                placeholder={t('profile.website')}
                value={editForm.website_url}
                onChange={(e) => setEditForm(prev => ({ ...prev, website_url: e.target.value }))}
                className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100"
              />
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={editForm.show_social_links}
                onChange={(e) => setEditForm(prev => ({ ...prev, show_social_links: e.target.checked }))}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-stone-700 dark:text-stone-300">
                {t('profile.showSocialOnPosts')}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
            >
              {savingProfile ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      )}

      {/* Tabs: My Stories & Saved Trips */}
      <div className="space-y-4">
        <div className="flex rounded-2xl bg-stone-100 dark:bg-stone-800/80 p-1">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'posts'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>{t('profile.myPosts')} ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'trips'
                ? 'bg-white dark:bg-stone-900 text-amber-700 dark:text-amber-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{t('profile.savedTrips')} ({trips.length})</span>
          </button>
        </div>

        {/* Tab 1: Stories */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800">
                {t('feed.noPostsYet')}
              </div>
            ) : (
              posts.map((post) => (
                <StoryCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Saved Trips */}
        {activeTab === 'trips' && (
          <div className="space-y-3">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-3">
                <p>ಯಾವುದೇ ಉಳಿಸಿದ ಪ್ರವಾಸ ಯೋಜನೆಗಳಿಲ್ಲ / No saved itineraries yet.</p>
                <Link
                  to="/plan"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs"
                >
                  <Compass className="w-4 h-4" />
                  <span>{t('planner.generateButton')}</span>
                </Link>
              </div>
            ) : (
              trips.map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-4 border border-stone-200/80 dark:border-stone-800 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
                      {trip.starting_city} • {trip.total_days || (trip.days?.length || 1)} {i18n.language === 'kn' ? 'ದಿನಗಳು' : 'Days'}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                    {trip.title}
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                    {trip.summary}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
