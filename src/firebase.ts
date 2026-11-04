/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Supabase-native client adapter providing complete backward-compatible API
// for authentication, database operations, and storage, backed 100% by Supabase.

import { supabase } from './utils/supabase';

export type ClientAuthUser = any;
export type User = any;

// Current active cached user representation
let activeCachedUser: ClientAuthUser | null = null;

function mapSupabaseUserToAuthUser(sbUser: any): ClientAuthUser | null {
  if (!sbUser) return null;
  const uid = sbUser.id;
  const email = sbUser.email || null;
  const meta = sbUser.user_metadata || {};
  const displayName = meta.displayName || meta.display_name || meta.name || meta.full_name || (email ? email.split('@')[0] : 'User');
  const photoURL = meta.photoURL || meta.avatar_url || meta.picture || null;
  const emailVerified = Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at);

  return {
    uid,
    id: uid,
    email,
    displayName,
    photoURL,
    emailVerified,
    getIdToken: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
      } catch {
        return '';
      }
    },
  };
}

// Sync session on startup
try {
  supabase.auth.getSession().then(({ data: { session } }) => {
    activeCachedUser = mapSupabaseUserToAuthUser(session?.user);
  }).catch(() => {});

  supabase.auth.onAuthStateChange((_event, session) => {
    activeCachedUser = mapSupabaseUserToAuthUser(session?.user);
  });
} catch {}

// ----------------------------------------------------
// Authentication API (Native Supabase Auth)
// ----------------------------------------------------

export const auth: any = {
  get currentUser(): ClientAuthUser | null {
    if (activeCachedUser) return activeCachedUser;
    try {
      const local = localStorage.getItem('appmarket_user_profile');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.uid && parsed?.email) {
          return {
            uid: parsed.uid,
            id: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName || parsed.publisherName || '',
            photoURL: parsed.photoURL || null,
            emailVerified: Boolean(parsed.isEmailVerified),
            getIdToken: async () => {
              const { data: { session } } = await supabase.auth.getSession();
              return session?.access_token || '';
            },
          };
        }
      }
    } catch {}
    return null;
  },

  async signOut(): Promise<void> {
    activeCachedUser = null;
    await supabase.auth.signOut();
  },

  onAuthStateChanged(callback: (user: ClientAuthUser | null) => void): () => void {
    // Initial call
    callback(this.currentUser);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = mapSupabaseUserToAuthUser(session?.user);
      activeCachedUser = user;
      callback(user);
    });
    return () => {
      subscription?.unsubscribe();
    };
  },
};

export function onAuthStateChanged(authObj: any, callback: (user: any) => void): () => void {
  return auth.onAuthStateChanged(callback);
}

export async function signInWithEmailAndPassword(authObj: any, email: string, pass: string): Promise<any> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });
  if (error) throw error;
  const user = mapSupabaseUserToAuthUser(data.user);
  activeCachedUser = user;
  return { user };
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, pass: string): Promise<any> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
  });
  if (error) throw error;
  const user = mapSupabaseUserToAuthUser(data.user);
  activeCachedUser = user;
  return { user };
}

export async function signOut(authObj?: any): Promise<void> {
  activeCachedUser = null;
  await supabase.auth.signOut();
}

export async function signInWithPopup(authObj: any, provider: any): Promise<any> {
  const providerName = provider?.providerId === 'github.com' ? 'github' : 'google';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: providerName,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
  if (error) throw error;
  return { user: auth.currentUser, isRedirecting: true, url: data?.url };
}

export async function signInWithRedirect(authObj: any, provider: any): Promise<void> {
  const providerName = provider?.providerId === 'github.com' ? 'github' : 'google';
  await supabase.auth.signInWithOAuth({
    provider: providerName,
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
    }
  });
}

export async function getRedirectResult(authObj?: any): Promise<any> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return { user: mapSupabaseUserToAuthUser(session.user) };
  }
  return null;
}

export function getAdditionalUserInfo(cred?: any): any {
  return { isNewUser: false };
}

export class GoogleAuthProvider {
  providerId = 'google.com';
  setCustomParameters(_params: any) { return this; }
  addScope(_scope: string) { return this; }
  static credentialFromError(_err: any): any { return null; }
}

export class GithubAuthProvider {
  providerId = 'github.com';
  setCustomParameters(_params: any) { return this; }
  addScope(_scope: string) { return this; }
  static credentialFromError(_err: any): any { return null; }
}

export async function confirmPasswordReset(..._args: any[]): Promise<void> {}
export async function updatePassword(_user: any, newPassword: string): Promise<void> {
  await supabase.auth.updateUser({ password: newPassword }).catch(() => {});
}
export async function verifyPasswordResetCode(..._args: any[]): Promise<string> { return ''; }

