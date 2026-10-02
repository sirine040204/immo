export enum TypeDonnee {
  TEXTE = "TEXTE",
  NOMBRE = "NOMBRE",
  DECIMAL = "DECIMAL",
  DATE = "DATE",
  BOOLEEN = "BOOLEEN",
  LISTE = "LISTE",
}

export interface AttributDynamique {
  id_attribut: number;
  famille: number; // ID of the Famille
  libelle: string;
  code: string;
  type_donnee: TypeDonnee;
  obligatoire: boolean;
  valeur_defaut: string;
  placeholder: string;
  valeur_min: number | null;
  valeur_max: number | null;
  longueur_min: number | null;
  longueur_max: number | null;
  ordre_affichage: number;
  statut: "ACTIVE" | "ARCHIVEE";
}

export interface CreateAttributDTO {
  famille: number;
  libelle: string;
  code: string;
  type_donnee: TypeDonnee;
  obligatoire: boolean;
  valeur_defaut?: string;
  placeholder?: string;
  valeur_min?: number | null;
  valeur_max?: number | null;
  longueur_min?: number | null;
  longueur_max?: number | null;
  ordre_affichage?: number;
}

export interface UpdateAttributDTO {
  libelle?: string;
  obligatoire?: boolean;
  valeur_defaut?: string;
  placeholder?: string;
  valeur_min?: number | null;
  valeur_max?: number | null;
  longueur_min?: number | null;
  longueur_max?: number | null;
  ordre_affichage?: number;
}

export interface OptionAttribut {
  id: number;
  attribut: number; // ID of AttributDynamique
  libelle: string;
  code: string;
  ordre: number;
  statut: "ACTIVE" | "ARCHIVEE";
}

export interface CreateOptionAttributDTO {
  libelle: string;
  code: string;
  ordre?: number;
}

export interface UpdateOptionAttributDTO {
  libelle?: string;
  code?: string;
  ordre?: number;
}
