import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  process.env.SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  'https://tygkgbmobqqxnvmeveof.supabase.co';

const SUPABASE_KEY = 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  'sb_publishable_wO_xyGrJb7s1KKCW_OMOIg_-UWSbq-0';

let supabaseClient: SupabaseClient | null = null;
let isSupabaseHealthy = false;
let lastHealthCheck = 0;

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Check if the Supabase project is reachable
 */
export async function checkSupabaseHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - lastHealthCheck < 30000 && lastHealthCheck > 0) {
    return isSupabaseHealthy;
  }

  try {
    const client = getSupabaseAdminClient();
    const { error } = await Promise.race([
      client.from('apps').select('id').limit(1),
      new Promise<{ error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timeout')), 2500)
      ),
    ]);
    // If table doesn't exist yet (404/PGRST205), project is still healthy and reachable
    if (error && error.code !== 'PGRST205' && !error.message?.includes('relation "public.apps" does not exist')) {
      console.warn('[Supabase Health Notice]:', error.message);
    }
    isSupabaseHealthy = true;
  } catch (err: any) {
    console.warn('[Supabase] Health check notice:', err.message);
    isSupabaseHealthy = false;
  }
  lastHealthCheck = now;
  return isSupabaseHealthy;
}

/**
 * Map an internal Prople Store App payload to the Supabase PostgreSQL table columns
 */
export function mapAppToSupabaseRow(app: any): Record<string, any> {
  if (!app) return {};
  return {
    id: String(app.id),
    slug: app.slug || null,
    name: String(app.name || 'Untitled App'),
    developer: String(app.developer || 'Unknown Developer'),
    category: app.category || 'Utilities',
    rating: typeof app.rating === 'number' ? app.rating : 5.0,
    reviews_count: String(app.reviewsCount || '1'),
    downloads: String(app.downloads || '1+'),
    downloads_count: typeof app.downloadsCount === 'number' ? app.downloadsCount : 1,
    ratings_count: typeof app.ratingsCount === 'number' ? app.ratingsCount : 1,
    size: app.size || 'Varies with device',
    content_rating: app.contentRating || 'Everyone',
    price: app.price || 'Free',
    type: app.type || 'apk',
    icon_url: app.iconUrl || null,
    feature_graphic_url: app.featureGraphicUrl || null,
    details_banner_url: app.detailsBannerUrl || null,
    hero_banner_url: app.heroBannerUrl || null,
    promo_video_url: app.promoVideoUrl || null,
    video_thumbnail_url: app.videoThumbnailUrl || null,
    tagline: app.tagline || null,
    about_text: app.aboutText || null,
    description: app.description || null,
    screenshots: Array.isArray(app.screenshots) ? app.screenshots : [],
    tablet_screenshots: Array.isArray(app.tabletScreenshots) ? app.tabletScreenshots : [],
    desktop_screenshots: Array.isArray(app.desktopScreenshots) ? app.desktopScreenshots : [],
    tags: Array.isArray(app.tags) ? app.tags : [],
    download_url: String(app.downloadUrl || ''),
    package_format: app.packageFormat || null,
    target_os: app.targetOs || 'android',
    platform: app.platform || 'android',
    platforms: Array.isArray(app.platforms) ? app.platforms : [app.platform || 'android'],
    min_android: app.minAndroid || null,
    min_windows: app.minWindows || null,
    min_linux: app.minLinux || null,
    min_mac: app.minMac || null,
    min_ios: app.minIos || null,
    package_name: app.packageName || null,
    version_name: app.versionName || '1.0.0',
    version_code: typeof app.versionCode === 'number' ? app.versionCode : 1,
    release_notes: app.releaseNotes || app.whatsNew || null,
    whats_new: app.whatsNew || app.releaseNotes || null,
    release_date: app.releaseDate || null,
    sha256: app.sha256 || null,
    is_verified: Boolean(app.isVerified),
    is_featured: Boolean(app.isFeatured),
    is_published: app.isPublished !== false,
    owner: app.owner || null,
    developer_id: app.developerId || null,
    developer_email: app.developerEmail || null,
    published_by: app.publishedBy || null,
    published_via: app.publishedVia || 'prople-console',
    data_safety: app.dataSafety || {},
    developer_info: app.developerInfo || {},
    download_options: Array.isArray(app.downloadOptions) ? app.downloadOptions : [],
    rating_breakdown: app.ratingBreakdown || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
    updated_at: new Date().toISOString(),
  };
}

/**
 * Map a Supabase row back to the Prople Store App schema
 */
