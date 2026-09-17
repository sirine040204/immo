import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import {
  LayoutDashboard,
  Settings,
  Users,
  Box,
  Wrench,
  FileText,
  DollarSign,
  CheckCircle,
  Bell,
  ChevronDown
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "STRUCTURE",
    items: [
      { title: "Paramètres", href: "/parametres", icon: Settings },
      { title: "Utilisateurs", href: "/utilisateurs", icon: Users },
      { title: "Immobilisations", href: "/immobilisations", icon: Box },
    ],
  },
  {
    title: "TRAITEMENT",
    items: [
      { title: "Entretiens", href: "/entretiens", icon: Wrench },
      { title: "Documents", href: "/documents", icon: FileText },
      { title: "Coûts", href: "/couts", icon: DollarSign },
    ],
  },
  {
    title: "SUIVI",
    items: [
      { title: "Validations", href: "/validations", icon: CheckCircle },
      { title: "Entretiens", href: "/suivi/entretiens", icon: Wrench }, // the image shows Entretiens twice, likely a sub-menu or tracking specific page
      { title: "Documents", href: "/suivi/documents", icon: FileText },
      { title: "Alertes & Échéances", href: "/alertes", icon: Bell },
    ],
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex shrink-0">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="font-bold">A</span>
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">AssetFlow</span>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Gestion des actifs</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/" || pathname === "/dashboard" 
              ? "bg-primary text-primary-foreground" 
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          Tableau de bord
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {section.title}
            </h4>
            <div className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-sidebar-accent cursor-pointer transition-colors">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            MK
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Mohamed Karray</p>
            <p className="text-xs text-sidebar-foreground/50 truncate">Administrateur</p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/50" />
        </div>
      </div>
    </aside>
  );
}
