import {
  getSupabaseAdminClient,
  fetchAppsFromSupabase,
  fetchAppFromSupabase,
  upsertAppToSupabase,
  deleteAppFromSupabase,
  fetchReviewsFromSupabase,
  insertReviewToSupabase,
  deleteReviewFromSupabase,
  upsertProfileToSupabase,
  fetchProfileFromSupabase,
  claimPublisherNameInSupabase,
  checkPublisherNameAvailabilityInSupabase,
  insertNotificationToSupabase,
  deleteNotificationFromSupabase,
  fetchNotificationsFromSupabase,
  checkSupabaseHealth,
  mapAppToSupabaseRow,
  mapSupabaseRowToApp,
  markAppDeletedServer,
  isAppDeletedServer
} from './supabase.ts';

export interface DocumentReference {
  id: string;
  path: string;
  collection: string;
  subcollection?: string;
  subId?: string;
}

export interface DocumentSnapshot {
  id: string;
  ref?: any;
  exists: () => boolean;
  data: () => Record<string, any> | undefined;
}

export interface QuerySnapshot {
  empty: boolean;
  size: number;
  docs: DocumentSnapshot[];
  forEach: (callback: (doc: DocumentSnapshot) => void) => void;
}

export interface CollectionReference {
  id: string;
  path: string;
  parentDocId?: string;
}

export interface QueryConstraint {
  type: 'where' | 'limit' | 'orderBy';
  field?: string;
  op?: string;
  val?: any;
  num?: number;
}

// In-memory document store cache for fast server operations and synchronous lookups
const inMemoryStore: Map<string, Record<string, any>> = new Map();

export function setMemoryDoc(path: string, data: Record<string, any>) {
  inMemoryStore.set(path, { ...data });
}

export function getMemoryDoc(path: string): Record<string, any> | undefined {
  return inMemoryStore.get(path);
}

export function deleteMemoryDoc(path: string): boolean {
  return inMemoryStore.delete(path);
}

/**
 * serverDoc adapter: converts collection path to DocumentReference
 */
export function serverDoc(
  dbOrCol: any,
  collectionNameOrDocId?: string,
  ...pathSegments: string[]
): DocumentReference {
  const parts: string[] = [];

  if (typeof dbOrCol === 'string') {
    parts.push(dbOrCol);
  } else if (dbOrCol && dbOrCol.path) {
    parts.push(dbOrCol.path);
  }

  if (collectionNameOrDocId) {
    parts.push(collectionNameOrDocId);
  }

  for (const s of pathSegments) {
    if (s) parts.push(s);
  }

  const fullPath = parts.join('/');
  const segments = fullPath.split('/').filter(Boolean);

  const col = segments[0] || '';
  const docId = segments[1] || '';
  const subcol = segments[2] || undefined;
  const subId = segments[3] || undefined;

  return {
    id: subId || docId,
    path: fullPath,
    collection: col,
    subcollection: subcol,
    subId
  };
}

/**
 * serverCollection adapter
 */
export function serverCollection(
  dbOrDoc: any,
  collectionName?: string,
  ...pathSegments: string[]
): CollectionReference {
  const parts: string[] = [];

  if (typeof dbOrDoc === 'string') {
    parts.push(dbOrDoc);
  } else if (dbOrDoc && dbOrDoc.path) {
    parts.push(dbOrDoc.path);
  }

  if (collectionName) {
    parts.push(collectionName);
  }

  for (const s of pathSegments) {
    if (s) parts.push(s);
  }

  const fullPath = parts.join('/');
  const segments = fullPath.split('/').filter(Boolean);

  return {
    id: segments[segments.length - 1] || '',
    path: fullPath,
    parentDocId: segments.length > 2 ? segments[1] : undefined
  };
}

/**
 * serverGetDoc adapter: reads from Supabase or memory
 */
