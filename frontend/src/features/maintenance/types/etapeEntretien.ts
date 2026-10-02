export interface EtapeEntretien {
  id: number;
  modele_entretien: number;
  libelle: string;
  description?: string;
  ordre: number;
  obligatoire: boolean;
  statut: "ACTIF" | "ARCHIVE";
}

export interface CreateEtapeEntretienDTO {
  modele_entretien: number;
  libelle: string;
  description?: string;
  ordre: number;
  obligatoire: boolean;
}

export interface UpdateEtapeEntretienDTO {
  modele_entretien?: number;
  libelle?: string;
  description?: string;
  ordre?: number;
  obligatoire?: boolean;
}
