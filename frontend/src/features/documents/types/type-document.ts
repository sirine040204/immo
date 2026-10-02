export interface TypeDocument {
  id_type_document: number;
  entreprise: number;
  code: string;
  nom: string;
  description: string;
  a_echeance: boolean;
  statut: "ACTIF" | "ARCHIVE";
}

export interface CreateTypeDocumentDTO {
  code: string;
  nom: string;
  description?: string;
  a_echeance?: boolean;
}

export interface UpdateTypeDocumentDTO {
  code?: string;
  nom?: string;
  description?: string;
  a_echeance?: boolean;
}

export interface TypeDocumentFamille {
  id_type_document_famille: number;
  type_document: number;
  type_document_nom: string;
  famille: number;
  famille_nom: string;
  obligatoire: boolean;
}

export interface CreateTypeDocumentFamilleDTO {
  type_document: number;
  famille: number;
  obligatoire?: boolean;
}

export interface UpdateTypeDocumentFamilleDTO {
  type_document?: number;
  famille?: number;
  obligatoire?: boolean;
}
