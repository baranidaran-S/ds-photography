/* Sets (or resets) an admin password without touching the database by hand.
 *
 *   npm run set-password -- <newPassword>
 *   npm run set-password -- <newPassword> <email>
 *
 * Creates the account if that email has none yet, so it doubles as "add an admin".
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const password = process.argv[2] ?? "";
const email = (process.argv[3] ?? process.env.SEED_ADMIN_EMAIL ?? "")
  .trim()
  .toLowerCase();

async function main() {
  if (!password) {
    console.error(
      "\nUsage: npm run set-password -- <newPassword> [email]\n",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("\nPassword must be at least 8 characters.\n");
    process.exit(1);
  }
  if (!email) {
    console.error(
      "\nNo email given and SEED_ADMIN_EMAIL is not set in .env.local.\n",
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing from .env.local.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  const users = mongoose.connection.db!.collection("adminusers");

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne({ email }, { $set: { passwordHash, updatedAt: new Date() } });
    console.log(`\n✓ Password updated for ${email}`);
  } else {
    await users.insertOne({
      email,
      passwordHash,
      name: process.env.SEED_ADMIN_NAME || "Administrator",
      role: "owner",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`\n✓ Admin account created for ${email}`);
  }

  console.log(`  Sign in at /admin/login\n`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(`\n✗ Failed: ${err instanceof Error ? err.message : err}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
