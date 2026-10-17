import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import kn from './locales/kn.json';
import en from './locales/en.json';

// Retrieve saved language from localStorage, strictly defaulting to 'kn' (Kannada)
const savedLanguage = localStorage.getItem('namma_trip_lang') || 'kn';

// Synchronize html lang attribute
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      kn: { translation: kn },
      en: { translation: en }
    },
    lng: savedLanguage,
    fallbackLng: 'kn', // Never default to English on first visit
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('namma_trip_lang', lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
