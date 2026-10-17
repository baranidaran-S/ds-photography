/** A small preview of a gallery photo, for the admin (a few KB instead of the whole photo): a
    square crop, or with `whole` the whole photo fitted inside that size. The photo store makes it
    from the address; a photo from elsewhere comes back as it is. */
export function thumbOf(src: string, size = 320, whole = false) {
  return src.includes("res.cloudinary.com/") && src.includes("/upload/")
    ? src.replace("/upload/", `/upload/${whole ? "c_limit" : "c_fill"},w_${size},h_${size},q_auto,f_auto/`)
    : src;
}
