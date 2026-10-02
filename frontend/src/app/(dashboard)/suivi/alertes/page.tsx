"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, ShieldAlert, FileText, Settings, AlertTriangle, ArrowRight, CheckCircle2, Circle, Filter, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { fetchNotifications, markAsRead, markAsUnread, markAllAsRead, deleteNotification, deleteAllReadNotifications } from "@/features/notifications/api/notifications";
import { AppNotification, NotificationLevel, NotificationType } from "@/features/notifications/types";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DocumentsExpirations } from "@/features/documents/components/DocumentsExpirations";

type DateFilter = "ALL" | "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "OLDER";
type LevelFilter = "ALL" | NotificationLevel;

export default function AlertesEcheancesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [viewMode, setViewMode] = useState<"NOTIFICATIONS" | "DOCUMENTS">("NOTIFICATIONS");
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("ALL");

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: markAsUnread,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification supprimée.");
    }
  });

  const deleteAllReadMutation = useMutation({
    mutationFn: deleteAllReadNotifications,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(data.message || "Notifications lues supprimées.");
    }
  });

  const handleToggleReadStatus = (e: React.MouseEvent, notif: AppNotification) => {
    e.stopPropagation();
    if (notif.lu) {
      markAsUnreadMutation.mutate(notif.id_notification);
    } else {
      markAsReadMutation.mutate(notif.id_notification);
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.lu) {
      markAsReadMutation.mutate(notif.id_notification);
    }
    
    if (notif.cout) {
      router.push(`/validations/couts?highlightId=${notif.cout}`);
    } else if (notif.intervention) {
      router.push(`/entretiens/execution/${notif.intervention}`);
    } else if (notif.document) {
      router.push(`/documents/documents?highlightId=${notif.document}`);
    } else if (notif.immobilisation) {
      router.push(`/immobilisations/immobilisations/${notif.immobilisation}`);
    } else {
      if (notif.type_notification === "COUT_VALIDATION") {
        router.push("/validations/couts");
      } else if (notif.type_notification === "DOCUMENT_AJOUT" || notif.type_notification === "DOCUMENT_EXPIRATION") {
        router.push("/documents/documents");
      } else if (notif.type_notification === "MAINTENANCE") {
        router.push("/entretiens/execution");
      } else if (notif.type_notification === "GARANTIE_EXPIRATION") {
        router.push("/immobilisations/immobilisations");
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // 1. Read/Unread Filter
    if (activeTab === "UNREAD") filtered = filtered.filter((n) => !n.lu);
    if (activeTab === "READ") filtered = filtered.filter((n) => n.lu);

    // 2. Level Filter
    if (levelFilter !== "ALL") {
      filtered = filtered.filter((n) => n.niveau === levelFilter);
    }

    // 3. Date Filter
    if (dateFilter !== "ALL") {
      filtered = filtered.filter((n) => {
        const d = new Date(n.date_creation);
        switch (dateFilter) {
          case "TODAY": return isToday(d);
          case "THIS_WEEK": return isThisWeek(d);
          case "THIS_MONTH": return isThisMonth(d);
          case "OLDER": return !isThisMonth(d);
          default: return true;
        }
      });
    }

    return filtered;
  }, [notifications, activeTab, levelFilter, dateFilter]);

  // Grouping the filtered notifications for better visual parsing
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; items: AppNotification[] }[] = [
      { label: "Aujourd'hui", items: [] },
      { label: "Hier", items: [] },
      { label: "Cette semaine", items: [] },
      { label: "Ce mois-ci", items: [] },
      { label: "Plus ancien", items: [] },
    ];

    filteredNotifications.forEach(notif => {
      const d = new Date(notif.date_creation);
      if (isToday(d)) groups[0].items.push(notif);
      else if (isYesterday(d)) groups[1].items.push(notif);
      else if (isThisWeek(d)) groups[2].items.push(notif);
      else if (isThisMonth(d)) groups[3].items.push(notif);
      else groups[4].items.push(notif);
    });

    return groups.filter(g => g.items.length > 0);
  }, [filteredNotifications]);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "DOCUMENT_AJOUT":
      case "DOCUMENT_EXPIRATION": return <FileText className="h-5 w-5" />;
      case "GARANTIE_EXPIRATION": return <ShieldAlert className="h-5 w-5" />;
      case "MAINTENANCE": return <Settings className="h-5 w-5" />;
      case "COUT_VALIDATION": return <Check className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getLevelColor = (level: NotificationLevel, lu: boolean) => {
    if (lu) return "text-slate-400 bg-slate-100 border-slate-200";
    switch (level) {
      case "INFO": return "text-blue-600 bg-blue-50 border-blue-200";
      case "WARNING": return "text-orange-600 bg-orange-50 border-orange-200";
      case "URGENT": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const renderLevelBadge = (level: NotificationLevel, lu: boolean) => {
    let text = "";
    let colorClass = "";
    
    switch (level) {
      case "INFO":
        text = "Information";
        colorClass = lu ? "text-slate-400 bg-slate-100" : "text-blue-700 bg-blue-100/80 border-blue-200";
        break;
      case "WARNING":
        text = "Attention";
        colorClass = lu ? "text-slate-400 bg-slate-100" : "text-orange-700 bg-orange-100/80 border-orange-200";
        break;
      case "URGENT":
        text = "Urgent";
        colorClass = lu ? "text-slate-400 bg-slate-100" : "text-red-700 bg-red-100/80 border-red-200";
        break;
    }

    return (
      <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider px-2 py-0 h-5", colorClass)}>
        {text}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-brand-green" />
            Centre de Notifications
          </h1>
          <p className="text-slate-500">
            Retrouvez ici toutes vos alertes, échéances et nouveautés.
          </p>
        </div>
        {viewMode === "NOTIFICATIONS" && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="bg-brand-green hover:bg-brand-green/90 text-white shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
            {notifications.some(n => n.lu) && (
              <Button
                onClick={() => deleteAllReadMutation.mutate()}
                disabled={deleteAllReadMutation.isPending}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer les lues
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex space-x-1 p-1 bg-slate-200/50 rounded-lg w-fit border mb-2 shadow-sm">
        <button
          onClick={() => setViewMode("NOTIFICATIONS")}
          className={cn(
            "px-5 py-2 text-sm font-semibold rounded-md transition-all",
            viewMode === "NOTIFICATIONS"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-300/50"
          )}
        >
          Flux de Notifications
        </button>
        <button
          onClick={() => setViewMode("DOCUMENTS")}
          className={cn(
            "px-5 py-2 text-sm font-semibold rounded-md transition-all",
            viewMode === "DOCUMENTS"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
              : "text-slate-600 hover:text-slate-800 hover:bg-slate-300/50"
          )}
        >
          Échéances Documents
        </button>
      </div>

      {viewMode === "NOTIFICATIONS" ? (
        <>
          {/* Filters Bar */}
          <Card className="bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
              
              <div className="flex space-x-1 p-1 bg-slate-100/80 rounded-lg border">
                {(["ALL", "UNREAD", "READ"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                      activeTab === tab
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                  >
                    {tab === "ALL" && "Toutes"}
                    {tab === "UNREAD" && (
                      <>
                        Non lues
                        {unreadCount > 0 && (
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </>
                    )}
                    {tab === "READ" && "Lues"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-600">Filtres :</span>
                </div>
                
                {/* Level Filter */}
                <select 
                  value={levelFilter} 
                  onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
                  className="text-sm border-slate-200 rounded-md py-1.5 pl-3 pr-8 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm"
                >
                  <option value="ALL">Tous les niveaux</option>
                  <option value="INFO">Information</option>
                  <option value="WARNING">Attention</option>
                  <option value="URGENT">Urgent</option>
                </select>

                {/* Date Filter */}
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="text-sm border-slate-200 rounded-md py-1.5 pl-3 pr-8 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm"
                >
                  <option value="ALL">Toutes les dates</option>
                  <option value="TODAY">Aujourd'hui</option>
                  <option value="THIS_WEEK">Cette semaine</option>
                  <option value="THIS_MONTH">Ce mois-ci</option>
                  <option value="OLDER">Plus ancien</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green/20"></div>
            </div>
          ) : isError ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-200">
              Une erreur est survenue lors du chargement des notifications.
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {groupedNotifications.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-lg font-medium text-slate-900">Aucune notification trouvée</p>
                    <p className="text-slate-500 text-center max-w-sm mt-1">
                      Essayez de modifier vos filtres pour voir plus de résultats.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                groupedNotifications.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pl-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {group.label}
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs ml-2">
                        {group.items.length}
                      </span>
                    </h3>
                    
                    <div className="relative border-l-2 border-slate-200/60 ml-4 pl-6 space-y-5 py-2">
                      {group.items.map((notif) => (
                        <div key={notif.id_notification} className="relative">
                          {/* Timeline Dot */}
                          <div className={cn(
                            "absolute -left-[35px] top-6 w-[18px] h-[18px] rounded-full border-[3px] border-white shadow-sm z-10 transition-colors",
                            notif.lu ? "bg-slate-300" : "bg-brand-green ring-4 ring-brand-green/20"
                          )} />

                          <div
                            onClick={() => handleNotificationClick(notif)}
                            className={cn(
                              "group flex flex-col sm:flex-row items-start gap-4 p-5 rounded-xl border transition-all duration-300 cursor-pointer relative overflow-hidden",
                              notif.lu 
                                ? "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white shadow-sm opacity-80 hover:opacity-100" 
                                : "bg-white border-brand-green/20 hover:border-brand-green/50 shadow-md hover:shadow-lg ring-1 ring-brand-green/5 translate-x-1"
                            )}
                          >
                            {!notif.lu && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-green" />
                            )}
                          
                          <div className={cn("p-3 rounded-xl border shrink-0 mt-1 sm:mt-0", getLevelColor(notif.niveau, notif.lu))}>
                            {getIcon(notif.type_notification)}
                          </div>

                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className={cn("font-semibold text-base leading-tight", !notif.lu ? "text-slate-900" : "text-slate-700")}>
                                    {notif.titre}
                                  </h3>
                                  {renderLevelBadge(notif.niveau, notif.lu)}
                                </div>
                                
                                <p className="text-slate-600 leading-relaxed text-sm">
                                  {notif.message}
                                </p>

                                {/* Show related object names if available */}
                                {(notif.document_nom || notif.immobilisation_nom || notif.intervention_nom || notif.cout_nom) && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {notif.immobilisation_nom && (
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                        Immobilisation : <span className="font-medium ml-1">{notif.immobilisation_nom}</span>
                                      </Badge>
                                    )}
                                    {notif.document_nom && (
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                        Document : <span className="font-medium ml-1">{notif.document_nom}</span>
                                      </Badge>
                                    )}
                                    {notif.intervention_nom && (
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                        <span className="font-medium">{notif.intervention_nom}</span>
                                      </Badge>
                                    )}
                                    {notif.cout_nom && (
                                      <Badge variant="outline" className="bg-slate-50 text-slate-700 font-normal">
                                        Coût : <span className="font-medium ml-1">{notif.cout_nom}</span>
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* Show action button if related object exists */}
                                {(notif.document || notif.immobilisation || notif.intervention || notif.cout) && (
                                  <div className="pt-2">
                                    <Button 
                                      variant="secondary" 
                                      size="sm" 
                                      className="text-xs bg-brand-green/10 text-brand-green hover:bg-brand-green/20 border-transparent shadow-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationClick(notif);
                                      }}
                                    >
                                      Voir les détails
                                      <ArrowRight className="w-3 h-3 ml-1.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-0 pt-3 sm:pt-0">
                                <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(notif.date_creation), "HH:mm", { locale: fr })}
                                </span>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs",
                                    notif.lu ? "text-slate-500 hover:text-slate-700 bg-slate-100/50" : "text-brand-green hover:text-brand-green/80 hover:bg-brand-green/10"
                                  )}
                                  onClick={(e) => handleToggleReadStatus(e, notif)}
                                >
                                  {notif.lu ? (
                                    <>
                                      <Circle className="w-3 h-3 mr-1.5" />
                                      Marquer non lu
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 mr-1.5" />
                                      Marquer lu
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="sm:opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMutation.mutate(notif.id_notification);
                                  }}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <DocumentsExpirations />
      )}
    </div>
  );
}
