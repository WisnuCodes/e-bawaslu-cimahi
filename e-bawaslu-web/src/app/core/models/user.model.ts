export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pegawai';
}

export interface AuthResponse {
  token: string;
  user: User;
}
