"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/accounts/api/auth";
import { User } from "@/features/accounts/types/auth";
import { fetchImmobilisations } from "@/features/immobilisations/api/immobilisations";
import { fetchFamilles } from "@/features/immobilisations/api/familles";
import { fetchInterventions, fetchMaintenanceKPIs } from "@/features/maintenance/api/interventions";
import { fetchCosts } from "@/features/costs/api/costs";
import { fetchNotifications } from "@/features/notifications/api/notifications";
import { EmptyState } from "@/shared/components/EmptyState";
import { Button } from "@/shared/components/ui/button";
import { 
  Wrench, 
  TrendingUp, 
  TrendingDown, 
  Box, 
  DollarSign, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  MoreHorizontal,
  ChevronDown,
  Shield,
  FileText,
  Activity,
  Timer
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [hoveredChartIndex, setHoveredChartIndex] = useState<number | null>(null);
  const [costPeriod, setCostPeriod] = useState(6);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: user, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["userProfile"],
    queryFn: () => getUserProfile(),
  });

  const { data: expirationData, isLoading: isLoadingExpiration } = useQuery({
    queryKey: ["documentsExpiration"],
    queryFn: () => import("@/features/documents/api/documents").then(mod => mod.fetchDocumentsExpiration()),
  });

  const { data: immobilisations } = useQuery({
    queryKey: ["immobilisations"],
    queryFn: fetchImmobilisations,
  });

  const { data: familles } = useQuery({
    queryKey: ["familles"],
    queryFn: fetchFamilles,
  });

  const { data: interventions } = useQuery({
    queryKey: ["interventions"],
    queryFn: fetchInterventions,
  });

  const { data: costs } = useQuery({
    queryKey: ["costs"],
    queryFn: fetchCosts,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const { data: kpiData } = useQuery({
    queryKey: ["maintenanceKPIs"],
    queryFn: fetchMaintenanceKPIs,
  });

  // Dynamic Date Formatting (e.g., "JEUDI 17 SEPTEMBRE 2026")
  const formattedDate = useMemo(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('fr-FR', options).toUpperCase();
  }, []);
  
  const router = import("next/navigation").then(mod => mod.useRouter);

  // Compute KPIs
  const kpis = useMemo(() => {
    // Immobilisations
    const immoTotal = immobilisations?.length || 0;
    const immoEnService = immobilisations?.filter(i => i.statut === "ACTIVE").length || 0; // Using ACTIVE based on typical statuses
    const pctEnService = immoTotal > 0 ? Math.round((immoEnService / immoTotal) * 100) : 0;

    // Entretiens this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const interventionsThisMonth = interventions?.filter(i => {
      const dStr = i.date_prevue || i.date_demande;
      if (!dStr) return false;
      const d = new Date(dStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }) || [];
    const entretiensRealises = interventionsThisMonth.filter(i => i.statut === "TERMINEE").length;
    const entretiensPlanifies = interventionsThisMonth.filter(i => i.statut === "PLANIFIEE").length;

    // Costs
    const coutsValides = costs?.filter(c => c.statut === "VALIDE") || [];
    const totalCouts = coutsValides.reduce((sum, c) => sum + Number(c.montant_ttc || 0), 0);

    // Asset Distribution
    const dist: Record<string, number> = {};
    immobilisations?.forEach(immo => {
      const fam = familles?.find(f => f.id_famille === immo.famille);
      const nom = fam ? fam.nom : "Autres";
      dist[nom] = (dist[nom] || 0) + 1;
    });
    const distArray = Object.entries(dist)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / (immoTotal || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4 for the donut chart

    // Total Assets Value
    const immoValeurTotale = immobilisations?.reduce((sum, i) => sum + Number(i.valeur_brute || 0), 0) || 0;

    // Monthly Cost Evolution (Dynamic Period)
    const monthlyCosts = new Array(costPeriod).fill(null).map(() => ({ month: "", total: 0 }));
    for (let i = costPeriod - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyCosts[(costPeriod - 1) - i].month = d.toLocaleDateString("fr-FR", { month: "short" });
    }
    
    costs?.filter(c => c.statut === "VALIDE").forEach(c => {
      const d = new Date(c.date_cout);
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
      if (diffMonths >= 0 && diffMonths < costPeriod) {
        monthlyCosts[(costPeriod - 1) - diffMonths].total += Number(c.montant_ttc || 0);
      }
    });

    const maxMonthlyCost = Math.max(...monthlyCosts.map(m => m.total), 1);

    // To-Do list (Actions Requises)
    const coutsEnAttente = costs?.filter(c => c.statut === "EN_ATTENTE_VALIDATION").slice(0, 4) || [];
    const interventionsPlanifiees = interventions?.filter(i => i.statut === "PLANIFIEE" || i.statut === "EN_COURS").sort((a, b) => new Date(a.date_prevue || "").getTime() - new Date(b.date_prevue || "").getTime()).slice(0, 4) || [];

    // Compute SVG Path points and d strings (Legacy, keeping for fallback if needed, but we use recharts now)
    const rechartsData = monthlyCosts.map(m => ({
      name: m.month,
      costs: m.total
    }));

    // Real KPI Data from backend
    const mttr = kpiData?.mttr_hours || 0;
    const mtbf = kpiData?.mtbf_days || 0;
    const mttrTrend = kpiData?.mttr_trend || 0;
    const mtbfTrend = kpiData?.mtbf_trend || 0;

    return {
      immoTotal,
      immoEnService,
      pctEnService,
      immoValeurTotale,
      entretiensRealises,
      entretiensPlanifies,
      totalCouts,
      distArray,
      monthlyCosts,
      maxMonthlyCost,
      coutsEnAttente,
      interventionsPlanifiees,
      rechartsData,
      mttr,
      mtbf,
      mttrTrend,
      mtbfTrend
    };
  }, [immobilisations, interventions, costs, familles, kpiData, costPeriod]);

  const prenom = user?.prenom || "Chargement...";

  if (isLoadingUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section matching the photo */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-green mb-2 tracking-wider">
            {formattedDate}
          </p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Bonjour {prenom},
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Voici l'état de votre patrimoine aujourd'hui.
          </p>
        </div>
      </div>

      {/* Advanced Performance KPIs (MTTR / MTBF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">MTTR (Temps moyen de réparation)</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.mttr} Heures</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center text-brand-green text-sm font-semibold gap-1">
              <TrendingDown className="h-4 w-4" />
              <span>{Math.abs(kpis.mttrTrend)}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">vs mois dernier</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">MTBF (Temps moyen entre pannes)</p>
              <h3 className="text-2xl font-bold text-slate-900">{kpis.mtbf} Jours</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center text-brand-green text-sm font-semibold gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{Math.abs(kpis.mtbfTrend)}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">vs mois dernier</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Immobilisations */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-brand-green-light text-brand-green p-3 rounded-lg">
              <Box className="h-6 w-6" />
            </div>
            <div className="flex items-center text-brand-green text-sm font-semibold gap-1">
              <span>{kpis.pctEnService}% Actifs</span>
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-slate-500 text-sm font-medium">Immobilisations</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{kpis.immoTotal}</h3>
            <p className="text-xs text-slate-400 mt-2">
              Valeur: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND", maximumFractionDigits: 0 }).format(kpis.immoValeurTotale)}
            </p>
          </div>
        </div>

        {/* Card 2: Entretiens */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-brand-green-light text-brand-green p-3 rounded-lg">
              <Wrench className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-slate-500 text-sm font-medium">Entretiens ce mois</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{kpis.entretiensRealises + kpis.entretiensPlanifies}</h3>
            <p className="text-xs text-slate-400 mt-2">{kpis.entretiensRealises} réalisés, {kpis.entretiensPlanifies} planifiés</p>
          </div>
        </div>

        {/* Card 3: Coûts cumulés */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-slate-500 text-sm font-medium">Coûts cumulés (Validés)</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND" }).format(kpis.totalCouts)}
            </h3>
            <p className="text-xs text-slate-400 mt-2">Toutes dépenses confondues</p>
          </div>
        </div>

        {/* Card 4: Alertes (Documents) */}
        <div className={`bg-white rounded-lg p-6 shadow-sm border flex flex-col h-full ${
          (expirationData?.nombre_expired || 0) > 0 
            ? 'border-red-200 bg-red-50/10' 
            : (expirationData?.nombre_expires_soon || 0) > 0 
              ? 'border-orange-200 bg-orange-50/10'
              : 'border-slate-100'
        }`}>
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-lg ${
              (expirationData?.nombre_expired || 0) > 0 
                ? 'bg-red-50 text-red-600' 
                : (expirationData?.nombre_expires_soon || 0) > 0 
                  ? 'bg-orange-50 text-orange-600'
                  : 'bg-brand-green-light text-brand-green'
            }`}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex items-center text-slate-500 text-sm font-semibold gap-1">
              Documents
            </div>
          </div>
          <div className="mt-auto">
            <p className="text-slate-500 text-sm font-medium">Alertes Actives</p>
            {isLoadingExpiration ? (
              <div className="h-9 bg-slate-200 animate-pulse rounded mt-1 mb-2 w-16"></div>
            ) : (
              <h3 className={`text-3xl font-bold mt-1 ${
                (expirationData?.nombre_expired || 0) > 0 
                  ? 'text-red-700' 
                  : (expirationData?.nombre_expires_soon || 0) > 0 
                    ? 'text-orange-700'
                    : 'text-slate-900'
              }`}>
                {(expirationData?.nombre_expired || 0) + (expirationData?.nombre_expires_soon || 0)}
              </h3>
            )}
            <div className="text-xs text-slate-400 mt-2 flex flex-col gap-1">
              {isLoadingExpiration ? (
                <div className="h-3 bg-slate-200 animate-pulse rounded w-32"></div>
              ) : (
                <>
                  {expirationData?.nombre_expired ? (
                    <span className="text-red-600 font-medium">{expirationData.nombre_expired} document(s) expiré(s)</span>
                  ) : null}
                  {expirationData?.nombre_expires_soon ? (
                    <span className="text-orange-600 font-medium">{expirationData.nombre_expires_soon} expire(nt) bientôt</span>
                  ) : null}
                  {!expirationData?.nombre_expired && !expirationData?.nombre_expires_soon ? (
                    <span>Aucune alerte document</span>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Main content area placeholders for charts (matching photo bottom half) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[380px] flex flex-col p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Évolution des coûts</h3>
              <p className="text-sm text-slate-500">Dépenses de maintenance en milliers MAD</p>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                {costPeriod} derniers mois <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 z-10 py-1">
                  {[3, 6, 9, 12].map(period => (
                    <button
                      key={period}
                      onClick={() => {
                        setCostPeriod(period);
                        setIsDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
                        costPeriod === period ? "text-brand-green font-semibold bg-brand-green-light/20" : "text-slate-600"
                      )}
                    >
                      {period} derniers mois
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 w-full relative mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.rechartsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `${value / 1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <RechartsTooltip 
                  formatter={(value: any) => [`${value} MAD`, "Coûts"]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="costs" stroke="#047857" strokeWidth={3} fillOpacity={1} fill="url(#colorCosts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden min-h-[380px] flex flex-col p-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Répartition des actifs</h3>
            <p className="text-sm text-slate-500">Par catégorie d'immobilisation</p>
          </div>
          <div className="flex-1 flex flex-col xl:flex-row items-center justify-center gap-8 mt-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kpis.distArray}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {kpis.distArray.map((entry, index) => {
                    const colors = ["#047857", "#3b82f6", "#f59e0b", "#cbd5e1", "#8b5cf6"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any, name: any, props: any) => [`${value} actifs (${props.payload.percentage}%)`, name]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="w-full xl:w-auto flex flex-col gap-3">
              {kpis.distArray.length > 0 ? (
                kpis.distArray.map((item, index) => {
                  const colors = ["bg-[#047857]", "bg-[#3b82f6]", "bg-[#f59e0b]", "bg-[#cbd5e1]", "bg-[#8b5cf6]"];
                  return (
                    <div key={index} className="flex justify-between items-center text-sm text-slate-600 gap-8">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-sm", colors[index % colors.length])}></span>
                        {item.name}
                      </div>
                      <span className="font-bold text-slate-900">{item.percentage} %</span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-sm text-slate-400">Aucune donnée</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Row: Interventions & Alertes matching the image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        
        {/* Interventions prioritaires */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Interventions prioritaires</h3>
              <p className="text-sm text-slate-500 mt-0.5">Maintenances à traiter prochainement</p>
            </div>
            <a href="/entretiens/execution" className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
              Voir tout
            </a>
          </div>
          <div className="p-0 flex-1">
            <div className="divide-y divide-slate-100">
              {kpis.interventionsPlanifiees.length > 0 ? (
                kpis.interventionsPlanifiees.slice(0, 3).map((inter, i) => (
                  <div key={inter.id} className="p-5 hover:bg-slate-50 transition-colors flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      i === 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-brand-green"
                    )}>
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] text-slate-900 truncate">
                        Intervention #{inter.id} - {inter.motif}
                      </p>
                      <p className="text-[13px] text-slate-500 mt-0.5 truncate">
                        {inter.type_entretien === 1 ? "Atelier de production" : "Site / Parc automobile"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {inter.date_prevue ? new Date(inter.date_prevue).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }) : "Aujourd'hui"}
                        </p>
                        <p className={cn(
                          "text-[11px] font-bold tracking-wide uppercase mt-0.5",
                          i === 0 ? "text-red-500" : "text-brand-green"
                        )}>
                          {i === 0 ? "URGENT" : inter.statut === "PLANIFIEE" ? "PLANIFIÉ" : "PRÉVENTIF"}
                        </p>
                      </div>
                      <button className="text-slate-300 hover:text-slate-500 transition-colors p-1">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-slate-500 font-medium">Aucune intervention</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertes & échéances */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Alertes & échéances</h3>
              <p className="text-sm text-slate-500 mt-0.5">Éléments nécessitant votre attention</p>
            </div>
            <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-md text-xs font-bold tracking-wider uppercase border border-amber-100">
              {notifications ? notifications.filter(n => !n.lu).length : 0} ACTIVES
            </div>
          </div>
          <div className="p-0 flex-1">
            <div className="divide-y divide-slate-100">
              {notifications && notifications.length > 0 ? (
                notifications.slice(0, 4).map(notif => {
                  let Icon = AlertTriangle;
                  let iconColor = "text-red-500";
                  
                  if (notif.niveau === "INFO") {
                    Icon = CheckCircle2;
                    iconColor = "text-brand-green";
                  } else if (notif.niveau === "WARNING") {
                    Icon = FileText;
                    iconColor = "text-amber-500";
                  } else if (notif.type_notification === "COUT_VALIDATION") {
                    Icon = Shield;
                    iconColor = "text-blue-500";
                  }

                  return (
                    <div key={notif.id_notification} className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4">
                      <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", iconColor)} />
                      <div>
                        <p className={cn("text-[14px]", !notif.lu ? "font-bold text-slate-900" : "font-semibold text-slate-700")}>{notif.titre}</p>
                        <p className="text-[13px] text-slate-500 mt-0.5 line-clamp-1">{notif.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-slate-200 mb-3" />
                  <p className="text-slate-500 font-medium">Aucune alerte</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
