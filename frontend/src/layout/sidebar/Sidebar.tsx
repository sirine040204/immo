"use client";

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
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/accounts/api/auth";
import { User } from "@/features/accounts/types/auth";
import { useAuth } from "@/core/auth/AuthContext";
import { useSidebar } from "@/layout/SidebarContext";

interface SubNavItem {
  title: string;
  href: string;
  subItems?: { title: string; href: string }[];
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  subItems?: SubNavItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "STRUCTURE",
    items: [
      { title: "Profil", href: "/profile", icon: Users },
      { title: "Paramètres", href: "/parametres", icon: Settings },
      {
        title: "Utilisateurs",
        href: "/utilisateurs",
        icon: Users,
        subItems: [
          { title: "Utilisateurs", href: "/utilisateurs/utilisateurs" },
          { title: "Rôles", href: "/utilisateurs/roles" },
          { title: "Permissions", href: "/utilisateurs/permissions" },
          { title: "Demandes", href: "/utilisateurs/demandes-permissions" },
        ],
      },
      {
        title: "Immobilisations",
        href: "/immobilisations",
        icon: Box,
        subItems: [
          { title: "Familles", href: "/immobilisations/familles" },
          { title: "Immobilisations", href: "/immobilisations/immobilisations" },
        ],
      },
    ],
  },
  {
    title: "TRAITEMENT",
    items: [
      {
        title: "Entretiens",
        href: "/entretiens",
        icon: Wrench,
        subItems: [
          {
            title: "Configuration Entretiens",
            href: "/entretiens/configuration",
            subItems: [
              { title: "Types Entretiens", href: "/entretiens/configuration/types" },
              { title: "Modeles Entretiens", href: "/entretiens/configuration/modeles" },
            ],
          },
          { title: "Exécution Entretiens", href: "/entretiens/execution" },
        ],
      },
      {
        title: "Documents",
        href: "/documents",
        icon: FileText,
        subItems: [
          { title: "Types Documents", href: "/documents/types" },
          { title: "Gestion Documents", href: "/documents/documents" },
        ],
      },
      { title: "Coûts", href: "/costs", icon: DollarSign },
    ],
  },
  {
    title: "SUIVI",
    items: [
      { title: "Validations", href: "/validations", icon: CheckCircle },
      { title: "Alertes & Échéances", href: "/suivi/alertes", icon: Bell },
    ],
  },
];

