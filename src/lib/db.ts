import mongoose from "mongoose";

/* Next reloads modules on every edit in dev, which would open a new pool each time.
   The connection is parked on globalThis so those reloads reuse the same one.

   The URI is read inside connectDB rather than at module scope, and stored next to
   the connection: changing MONGODB_URI in .env.local then has to open a fresh pool
   instead of silently reusing one pointed at the previous database. */
type Cache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri: string | null;
};
const globalForMongoose = globalThis as unknown as { mongoose?: Cache };
const cached: Cache = (globalForMongoose.mongoose ??= {
  conn: null,
  promise: null,
  uri: null,
});

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing. Copy .env.example to .env.local and fill it in.",
    );
  }

  if (cached.conn && cached.uri === uri) return cached.conn;

  // pointed somewhere new — drop the old pool before opening another
  if (cached.conn && cached.uri !== uri) {
    await cached.conn.disconnect().catch(() => {});
    cached.conn = null;
    cached.promise = null;
  }

  cached.uri = uri;
  cached.promise ??= mongoose
    .connect(uri, {
      // fail fast with a clear message instead of hanging the request
      serverSelectionTimeoutMS: 10_000,
    })
    .catch((err) => {
      cached.promise = null; // let the next request retry
      throw err;
    });

  cached.conn = await cached.promise;
  return cached.conn;
}
