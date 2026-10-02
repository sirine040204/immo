export enum TypeCout {
  ACQUISITION = "ACQUISITION",
  FRAIS_ACQUISITION = "FRAIS_ACQUISITION",
  ENTRETIEN = "ENTRETIEN",
  REPARATION = "REPARATION",
  ASSURANCE = "ASSURANCE",
  CONTROLE_TECHNIQUE = "CONTROLE_TECHNIQUE",
  AUTRE = "AUTRE",
}

export enum StatutCout {
  BROUILLON = "BROUILLON",
  EN_ATTENTE_VALIDATION = "EN_ATTENTE_VALIDATION",
  VALIDE = "VALIDE",
  REJETE = "REJETE",
}

export interface CoutImmobilisation {
  id_cout: number;
  immobilisation: number;
  immobilisation_nom?: string;
  type_cout: TypeCout;
  libelle: string;
  date_cout: string;
  montant_ht: string;
  taux_tva: string;
  montant_tva: string;
  montant_ttc: string;
  document: number | null;
  statut: StatutCout;
  commentaire: string;
  is_archived: boolean;
  date_archivage: string | null;
  archive_par: number | null;
  archive_par_nom?: string | null;
  date_creation: string;
  cree_par: number | null;
  cree_par_nom?: string | null;
  modifie_par: number | null;
  modifie_par_nom?: string | null;
  date_modification: string;
  valide_par: number | null;
  valide_par_nom?: string | null;
  date_validation: string | null;
  motif_rejet: string | null;
}

export interface CreateCoutDTO {
  immobilisation: number;
  type_cout: TypeCout;
  libelle: string;
  date_cout: string;
  montant_ht: string;
  taux_tva: string;
  document?: number | null;
  commentaire?: string;
}

export interface UpdateCoutDTO {
  immobilisation?: number;
  type_cout?: TypeCout;
  libelle?: string;
  date_cout?: string;
  montant_ht?: string;
  taux_tva?: string;
  document?: number | null;
  commentaire?: string;
}