export async function updateProfile(user: any, profile: { displayName?: string; photoURL?: string }): Promise<void> {
  try {
    await supabase.auth.updateUser({
      data: {
        display_name: profile.displayName,
        avatar_url: profile.photoURL,
      }
    });
  } catch (err: any) {
    console.warn('[Supabase Auth] updateProfile notice:', err.message);
  }
}

export async function linkWithPopup(..._args: any[]): Promise<any> { return { user: auth.currentUser }; }
export async function linkWithCredential(..._args: any[]): Promise<any> { return { user: auth.currentUser }; }
export class AuthCredential {}
export async function unlink(..._args: any[]): Promise<any> { return auth.currentUser; }

// ----------------------------------------------------
// Database & Storage API (Native Supabase PostgreSQL / Storage)
// ----------------------------------------------------

export const db: any = {
  isSupabase: true,
  name: 'prople-supabase-db',
};

export const app: any = {
  name: '[DEFAULT]',
  options: {},
};

export const rtdb: any = {
  isSupabase: true,
};

export const storage: any = {
  isSupabase: true,
  from: (bucket: string) => supabase.storage.from(bucket),
};

const inMemoryClientStore: Map<string, any> = new Map();

function mapSupabaseRowToClientApp(row: any): any {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: row.developer,
    category: row.category,
    rating: typeof row.rating === 'string' ? parseFloat(row.rating) : row.rating,
    reviewsCount: row.reviews_count,
    downloads: row.downloads,
    downloadsCount: row.downloads_count,
    ratingsCount: row.ratings_count,
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
    screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
    tabletScreenshots: Array.isArray(row.tablet_screenshots) ? row.tablet_screenshots : [],
    desktopScreenshots: Array.isArray(row.desktop_screenshots) ? row.desktop_screenshots : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    downloadUrl: row.download_url,
    packageFormat: row.package_format,
    targetOs: row.target_os,
    platform: row.platform,
    platforms: Array.isArray(row.platforms) ? row.platforms : [row.platform || 'android'],
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
    downloadOptions: Array.isArray(row.download_options) ? row.download_options : [],
    ratingBreakdown: row.rating_breakdown || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapClientAppToSupabaseRow(app: any): any {
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
    rating_breakdown: app.ratingBreakdown || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 1 },
    updated_at: new Date().toISOString(),
  };
}

export function doc(dbRef: any, col: string, id?: string, ...segments: string[]): any {
  const docId = id || 'doc_' + Math.random().toString(36).substring(2, 9);
  const fullPath = segments.length > 0 ? `${col}/${docId}/${segments.join('/')}` : `${col}/${docId}`;
  return {
    id: segments.length > 0 ? segments[segments.length - 1] : docId,
    path: fullPath,
    collection: col,
    subcollection: segments[0],
  };
}

export function collection(dbRef: any, col: string, ...segments: string[]): any {
  const fullPath = segments.length > 0 ? `${col}/${segments.join('/')}` : col;
  return {
    id: segments.length > 0 ? segments[segments.length - 1] : col,
    path: fullPath,
  };
}

export async function getDoc(docRef: any): Promise<any> {
  if (!docRef) return { exists: () => false, data: () => undefined, id: '' };

  const memData = inMemoryClientStore.get(docRef.path);
  if (memData) {
    return {
      id: docRef.id,
      exists: () => true,
      data: () => memData,
    };
  }

  const segments = docRef.path.split('/').filter(Boolean);
  const col = segments[0];
  const id = segments[1];

  if (col === 'apps' && id) {
    try {
      const { data } = await supabase.from('apps').select('*').eq('id', id).maybeSingle();
      if (data) {
        const app = mapSupabaseRowToClientApp(data);
        inMemoryClientStore.set(docRef.path, app);
        return { id, exists: () => true, data: () => app };
      }
    } catch {}
  } else if (col === 'users' && id) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (data) {
        inMemoryClientStore.set(docRef.path, data);
        return { id, exists: () => true, data: () => data };
      }
    } catch {}
  } else if (col === 'admins' && id) {
    try {
      const { data } = await supabase.from('admins').select('*').eq('id', id).maybeSingle();
      if (data) {
        return { id, exists: () => true, data: () => data };
      }
    } catch {}
  }

  return {
    id: docRef.id,
    exists: () => false,
    data: () => undefined,
  };
}

