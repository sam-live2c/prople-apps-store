import { getSupabaseAdminClient } from './supabase.ts';

export type AdminAction =
  | 'DELETE_APP'
  | 'UPDATE_APP'
  | 'RECEIVE_REPORTS'
  | 'DISMISS_REPORT'
  | 'DELETE_REVIEW'
  | 'BAN_LINK'
  | 'VERIFY_ACCOUNT'
  | 'RESTRICT_PUBLISHER'
  | 'MANAGE_ADMINS';

export interface ServerAdminRecord {
  uid?: string;
  email: string;
  role: 'Super Admin' | 'Store Administrator' | 'Platform Moderator';
  permissions: AdminAction[];
  grantedAt?: string;
  isActive: boolean;
}

export const ALL_ADMIN_ACTIONS: AdminAction[] = [
  'DELETE_APP',
  'UPDATE_APP',
  'RECEIVE_REPORTS',
  'DISMISS_REPORT',
  'DELETE_REVIEW',
  'BAN_LINK',
  'VERIFY_ACCOUNT',
  'RESTRICT_PUBLISHER',
  'MANAGE_ADMINS',
];

export const DEFAULT_ADMIN_EMAILS = [
  "ventureforge.corp@gmail.com",
  "sahabhaiislive@gmail.com",
  "sahanurmolla077@gmail.com",
  "sahanurmolla1777@gmail.com",
  "sahanurmolla7076@gmail.com",
  "sahanurmolla2886@gmail.com",
  "sahanurmolla190@gmail.com",
  "sahanurmolla1290@gmail.com",
  "prople.site@gmail.com",
  "cloaktailsupport@gmail.com",
  "cloaktailofficial@gmail.com",
  "prople.org@gmail.com",
];

export const VERIFIED_ADMIN_DOMAIN = "@prople.co.in";

export async function bootstrapDefaultAdmins(_db?: any): Promise<void> {
  // Supabase profiles bootstrap if needed
}

export async function isAuthorizedAdmin(_db?: any, email?: string | null, uid?: string | null): Promise<boolean> {
  const normEmail = (email || '').toLowerCase().trim();
  const cleanUid = (uid || '').trim();

  if (normEmail && DEFAULT_ADMIN_EMAILS.includes(normEmail)) return true;

  if (normEmail && normEmail.endsWith(VERIFIED_ADMIN_DOMAIN)) {
    const local = normEmail.slice(0, -VERIFIED_ADMIN_DOMAIN.length);
    if (['admin', 'security', 'moderator', 'executive', 'root', 'dev'].includes(local)) {
      return true;
    }
  }

  // Check env-configured admins
  const envAdmins = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .toLowerCase()
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);
  if (normEmail && envAdmins.includes(normEmail)) return true;

  // Check Supabase profiles table
  try {
    const client = getSupabaseAdminClient();
    if (cleanUid) {
      const { data } = await client.from('profiles').select('is_admin, publisher_role').eq('id', cleanUid).maybeSingle();
      if (data && (data.is_admin || data.publisher_role === 'Store Administrator' || data.publisher_role === 'Super Admin')) {
        return true;
      }
    }
    if (normEmail) {
      const { data } = await client.from('profiles').select('is_admin, publisher_role').eq('email', normEmail).maybeSingle();
      if (data && (data.is_admin || data.publisher_role === 'Store Administrator' || data.publisher_role === 'Super Admin')) {
        return true;
      }
    }
  } catch {}

  return false;
}

export async function hasAdminPermission(
  _db: any,
  action: AdminAction,
  email?: string | null,
  uid?: string | null
): Promise<boolean> {
  return await isAuthorizedAdmin(_db, email, uid);
}
