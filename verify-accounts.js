#!/usr/bin/env node

/**
 * Emergency email verification script
 * This script directly updates the Supabase auth.users table to mark accounts as email_verified
 * 
 * Usage: node verify-accounts.js "db-password" "email1@example.com" "email2@example.com"
 */

import postgres from "postgres";

const dbPassword = process.argv[2];
const emailsToVerify = process.argv.slice(3);

if (!dbPassword || emailsToVerify.length === 0) {
  console.log("Usage: node verify-accounts.js <db-password> <email1> <email2> ...");
  console.log("\nExample: node verify-accounts.js MyPassword123 test@example.com newtest@example.com");
  process.exit(1);
}

const sql = postgres(
  `postgres://postgres:${dbPassword}@db.noecmdbowwvgpktolaev.supabase.co:5432/postgres`
);

async function verifyEmails() {
  try {
    for (const email of emailsToVerify) {
      console.log(`Verifying ${email}...`);
      
      const result = await sql`
        UPDATE auth.users 
        SET email_confirmed_at = NOW()
        WHERE email = ${email}
        RETURNING id, email, email_confirmed_at
      `;

      if (result.length > 0) {
        console.log(`✓ ${email} is now verified`);
      } else {
        console.log(`✗ User ${email} not found`);
      }
    }
    
    console.log("\nAll done! Try logging in now.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

verifyEmails();