export async function serverGetDoc(docRef: DocumentReference): Promise<DocumentSnapshot> {
  const memData = inMemoryStore.get(docRef.path);

  // If apps collection:
  if (docRef.collection === 'apps' && !docRef.subcollection) {
    try {
      const app = await fetchAppFromSupabase(docRef.id);
      if (app) {
        const merged = { ...memData, ...app };
        inMemoryStore.set(docRef.path, merged);
        return {
          id: docRef.id,
          exists: () => true,
          data: () => merged
        };
      }
    } catch {}
  }

  // If users/profiles collection:
  if (docRef.collection === 'users' && !docRef.subcollection) {
    try {
      const profile = await fetchProfileFromSupabase(docRef.id);
      if (profile) {
        const mapped = {
          uid: profile.id,
          email: profile.email,
          displayName: profile.display_name,
          publisherName: profile.publisher_name,
          publisherRole: profile.publisher_role,
          isPublisher: profile.is_publisher,
          isAdmin: profile.is_admin,
          isVerifiedAccount: profile.is_verified_publisher,
          publishedAppIds: profile.published_app_ids || [],
          photoURL: profile.photo_url,
          bio: profile.bio,
          location: profile.location,
          ...memData
        };
        inMemoryStore.set(docRef.path, mapped);
        return {
          id: docRef.id,
          exists: () => true,
          data: () => mapped
        };
      }
    } catch {}
  }

  if (memData) {
    return {
      id: docRef.id,
      exists: () => true,
      data: () => memData
    };
  }

  return {
    id: docRef.id,
    exists: () => false,
    data: () => undefined
  };
}

/**
 * serverSetDoc adapter: writes to Supabase and memory
 */
export async function serverSetDoc(
  docRef: DocumentReference,
  data: Record<string, any>,
  options?: { merge?: boolean }
): Promise<void> {
  const current = inMemoryStore.get(docRef.path) || {};
  const merged = options?.merge ? { ...current, ...data } : { ...data };
  inMemoryStore.set(docRef.path, merged);

  // Persist to Supabase if corresponding table exists
  if (docRef.collection === 'apps' && !docRef.subcollection) {
    upsertAppToSupabase({ ...merged, id: docRef.id }).catch(() => {});
  } else if (docRef.collection === 'users' && !docRef.subcollection) {
    upsertProfileToSupabase({ ...merged, uid: docRef.id }).catch(() => {});
  } else if (docRef.collection === 'notifications') {
    insertNotificationToSupabase({ ...merged, id: docRef.id }).catch(() => {});
  } else if (docRef.collection === 'publisher_registry') {
    if (merged.publisher_name && merged.owner_uid && merged.owner_email) {
      claimPublisherNameInSupabase(merged.publisher_name, merged.owner_uid, merged.owner_email).catch(() => {});
    }
  } else if (docRef.collection === 'banned_releases') {
    const client = getSupabaseAdminClient();
    client.from('banned_releases').upsert({
      id: docRef.id,
      url_or_repo: merged.urlOrRepo || merged.url_or_repo || docRef.id,
      type: merged.type || 'release',
      target_identifier: merged.targetIdentifier || merged.target_identifier || '',
      app_name: merged.appName || merged.app_name || null,
      banned_at: merged.bannedAt ? new Date(merged.bannedAt).toISOString() : new Date().toISOString(),
      reason: merged.reason || 'Violated terms'
    }, { onConflict: 'id' }).then();
  }
}

/**
 * serverUpdateDoc adapter
 */
export async function serverUpdateDoc(
  docRef: DocumentReference,
  data: Record<string, any>
): Promise<void> {
  return serverSetDoc(docRef, data, { merge: true });
}

/**
 * serverDeleteDoc adapter: deletes from Supabase and memory
 */
export async function serverDeleteDoc(docRef: DocumentReference): Promise<void> {
  inMemoryStore.delete(docRef.path);

  if (docRef.collection === 'apps' && !docRef.subcollection) {
    markAppDeletedServer(docRef.id);
    await deleteAppFromSupabase(docRef.id).catch(() => {});
  } else if (docRef.collection === 'notifications') {
    deleteNotificationFromSupabase(docRef.id).catch(() => {});
  } else if (docRef.collection === 'banned_releases') {
    const client = getSupabaseAdminClient();
    client.from('banned_releases').delete().eq('id', docRef.id).then();
  } else if (docRef.collection === 'apps' && docRef.subcollection === 'reviews') {
    deleteReviewFromSupabase(docRef.id).catch(() => {});
  }
}

