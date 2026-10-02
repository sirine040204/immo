export interface Employee {
  id_utilisateur: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  role: number | null;
  role_nom: string | null;
  statut: string;
  date_creation: string;
  derniere_connexion: string | null;
  invitation_expires_at?: string | null;
}

export interface EmployeeUpdate {
  nom?: string;
  prenom?: string;
  telephone?: string | null;
  role?: number | null;
}

export interface Role {
  id: number;
  nom: string;
  statut: string;
  description: string;
  date_creation: string;
}
