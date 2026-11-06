/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Supabase Compatibility Facade
 * -----------------------------
 * Note: The Prople Store platform has fully migrated to Supabase.
 * This file acts as a non-breaking facade that delegates 100% of calls,
 * Auth state, and database operations to src/supabaseClient.ts.
 */

export * from './supabaseClient';
export { default } from './supabaseClient';
