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

// Since the API only returns a token (not a full user profile on login), 
// we construct a partial User type from what we know or can fetch later.
export interface User {
  id: number;
}
