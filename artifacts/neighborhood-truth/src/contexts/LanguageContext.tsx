import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const T = {
  en: {
    filters: "Filters",
    safety: "Safety",
    cost: "Cost",
    vibes: "Vibes",
    showHeatmap: "Show Heatmap",
    hideHeatmap: "Hide Heatmap",
    reset: "Reset",
    search: "Search",
    labels: "Labels",
    hidden: "Hidden",
    filter: "Filter",
    cities: "Cities",
    locate: "Locate",
    dropLabel: "Drop Label",
    dropping: "Dropping...",
    cancel: "Cancel",
    whatLike: "What's this place like?",
    safetyRating: "Safety Rating",
    costLevel: "Cost Level",
    category: "Category",
    optional: "optional",
    tags: "Tags",
    upTo4: "up to 4",
    labelColor: "Label Color",
    vibeOptions: {
      Chill: "Chill",
      Loud: "Loud",
      Bougie: "Bougie",
      Artsy: "Artsy",
      Family: "Family",
      Nightlife: "Nightlife",
      "IT Hub": "IT Hub",
      "Old City Charm": "Old City Charm",
      "Student Zone": "Student Zone",
      "Women Safe": "Women Safe",
      "Metro Access King": "Metro Access King",
      "Upcoming Area": "Upcoming Area",
    } as Record<string, string>,
    jumpToCity: "Jump to city",
  },
  hi: {
    filters: "फ़िल्टर",
    safety: "सुरक्षा",
    cost: "कीमत",
    vibes: "माहौल",
    showHeatmap: "हीटमैप दिखाएं",
    hideHeatmap: "हीटमैप छुपाएं",
    reset: "रीसेट",
    search: "खोजें",
    labels: "लेबल",
    hidden: "छुपे",
    filter: "फ़िल्टर",
    cities: "शहर",
    locate: "मेरी जगह",
    dropLabel: "लेबल जोड़ें",
    dropping: "जोड़ा जा रहा है...",
    cancel: "रद्द करें",
    whatLike: "यह जगह कैसी है?",
    safetyRating: "सुरक्षा रेटिंग",
    costLevel: "कीमत स्तर",
    category: "श्रेणी",
    optional: "वैकल्पिक",
    tags: "टैग",
    upTo4: "4 तक",
    labelColor: "रंग चुनें",
    vibeOptions: {
      Chill: "शांत",
      Loud: "शोरगुल",
      Bougie: "ग्लैमरस",
      Artsy: "कलात्मक",
      Family: "पारिवारिक",
      Nightlife: "नाइटलाइफ़",
      "IT Hub": "आईटी हब",
      "Old City Charm": "पुराना शहर",
      "Student Zone": "स्टूडेंट ज़ोन",
      "Women Safe": "महिला सुरक्षित",
      "Metro Access King": "मेट्रो एक्सेस",
      "Upcoming Area": "उभरता इलाका",
    } as Record<string, string>,
    jumpToCity: "शहर चुनें",
  },
} as const;

type Translations = (typeof T)["en"];

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: T.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      return (localStorage.getItem("pl_lang") as Lang) || "en";
    } catch {
      return "en";
    }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("pl_lang", l);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: T[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