export function mapSupabaseRowToApp(row: any): Record<string, any> {
  if (!row) return {};
  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    developer: row.developer,
    category: row.category,
    rating: row.rating ? Number(row.rating) : 5.0,
    reviewsCount: row.reviews_count || '1',
    downloads: row.downloads || '1+',
    downloadsCount: row.downloads_count || 1,
    ratingsCount: row.ratings_count || 1,
    size: row.size,
    contentRating: row.content_rating,
    price: row.price,
    type: row.type,
    iconUrl: row.icon_url,
    featureGraphicUrl: row.feature_graphic_url,
    detailsBannerUrl: row.details_banner_url,
    heroBannerUrl: row.hero_banner_url,
    promoVideoUrl: row.promo_video_url,
    videoThumbnailUrl: row.video_thumbnail_url,
    tagline: row.tagline,
    aboutText: row.about_text,
    description: row.description,
    screenshots: row.screenshots || [],
    tabletScreenshots: row.tablet_screenshots || [],
    desktopScreenshots: row.desktop_screenshots || [],
    tags: row.tags || [],
    downloadUrl: row.download_url,
    packageFormat: row.package_format,
    targetOs: row.target_os,
    platform: row.platform,
    platforms: row.platforms || [row.platform || 'android'],
    minAndroid: row.min_android,
    minWindows: row.min_windows,
    minLinux: row.min_linux,
    minMac: row.min_mac,
    minIos: row.min_ios,
    packageName: row.package_name,
    versionName: row.version_name,
    versionCode: row.version_code,
    releaseNotes: row.release_notes,
    whatsNew: row.whats_new,
    releaseDate: row.release_date,
    sha256: row.sha256,
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    isPublished: row.is_published,
    owner: row.owner,
    developerId: row.developer_id,
    developerEmail: row.developer_email,
    publishedBy: row.published_by,
    publishedVia: row.published_via,
    dataSafety: row.data_safety || {},
    developerInfo: row.developer_info || {},
    downloadOptions: row.download_options || [],
    ratingBreakdown: row.rating_breakdown || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Fetch all published apps from Supabase
 */
export async function fetchAppsFromSupabase(limit = 500): Promise<any[]> {
  try {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from('apps')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Table may not have been created yet via schema.sql
      return [];
    }
    return (data || []).map(mapSupabaseRowToApp);
  } catch (err: any) {
    console.warn('[Supabase] Failed to fetch apps:', err.message);
    return [];
  }
}

/**
 * Fetch a single app from Supabase by ID or slug
 */
