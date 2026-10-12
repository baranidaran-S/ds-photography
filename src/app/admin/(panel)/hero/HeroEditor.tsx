"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { move, useEditor } from "../../components/useEditor";

export type HeroSlideValue = {
  label: string;
  photo: PhotoValue;
  active: boolean;
};

/* One screenful of collapsed rows. The whole list still lives in the draft —
   this only decides which rows are drawn. */
const PER_PAGE = 10;

const blank: HeroSlideValue = {
  label: "",
  photo: { src: "", alt: "", position: "50% 50%", mobilePosition: "" },
  active: true,
};

export function HeroEditor({ initial }: { initial: HeroSlideValue[] }) {
  const ed = useEditor(initial, "/api/admin/hero", "slides");
  const slides = ed.draft;
  /* One row open at a time keeps the page to a single screen. -1 is "all shut",
     which is where it starts: the list is for finding a slide, not reading it. */
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(slides.length / PER_PAGE));
  /* Deleting the last row of the last page would otherwise strand you on a page
     that no longer exists. */
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = slides.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<HeroSlideValue>) =>
    ed.update(slides.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  /* Moving or deleting a row shifts the indexes under it, so the open row is
     shut rather than left pointing at whichever slide slid into its place. */
  function reorder(next: HeroSlideValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  /* A slide can be moved past the top or bottom of a page. Following it keeps
     "move up" from looking as though the slide vanished. */
  function moveTo(from: number, to: number) {
    reorder(move(slides, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  return (
    <>
      <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-[0.84rem] text-slate-600">
        The photos behind the words, played in this order. The wording itself is
        in the next tab.
      </p>

      <div className="space-y-3">
        {visible.map((slide, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          return (
            <EditorRow
              key={i}
              index={i}
              title={slide.label}
              subtitle={slide.photo.src ? slide.photo.alt : "No photo yet"}
              thumb={slide.photo.src}
              dimmed={!slide.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={slides.length}
                  active={slide.active}
                  onMove={moveTo}
                noun="Hero slide"
                label={slide.label}
                  onToggle={(k) => set(k, { active: !slides[k].active })}
                  onRemove={(k) => reorder(slides.filter((_, x) => x !== k))}
                />
              }
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
                <div>
                  <label className="block">
                    <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                      Slide name
                    </span>
                    <input
                      value={slide.label}
                      onChange={(e) => set(i, { label: e.target.value })}
                      placeholder="e.g. Weddings"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.92rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
                    />
                  </label>
                  <p className="mt-1.5 text-[0.78rem] leading-relaxed text-slate-400">
                    Not shown on the page. It names the slide for screen readers
                    (&ldquo;Photo {i + 1}: {slide.label || "…"}&rdquo;) and
                    labels this row here.
                  </p>
                </div>

                <PhotoField
                  label="Photo"
                  value={slide.photo}
                  onChange={(photo) => set(i, { photo })}
                  folder="hero"
                  withMobile
                  aspect="16 / 9"
                  hint="Full-screen background. Landscape, at least 1920px wide. Set a separate focus point for phones — the crop there is much taller."
                />
              </div>
            </EditorRow>
          );
        })}
      </div>

      <ListPager
        page={current}
        pages={pages}
        total={slides.length}
        onPage={setPage}
        noun="slides"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([...slides, { ...blank }]);
          setOpenRow(slides.length);
          // the new slide goes on the end, so follow it there
          setPage(Math.ceil((slides.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a slide
      </button>

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
