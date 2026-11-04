import { 
  fetchAppFromSupabase, 
  deleteAppFromSupabase 
} from '../../server/supabase.ts';
import { authenticateApiRequest } from '../../server/tokenVerifier.ts';

const TRUSTED_ORIGIN_PATTERNS = [
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^https:\/\/([a-z0-9-]+\.)?prople\.(co\.in|store)$/i,
  /^https:\/\/([a-z0-9-]+\.)?run\.app$/i,
  /^https:\/\/([a-z0-9-]+\.)?google\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)?googleusercontent\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/i,
  /^https:\/\/([a-z0-9-]+\.)?vercel\.app$/i,
  /^https:\/\/prople-store(-[a-z0-9-]+)?\.web\.app$/i,
  /^https:\/\/prople-store(-[a-z0-9-]+)?\.firebaseapp\.com$/i,
];

function isTrustedOrigin(origin?: string): boolean {
  if (!origin || typeof origin !== 'string') return false;
  const clean = origin.trim();
  if (clean === 'null') return false;
  return TRUSTED_ORIGIN_PATTERNS.some((pattern) => pattern.test(clean));
}

function getSecureCorsHeaders(origin?: string): Record<string, string> {
  const trusted = isTrustedOrigin(origin);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With, Accept, X-User-Id, X-User-Email, X-Entity-Ref-ID',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (trusted && origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

function sanitizeIdentifier(input: any, maxLength = 100): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^a-zA-Z0-9_\-\.:]/g, '').slice(0, maxLength);
}

export default async function handler(req: any, res: any) {
  const corsHeaders = getSecureCorsHeaders(req.headers?.origin);
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.setHeader('Content-Type', 'application/json');

  const rawAppId = (req.query?.appId || req.query?.id || '').toString().trim();
  const appId = sanitizeIdentifier(rawAppId, 120);
  if (!appId) {
    return res.status(400).json({ success: false, error: 'App identifier is required' });
  }

  try {
    // Handle DELETE method
    if (req.method === 'DELETE') {
      const existingData = await fetchAppFromSupabase(appId);
      if (!existingData) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const callerAuth = await authenticateApiRequest(req);
      const callerUid = callerAuth.uid;
      const callerEmail = (callerAuth.email || '').toLowerCase().trim();

      const devEmail = (existingData.developerEmail || '').toLowerCase().trim();
      const pubEmail = (existingData.publisherEmail || '').toLowerCase().trim();
      const ownerEmail = (existingData.ownerEmail || '').toLowerCase().trim();
      const devInfoEmail = (existingData.developerInfo?.email || '').toLowerCase().trim();

      const isMatchingEmail = callerEmail && (
        devEmail === callerEmail ||
        pubEmail === callerEmail ||
        ownerEmail === callerEmail ||
        devInfoEmail === callerEmail
      );

      const isOwner =
        callerAuth.isVerifiedAdmin ||
        (callerUid &&
          callerUid !== 'guest' &&
          callerUid !== 'developer' &&
          callerUid !== 'dev-publisher' &&
          (existingData.owner === callerUid ||
            existingData.developerId === callerUid ||
            existingData.publisherId === callerUid ||
            existingData.creatorUid === callerUid)) ||
        Boolean(isMatchingEmail && callerUid && callerUid !== 'guest');

      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not own this application and cannot delete it.' });
      }

      const deleted = await deleteAppFromSupabase(appId);
      return res.status(200).json({ success: deleted, deletedAppId: appId });
    }

    // GET: Query single app by ID, slug, or name
    const app = await fetchAppFromSupabase(appId);
    if (app && app.isPublished !== false) {
      return res.status(200).json({ success: true, app });
    }

    return res.status(404).json({ success: false, error: 'Application not found' });
  } catch (err: any) {
    console.warn('[apps appId Notice]', err?.message || err);
    return res.status(404).json({ success: false, error: 'Application not found' });
  }
}
