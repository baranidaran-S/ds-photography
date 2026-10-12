import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { AdminUser } from "@/models";
import { signSession, setSessionCookie } from "@/lib/auth";

/* Wrong guesses allowed before the account closes for a while. Generous enough
   that a mistyped password is never a problem, small enough that guessing is
   not worth starting. */
const TRIES = 8;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    await connectDB();
  } catch {
    return NextResponse.json(
      { error: "Could not reach the database. Check MONGODB_URI." },
      { status: 503 },
    );
  }

  /* Nobody has been set up yet — saying so is not an information leak (there is no
     account to enumerate) and it saves guessing at passwords that cannot exist. */
  if ((await AdminUser.estimatedDocumentCount()) === 0) {
    return NextResponse.json(
      {
        error:
          "No admin account exists yet. Run `npm run seed` to create the first one.",
      },
      { status: 401 },
    );
  }

  const user = await AdminUser.findOne({ email });

  /* Still locked from earlier attempts: answer before touching the password, so
     a locked account costs a guesser a request and tells them nothing. */
  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.max(
      1,
      Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000),
    );
    return NextResponse.json(
      {
        error: `Too many wrong attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      },
      { status: 429 },
    );
  }

  /* Compare against a dummy hash when the user is unknown, so a wrong email and a
     wrong password take the same time and cannot be told apart. */
  const hash = user?.passwordHash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok) {
    if (user) {
      const failed = (user.failedLogins ?? 0) + 1;
      await AdminUser.updateOne(
        { _id: user._id },
        failed >= TRIES
          ? {
              failedLogins: 0,
              lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000),
            }
          : { failedLogins: failed },
      );
    }
    return NextResponse.json(
      { error: "Email or password is incorrect" },
      { status: 401 },
    );
  }

  const token = await signSession({
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  // a good password clears the slate
  await AdminUser.updateOne(
    { _id: user._id },
    { lastLoginAt: new Date(), failedLogins: 0, $unset: { lockedUntil: 1 } },
  );

  return NextResponse.json({ ok: true, name: user.name });
}