export async function fetchAppFromSupabase(idOrSlug: string): Promise<any | null> {
  try {
    const client = getSupabaseAdminClient();
    const clean = (idOrSlug || '').trim();
    if (!clean) return null;

    // 1. Direct ID or slug query
    const { data, error } = await client
      .from('apps')
      .select('*')
      .or(`id.eq.${clean},slug.eq.${clean}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) return mapSupabaseRowToApp(data);

    // 2. Direct package_name query
    const { data: pkgData } = await client
      .from('apps')
      .select('*')
      .eq('package_name', clean)
      .limit(1)
      .maybeSingle();

    if (pkgData) return mapSupabaseRowToApp(pkgData);

    // 3. Normalized name slug search
    const cleanWord = clean.replace(/[-_]+/g, ' ').trim();
    if (cleanWord.length >= 2) {
      const { data: nameMatches } = await client
        .from('apps')
        .select('*')
        .ilike('name', `%${cleanWord}%`)
        .limit(5);

      if (nameMatches && nameMatches.length > 0) {
        for (const row of nameMatches) {
          const app = mapSupabaseRowToApp(row);
          const computedSlug = (app.name || '')
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
          if (computedSlug === clean.toLowerCase() || app.name.toLowerCase() === clean.toLowerCase()) {
            return app;
          }
        }
        return mapSupabaseRowToApp(nameMatches[0]);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Upsert an app into Supabase
 */
export async function upsertAppToSupabase(app: any): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const row = mapAppToSupabaseRow(app);
    const { error } = await client
      .from('apps')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Upsert app warning:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Upsert app error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch reviews for an app from Supabase
 */
export async function fetchReviewsFromSupabase(appId: string): Promise<any[]> {
  try {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .eq('app_id', appId)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return [];
    return data.map((r: any) => ({
      id: r.id,
      appId: r.app_id,
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar,
      rating: r.rating,
      date: r.date,
      text: r.text,
      helpfulCount: r.helpful_count,
      notHelpfulCount: r.not_helpful_count,
      media: r.media || [],
      reply: r.reply,
      device: r.device,
      verified: r.verified,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Insert a review into Supabase
 */
export async function insertReviewToSupabase(review: any): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from('reviews').insert({
      id: review.id,
      app_id: review.appId,
      user_id: review.userId,
      user_name: review.userName || 'Verified User',
      user_avatar: review.userAvatar || null,
      rating: review.rating || 5,
      date: review.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      text: review.text,
      helpful_count: review.helpfulCount || 0,
      not_helpful_count: review.notHelpfulCount || 0,
      media: review.media || [],
      reply: review.reply || null,
      device: review.device || null,
      verified: review.verified !== false,
      is_flagged: Boolean(review.isFlagged),
      flag_reason: review.flagReason || null,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Migrate all apps and reviews from an array of Firestore apps into Supabase
 */
export async function migrateFirestoreAppsToSupabase(apps: any[]): Promise<{
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}> {
  if (!Array.isArray(apps) || apps.length === 0) {
    return { success: true, migratedCount: 0, failedCount: 0, errors: [] };
  }

  const client = getSupabaseAdminClient();
  let migratedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const app of apps) {
    try {
      const row = mapAppToSupabaseRow(app);
      const { error } = await client.from('apps').upsert(row, { onConflict: 'id' });
      if (error) {
        failedCount++;
        errors.push(`${app.name || app.id}: ${error.message}`);
      } else {
        migratedCount++;
      }
    } catch (e: any) {
      failedCount++;
      errors.push(`${app.name || app.id}: ${e.message}`);
    }
  }

  return {
    success: failedCount === 0,
    migratedCount,
    failedCount,
    errors,
  };
}

/**
 * Upsert a user profile into Supabase profiles table
 */
export async function upsertProfileToSupabase(profile: any): Promise<{ success: boolean; error?: string }> {
  if (!profile || (!profile.uid && !profile.id) || !profile.email) {
    return { success: false, error: 'Missing user id or email' };
  }
  try {
    const client = getSupabaseAdminClient();
    const id = String(profile.uid || profile.id);
    const email = String(profile.email).toLowerCase().trim();
    const { error } = await client.from('profiles').upsert({
      id,
      email,
      display_name: profile.displayName || profile.publisherName || null,
      photo_url: profile.photoURL || profile.photo_url || null,
      bio: profile.bio || null,
      location: profile.location || null,
      is_email_verified: Boolean(profile.isEmailVerified),
      is_publisher: Boolean(profile.isPublisher),
      is_admin: Boolean(profile.isAdmin),
      is_verified_publisher: Boolean(profile.isVerifiedPublisher || profile.isVerifiedAccount),
      publisher_name: profile.publisherName || null,
      publisher_role: profile.publisherRole || null,
      publisher_bio: profile.publisherBio || null,
      publisher_website: profile.publisherWebsite || null,
      publisher_email: profile.publisherEmail || email,
      publisher_github: profile.publisherGithub || null,
      publisher_location: profile.publisherLocation || profile.location || null,
      published_app_ids: Array.isArray(profile.publishedAppIds) ? profile.publishedAppIds : [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch a profile from Supabase by UID or Email
 */
export async function fetchProfileFromSupabase(uidOrEmail: string): Promise<any | null> {
  if (!uidOrEmail) return null;
  try {
    const client = getSupabaseAdminClient();
    const clean = uidOrEmail.trim().toLowerCase();
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .or(`id.eq.${uidOrEmail},email.eq.${clean}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * Inspect Supabase Auth settings and active providers
 */
export async function getSupabaseAuthProviders(): Promise<{
  google: boolean;
  github: boolean;
  email: boolean;
  disableSignup: boolean;
  totalUsers: number;
}> {
  let google = false;
  let github = false;
  let email = true;
  let disableSignup = false;
  let totalUsers = 0;

  try {
    const pubKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || SUPABASE_KEY;
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: pubKey },
    });
    if (res.ok) {
      const data = await res.json();
      google = Boolean(data?.external?.google);
      github = Boolean(data?.external?.github);
      email = Boolean(data?.external?.email ?? true);
      disableSignup = Boolean(data?.disable_signup);
    }
  } catch (e: any) {
    console.warn('[Supabase Auth Settings Check]:', e.message);
  }

  try {
    const client = getSupabaseAdminClient();
    const { data: userData } = await client.auth.admin.listUsers();
    totalUsers = userData?.users?.length || 0;
  } catch {}

  return { google, github, email, disableSignup, totalUsers };
}

/**
 * Full Supabase Health & Diagnostic check
 */
