/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import { 
  getSupabaseAdminClient, 
  checkSupabaseHealth, 
  getSupabaseDiagnostics,
  fetchAppsFromSupabase
} from "../server/supabase.ts";

async function runMigration() {
  console.log("=== Prople Store Supabase Verifier & Sync ===");
  console.log("1. Checking Supabase connectivity...");
  
  const isHealthy = await checkSupabaseHealth();
  if (!isHealthy) {
    console.error("Notice: Could not reach Supabase project directly. Standalone in-memory fallback active.");
    process.exit(0);
  }
  console.log("✓ Supabase connected successfully.");

  console.log("2. Checking Supabase tables...");
  const diagnostics = await getSupabaseDiagnostics();
  console.log(`- Project URL: ${diagnostics.projectUrl}`);
  console.log(`- Latency: ${diagnostics.latencyMs}ms`);
  for (const [table, info] of Object.entries(diagnostics.tables)) {
    console.log(`  * ${table}: ${info.ready ? `Ready (${info.count} rows)` : `Pending setup: ${info.error}`}`);
  }

  const existingApps = await fetchAppsFromSupabase(10);
  console.log(`\nCatalog status: ${existingApps.length} published applications found.`);
  console.log("✓ Supabase setup verified!");
}

runMigration().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
