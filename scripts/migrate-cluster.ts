/* Copy every collection from one cluster to another.
 *   npm run migrate-cluster
 *
 * Reads MONGODB_URI (source, only ever read from) and TARGET_MONGODB_URI
 * (destination) out of .env.local, so the connection strings never enter the
 * repository.
 *
 * A target collection that already holds documents is skipped, so running this
 * twice cannot duplicate anything. Nothing is deleted from either side.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { MongoClient } from "mongodb";

const SOURCE = process.env.MONGODB_URI;
const TARGET = process.env.TARGET_MONGODB_URI;
const DB = "ds-photography";

async function main() {
  if (!SOURCE || !TARGET) {
    throw new Error("Set MONGODB_URI and TARGET_MONGODB_URI in .env.local");
  }
  if (SOURCE === TARGET) throw new Error("Source and target are the same cluster");

  const src = new MongoClient(SOURCE, { serverSelectionTimeoutMS: 20_000 });
  const dst = new MongoClient(TARGET, { serverSelectionTimeoutMS: 20_000 });
  await Promise.all([src.connect(), dst.connect()]);
  const from = src.db(DB);
  const to = dst.db(DB);

  console.log("from:", new URL(SOURCE).host);
  console.log("to  :", new URL(TARGET).host, "\n");

  const collections = await from.listCollections().toArray();

  for (const { name } of collections) {
    const already = await to.collection(name).countDocuments();
    if (already) {
      console.log(`  ${name.padEnd(18)} skipped — target already holds ${already}`);
      continue;
    }

    const docs = await from.collection(name).find({}).toArray();
    if (docs.length) await to.collection(name).insertMany(docs, { ordered: true });
    else await to.createCollection(name).catch(() => {});

    /* The unique ones carry real meaning: a second admin on one email, or a
       second settings row for one key, would quietly break the panel. */
    const specs = (await from.collection(name).indexes())
      .filter((i) => i.name !== "_id_")
      .map((i) => ({
        key: i.key as Record<string, 1 | -1>,
        name: i.name!,
        unique: Boolean(i.unique),
        sparse: Boolean(i.sparse),
      }));
    if (specs.length) await to.collection(name).createIndexes(specs);

    console.log(
      `  ${name.padEnd(18)} ${String(docs.length).padStart(4)} docs  +${specs.length} indexes`,
    );
  }

  console.log("\nverifying…");
  let same = true;
  for (const { name } of collections) {
    const a = await from.collection(name).countDocuments();
    const b = await to.collection(name).countDocuments();
    if (a !== b) same = false;
    console.log(`  ${name.padEnd(18)} ${a} → ${b} ${a === b ? "ok" : "MISMATCH"}`);
  }

  await Promise.all([src.close(), dst.close()]);
  if (!same) process.exitCode = 1;
}

main().catch((e) => {
  console.error("failed:", e instanceof Error ? e.message : e);
  process.exit(1);
});
