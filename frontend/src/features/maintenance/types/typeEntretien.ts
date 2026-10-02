export interface TypeEntretien {
  id: number;
  code: string;
  nom: string;
  description: string;
  statut: "ACTIF" | "ARCHIVE";
  entreprise: number;
}

export interface CreateTypeEntretienDTO {
  code: string;
  nom: string;
  description?: string;
}

export interface UpdateTypeEntretienDTO {
  code?: string;
  nom?: string;
  description?: string;
}
