import { BlogPost } from "@/models";
import { BLOG_FOLDER, deleteFiles, isBlogFile } from "@/lib/photoStore";

/** Deletes from the photo store those of these blog files that no post uses any more (a replaced or
    removed cover, a deleted post's photos, an upload never saved). Files outside the blog's folder,
    and any still used by a post, are kept. */
export async function dropUnused(publicIds: string[]) {
  const ids = [...new Set(publicIds.filter(isBlogFile))];
  if (!ids.length) return 0;
  type File = { publicId?: string };
  const users = (await BlogPost.find(
    { $or: [{ "cover.publicId": { $in: ids } }, { "storyCover.publicId": { $in: ids } }, { "photos.publicId": { $in: ids } }] },
    { cover: 1, storyCover: 1, photos: 1 },
  ).lean()) as { cover?: File; storyCover?: File; photos?: File[] }[];
  const used = new Set(
    users.flatMap((p) => [p.cover?.publicId, p.storyCover?.publicId, ...(p.photos ?? []).map((photo) => photo.publicId)]),
  );
  return deleteFiles(
    ids.filter((id) => !used.has(id)),
    BLOG_FOLDER,
  );
}
