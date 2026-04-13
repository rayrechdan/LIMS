"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Lang = "en" | "ar";

type LanguageCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (en: string, ar: string) => string;
};

const Ctx = createContext<LanguageCtx>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lims-lang")) as Lang | null;
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lims-lang", l);
  }

  function t(en: string, ar: string) {
    return lang === "ar" ? ar : en;
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  return useContext(Ctx);
}
