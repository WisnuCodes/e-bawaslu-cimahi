export interface LhppItem {
  lhpp_id: string;
  tps_id: string;
  uploaded_by: string;
  nomor_lhpp: string;
  judul_laporan: string;
  tanggal_pengawasan: string;
  tahapan_pemilu: string;
  deskripsi_pengawasan: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  status_lhpp: 'Draft' | 'Submitted' | 'Verified' | 'Rejected';
  catatan_verifikasi?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  tps?: {
    tps_id: string;
    no_tps: number;
    kelurahan: string;
    kecamatan: string;
  };
  uploader?: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
  verifier?: {
    user_id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface LhppResponse {
  success: boolean;
  message: string;
  data: LhppItem[];
}

export interface SingleLhppResponse {
  success: boolean;
  message?: string;
  data: LhppItem;
}
