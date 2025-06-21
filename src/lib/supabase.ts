import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          staff_id: string;
          date: string;
          raw_responses: any;
          formatted_report: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          date: string;
          raw_responses: any;
          formatted_report: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          date?: string;
          raw_responses?: any;
          formatted_report?: string;
          created_at?: string;
        };
      };
      admin_auth: {
        Row: {
          id: string;
          password_hash: string;
        };
        Insert: {
          id?: string;
          password_hash: string;
        };
        Update: {
          id?: string;
          password_hash?: string;
        };
      };
    };
  };
}