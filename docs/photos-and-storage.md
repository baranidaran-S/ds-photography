# Photos: how they're stored, shown and framed

How the site's photos work today, how the gallery pages lay them out, how the blog frames its cover photos, and what has to change when the photos move from Cloudinary to AWS S3.

Written on 17 Oct 2026. At that point:

- Photos are stored on **Cloudinary**.
- A move to **AWS S3** is planned.
- The blog is being built in phases (see [Blog status](#blog-status)). That work is not committed yet.

---

## The short version

- **The admin uploads photos as they are, of any size or shape.** There is no crop tool anywhere.
- **Every upload records four things** with the record it belongs to:
  - `src`: the file's address
  - `publicId`: its name in the photo store
  - `width` and `height`
- **The pages lay photos out by their shape** (width ÷ height), so a photo shows whole.
- **Where a fixed shape is needed** (the blog's cards), a **focus point** keeps the people in view.
- **The website's resizing is done by Next.js, not Cloudinary.** `next/image` makes the smaller AVIF/WebP copies a browser downloads, at `/_next/image`. Cloudinary only stores and serves the original file. Its URL transforms are used in one place only: the admin's small thumbnails.
- **So the S3 move is mostly about upload, delete and thumbnail code.** Page components don't change, as long as every new upload still records its `width` and `height`.

---

## How a photo gets in (today)

1. **The admin presses an upload button.** It is [UploadButton.tsx](../src/app/admin/components/UploadButton.tsx), which opens Cloudinary's upload window (`CldUploadWidget` from `next-cloudinary`).
2. **The window asks our server to sign the upload.** That happens at [api/admin/media/sign](../src/app/api/admin/media/sign/route.ts).
   - The server only signs uploads into the allowed folders, `UPLOAD_FOLDERS` in [lib/cloudinary.ts](../src/lib/cloudinary.ts), all under `ds-photography/`.
   - The API secret never reaches the browser.
3. **Gallery and blog photos are shrunk in the browser first,** to 2400 px on the long side (`shrinkTo`). The upload window does this.
4. **Cloudinary returns the upload's details:** `secure_url`, `public_id`, `width` and `height`.
   - The form keeps them.
   - Saving writes them to MongoDB with the record.
5. **Photos for the site's sections are also listed in the Media Library** (the `Media` collection). These are the hero, services, about, reviews and so on. Gallery and blog photos are not listed (`library={false}`), because there are too many.

### Where photos are saved in the database

All models are in [src/models](../src/models).

| What | Model and field | Photo fields |
|---|---|---|
| Gallery category cover | `GalleryCategory.cover` | `src`, `publicId`, `width`, `height` |
| Kind of shoot (album) cover | `GallerySub.cover` | same |
| Album photos | `GalleryPhoto`, one document per photo (an album can hold thousands) | `src`, `publicId`, `width`, `height` |
| Blog card cover, story-page photo | `BlogPost.cover`, `BlogPost.storyCover` | the same, plus `position` (focus point) and `alt` |
| Blog story photos | `BlogPost.photos[]` | `src`, `publicId`, `width`, `height`, `alt` |
| Site sections: hero, services, films, stories, reviews, Instagram strip | `photoSchema` in [models/shared.ts](../src/models/shared.ts) | `src`, `alt`, `position`, `mobilePosition`, `publicId` (no size) |
| Media Library | `Media` | `publicId`, `url`, `width`, `height`, `format`, `bytes`, `folder` |

`Setting.value` is free-form (`Mixed`) and may also hold photo addresses.

---

## The gallery pages

The rule: **every photo shows whole, laid out by its shape.** The admin never has to crop or adjust anything. The shape comes from the `width` and `height` saved at upload. The pages read the gallery through [lib/gallery.ts](../src/lib/gallery.ts).

### `/gallery`: [GalleryRows.tsx](../src/components/gallery/GalleryRows.tsx)

- The categories show as even rows:
  - every photo in a row is the same height
  - each photo is as wide as its shape needs
  - every row is exactly the page's width
- Which categories share a row is worked out from their shapes. The cut is chosen so the rows end as evenly as possible (a small dynamic-programming search).
- Each screen size has its own arrangement. Only the one that fits is shown.

| Screen | Shape per row (`TARGET`) | Most photos per row (`MOST`) |
|---|---|---|
| Phone | 1.4 | 2 |
| Tablet | 2.1 | 3 |
| Computer | 2.75 | 4 |

- The "Don't see your celebration?" card fills the end of the last row when there's room. Otherwise it runs under the rows.

### `/gallery/[category]`: [CategoryWall.tsx](../src/components/gallery/CategoryWall.tsx)

- The category's kinds of shoot show as a staggered wall of columns, with every other column starting lower.
- Each card takes its cover's own shape, kept between 2:3 and 3:2. A panorama or a phone screenshot then can't make a sliver. A photo outside that range loses a little off its long sides.
- The kinds are shared across the columns so the columns end as evenly as possible.

### `/gallery/[category]/[sub]`: [CategoryStory.tsx](../src/components/gallery/CategoryStory.tsx)

- **One album.** Every photo shows whole, in 2 columns on phones and 3 on bigger screens.
- **24 photos come with the page.** "Show more" fetches 24 more each time (`ALBUM_PAGE` in [lib/album.ts](../src/lib/album.ts)) from `/api/gallery/photos`.
- **Photos already showing never move.** New ones are only added at the bottom of the columns. The last few photos are placed so the columns end together.
- **Tapping a photo** opens [PhotoViewer.tsx](../src/components/gallery/PhotoViewer.tsx): full screen and whole (`object-contain`), with arrows, keyboard and swipe.
- **A photo whose size wasn't recorded** is treated as 4:5 (`shownOf` in lib/album.ts).

### Why the pages are quick

- **No jumping while photos load.** Every photo's shape is known before it loads, so its space is held.
- **The first photos load early.** [preload.tsx](../src/components/gallery/preload.tsx) adds `<link rel="preload">` for them, per screen size, at exactly the `srcset` the `<Image>` will ask for. `warmPhotos` starts the next "Show more" batch early.
- **The browser gets the right size.** `next/image`, given a `sizes` hint, picks from Next's widths (`deviceSizes` / `imageSizes`). The optimizer at `/_next/image` makes and caches each copy as AVIF/WebP, at qualities 75/85 ([next.config.ts](../next.config.ts)).

### The gallery admin

- **Gallery editor:** categories, kinds of shoot and their covers ([CoverField.tsx](../src/app/admin/(panel)/gallery/CoverField.tsx)).
- **A Photos page per kind** ([PhotosEditor.tsx](../src/app/admin/(panel)/gallery/[id]/PhotosEditor.tsx)):
  - Up to 200 photos per upload.
  - Save sends `{ add, remove }` to [api/admin/gallery/photos](../src/app/api/admin/gallery/photos/route.ts).
  - Discard deletes uploads that were never saved, through [api/admin/gallery/discard](../src/app/api/admin/gallery/discard/route.ts).
- **Unused files are deleted from the store:** replaced covers, removed photos, and a deleted kind's photos. This goes through `deleteFiles` in [lib/photoStore.ts](../src/lib/photoStore.ts). It only ever deletes inside `ds-photography/gallery/`, so the site's other photos can't be touched from the gallery.
- **Saving rebuilds the affected pages** (`revalidatePath`).

> **"The gallery sends the link with the width and height, and the sizes update automatically."**
>
> Here is what actually happens:
>
> - The width and height are **numbers saved once, at upload**.
> - The page uses them to hold each photo's shape.
> - The browser then asks **Next.js** for a copy of the right size. Next fetches the original from the photo store, resizes it and caches it.
>
> Cloudinary isn't doing the resizing. After the move to S3, the gallery keeps working unchanged, as long as uploads still record width and height.

---

## Blog cover photos: the framing (phase 6, built)

### Any photo can be a cover

- The admin uploads a tall, wide, square or panorama photo as it comes. There is no crop tool.
- The file stays whole.
- Each place on the website shows it through a **window** of a fixed shape. The window keeps the **focus point** in view.

| Window | Shape | Where | Code |
|---|---|---|---|
| Story card | 5:4 | The cards on `/blog` and under "More stories" | [components/blog/card.tsx](../src/components/blog/card.tsx) |
| Big card, phone (narrower than 640 px) | 4:3 | The newest story at the top of `/blog`; the top of the story's own page | [BlogList.tsx](../src/components/blog/BlogList.tsx), [BlogStory.tsx](../src/components/blog/BlogStory.tsx) |
| Big card, tablet and computer | 3:2 | Same places | same |

How much of the photo each window keeps:

| Photo | Story card 5:4 | Big card 4:3 | Big card 3:2 |
|---|---|---|---|
| Tall (2:3) | 53% of the height | 50% | 44% |
| Square (1:1) | 80% of the height | 75% | 67% |
| Wide (3:2) | 83% of the width | 89% | 100%, nothing trimmed |
| Very wide (16:9) | 70% of the width | 75% | 84% |

Wide photos lose a little from the sides. Tall photos lose about half, from the top and bottom, so for them the focus point matters most.

### The focus point

- **What it is:** `cover.position`, saved as `"x% y%"` and used as CSS `object-position`.
- **One point serves every window.** With percentage `object-position`, the window slides along the trimmed side until the focus point sits the same share of the way across the window as it does across the photo. That means the focus point is always inside every window.

#### How the website finds it

[lib/coverLook.ts](../src/lib/coverLook.ts), called from [api/admin/blog/cover](../src/app/api/admin/blog/cover/route.ts) right after an upload:

1. **Fetch the file.** Only the website's own uploads are fetched (`isStoredPhoto` in lib/photoStore.ts).
2. **Prepare it.** Turn it upright (EXIF), then shrink it to 800 px.
3. **Find the people.** Ask sharp's `attention` crop where it would cut for the tightest window: 3:2 for tall photos, 5:4 for wide ones. That crop looks for the busiest, most skin-toned, most colourful area. Its crop offset is turned into a percentage.
4. **Cap tall photos at the middle.** For a tall photo the vertical result never goes below 50%.
   - On 9 photos from the site, sharp twice chose a bright dress or a gold cushion at the bottom and cut off the faces. The cap fixes both.
   - Tall group photos can still lose the top of a head in the 3:2 window. That's what the tap is for.

#### How the admin changes it

The post form ([CoverPicker.tsx](../src/app/admin/(panel)/blog/CoverPicker.tsx)) shows:

- **The whole photo** with a gold dot (the focus point), and the chosen window drawn on it with the rest shaded.
- **The three windows, live:**
  - the real story card, made by the same `CardFace` the website uses
  - the two big-card shapes

The admin can move the focus point in three ways:

- tap or drag on the photo
- use the arrow keys
- press "Find the focus again"

The admin can also pick any window to see it outlined on the photo.

### The card's colour

Every card is framed in a deep shade of its cover's main colour, saved as `tone`. lib/coverLook.ts finds it:

1. Shrink the photo to 48 px.
2. Average its colourful pixels in OKLab:
   - each pixel counts as much as it is colourful
   - near-black, near-white and grey pixels are skipped
3. Keep that hue, set the lightness to 0.31 and the chroma to 0.03–0.075. The cream words on the card always read on that.

A photo with no real colour gets a warm brown. The fallback is `DEFAULT_TONE`, `#3b2a22`.

### The optional story-page photo

- `storyCover` is a different photo for the top of the story's own page, for example a wide one when the cover is tall.
- It has its own focus point.
- Without one, the cover is used there.

### Files

- Blog uploads go to `ds-photography/blog/`.
- **Saving:** a replaced or removed cover's file is deleted.
- **Deleting a post:** its files are deleted.
- **Uploads that were never saved are deleted** through [api/admin/blog/discard](../src/app/api/admin/blog/discard/route.ts), sent with `fetch(…, { keepalive: true })`. That covers four cases:
  - replaced before saving
  - removed
  - "Discard" pressed
  - the page left
- **The server only deletes blog-folder files that no post uses** ([api/admin/blog/files.ts](../src/app/api/admin/blog/files.ts)).

### Story photos (phase 7, built)

- **On the post's own page,** story photos always show whole. Wide photos go across. Two tall photos in a row sit side by side. A lone tall photo is centred and narrower. The rule is `photoRows` in [content/blog.ts](../src/content/blog.ts), shared by the page and the admin preview.
- **In the post form** ([StoryPhotos.tsx](../src/app/admin/(panel)/blog/StoryPhotos.tsx)):
  - Upload many at once (up to 100 per batch, 200 per post).
  - Drag to reorder: with a mouse anywhere on a photo; on touch screens by its handle, so the page still scrolls; or with the arrow keys on the handle.
  - Remove a photo with its ×.
  - A live preview of the page's arrangement.
  - A tip naming any lone tall photos.
  - A "Small" label on photos under 1200 px on their long side.
- **Alt text** is made from the title: "<title>, photo 3".
- **Files:** removed photos' files are deleted on Save, like the covers.

---

## Switching from Cloudinary to S3

### What does not change

- **Every page component:** gallery, blog and the site's sections. They only read `src`, `width`, `height` and `position`.
- **Next.js's resizing** (`next/image`, `/_next/image`).
- **The database's shapes.** `publicId` simply becomes the S3 object key.
- **The blog's focus point and colour.** sharp fetches any address. Only `isStoredPhoto` changes.

### What changes

| Job | Today (Cloudinary) | File | With S3 |
|---|---|---|---|
| Upload window (pick files, many at once, progress) | `CldUploadWidget` from `next-cloudinary` | [UploadButton.tsx](../src/app/admin/components/UploadButton.tsx) | Our own file input and progress list. **Keep the `UploadedMedia` result and the props** (`folder`, `multiple`, `maxFiles`, `shrinkTo`, `library`, `onUploaded`), so its users don't change: CoverField, PhotosEditor, PhotoField, MediaBrowser and the blog's CoverPicker and BlogPostForm. |
| Shrink before upload (2400 px) | The window's `maxImageWidth` / `maxImageHeight` | UploadButton.tsx | `createImageBitmap` and a canvas, then a JPEG or WebP blob at about 0.9 quality. |
| Width and height | Returned by Cloudinary | UploadButton.tsx | Measured in the browser from the (shrunk) image. **Must be recorded**: the gallery and blog layouts depend on them. |
| Permission to upload | A signature over the window's parameters | [api/admin/media/sign](../src/app/api/admin/media/sign/route.ts), `signUploadParams` in [lib/cloudinary.ts](../src/lib/cloudinary.ts) | A presigned PUT URL (`@aws-sdk/s3-request-presigner`). The **server** picks the key, `ds-photography/<allowed folder>/<random id>.<ext>`, keeping the `UPLOAD_FOLDERS` check. Allow image types only, with a short expiry (about 5 minutes). The browser PUTs the file straight to S3. |
| Listing in the Media Library | `POST /api/admin/media` | [api/admin/media](../src/app/api/admin/media/route.ts) | Unchanged; the S3 key is the `publicId`. |
| Delete gallery and blog files | `delete_resources`, 100 per call, CDN cleared | [lib/photoStore.ts](../src/lib/photoStore.ts) `deleteFiles` | `DeleteObjectsCommand`, up to 1000 keys per call. Keep the folder check. |
| Is this one of our photos? | Matches `res.cloudinary.com/<cloud>/image/upload/` | lib/photoStore.ts `isStoredPhoto` | Match the bucket's or CloudFront's address. |
| Delete a Media Library file | `uploader.destroy` | lib/cloudinary.ts `deleteImage`, used by the `DELETE` in api/admin/media | `DeleteObjectCommand`. |
| Admin thumbnails | Cloudinary URL transform (`/upload/c_fill,w_…`) | [lib/photoUrl.ts](../src/lib/photoUrl.ts) `thumbOf` | Next's optimizer (`getImageProps` from `next/image`, or `/_next/image?url=…&w=256&q=75`, where `w` is one of Next's sizes), or thumbnails made at upload. Until it's replaced, `thumbOf` returns the full photo for non-Cloudinary addresses. That works but is heavy: a Photos page of 200 photos would load 200 full-size files. |
| Photos on the website | `res.cloudinary.com` allowed | [next.config.ts](../next.config.ts) `images.remotePatterns` | Add the bucket's or CloudFront's host. Keep `res.cloudinary.com` until the old photos are moved. |
| Keys | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | [.env.example](../.env.example), `.env.local` | For example `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and a public base address such as `NEXT_PUBLIC_PHOTO_BASE_URL`. Remove the Cloudinary keys after the move. |
| Packages | `cloudinary`, `next-cloudinary` | [package.json](../package.json) | Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`; remove the two Cloudinary packages after the move. (`sharp` is already a dependency.) |
| Wording | The Media Library's delete message says "Cloudinary" | [MediaBrowser.tsx](../src/app/admin/(panel)/media/MediaBrowser.tsx) | Reword. |

`uploadImage` in lib/cloudinary.ts is not used by the app. It can go.

### Setting up the bucket

- **Make the photos public:** a bucket policy for `ds-photography/*`, or (better) **CloudFront** in front for HTTPS, caching and a custom domain.
- **CORS:** allow `PUT` from the admin's addresses (the live domain and `http://localhost:3000`), with the `Content-Type` header.
- **Access key:** an IAM user limited to `s3:PutObject`, `s3:DeleteObject` and `s3:GetObject` on this bucket.
- **Caching:** every upload gets a new key, so a replaced photo never needs its cache cleared.
  - Cloudinary's `invalidate: true` cleared its CDN when a file was deleted.
  - With CloudFront, a deleted photo can still be served from its cache until it expires, unless an invalidation is made.

### Moving the photos already uploaded (a one-time script)

Every saved address today is a full `https://res.cloudinary.com/...` URL, and every `publicId` a Cloudinary name such as `ds-photography/gallery/abc123`. The script should:

1. **Find every record that points at Cloudinary,** in every collection: gallery categories, kinds and photos; blog posts; Media; and the section models (hero slides, services, films, stories, reviews, Instagram photos, settings). The safest way is to search every collection for strings containing `res.cloudinary.com` rather than listing fields by hand.
2. **For each file:** download the original, upload it to S3 under the same name (its `publicId` plus its extension), and write the new address into `src` / `url`. `width` and `height` stay as they are.
3. **Run it on a copy of the database first.** `npm run migrate-cluster` copies everything to another cluster.
4. **Keep the Cloudinary account until the site has been checked,** then remove `res.cloudinary.com` from `remotePatterns`.

---

## Blog status

| Phase | What | State on 17 Oct 2026 |
|---|---|---|
| 1 | Remove the sample posts | Done |
| 2 | Database (`BlogPost` model, [lib/blog.ts](../src/lib/blog.ts)) | Done |
| 3 | Blog categories | Dropped: posts use the gallery's categories |
| 4 | Admin posts list | Done |
| 5 | Post form: title, address (made from the title, fixed after publishing), category, place, date, one description box | Done |
| 6 | Cover photo, story-page photo, focus point, card colour, file clean-up | Done (this document) |
| 7 | Story photos: multi-upload, drag to reorder, remove, layout preview, small-photo warning, alt text made from the title | Done |
| 8 | Site finishing: first 20 photos plus "Show more", never taller than the screen, SEO fields | |
| 9 | Move to S3 (above) | |
| 10 | Import the 70 posts from the old WordPress site, at the same addresses (list in [docs/old-site-urls](old-site-urls/)) | |
| 11 | Permanent redirects from the old addresses to `/blog/<name>`, and the sitemap | |
| 12 | Final test, commit, push | |

The S3 move (9) comes before the import (10), so the old posts' photos go straight to S3.
