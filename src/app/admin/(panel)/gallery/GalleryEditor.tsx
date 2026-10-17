"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GalleryCategoryValue, GallerySubValue } from "@/lib/gallery";
import { thumbOf } from "@/lib/photoUrl";
import { slugOf } from "@/lib/slug";
import { CoverField } from "./CoverField";
import { newCategory, newSub } from "./values";
import { EditorRow } from "../../components/EditorRow";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { TextField } from "../../components/Field";
import { move, useEditor } from "../../components/useEditor";

// the saved gallery the server sends back, new rows with their ids
const adopt = (reply: Record<string, unknown>) => reply.categories as GalleryCategoryValue[];

const subsCount = (n: number) => (n === 1 ? "1 sub-category" : `${n} sub-categories`);
const photosCount = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

/* The website's gallery: its categories in order, each a row that opens to its name, its cover
   photo and its sub-categories (each with an English name, a Tamil name if it has one, its own
   cover photo, and a button to its Photos page). Their web addresses are made from the names;
   they show here as you type. Everything here saves together with Save; a sub-category's photos
   are saved on its Photos page. `openSub`: coming back from a sub-category's Photos page, its
   category starts open, scrolled to it and lit for a moment. */
export function GalleryEditor({ initial, openSub }: { initial: GalleryCategoryValue[]; openSub?: string }) {
  const ed = useEditor(initial, "/api/admin/gallery", "categories", adopt);
  const list = ed.draft;
  // one category open at a time
  const [openRow, setOpenRow] = useState(() => initial.findIndex((c) => c.subs.some((s) => s.id === openSub)));
  const [lit, setLit] = useState(openSub);

  useEffect(() => {
    if (!openSub) return;
    document.getElementById(`sub-${openSub}`)?.scrollIntoView({ block: "center" });
    const t = setTimeout(() => setLit(undefined), 2500);
    return () => clearTimeout(t);
  }, [openSub]);

  const set = (i: number, patch: Partial<GalleryCategoryValue>) =>
    ed.update(list.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const setSubs = (i: number, subs: GallerySubValue[]) => set(i, { subs });

  /* Moving or deleting shifts every index below, so the open row is shut rather than left
     pointing at whichever category slid into its place. */
  function reorder(next: GalleryCategoryValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }
  function add() {
    ed.update([...list, newCategory()]);
    setOpenRow(list.length);
  }

  return (
    <>
      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-display text-[1.3rem] text-ink">No categories yet</p>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[0.88rem] leading-relaxed text-slate-500">
            The website&rsquo;s Gallery page says &ldquo;coming soon&rdquo; until you add one. Start with a
            category, like Weddings, then add its sub-categories.
          </p>
          <button
            type="button"
            onClick={add}
            className="mt-5 rounded-lg bg-accent-deep px-5 py-2.5 font-heading text-[0.74rem] font-bold tracking-[0.12em] text-cream uppercase transition-colors hover:bg-accent"
          >
            + Add your first category
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((c, i) => {
            const address = `/gallery/${slugOf(c.name) || "…"}`;
            return (
              <EditorRow
                key={c.id || `new-${i}`}
                index={i}
                title={c.name}
                subtitle={`${subsCount(c.subs.length)} · ${address}`}
                thumb={c.cover.src && thumbOf(c.cover.src, 96)}
                dimmed={!c.active}
                open={openRow === i}
                onToggle={() => setOpenRow(openRow === i ? -1 : i)}
                controls={
                  <RowControls
                    index={i}
                    count={list.length}
                    active={c.active}
                    onMove={(from, to) => reorder(move(list, from, to))}
                    onToggle={(x) => set(x, { active: !list[x].active })}
                    onRemove={(x) => reorder(list.filter((_, y) => y !== x))}
                    noun="Category"
                    label={c.name}
                    detail={(() => {
                      const photos = c.subs.reduce((a, s) => a + s.count, 0);
                      if (!c.subs.length) return undefined;
                      return `Its ${subsCount(c.subs.length)}${photos ? ` and ${photosCount(photos)}` : ""} will be deleted with it.`;
                    })()}
                  />
                }
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <TextField
                      label="Category name"
                      value={c.name}
                      onChange={(name) => set(i, { name })}
                      placeholder="e.g. Weddings"
                      hint={`Its web address: ${address}`}
                    />
                  </div>
                  <CoverField
                    label="Cover photo"
                    value={c.cover}
                    onChange={(cover) => set(i, { cover })}
                    hint="Its card on the Gallery page. Any size works: it shows whole, in its own shape."
                  />
                </div>

                <Subs category={c} onChange={(subs) => setSubs(i, subs)} unsaved={ed.dirty} lit={lit} />
              </EditorRow>
            );
          })}
        </div>
      )}

      {list.length > 0 && (
        <button
          type="button"
          onClick={add}
          className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
        >
          + Add a category
        </button>
      )}

      <SaveBar
        dirty={ed.dirty}
        saving={ed.saving}
        error={ed.error}
        saved={ed.saved}
        onSave={ed.save}
        onReset={ed.reset}
      />
    </>
  );
}