/**
 * serverGetDocs adapter
 */
export async function serverGetDocs(colOrQuery: any): Promise<QuerySnapshot> {
  const path = colOrQuery.path || (colOrQuery.collection ? colOrQuery.collection.path : '');
  const segments = path.split('/').filter(Boolean);
  const col = segments[0] || '';
  const subcol = segments[2] || undefined;
  const parentId = segments[1] || undefined;

  let docs: DocumentSnapshot[] = [];

  if (col === 'apps' && !subcol) {
    try {
      const apps = await fetchAppsFromSupabase(1000);
      if (apps.length > 0) {
        docs = apps
          .filter(app => {
            if (!app || !app.id) return false;
            if (isAppDeletedServer(app.id)) return false;
            if (app.id.startsWith('rev-') || app.id.startsWith('notif-')) return false;
            const name = (app.name || '').trim();
            if (!name || name === 'Untitled App' || name === 'Untitled') return false;
            return true;
          })
          .map(app => ({
            id: app.id,
            exists: () => true,
            data: () => app
          }));
      }
    } catch {}
  } else if (col === 'apps' && subcol === 'reviews' && parentId) {
    try {
      const reviews = await fetchReviewsFromSupabase(parentId);
      if (reviews.length > 0) {
        docs = reviews.map(r => ({
          id: r.id,
          exists: () => true,
          data: () => r
        }));
      }
    } catch {}
  } else if (col === 'notifications') {
    try {
      const notifs = await fetchNotificationsFromSupabase(100);
      if (notifs.length > 0) {
        docs = notifs.map(n => ({
          id: n.id,
          exists: () => true,
          data: () => n
        }));
      }
    } catch {}
  }

  // If Supabase returned docs, populate cache
  if (docs.length > 0) {
    docs.forEach(d => {
      inMemoryStore.set(`${path}/${d.id}`, d.data()!);
    });
    return {
      empty: false,
      size: docs.length,
      docs,
      forEach: (cb) => docs.forEach(cb)
    };
  }

  // Fallback: search in-memory store matching prefix
  const prefix = `${path}/`;
  const memoryDocs: DocumentSnapshot[] = [];

  for (const [key, value] of inMemoryStore.entries()) {
    if (key.startsWith(prefix)) {
      const remainder = key.substring(prefix.length);
      if (!remainder.includes('/')) {
        if (col === 'apps' && !subcol) {
          if (isAppDeletedServer(remainder) || remainder.startsWith('rev-') || remainder.startsWith('notif-')) {
            continue;
          }
          const appVal = value as any;
          const name = (appVal?.name || '').trim();
          if (!name || name === 'Untitled App' || name === 'Untitled') {
            continue;
          }
        }
        memoryDocs.push({
          id: remainder,
          exists: () => true,
          data: () => value
        });
      }
    }
  }

  return {
    empty: memoryDocs.length === 0,
    size: memoryDocs.length,
    docs: memoryDocs,
    forEach: (cb) => memoryDocs.forEach(cb)
  };
}

/**
 * serverQuery adapter
 */
export function serverQuery(colRef: CollectionReference, ...constraints: QueryConstraint[]): any {
  return {
    collection: colRef,
    path: colRef.path,
    constraints
  };
}

/**
 * serverWhere adapter
 */
export function serverWhere(field: string, op: string, val: any): QueryConstraint {
  return {
    type: 'where',
    field,
    op,
    val
  };
}

/**
 * serverLimit adapter
 */
export function serverLimit(num: number): QueryConstraint {
  return {
    type: 'limit',
    num
  };
}

export const serverSupabaseDb = {
  type: 'supabase-postgres-adapter',
  isReady: true
};
