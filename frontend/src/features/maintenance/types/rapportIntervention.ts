export interface RapportIntervention {
  id: number;
  intervention: number;
  observations: string;
  travaux_realises: string;
  recommandations: string;
  date_rapport: string;
  redige_par: number;
  redige_par_nom?: string;
  entreprise_nom?: string;
}

export interface CreateRapportInterventionDTO {
  intervention: number;
  observations?: string;
  travaux_realises: string;
  recommandations?: string;
}

export interface UpdateRapportInterventionDTO {
  observations?: string;
  travaux_realises?: string;
  recommandations?: string;
}
