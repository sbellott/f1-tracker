/**
 * Generate VAPID keys for web push notifications
 * Run: npx tsx scripts/generate-vapid-keys.ts
 */

import webPush from "web-push";

const vapidKeys = webPush.generateVAPIDKeys();

console.log("\n=== VAPID Keys Generated ===\n");
console.log("Add these to your .env file:\n");
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:your-email@example.com"`);
console.log("\n============================\n");
