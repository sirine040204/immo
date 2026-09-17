import React from "react";
import { SearchBar } from "@/shared/components/SearchBar";
import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex-1 w-full max-w-xl">
        <SearchBar 
          placeholder="Rechercher un actif, document..." 
          className="bg-gray-50 border-transparent focus-visible:ring-primary h-10 rounded-full"
        />
      </div>

      <div className="ml-4 flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-sm font-medium text-green-800">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          Système opérationnel
        </div>
        
        <Button variant="ghost" size="icon" className="relative rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </Button>
      </div>
    </header>
  );
}
