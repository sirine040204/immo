export type NotificationType =
  | 'DOCUMENT_AJOUT'
  | 'DOCUMENT_EXPIRATION'
  | 'GARANTIE_EXPIRATION'
  | 'MAINTENANCE'
  | 'COUT_VALIDATION'
  | 'STATUT_CHANGE'
  | 'AFFECTATION';

export type NotificationLevel = 'INFO' | 'WARNING' | 'URGENT';

export interface AppNotification {
  id_notification: number;
  entreprise: number;
  destinataire: number;
  type_notification: NotificationType;
  niveau: NotificationLevel;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  date_lecture: string | null;
  immobilisation: number | null;
  immobilisation_nom?: string;
  document: number | null;
  document_nom?: string;
  intervention: number | null;
  intervention_nom?: string;
  cout: number | null;
  cout_nom?: string;
}