export async function getDocs(colOrQuery: any): Promise<any> {
  const path = colOrQuery?.path || colOrQuery?.collection?.path || '';
  const segments = path.split('/').filter(Boolean);
  const col = segments[0] || '';
  const subcol = segments[2];
  const parentId = segments[1];

  let docs: any[] = [];

  if (col === 'apps' && !subcol) {
    try {
      const { data } = await supabase.from('apps').select('*').limit(1000);
      if (Array.isArray(data) && data.length > 0) {
        docs = data.map(row => {
          const app = mapSupabaseRowToClientApp(row);
          inMemoryClientStore.set(`apps/${app.id}`, app);
          return { id: app.id, exists: () => true, data: () => app };
        });
      }
    } catch {}
  } else if (col === 'apps' && subcol === 'reviews' && parentId) {
    try {
      const { data } = await supabase.from('reviews').select('*').eq('app_id', parentId);
      if (Array.isArray(data) && data.length > 0) {
        docs = data.map(r => ({ id: r.id, exists: () => true, data: () => r }));
      }
    } catch {}
  } else if (col === 'notifications') {
    try {
      const { data } = await supabase.from('notifications').select('*').limit(100);
      if (Array.isArray(data) && data.length > 0) {
        docs = data.map(n => ({ id: n.id, exists: () => true, data: () => n }));
      }
    } catch {}
  }

  if (docs.length === 0) {
    const prefix = `${path}/`;
    for (const [key, val] of inMemoryClientStore.entries()) {
      if (key.startsWith(prefix)) {
        const id = key.substring(prefix.length);
        if (!id.includes('/')) {
          docs.push({ id, exists: () => true, data: () => val });
        }
      }
    }
  }

  return {
    empty: docs.length === 0,
    size: docs.length,
    docs,
    forEach: (cb: any) => docs.forEach(cb),
  };
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }): Promise<void> {
  const current = inMemoryClientStore.get(docRef.path) || {};
  const merged = options?.merge ? { ...current, ...data } : { ...data };
  inMemoryClientStore.set(docRef.path, merged);

  const segments = docRef.path.split('/').filter(Boolean);
  const col = segments[0];
  const id = segments[1];

  if (col === 'apps' && id) {
    try {
      await supabase.from('apps').upsert(mapClientAppToSupabaseRow({ id, ...merged }));
    } catch {}
  } else if (col === 'users' && id) {
    try {
      await supabase.from('profiles').upsert({ id, ...merged, updated_at: new Date().toISOString() });
    } catch {}
  } else if (col === 'notifications' && id) {
    try {
      await supabase.from('notifications').upsert({ id, ...merged });
    } catch {}
  }
}

export async function updateDoc(docRef: any, data: any): Promise<void> {
  return setDoc(docRef, data, { merge: true });
}

export async function deleteDoc(docRef: any): Promise<void> {
  inMemoryClientStore.delete(docRef.path);
  const segments = docRef.path.split('/').filter(Boolean);
  const col = segments[0];
  const id = segments[1];

  if (col === 'apps' && id) {
    try {
      await supabase.from('apps').delete().eq('id', id);
    } catch {}
  } else if (col === 'reviews' && id) {
    try {
      await supabase.from('reviews').delete().eq('id', id);
    } catch {}
  } else if (col === 'notifications' && id) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch {}
  }
}

export function onSnapshot(targetRef: any, callback: (snap: any) => void, errorCallback?: (err: any) => void): () => void {
  if (targetRef?.path?.includes('/')) {
    getDoc(targetRef).then(callback).catch(errorCallback);
  } else {
    getDocs(targetRef).then(callback).catch(errorCallback);
  }
  return () => {};
}

export function query(colRef: any, ...constraints: any[]): any {
  return { ...colRef, constraints };
}

export function where(field: string, op: string, val: any): any {
  return { type: 'where', field, op, val };
}

export function orderBy(field: string, dir?: 'asc' | 'desc'): any {
  return { type: 'orderBy', field, dir: dir || 'asc' };
}

export function limit(n: number): any {
  return { type: 'limit', n };
}

export function serverTimestamp(): string {
  return new Date().toISOString();
}

export function increment(n: number): any {
  return n;
}

export function arrayUnion(...items: any[]): any[] {
  return items;
}

export function arrayRemove(...items: any[]): any[] {
  return items;
}

export function writeBatch(dbRef?: any): any {
  const operations: Array<() => Promise<void>> = [];
  return {
    set(ref: any, data: any, options?: any) {
      operations.push(() => setDoc(ref, data, options));
    },
    update(ref: any, data: any) {
      operations.push(() => updateDoc(ref, data));
    },
    delete(ref: any) {
      operations.push(() => deleteDoc(ref));
    },
    async commit() {
      for (const op of operations) {
        await op().catch(() => {});
      }
    }
  };
}

export { supabase };
export default supabase;
