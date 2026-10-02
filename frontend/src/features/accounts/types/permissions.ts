export interface Permission {
  id: number;
  code: string;
  nom: string;
  description?: string;
}

export interface RolePermission {
  id: number;
  permission: number; // ID of the permission
  permission_code: string;
  permission_nom: string;
}

export interface PermissionRequest {
  id: number;
  user: number;
  user_nom: string;
  user_prenom: string;
  user_email: string;
  permission: number;
  permission_code: string;
  permission_nom: string;
  statut: "PENDING" | "ACCEPTED" | "REJECTED";
  motif_rejet?: string;
  date_demande: string;
  date_traitement?: string;
}
