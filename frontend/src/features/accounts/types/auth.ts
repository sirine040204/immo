export interface LoginCredentials {
  email: string;
  mot_de_passe: string;
}

export interface AuthResponse {
  message: string;
  access: string;
  refresh: string;
}

export interface JWTPayload {
  token_type: string;
  exp: number;
  iat: number;
  jti: string;
  user_id: number;
}

// Profile returned by /api/v1/accounts/me/
export interface User {
  id_utilisateur: number;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
  is_company_admin: boolean;
  statut: string;
  role?: number;
  role_nom?: string;
  entreprise?: number;
  entreprise_nom?: string;
  photo?: string;
}

export interface RegisterCredentials {
  nom: string;
  prenom: string;
  email: string;
  mot_de_passe: string;
  telephone?: string;
  nom_entreprise: string;
  numero_fiscal: string;
  forme_juridique: string;
  secteur_activite: string;
  email_notifications: string;
  numero_telephone: string;
  adresse?: string;
  photo?: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}
