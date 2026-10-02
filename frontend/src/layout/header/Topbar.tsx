"use client";

import React, { useEffect, useState } from "react";
import { Bell, PanelLeftClose, PanelLeftOpen, Languages, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useSidebar } from "@/layout/SidebarContext";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import Cookies from "js-cookie";

export function Topbar() {
  const { collapsed, toggle } = useSidebar();
  const [lang, setLang] = useState("fr");

  useEffect(() => {
    const currentLang = Cookies.get("googtrans");
    if (currentLang && currentLang.endsWith("en")) {
      setLang("en");
    } else {
      setLang("fr");
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === "fr" ? "en" : "fr";
    
    // Set cookies for persistence
    Cookies.set("googtrans", `/fr/${newLang}`, { path: "/" });
    Cookies.set("googtrans", `/fr/${newLang}`, { path: "/", domain: window.location.hostname });
    setLang(newLang);

    // Smoothly trigger Google Translate without reload
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = newLang;
      select.dispatchEvent(new Event("change"));
    } else {
      // Fallback if the script hasn't fully loaded the widget yet
      window.location.reload();
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200/50 bg-white/60 backdrop-blur-xl px-4 shrink-0 translate-no-translate shadow-sm relative z-50">
      {/* Sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        title={collapsed ? "Afficher le menu" : "Masquer le menu"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      {/* Global Search Trigger */}
      <div className="flex-1 max-w-md px-4 hidden md:flex">
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="flex items-center w-full gap-2 px-3 py-1.5 text-sm text-slate-500 bg-slate-100/50 hover:bg-slate-200/70 border border-slate-200/60 rounded-lg transition-colors group"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-green transition-colors" />
          <span className="flex-1 text-left">Recherche rapide...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white border border-slate-200 rounded">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="hidden sm:flex items-center gap-2 h-9 text-slate-600 font-medium notranslate"
        >
          <Languages className="h-4 w-4 text-brand-green" />
          {lang === "fr" ? "EN" : "FR"}
        </Button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand-green/20 bg-brand-green-light text-sm font-medium text-brand-green">
          <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
          Système opérationnel
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}
