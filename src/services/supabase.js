import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 생성 부분
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const AdminPassword = process.env.EXPO_PUBLIC_ADMIN_PASSWORD;