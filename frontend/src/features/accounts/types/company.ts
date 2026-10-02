export interface CompanyProfile {
  id_entreprise: number;
  nom_entreprise: string;
  numero_fiscal: string;
  forme_juridique: string;
  secteur_activite: string;
  email_notifications: string;
  numero_telephone: string;
  date_creation: string;
  description: string;
  documents_justificatifs: string | null;
  statut: string;
  logo: string | null;
  adresse: string;
  site_web: string | null;
  devise: string;
  langue: string;
  delai_rappel_maintenance_defaut: number;
  delai_rappel_document_defaut: number;
}

export interface CompanyProfileUpdate {
  nom_entreprise?: string;
  forme_juridique?: string;
  secteur_activite?: string;
  email_notifications?: string;
  numero_telephone?: string;
  description?: string;
  documents_justificatifs?: string | null;
  logo?: string | null;
  adresse?: string;
  site_web?: string | null;
  devise?: string;
  langue?: string;
  delai_rappel_maintenance_defaut?: number;
  delai_rappel_document_defaut?: number;
}
