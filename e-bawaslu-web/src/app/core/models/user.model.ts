export interface User {
  user_id?: string;
  id?: string;
  username?: string;
  nama?: string;
  name?: string;
  email: string;
  role: string;
  divisi_id?: string;
  mfa_enabled?: boolean;
  status_aktif?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
