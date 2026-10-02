"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Clock, ShieldAlert, FileText, Settings, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { fetchNotifications, markAsRead, markAllAsRead } from "../api/notifications";
import { AppNotification, NotificationLevel, NotificationType } from "../types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnseenAlert, setHasUnseenAlert] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasUnseenAlert(false);
    }
  };

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60000, // Refresh every minute
  });

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (notif: AppNotification) => {
    if (!notif.lu) {
      markAsReadMutation.mutate(notif.id_notification);
    }
    setIsOpen(false);
    
    if (notif.cout) {
      router.push(`/validations/couts?highlightId=${notif.cout}`);
    } else if (notif.intervention) {
      router.push(`/entretiens/execution/${notif.intervention}`);
    } else if (notif.document) {
      router.push(`/documents/documents?highlightId=${notif.document}`);
    } else if (notif.immobilisation) {
      router.push(`/immobilisations/immobilisations/${notif.immobilisation}`);
    } else {
      // Fallbacks based on type
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

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "DOCUMENT_AJOUT":
      case "DOCUMENT_EXPIRATION":
        return <FileText className="h-4 w-4" />;
      case "GARANTIE_EXPIRATION":
        return <ShieldAlert className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Settings className="h-4 w-4" />;
      case "COUT_VALIDATION":
        return <Check className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: NotificationLevel, lu: boolean) => {
    if (lu) return "text-slate-400 bg-slate-100";
    switch (level) {
      case "INFO":
        return "text-blue-600 bg-blue-100";
      case "WARNING":
        return "text-orange-600 bg-orange-100";
      case "URGENT":
        return "text-red-600 bg-red-100";
      default:
        return "text-slate-600 bg-slate-100";
    }
  };

  const prevUnreadIds = React.useRef<Set<number>>(new Set());
  const initialLoadRef = React.useRef(true);

  React.useEffect(() => {
    if (notifications.length > 0) {
      const currentUnreadIds = new Set(notifications.filter(n => !n.lu).map(n => n.id_notification));
      
      if (initialLoadRef.current) {
        prevUnreadIds.current = currentUnreadIds;
        initialLoadRef.current = false;
        return;
      }

      const newUnreadNotifs = notifications.filter(
        n => !n.lu && !prevUnreadIds.current.has(n.id_notification)
      );

      if (newUnreadNotifs.length > 0) {
        setHasUnseenAlert(true);
        // Play beep
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beep
            
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.15);
          }
        } catch (e) {
          console.warn("Audio playback blocked by browser", e);
        }

        // Trigger toasts
        newUnreadNotifs.forEach(notif => {
          toast(notif.titre, {
            description: notif.message,
            icon: getIcon(notif.type_notification),
            action: {
              label: "Voir",
              onClick: () => handleNotificationClick(notif),
            }
          });
        });
      }

      prevUnreadIds.current = currentUnreadIds;
    }
  }, [notifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        className="relative rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center p-2 transition-colors"
      >
        <Bell className={cn("h-5 w-5 transition-all duration-300", hasUnseenAlert && "animate-pulse text-amber-500")} />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white",
            hasUnseenAlert && "animate-bounce shadow-[0_0_8px_rgba(239,68,68,0.6)]"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden rounded-xl border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
          <div className="font-semibold text-slate-900">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-brand-green hover:text-brand-green/80 hover:bg-transparent"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <div className="max-h-[350px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500 flex flex-col items-center">
              <Bell className="h-8 w-8 text-slate-300 mb-2" />
              Aucune notification
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id_notification}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b last:border-0 hover:bg-slate-50",
                    !notif.lu ? "bg-blue-50/30" : "opacity-75"
                  )}
                >
                  <div className={cn("mt-0.5 flex-shrink-0 p-2 rounded-full h-8 w-8 flex items-center justify-center", getLevelColor(notif.niveau, notif.lu))}>
                    {getIcon(notif.type_notification)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className={cn("text-sm font-medium leading-tight truncate", !notif.lu ? "text-slate-900" : "text-slate-700")}>
                      {notif.titre}
                    </p>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    {(notif.document_nom || notif.immobilisation_nom || notif.intervention_nom || notif.cout_nom) && (
                      <p className="text-[11px] text-brand-green/80 font-medium truncate pt-0.5">
                        {notif.document_nom || notif.immobilisation_nom || notif.intervention_nom || notif.cout_nom}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 font-medium pt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(notif.date_creation), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  {!notif.lu && (
                    <div className="w-2 h-2 rounded-full bg-brand-green mt-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-2 bg-slate-50 border-t">
          <Button 
            variant="ghost" 
            className="w-full text-sm text-slate-600 hover:text-brand-green hover:bg-brand-green/10"
            onClick={() => {
              setIsOpen(false);
              router.push("/suivi/alertes");
            }}
          >
            Voir toutes les notifications
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
