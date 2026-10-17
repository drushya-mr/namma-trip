import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Compass, MapPin, PlusCircle, User } from 'lucide-react';

export default function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/plan', label: t('nav.plan'), icon: Compass },
    { to: '/post', label: t('nav.post'), icon: PlusCircle, isPrimary: true },
    { to: '/explore', label: t('nav.explore'), icon: MapPin },
    { to: '/profile', label: t('nav.profile'), icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-amber-200/50 dark:border-stone-800 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (item.isPrimary) {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center -mt-5 group`
                }
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 group-hover:scale-105 active:scale-95 transition-all">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 mt-1">
                  {item.label}
                </span>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-red-700 dark:text-amber-400 font-bold scale-105'
                    : 'text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-300 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
