"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/accounts/api/auth";
import { Search, Monitor, Wrench, Settings, DollarSign, Bell, CheckSquare, X, ArrowRight, User, Users, Box, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
  });

  // Keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setQuery("");
    }
  }, [isOpen]);

  const items = [
    { icon: <Monitor className="w-4 h-4" />, name: "Tableau de bord", route: "/", section: "Navigation", adminOnly: false },
    { icon: <User className="w-4 h-4" />, name: "Mon Profil", route: "/profile", section: "Structure", adminOnly: false },
    { icon: <Settings className="w-4 h-4" />, name: "Paramètres de l'entreprise", route: "/parametres", section: "Structure", adminOnly: true },
    { icon: <Users className="w-4 h-4" />, name: "Utilisateurs", route: "/utilisateurs/utilisateurs", section: "Structure", adminOnly: true },
    { icon: <Users className="w-4 h-4" />, name: "Rôles", route: "/utilisateurs/roles", section: "Structure", adminOnly: true },
    { icon: <Users className="w-4 h-4" />, name: "Permissions", route: "/utilisateurs/permissions", section: "Structure", adminOnly: true },
    { icon: <Users className="w-4 h-4" />, name: "Demandes de permissions", route: "/utilisateurs/demandes-permissions", section: "Structure", adminOnly: true },
    { icon: <Box className="w-4 h-4" />, name: "Familles d'immobilisations", route: "/immobilisations/familles", section: "Structure", adminOnly: false },
    { icon: <Box className="w-4 h-4" />, name: "Immobilisations", route: "/immobilisations/immobilisations", section: "Structure", adminOnly: false },
    { icon: <Wrench className="w-4 h-4" />, name: "Types d'entretiens", route: "/entretiens/configuration/types", section: "Traitement", adminOnly: false },
    { icon: <Wrench className="w-4 h-4" />, name: "Modèles d'entretiens", route: "/entretiens/configuration/modeles", section: "Traitement", adminOnly: false },
    { icon: <Wrench className="w-4 h-4" />, name: "Exécution des entretiens", route: "/entretiens/execution", section: "Traitement", adminOnly: false },
    { icon: <FileText className="w-4 h-4" />, name: "Types de documents", route: "/documents/types", section: "Traitement", adminOnly: false },
    { icon: <FileText className="w-4 h-4" />, name: "Gestion des documents", route: "/documents/documents", section: "Traitement", adminOnly: false },
    { icon: <DollarSign className="w-4 h-4" />, name: "Coûts", route: "/costs", section: "Traitement", adminOnly: false },
    { icon: <CheckSquare className="w-4 h-4" />, name: "Validations", route: "/validations", section: "Suivi", adminOnly: false },
    { icon: <Bell className="w-4 h-4" />, name: "Alertes & Échéances", route: "/suivi/alertes", section: "Suivi", adminOnly: false },
  ];

  // Filter items based on permissions and search query
  const availableItems = items.filter(item => !item.adminOnly || user?.is_company_admin);
  const filteredItems = query
    ? availableItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()) || item.section.toLowerCase().includes(query.toLowerCase()))
    : availableItems;

  const handleSelect = (route: string) => {
    setIsOpen(false);
    router.push(route);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Modal */}
      <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200/60 bg-white/50">
          <Search className="w-5 h-5 text-brand-green shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-0 py-4 px-4 text-base outline-none placeholder:text-slate-400 text-slate-800"
            placeholder="Que cherchez-vous ? (Appuyez sur Échap pour quitter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="py-14 px-6 text-center text-sm text-slate-500">
              Aucun résultat pour "{query}". <br />
              <span className="text-xs text-slate-400 mt-1 block">Essayez un autre mot-clé.</span>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item.route)}
                className="flex items-center w-full gap-3 px-4 py-3 text-sm text-slate-700 hover:text-brand-green rounded-xl hover:bg-brand-green/10 transition-all group"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm text-slate-500 group-hover:text-brand-green transition-all">
                  {item.icon}
                </div>
                <div className="flex flex-col items-start flex-1 text-left">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{item.section}</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200/60 p-3 bg-slate-50/50 flex justify-between items-center text-xs text-slate-400">
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-200 text-slate-600 px-1.5 rounded text-[10px] font-sans">↑↓</kbd> pour naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-slate-200 text-slate-600 px-1.5 rounded text-[10px] font-sans">Enter</kbd> pour sélectionner
            </span>
          </div>
          <span className="font-semibold text-brand-green/60">Global Search</span>
        </div>
      </div>
    </div>
  );
}
