export enum ImmobilisationStatut {
  CREEE = "CREEE",
  ACTIVE = "ACTIVE",
  HORS_SERVICE = "HORS_SERVICE",
  REFORMEE = "REFORMEE",
  ARCHIVEE = "ARCHIVEE",
}

export enum ModeCalcul {
  LINEAIRE = "LINEAIRE",
  DEGRESSIF = "DEGRESSIF",
}

export enum MotifSortie {
  VENTE = "VENTE",
  MISE_AU_REBUT = "MISE_AU_REBUT",
  DESTRUCTION = "DESTRUCTION",
  DON = "DON",
  REMPLACEMENT = "REMPLACEMENT",
  AUTRE = "AUTRE",
}

export interface Immobilisation {
  id_immobilisation: number;
  entreprise: number;
  entreprise_nom?: string;
  famille: number;
  code: string;
  designation: string;
  description: string;
  statut: ImmobilisationStatut;
  date_acquisition: string;
  valeur_brute: string;
  tva_recuperable: string;
  numero_facture: string;
  taux_amortissement: string | null;
  mode_calcul: ModeCalcul;
  amortissement_anterieur: string;
  numero_serie: string;
  date_mise_en_service: string | null;
  date_fin_garantie: string | null;
  etat_physique: string;
  date_cession: string | null;
  prix_cession: string | null;
  motif_sortie: MotifSortie | null;
  cree_par: number | null;
  cree_par_nom?: string | null;
  date_creation: string;
  modifie_par: number | null;
  modifie_par_nom?: string | null;
  date_derniere_modification: string;
  date_derniere_maintenance: string | null;
  date_prochaine_maintenance: string | null;
  has_missing_documents?: boolean;
  alerte_predictive?: {
    niveau: "CRITIQUE" | "ATTENTION";
    message: string;
  } | null;
}

export interface ImmobilisationFormData {
  famille: number;
  designation: string;
  description?: string;
  code: string;
  date_acquisition: string;
  valeur_brute: number;
  tva_recuperable?: number;
  numero_facture?: string;
  taux_amortissement?: number;
  mode_calcul?: ModeCalcul;
  amortissement_anterieur?: number;
  numero_serie?: string;
  date_mise_en_service?: string;
  date_fin_garantie?: string;
  etat_physique?: string;
  date_cession?: string;
  prix_cession?: number;
  motif_sortie?: MotifSortie;
}

export interface ValeurAttribut {
  id: number;
  immobilisation: number;
  attribut: number;
  option: number | null;
  valeur: string | null;
}

export interface ValeurAttributFormData {
  immobilisation: number;
  attribut: number;
  option?: number | null;
  valeur?: string | null;
}

export interface ReleveUsage {
  id: number;
  immobilisation: number;
  attribut: number;
  option: number | null;
  valeur: string | null;
  date_releve: string;
}
