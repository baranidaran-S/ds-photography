import { getSearchItems } from "@/lib/searchIndex";

/* /search.json: everything the gallery search can find (lib/searchIndex.ts). Made once when the
   site is built, like the pages, and fetched by the browser only when the search is opened. */
export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getSearchItems());
}
