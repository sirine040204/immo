export type TypePlanification = "TEMPS" | "USAGE" | "DATE_FIXE" | "MANUELLE";
export type UnitePeriodicite = "JOURS" | "SEMAINES" | "MOIS" | "ANNEES";
export type UniteUsage = "KM" | "HEURES" | "CYCLES";
export type Statut = "ACTIF" | "ARCHIVE";

export interface ModeleEntretien {
  id: number;
  famille: number;
  type_entretien: number;
  code: string;
  nom: string;
  description: string;
  type_planification: TypePlanification;
  periodicite?: number | null;
  unite_periodicite?: UnitePeriodicite | null;
  seuil_usage?: number | null;
  unite_usage?: UniteUsage | null;
  date_fixe?: string | null;
  statut: Statut;
  entreprise: number;
}

export interface CreateModeleEntretienDTO {
  famille: number;
  type_entretien: number;
  code: string;
  nom: string;
  description?: string;
  type_planification: TypePlanification;
  periodicite?: number | null;
  unite_periodicite?: UnitePeriodicite | null;
  seuil_usage?: number | null;
  unite_usage?: UniteUsage | null;
  date_fixe?: string | null;
}

export interface UpdateModeleEntretienDTO extends Partial<CreateModeleEntretienDTO> {}