/* ── Sub-nav items ─────────────────────────────────────────────── */
function SidebarSubNavItem({
  subItem,
  pathname,
}: {
  subItem: SubNavItem;
  pathname: string;
}) {
  const isSubActive =
    pathname === subItem.href ||
    (subItem.subItems && pathname.startsWith(subItem.href + "/"));
  const hasSubSubItems = subItem.subItems && subItem.subItems.length > 0;
  const [isOpen, setIsOpen] = React.useState(!!isSubActive);

  if (!hasSubSubItems) {
    return (
      <Link
        href={subItem.href}
        className={cn(
          "block rounded px-3 py-1.5 text-xs font-medium transition-colors",
          pathname === subItem.href
            ? "text-white font-semibold"
            : "text-white/50 hover:text-white/90 hover:bg-white/10"
        )}
      >
        {subItem.title}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between rounded px-3 py-1.5 text-xs font-medium transition-colors",
          isSubActive && !isOpen
            ? "text-white font-semibold"
            : "text-white/50 hover:text-white/90 hover:bg-white/10"
        )}
      >
        <span>{subItem.title}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", isOpen ? "rotate-180" : "")}
        />
      </button>

      {isOpen && (
        <div className="ml-2 space-y-1 mt-1 border-l border-white/10 pl-3 py-1">
          {subItem.subItems!.map((sub, idx) => (
            <Link
              key={idx}
              href={sub.href}
              className={cn(
                "block rounded px-3 py-1 text-xs font-medium transition-colors",
                pathname === sub.href
                  ? "text-white font-semibold"
                  : "text-white/40 hover:text-white/80 hover:bg-white/10"
              )}
            >
              {sub.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Top-level nav items ────────────────────────────────────────── */
function SidebarNavItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isParentActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const [isOpen, setIsOpen] = React.useState(isParentActive);

  if (!hasSubItems) {
    return (
      <Link
        href={item.href}
        title={collapsed ? item.title : undefined}
        className={cn(
          "flex items-center gap-3 rounded px-4 py-2 text-[0.9rem] font-medium transition-colors",
          collapsed && "justify-center px-2",
          isParentActive
            ? "bg-[#3CB395]/25 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && item.title}
      </Link>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={collapsed ? item.title : undefined}
        className={cn(
          "w-full flex items-center rounded px-4 py-2 text-[0.9rem] font-medium transition-colors",
          collapsed ? "justify-center px-2" : "justify-between",
          isParentActive && !isOpen
            ? "bg-[#3CB395]/25 text-white"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        )}
      >
        <div className={cn("flex items-center gap-3", collapsed && "gap-0")}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && item.title}
        </div>
        {!collapsed && (
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")}
          />
        )}
      </button>

      {isOpen && !collapsed && (
        <div className="ml-9 space-y-1 mt-1 border-l border-white/10 pl-3 py-1">
          {item.subItems!.map((subItem, idx) => (
            <SidebarSubNavItem key={idx} subItem={subItem} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Sidebar ───────────────────────────────────────────────── */
export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { collapsed } = useSidebar();

  const { data: user } = useQuery<User>({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
  });

  const displayName = user ? `${user.prenom} ${user.nom}` : "Chargement...";
  const displayRole = user
    ? user.is_company_admin
      ? "Administrateur"
      : user.role_nom || "Employé"
    : "...";
  const displayInitials = user
    ? `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase()
    : "??";

  return (
    <aside
      className={cn(
        /* dark teal background matching the reference screenshot */
        "hidden md:flex flex-col shrink-0 transition-all duration-300 ease-in-out",
        "bg-[#0E2427] text-white",
        collapsed ? "w-[64px]" : "w-72"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center px-6 border-b border-white/10",
          collapsed ? "justify-center" : "gap-3"
        )}
      >
        <img
          src="/logo.png"
          alt="AssetFlow Logo"
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
        />
        {!collapsed && (
          <div className="notranslate">
            <span className="text-base font-bold tracking-tight text-white">
              AssetFlow
            </span>
            <span className="block text-[10px] text-white/50 uppercase tracking-wider">
              Maintain. Track. Optimize. Flow.
            </span>
          </div>
        )}
      </div>

      {/* Dashboard link */}
      <div className="px-3 py-3">
        <Link
          href="/"
          title={collapsed ? "Tableau de bord" : undefined}
          className={cn(
            "flex items-center gap-3 rounded px-4 py-2 text-[0.9rem] font-medium transition-colors",
            collapsed && "justify-center px-2",
            pathname === "/" || pathname === "/dashboard"
              ? "bg-[#3CB395] text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!collapsed && "Tableau de bord"}
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!collapsed && (
              <h4 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {section.title}
              </h4>
            )}
            {collapsed && <div className="mb-2 h-px bg-white/10" />}
            <div className="space-y-0.5">
              {section.items.map((item, itemIdx) => (
                <SidebarNavItem
                  key={itemIdx}
                  item={item}
                  pathname={pathname}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded px-2 py-2",
            collapsed && "justify-center"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white overflow-hidden">
            {user?.photo ? (
              <img src={user.photo} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-5 w-5 text-white/70" />
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              <p className="text-xs text-white/50 truncate">{displayRole}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              title="Déconnexion"
              className="flex h-8 w-8 items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 7.5L10.5 10.75M13.5 7.5L10.5 4.5M13.5 7.5L4 7.5M8 13.5H1.5L1.5 1.5L8 1.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
