import React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

interface FilterPanelProps {
  children: React.ReactNode;
  onClear?: () => void;
  onApply?: () => void;
  className?: string;
}

export function FilterPanel({ children, onClear, onApply, className }: FilterPanelProps) {
  return (
    <div className={cn("p-4 bg-white rounded-md border shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm font-semibold text-gray-700">
          <Filter className="mr-2 h-4 w-4" />
          Filtres
        </div>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="h-8 px-2 text-muted-foreground">
            <X className="mr-1 h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>

      {onApply && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={onApply}>
            Appliquer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
