"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/language";

/**
 * Keeps <html lang="…"> in sync with the user's language preference so
 * the :lang(km) CSS rule in globals.css can activate and swap in a
 * Khmer-aware font stack. Without this, Android renders Khmer chars
 * with a very thin system fallback that looks wrong next to Poppins.
 *
 * Rendered once in the root layout. No visible output.
 */
export default function HtmlLangSync() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