export async function getSupabaseDiagnostics(): Promise<{
  connected: boolean;
  projectUrl: string;
  latencyMs: number;
  tables: Record<string, { ready: boolean; count: number; error?: string }>;
  auth: {
    google: boolean;
    github: boolean;
    email: boolean;
    disableSignup: boolean;
    totalUsers: number;
  };
}> {
  const start = Date.now();
  const client = getSupabaseAdminClient();
  const tables: Record<string, { ready: boolean; count: number; error?: string }> = {};

  const tableList = ['apps', 'reviews', 'profiles', 'banned_releases'];
  for (const t of tableList) {
    try {
      const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        tables[t] = { ready: false, count: 0, error: error.message };
      } else {
        tables[t] = { ready: true, count: count || 0 };
      }
    } catch (e: any) {
      tables[t] = { ready: false, count: 0, error: e.message };
    }
  }

  const latencyMs = Date.now() - start;
  const auth = await getSupabaseAuthProviders();
  const connected = Object.values(tables).some(t => t.ready);

  return {
    connected,
    projectUrl: SUPABASE_URL,
    latencyMs,
    tables,
    auth,
  };
}

/**
 * Delete an app from Supabase
 */
export async function deleteAppFromSupabase(appId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from('apps').delete().eq('id', appId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a review from Supabase
 */
export async function deleteReviewFromSupabase(reviewId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from('reviews').delete().eq('id', reviewId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch notifications from Supabase
 */
export async function fetchNotificationsFromSupabase(limit = 100): Promise<any[]> {
  try {
    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      iconUrl: n.icon_url,
      appId: n.app_id,
      actionType: n.action_type,
      actionUrl: n.action_url,
      actionLabel: n.action_label,
      isUnread: n.is_unread,
      createdAt: n.created_at ? new Date(n.created_at).getTime() : Date.now(),
      category: n.category,
      targetType: n.target_type,
      targetUid: n.target_uid,
      targetUserName: n.target_user_name,
      targetEmail: n.target_email,
      publisherAppId: n.publisher_app_id,
      publisherUid: n.publisher_uid,
      publisherEmail: n.publisher_email,
      publisherName: n.publisher_name
    }));
  } catch {
    return [];
  }
}

/**
 * Insert or upsert a notification in Supabase
 */
export async function insertNotificationToSupabase(notification: any): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from('notifications').upsert({
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: notification.title || '',
      message: notification.message || '',
      icon_url: notification.iconUrl || null,
      app_id: notification.appId || null,
      action_type: notification.actionType || null,
      action_url: notification.actionUrl || null,
      action_label: notification.actionLabel || null,
      is_unread: notification.isUnread !== false,
      category: notification.category || null,
      target_type: notification.targetType || 'all',
      target_uid: notification.targetUid || null,
      target_user_name: notification.targetUserName || null,
      target_email: notification.targetEmail || null,
      publisher_app_id: notification.publisherAppId || null,
      publisher_uid: notification.publisherUid || null,
      publisher_email: notification.publisherEmail || null,
      publisher_name: notification.publisherName || null,
      created_at: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete a notification from Supabase
 */
export async function deleteNotificationFromSupabase(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const { error } = await client.from('notifications').delete().eq('id', notificationId);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Check publisher name availability in Supabase
 */
export async function checkPublisherNameAvailabilityInSupabase(
  publisherName: string,
  userUid?: string,
  userEmail?: string
): Promise<{ available: boolean; claimedBy?: string; isOwner?: boolean }> {
  try {
    const client = getSupabaseAdminClient();
    const clean = publisherName.trim().toLowerCase();
    const { data, error } = await client
      .from('publisher_registry')
      .select('*')
      .eq('name_lower', clean)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return { available: true };
    }

    const isOwner = Boolean(
      (userUid && data.owner_uid === userUid) ||
      (userEmail && data.owner_email && data.owner_email.toLowerCase() === userEmail.toLowerCase())
    );

    return {
      available: isOwner,
      claimedBy: data.publisher_name,
      isOwner
    };
  } catch {
    return { available: true };
  }
}

/**
 * Claim publisher name in Supabase
 */
export async function claimPublisherNameInSupabase(
  publisherName: string,
  ownerUid: string,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSupabaseAdminClient();
    const clean = publisherName.trim().toLowerCase();
    const { error } = await client.from('publisher_registry').upsert({
      name_lower: clean,
      publisher_name: publisherName.trim(),
      owner_uid: ownerUid,
      owner_email: email.trim().toLowerCase(),
      claimed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'name_lower' });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Insert security audit log into Supabase
 */
export async function insertSecurityLogToSupabase(log: any): Promise<void> {
  try {
    const client = getSupabaseAdminClient();
    await client.from('security_logs').insert({
      event: log.event || 'SECURITY_EVENT',
      severity: log.severity || 'low',
      ip: log.ip || null,
      email: log.email || null,
      details: log.details || {},
      created_at: new Date().toISOString()
    });
  } catch {}
}

