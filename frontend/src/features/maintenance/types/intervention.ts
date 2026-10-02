export type PrioriteIntervention = "FAIBLE" | "NORMALE" | "HAUTE" | "URGENTE";
export type StatutIntervention = "BROUILLON" | "PLANIFIEE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export interface Intervention {
  id: number;
  entreprise: number;
  immobilisation: number;
  modele_entretien: number | null;
  type_entretien: number;
  demande_par: number;
  demande_par_nom?: string;
  intervention_nom?: string;
  date_demande: string;
  date_prevue: string | null;
  date_debut: string | null;
  date_fin: string | null;
  priorite: PrioriteIntervention;
  motif: string;
  statut: StatutIntervention;
}

export interface CreateInterventionDTO {
  immobilisation: number;
  type_entretien: number;
  modele_entretien: number | null;
  date_prevue?: string | null;
  priorite?: PrioriteIntervention;
  motif?: string;
}

export interface UpdateInterventionDTO {
  immobilisation?: number;
  type_entretien?: number;
  modele_entretien?: number | null;
  date_prevue?: string | null;
  priorite?: PrioriteIntervention;
  motif?: string;
}

export interface PatchInterventionStatutDTO {
  statut: StatutIntervention;
}

// --- SUIVI ETAPE INTERVENTION ---

export type SuiviEtapeStatut = "A_VALIDER" | "VALIDEE" | "NON_VALIDEE";

export interface SuiviEtapeIntervention {
  id: number;
  intervention: number;
  etape_entretien: number | null;
  libelle: string;
  description: string;
  ordre: number;
  obligatoire: boolean;
  statut: SuiviEtapeStatut;
  commentaire: string;
  date_validation: string | null;
  validee_par: number | null;
  validee_par_nom?: string | null;
}

export interface CreateSuiviEtapeDTO {
  intervention: number;
  libelle: string;
  description: string;
  ordre: number;
  obligatoire: boolean;
}

export interface UpdateSuiviEtapeDTO {
  statut?: SuiviEtapeStatut;
  commentaire?: string;
}
