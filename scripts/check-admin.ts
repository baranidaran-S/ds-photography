/* Diagnostic: lists the admin accounts and tests a password against them.
 *   npm run check-admin              — list accounts
 *   npm run check-admin -- <password> — also test that password
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const probe = process.argv[2] ?? process.env.SEED_ADMIN_PASSWORD ?? "";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string, {
    serverSelectionTimeoutMS: 15_000,
  });
  const db = mongoose.connection.db!;
  console.log("database  :", db.databaseName);

  const users = await db.collection("adminusers").find({}).toArray();
  console.log("accounts  :", users.length, "\n");

  for (const u of users) {
    const hash = String(u.passwordHash ?? "");
    console.log("  email   :", JSON.stringify(u.email));
    console.log("  name    :", u.name, "·", u.role);
    console.log("  hash    :", hash.slice(0, 7) || "(none)", "len", hash.length);
    if (probe) {
      const ok = hash ? await bcrypt.compare(probe, hash) : false;
      console.log(`  "${probe}" matches:`, ok);
    }
    console.log();
  }

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("failed:", e instanceof Error ? e.message : e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
