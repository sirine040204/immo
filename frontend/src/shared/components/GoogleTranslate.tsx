"use client";

import { useEffect } from "react";
import Script from "next/script";

export function GoogleTranslate() {
  useEffect(() => {
    // We add a global callback for the Google Translate script
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "fr",
          includedLanguages: "en,fr",
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <>
      <div id="google_translate_element" className="hidden" style={{ display: 'none' }}></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      {/* Hide Google Translate top bar and banners that get injected */}
      <style dangerouslySetInnerHTML={{ __html: `
        .goog-te-banner-frame { display: none !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
        body { top: 0 !important; position: static !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .goog-te-banner-frame.skiptranslate { display: none !important; }
        .skiptranslate iframe { display: none !important; }
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; }
        .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
      `}} />
    </>
  );
}