/** A category's sub-categories: one line each (its cover, English name, Tamil name, its Photos
    button and the row's controls). The Photos page opens only once the gallery is saved: a new
    sub-category has nowhere to keep photos yet, and leaving would lose what's not saved. */
function Subs({
  category,
  onChange,
  unsaved,
  lit,
}: {
  category: GalleryCategoryValue;
  onChange: (subs: GallerySubValue[]) => void;
  unsaved: boolean;
  /** the sub-category just come back to, picked out for a moment */
  lit?: string;
}) {
  const subs = category.subs;
  const base = `/gallery/${slugOf(category.name) || "…"}`;
  const set = (j: number, patch: Partial<GallerySubValue>) =>
    onChange(subs.map((s, k) => (k === j ? { ...s, ...patch } : s)));

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <p className="font-heading text-[0.62rem] font-bold tracking-[0.18em] text-slate-500 uppercase">
        Sub-categories{subs.length > 0 && <span className="ml-2 text-slate-400">{subs.length}</span>}
      </p>
      <p className="mt-1 text-[0.8rem] text-slate-400">
        The kinds of shoot inside {category.name || "this category"}, in the order the website shows them.
      </p>

      {subs.length > 0 && (
        <div className="mt-4 space-y-2.5">
          {subs.map((s, j) => (
            <div
              key={s.id || `new-${j}`}
              id={s.id ? `sub-${s.id}` : undefined}
              className={`flex flex-wrap items-start gap-3 rounded-lg border bg-slate-50/70 p-3 transition duration-700 ${
                s.active ? "" : "opacity-60"
              } ${s.id && s.id === lit ? "border-brand ring-2 ring-brand/40" : "border-slate-200"}`}
            >
              <span className="pt-6 font-display text-[0.95rem] text-slate-300 tabular-nums">
                {String(j + 1).padStart(2, "0")}
              </span>
              <div className="pt-1">
                <CoverField label="Cover" compact value={s.cover} onChange={(cover) => set(j, { cover })} />
              </div>
              <div className="grid min-w-0 flex-1 basis-56 gap-3 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={s.name}
                  onChange={(name) => set(j, { name })}
                  placeholder="e.g. Hindu wedding"
                  hint={`${base}/${slugOf(s.name) || "…"}`}
                />
                <TextField
                  label="Tamil name (optional)"
                  value={s.local}
                  onChange={(local) => set(j, { local })}
                  placeholder="e.g. Muhurtham"
                  hint="Shown with the name, and found by the search."
                />
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:pt-5">
                {s.id && !unsaved ? (
                  <Link
                    href={`/admin/gallery/${s.id}`}
                    className="rounded-lg bg-accent-deep px-3.5 py-2 text-[0.8rem] font-medium whitespace-nowrap text-cream transition-colors hover:bg-accent"
                  >
                    Photos ({s.count})
                  </Link>
                ) : (
                  <span
                    title={s.id ? "Save your changes first" : "Save to add photos"}
                    className="flex flex-col items-end rounded-lg border border-dashed border-slate-300 px-3 py-1 text-right text-[0.78rem] whitespace-nowrap text-slate-400"
                  >
                    Photos
                    <span className="text-[0.64rem]">{s.id ? "Save changes first" : "Save to add photos"}</span>
                  </span>
                )}
                <RowControls
                  index={j}
                  count={subs.length}
                  active={s.active}
                  onMove={(from, to) => onChange(move(subs, from, to))}
                  onToggle={(x) => set(x, { active: !subs[x].active })}
                  onRemove={(x) => onChange(subs.filter((_, y) => y !== x))}
                  noun="Sub-category"
                  label={s.name}
                  detail={s.count ? `Its ${photosCount(s.count)} will be deleted with it.` : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => onChange([...subs, newSub()])}
        className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-3 text-[0.84rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a sub-category
      </button>
    </div>
  );
}
