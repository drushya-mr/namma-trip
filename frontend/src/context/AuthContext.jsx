import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize with demo user or saved session
  useEffect(() => {
    async function loadUser() {
      try {
        const storedUser = localStorage.getItem('namma_trip_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          if (parsed.preferred_language && parsed.preferred_language !== i18n.language) {
            i18n.changeLanguage(parsed.preferred_language);
          }
        } else {
          // Default to Demo user for judges
          const demoRes = await api.getDemoProfile();
          if (demoRes.success && demoRes.profile) {
            setCurrentUser(demoRes.profile);
            localStorage.setItem('namma_trip_user', JSON.stringify(demoRes.profile));
          }
        }
      } catch (e) {
        console.warn('Failed to load initial user session:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const loginAsDemo = async () => {
    try {
      const demoRes = await api.getDemoProfile();
      if (demoRes.success && demoRes.profile) {
        setCurrentUser(demoRes.profile);
        localStorage.setItem('namma_trip_user', JSON.stringify(demoRes.profile));
        if (demoRes.profile.preferred_language) {
          i18n.changeLanguage(demoRes.profile.preferred_language);
        }
      }
    } catch (err) {
      console.error('Demo login failed:', err);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const res = await api.updateProfile({
        userId: currentUser?.id || 'demo-user-id',
        ...updates
      });
      if (res.success && res.profile) {
        setCurrentUser(res.profile);
        localStorage.setItem('namma_trip_user', JSON.stringify(res.profile));
        if (updates.preferred_language && updates.preferred_language !== i18n.language) {
          i18n.changeLanguage(updates.preferred_language);
        }
        return res.profile;
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      throw err;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('namma_trip_user');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'kn' ? 'en' : 'kn';
    i18n.changeLanguage(nextLang);
    if (currentUser) {
      updateUserProfile({ preferred_language: nextLang }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginAsDemo,
        updateUserProfile,
        logout,
        currentLanguage: i18n.language,
        toggleLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
