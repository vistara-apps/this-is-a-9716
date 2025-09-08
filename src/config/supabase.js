import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database schema constants
export const TABLES = {
  USERS: 'users',
  CONTENT: 'content',
  USER_PREFERENCES: 'user_preferences',
  USER_INTERACTIONS: 'user_interactions',
  SUBSCRIPTIONS: 'subscriptions'
};

// Database schema types
export const PREFERENCE_TYPES = {
  LIKE: 'like',
  DISLIKE: 'dislike',
  SAVE: 'save',
  GENRE: 'genre',
  MOOD: 'mood',
  TIME: 'time'
};

export const INTERACTION_TYPES = {
  VIEW: 'view',
  LIKE: 'like',
  DISLIKE: 'dislike',
  SAVE: 'save',
  SHARE: 'share'
};
