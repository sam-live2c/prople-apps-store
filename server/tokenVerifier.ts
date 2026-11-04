import { getSupabaseAdminClient } from './supabase.ts';
import { isStrictAdminEmail, verifySecuritySecret } from './securityDefense.ts';
import crypto from 'crypto';

export interface VerifiedUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
}

// In-memory verification cache to eliminate redundant network calls for identical valid tokens
const verifiedTokenCache = new Map<string, { user: VerifiedUser; expiresAt: number }>();

// Periodic pruning of expired token cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [hash, record] of verifiedTokenCache.entries()) {
    if (now > record.expiresAt) {
      verifiedTokenCache.delete(hash);
    }
  }
}, 5 * 60 * 1000).unref();

function getSha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Authoritatively verifies a Supabase JWT Token against Supabase Auth.
 */
export async function verifySupabaseToken(rawToken?: string | null): Promise<VerifiedUser | null> {
  if (!rawToken || typeof rawToken !== 'string') return null;
  const token = rawToken.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.split('.').length !== 3) return null;

  const tokenHash = getSha256(token);
  const now = Date.now();
  const cached = verifiedTokenCache.get(tokenHash);
  if (cached && now < cached.expiresAt) {
    return cached.user;
  }

  // Fast structural decode to check basic expiration before hitting Supabase API
  try {
    const payloadPart = token.split('.')[1];
    const decodedPayload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf-8'));
    if (decodedPayload.exp && decodedPayload.exp * 1000 < now) {
      return null; // Expired token
    }
  } catch {
    return null; // Malformed payload
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    const uid = user.id;
    const email = (user.email || '').toLowerCase().trim();
    const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
    const isAdmin = Boolean(email && (isStrictAdminEmail(email) || user.user_metadata?.is_admin));

    const verified: VerifiedUser = {
      uid,
      email,
      emailVerified,
      isAdmin,
    };

    verifiedTokenCache.set(tokenHash, {
      user: verified,
      expiresAt: now + 5 * 60 * 1000,
    });

    return verified;
  } catch (err: any) {
    console.warn('[TokenVerifier] Error verifying Supabase token:', err?.message || err);
    return null;
  }
}

// Backward-compatibility alias
export const verifyFirebaseIdToken = verifySupabaseToken;

/**
 * Centralized caller authorization helper:
 * Resolves verified caller identity from Authorization header or admin secret.
 */
export async function authenticateApiRequest(req: any): Promise<{
  isAuthenticated: boolean;
  isVerifiedAdmin: boolean;
  uid: string | null;
  email: string | null;
}> {
  const adminSecret = req.headers?.['x-admin-secret'] || req.body?.adminSecret;
  if (adminSecret && verifySecuritySecret(adminSecret)) {
    return {
      isAuthenticated: true,
      isVerifiedAdmin: true,
      uid: 'admin-root',
      email: 'admin@prople.co.in',
    };
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const rawToken = (authHeader || req.body?.idToken || '').replace(/^Bearer\s+/i, '').trim();

  if (rawToken) {
    const verified = await verifySupabaseToken(rawToken);
    if (verified) {
      return {
        isAuthenticated: true,
        isVerifiedAdmin: verified.isAdmin,
        uid: verified.uid,
        email: verified.email,
      };
    }
  }

  return {
    isAuthenticated: false,
    isVerifiedAdmin: false,
    uid: null,
    email: null,
  };
}
