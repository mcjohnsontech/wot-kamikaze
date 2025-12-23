import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing required environment variables:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY\n' +
    'Please check your .env.local file'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// --- Type Definitions ---
export interface Order {
  id: string;
  readable_id: string;
  status: 'NEW' | 'PROCESSING' | 'READY' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  price_total: number;
  rider_phone: string | null;
  rider_token: string | null;
  rider_lat: number | null;
  rider_lng: number | null;
  csat_score: number | null;
  csat_comment: string | null;
  created_at: string;
  updated_at: string;
  sme_id: string;
}

export interface SMEProfile {
  id: string;
  name: string;
  phone: string;
  whatsapp_number: string;
  business_name: string;
  created_at: string;
  updated_at: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  created_at: string;
}
