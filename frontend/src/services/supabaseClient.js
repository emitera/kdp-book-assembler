import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jezhiebjkbpuidabhvav.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_06RsSpB-EhaTncT7xgsCHA_5L7Prauz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
