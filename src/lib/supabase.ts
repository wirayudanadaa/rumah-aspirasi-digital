import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AduanClassification = 'PENGADUAN' | 'ASPIRASI' | 'PERMINTAAN_INFORMASI';

export type AduanStatus = 'PENDING' | 'VERIFIKASI' | 'PROSES' | 'SELESAI' | 'DITOLAK';

export interface Aduan {
  id: string;
  ticket_number: string;
  classification: AduanClassification;
  name: string;
  email: string;
  title: string;
  description: string;
  date_of_incident?: string;
  location?: string;
  institution?: string;
  category?: string;
  is_anonymous: boolean;
  is_secret: boolean;
  status: AduanStatus;
  reply_content?: string;
  replied_at?: string;
  created_at: string;
}

export interface AduanPublicTrack {
  ticket_number: string;
  classification: AduanClassification;
  title: string;
  status: AduanStatus;
  response: string | null;
  created_at: string;
  updated_at: string | null;
}
