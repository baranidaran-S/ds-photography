import { v2 as cloudinary } from "cloudinary";

let configured = false;

function client() {
  if (!configured) {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error(
        "Cloudinary keys are missing. Fill CLOUDINARY_* in .env.local.",
      );
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

export type UploadResult = {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

/** Uploads a file picked in the admin. Cloudinary handles resizing and format on delivery. */
export async function uploadImage(
  file: Buffer,
  folder: string,
): Promise<UploadResult> {
  const api = client();
  const res = await new Promise<Record<string, unknown>>((resolve, reject) => {
    api.uploader
      .upload_stream(
        {
          folder: `ds-photography/${folder}`,
          resource_type: "image",
          // keep a sane ceiling so a 20MP original does not become the stored master
          transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        },
        (err, result) => (err || !result ? reject(err) : resolve(result)),
      )
      .end(file);
  });

  return {
    publicId: String(res.public_id),
    url: String(res.secure_url),
    width: Number(res.width ?? 0),
    height: Number(res.height ?? 0),
    format: String(res.format ?? ""),
    bytes: Number(res.bytes ?? 0),
  };
}

export async function deleteImage(publicId: string) {
  if (!publicId) return;
  /* `invalidate` clears the delivery network too. Without it the file leaves the
     account but the CDN keeps serving its cached copy, so a photo you deleted
     still appears on anyone who loads the old link. */
  await client().uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

/** Folders the admin is allowed to upload into. Anything else is rejected when signing. */
export const UPLOAD_FOLDERS = [
  "hero",
  "services",
  "portfolio",
  "about",
  "reviews",
  "instagram",
  "films",
  "logo",
  "contact",
  "misc",
] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export const ROOT_FOLDER = "ds-photography";

/** Signs the params the upload widget sends, so the browser never sees the API secret. */
export function signUploadParams(params: Record<string, unknown>) {
  const api = client();
  return api.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET as string,
  );
}
