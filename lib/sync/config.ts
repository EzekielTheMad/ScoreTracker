/**
 * Sync feature flag and Supabase connection. The URL and publishable key
 * are public by design (Row Level Security guards all data access), so
 * they ship as defaults; env vars override per deployment.
 */
export const SYNC_ENABLED = process.env.NEXT_PUBLIC_SYNC_ENABLED !== 'false';

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://ilaatvossnjydjedbkeq.supabase.co';

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  'sb_publishable_NzJi6ZTzI9a0ZJwsfRkvkg_F2zeOv11';
