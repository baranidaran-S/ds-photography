import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ROOT_FOLDER, UPLOAD_FOLDERS, signUploadParams } from "@/lib/cloudinary";

/* The upload widget asks for a signature before it sends a file. proxy.ts has
   already checked the cookie, but this is re-checked because signing is what
   actually authorises a write to the Cloudinary account. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let paramsToSign: Record<string, unknown>;
  try {
    const body = await request.json();
    paramsToSign = body?.paramsToSign ?? {};
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  /* Pin the destination folder. Without this a tampered widget could sign an
     upload into any folder on the account. */
  const asked = String(paramsToSign.folder ?? "").replace(`${ROOT_FOLDER}/`, "");
  const folder = (UPLOAD_FOLDERS as readonly string[]).includes(asked)
    ? asked
    : "misc";
  paramsToSign.folder = `${ROOT_FOLDER}/${folder}`;

  try {
    return NextResponse.json({ signature: signUploadParams(paramsToSign) });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Could not sign the upload.",
      },
      { status: 500 },
    );
  }
}
