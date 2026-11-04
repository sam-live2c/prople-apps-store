/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getServerFirebaseConfig } from "../server/firebaseConfig.ts";
import { 
  getSupabaseAdminClient, 
  checkSupabaseHealth, 
  migrateFirestoreAppsToSupabase 
} from "../server/supabase.ts";

async function runMigration() {
  console.log("=== Prople Store to Supabase Migration ===");
  console.log("1. Checking Supabase connectivity...");
  
  const isHealthy = await checkSupabaseHealth();
  if (!isHealthy) {
    console.error("Error: Could not reach Supabase project. Please verify SUPABASE_URL and SUPABASE_SECRET_KEY in .env");
    process.exit(1);
  }
  console.log("✓ Supabase connected successfully.");

  console.log("2. Fetching existing apps from Firestore...");
  const fbConfig = getServerFirebaseConfig();
  if (!fbConfig.projectId || fbConfig.isExampleConfig) {
    console.warn("Notice: Firestore is running in mock/standalone mode. No live apps found to migrate.");
    process.exit(0);
  }

  const fbApp = initializeApp(fbConfig, "migration-client");
  const db = fbConfig.firestoreDatabaseId && !fbConfig.firestoreDatabaseId.includes("example")
    ? getFirestore(fbApp, fbConfig.firestoreDatabaseId)
    : getFirestore(fbApp);

  const appsSnap = await getDocs(collection(db, "apps"));
  const apps: any[] = [];
  appsSnap.forEach(d => {
    const data = d.data();
    if (!data.isDeleted && data.status !== 'deleted') {
      apps.push({ id: d.id, ...data });
    }
  });

  console.log(`✓ Retrieved ${apps.length} apps from Firestore.`);

  if (apps.length === 0) {
    console.log("Catalog is empty. Nothing to migrate.");
    process.exit(0);
  }

  console.log("3. Migrating apps to Supabase PostgreSQL...");
  const result = await migrateFirestoreAppsToSupabase(apps);

  console.log(`\nMigration Summary:`);
  console.log(`- Total Apps: ${apps.length}`);
  console.log(`- Successfully Migrated: ${result.migratedCount}`);
  console.log(`- Failed: ${result.failedCount}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors encountered:`);
    result.errors.forEach(e => console.log(`  * ${e}`));
    console.log(`\nTip: If you see "relation public.apps does not exist", make sure to run supabase/schema.sql in the Supabase SQL Editor first!`);
  } else {
    console.log("\n✓ All apps successfully migrated to Supabase!");
  }
}

runMigration().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});
