import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import languages directly to avoid suspense on load
import enTranslations from './locales/en/translation.json';
import esTranslations from './locales/es/translation.json';
import ptTranslations from './locales/pt/translation.json';
import deTranslations from './locales/de/translation.json';
import jaTranslations from './locales/ja/translation.json';
import idTranslations from './locales/id/translation.json';
import frTranslations from './locales/fr/translation.json';
import itTranslations from './locales/it/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations
      },
      es: {
        translation: esTranslations
      },
      pt: {
        translation: ptTranslations
      },
      'pt-BR': {
        translation: ptTranslations
      },
      de: {
        translation: deTranslations
      },
      ja: {
        translation: jaTranslations
      },
      id: {
        translation: idTranslations
      },
      fr: {
        translation: frTranslations
      },
      it: {
        translation: itTranslations
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes by default
    }
  });

export default i18n;
