export enum DocumentStatut {
  ACTIF = "ACTIF",
  ARCHIVE = "ARCHIVE",
}

export interface Document {
  id: number;
  entreprise: number;
  immobilisation: number | null;
  type_document: number;
  nom: string;
  description: string;
  fichier: string;
  date_debut_validite: string | null;
  date_fin_validite: string | null;
  statut: DocumentStatut;
  date_ajout: string;
  ajoute_par: number;
  ajoute_par_nom?: string;
  type_document_nom?: string;
  immobilisation_code?: string;
}

export interface CreateDocumentDTO {
  type_document: number;
  immobilisation?: number | null;
  nom: string;
  description?: string;
  fichier: File;
  date_debut_validite?: string | null;
  date_fin_validite?: string | null;
}

export interface UpdateDocumentDTO {
  type_document?: number;
  immobilisation?: number | null;
  nom?: string;
  description?: string;
  fichier?: File | null;
  date_debut_validite?: string | null;
  date_fin_validite?: string | null;
}

export interface DocumentExpirationItem {
  id: number;
  nom: string;
  type_document: number;
  date_fin_validite: string | null;
  statut_validite: 'EXPIRE' | 'BIENTOT_EXPIRE' | 'VALIDE' | 'SANS_ECHEANCE';
  jours_restants: number | null;
}

export interface DocumentExpirationResponse {
  date_verification: string;
  expired: DocumentExpirationItem[];
  expires_soon: DocumentExpirationItem[];
  valid: DocumentExpirationItem[];
  sans_echeance: DocumentExpirationItem[];
  nombre_expired: number;
  nombre_expires_soon: number;
  nombre_valid: number;
  nombre_sans_echeance: number;
  nombre_total: number;
}

