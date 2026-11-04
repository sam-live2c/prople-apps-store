/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Supabase-backed client adapter replacing legacy Firebase services.
// Fully unified with Supabase Auth, PostgreSQL, and Storage.

import { supabase } from './utils/supabase';

export interface ClientAuthUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

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

export const auth = {
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
      subscription.unsubscribe();
    };
  },
};

export const db = {
  isSupabase: true,
  name: 'prople-supabase-db',
};

export const app = {
  name: '[DEFAULT]',
  options: {},
};

export const rtdb = {
  isSupabase: true,
};

export const storage = {
  isSupabase: true,
  from: (bucket: string) => supabase.storage.from(bucket),
};

export { supabase };
export default supabase;
