export interface Famille {
  id_famille: number;
  code: string;
  nom: string;
  description?: string;
  icone?: string;
  taux_amortissement?: number | null;
  statut: "ACTIVE" | "ARCHIVEE";
  entreprise: number;
}

export interface CreateFamilleDTO {
  code: string;
  nom: string;
  description?: string;
  icone?: File | null;
  taux_amortissement?: number | null;
}

export interface UpdateFamilleDTO extends Partial<CreateFamilleDTO> {}
