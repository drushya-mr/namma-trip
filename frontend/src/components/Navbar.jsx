import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Bell, Sun, Moon, Sparkles, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { currentUser, toggleLanguage } = useAuth();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('namma_trip_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('namma_trip_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('namma_trip_theme', 'light');
    }
  }, [darkMode]);

  // Fetch notifications
  useEffect(() => {
    async function loadNotifs() {
      try {
        const res = await api.getNotifications(currentUser?.id || 'demo-user-id');
        if (res.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unread_count || 0);
        }
      } catch (e) {
        // quiet error
      }
    }
    loadNotifs();
  }, [currentUser, location.pathname]);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // quiet error
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-amber-200/60 dark:border-stone-800 transition-colors">
      {/* Karnataka flag ribbon (Haladi-Kempu / Yellow & Crimson Red) */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-red-600" />

      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Greeting */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-xl tracking-tight">ನ</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-amber-600 to-red-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-red-400">
                {t('app.title')}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                31/31
              </span>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 hidden xs:block -mt-0.5">
              {t('app.subtitle')}
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Friendly Greeting Pill */}
          <div className="hidden md:flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('app.greeting')}</span>
          </div>

          {/* Instant Language Toggle: ಕನ್ನಡ | English */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300 dark:bg-stone-800 dark:text-amber-300 dark:border-stone-700 transition-all hover:scale-105 shadow-sm active:scale-95"
            title="Switch Language / ಭಾಷೆಯನ್ನು ಬದಲಿಸಿ"
            aria-label="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className={i18n.language === 'kn' ? 'text-red-700 dark:text-red-400 font-extrabold' : 'opacity-60'}>
              ಕನ್ನಡ
            </span>
            <span className="opacity-40">|</span>
            <span className={i18n.language === 'en' ? 'text-red-700 dark:text-red-400 font-extrabold' : 'opacity-60'}>
              Eng
            </span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full text-stone-600 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="p-2 rounded-full text-stone-600 hover:text-amber-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors relative"
              title={t('nav.notifications')}
              aria-label={t('nav.notifications')}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/50">
                  <span className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    {t('nav.notifications')} ({notifications.length})
                  </span>
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400">
                      ಯಾವುದೇ ಹೊಸ ಸೂಚನೆಗಳಿಲ್ಲ / No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3 text-xs hover:bg-amber-50/50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors ${
                          !n.is_read ? 'bg-amber-50/30 dark:bg-amber-950/20 font-semibold' : 'text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-stone-900 dark:text-stone-100 text-[11px] truncate">
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                          )}
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
