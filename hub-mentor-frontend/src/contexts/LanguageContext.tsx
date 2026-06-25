
import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'ml';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'nav.home': 'Home',
    'nav.mentors': 'Find Mentors',
    'nav.about': 'About',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',
    'hero.title': 'Find Your Perfect Mentor',
    'hero.subtitle': 'Connect with expert mentors for academic and personal growth',
    'cta.find': 'Find a Mentor Today',
    'cta.learn': 'Learn More',
  },
  ml: {
    'nav.home': 'ഹോം',
    'nav.mentors': 'മെന്റർമാരെ കണ്ടെത്തുക',
    'nav.about': 'കുറിച്ച്',
    'nav.login': 'ലോഗിൻ',
    'nav.signup': 'സൈൻ അപ്പ്',
    'hero.title': 'നിങ്ങളുടെ പരിപൂർണ്ണ മെന്റർ കണ്ടെത്തുക',
    'hero.subtitle': 'അക്കാദമിക, വ്യക്തിപരമായ വളർച്ചയ്ക്കായി വിദഗ്ധ മെന്റർമാരുമായി ബന്ധപ്പെടുക',
    'cta.find': 'ഇന്ന് ഒരു മെന്റർ കണ്ടെത്തുക',
    'cta.learn': 'കൂടുതൽ അറിയുക',
  }
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
