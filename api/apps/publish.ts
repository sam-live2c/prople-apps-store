import { 
  fetchAppFromSupabase, 
  upsertAppToSupabase 
} from '../../server/supabase.ts';
import { authenticateApiRequest } from '../../server/tokenVerifier.ts';
import { slugifyAppName } from '../../server/seoRenderer.ts';

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

export default async function handler(req: any, res: any) {
  const corsHeaders = getSecureCorsHeaders(req.headers?.origin);
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  res.setHeader('Content-Type', 'application/json');

  try {
    const { app: appPayload, userId, userEmail } = req.body || {};
    if (!appPayload || typeof appPayload !== 'object') {
      return res.status(400).json({ success: false, error: 'Missing app payload in request body' });
    }

    if (!appPayload.name || typeof appPayload.name !== 'string' || !appPayload.name.trim()) {
      return res.status(400).json({ success: false, error: 'Application name is required' });
    }

    const appId = (appPayload.id || `app-${(appPayload.name || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).trim();
    const callerAuth = await authenticateApiRequest(req);
    const effectiveUid = callerAuth.uid || String(userId || req.headers['x-user-id'] || appPayload.owner || appPayload.developerId || appPayload.creatorUid || 'dev-publisher').trim();
    const effectiveEmail = callerAuth.email || String(userEmail || req.headers['x-user-email'] || appPayload.developerEmail || appPayload.publisherEmail || '').toLowerCase().trim();
    const isVerifiedAdmin = callerAuth.isVerifiedAdmin;

    // 1. Fetch existing doc if present
    const existing = await fetchAppFromSupabase(appId);

    if (existing) {
      const devEmail = (existing.developerEmail || '').toLowerCase().trim();
      const pubEmail = (existing.publisherEmail || '').toLowerCase().trim();
      const ownerEmail = (existing.ownerEmail || '').toLowerCase().trim();

      const isMatchingEmail = callerAuth.email && (
        devEmail === callerAuth.email ||
        pubEmail === callerAuth.email ||
        ownerEmail === callerAuth.email
      );

      const isOwner = isVerifiedAdmin || (
        callerAuth.uid && callerAuth.uid !== 'guest' && (
          existing.owner === callerAuth.uid ||
          existing.developerId === callerAuth.uid ||
          existing.creatorUid === callerAuth.uid
        )
      ) || Boolean(isMatchingEmail);

      if (!isOwner) {
        return res.status(403).json({ success: false, error: 'Forbidden: You do not own this application and cannot update it.' });
      }
    }

    const cleanDoc: Record<string, any> = {
      ...appPayload,
      id: appId,
      slug: slugifyAppName(appPayload.name || existing?.name || ''),
      owner: effectiveUid || existing?.owner || 'developer',
      developerId: effectiveUid || existing?.developerId || 'developer',
      creatorUid: effectiveUid || existing?.creatorUid || 'developer',
      developerEmail: effectiveEmail || appPayload.developerEmail || existing?.developerEmail || '',
      updatedAt: new Date().toISOString(),
      isPublished: true,
    };

    if (!existing) {
      cleanDoc.createdAt = new Date().toISOString();
      cleanDoc.rating = typeof appPayload.rating === 'number' ? appPayload.rating : 5.0;
      cleanDoc.ratingsCount = typeof appPayload.ratingsCount === 'number' ? appPayload.ratingsCount : 1;
      cleanDoc.reviewsCount = appPayload.reviewsCount || '1 review';
      cleanDoc.downloadsCount = typeof appPayload.downloadsCount === 'number' ? appPayload.downloadsCount : 1;
      cleanDoc.downloads = appPayload.downloads || '1+';
    }

    const success = await upsertAppToSupabase(cleanDoc);
    if (!success) {
      return res.status(500).json({ success: false, error: 'Failed to write application record to Supabase database' });
    }

    return res.status(200).json({ success: true, app: cleanDoc, isNew: !existing });
  } catch (err: any) {
    console.error('[Apps Publish Handler Error]:', err?.message || err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal server error while publishing application' });
  }
}
