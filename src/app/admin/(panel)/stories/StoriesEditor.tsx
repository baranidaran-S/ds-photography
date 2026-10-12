"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { TextArea, TextField } from "../../components/Field";
import { move, useEditor } from "../../components/useEditor";

export type StoryValue = {
  category: string;
  title: string;
  place: string;
  date: string;
  note: string;
  cover: PhotoValue;
  photos: [PhotoValue, PhotoValue];
  active: boolean;
};

const emptyPhoto = (): PhotoValue => ({
  src: "",
  alt: "",
  position: "50% 50%",
});

/* One screenful of collapsed rows. The whole list stays in the draft - this
   only decides which rows are drawn, so Save still writes every spread. */
const PER_PAGE = 10;

const blank: StoryValue = {
  category: "",
  title: "",
  place: "",
  date: "",
  note: "",
  cover: emptyPhoto(),
  photos: [emptyPhoto(), emptyPhoto()],
  active: true,
};

export function StoriesEditor({ initial }: { initial: StoryValue[] }) {
  const ed = useEditor(initial, "/api/admin/stories", "stories");
  const list = ed.draft;
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // deleting the last row of the last page would otherwise strand you there
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = list.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<StoryValue>) =>
    ed.update(list.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const setSub = (i: number, slot: 0 | 1, photo: PhotoValue) => {
    const pair = [...list[i].photos] as [PhotoValue, PhotoValue];
    pair[slot] = photo;
    set(i, { photos: pair });
  };

  /* Moving or deleting shifts every index below, so the open row is shut rather
     than left pointing at whichever spread slid into its place. */
  function reorder(next: StoryValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  /* A spread can be moved past the top or bottom of a page. Following it keeps
     "move up" from looking as though the row vanished. */
  function moveTo(from: number, to: number) {
    reorder(move(list, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  return (
    <>
      <div className="space-y-3">
        {visible.map((story, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          return (
            <EditorRow
              key={i}
              index={i}
              title={story.title}
              subtitle={
                [story.category, story.place, story.date]
                  .filter(Boolean)
                  .join(" · ") || "No details yet"
              }
              thumb={story.cover.src || story.photos[0].src}
              dimmed={!story.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={list.length}
                  active={story.active}
                  onMove={moveTo}
                noun="Album spread"
                label={story.title}
                  onToggle={(x) => set(x, { active: !list[x].active })}
                  onRemove={(x) => reorder(list.filter((_, y) => y !== x))}
                />
              }
            >
              <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <TextField
                  label="Category"
                  value={story.category}
                  onChange={(category) => set(i, { category })}
                  placeholder="e.g. Wedding"
                />
                <TextField
                  label="Names"
                  value={story.title}
                  onChange={(title) => set(i, { title })}
                  placeholder="e.g. Ananya & Sourav"
                  hint="An &amp; between two names is shown in maroon."
                />
                <TextField
                  label="Place"
                  value={story.place}
                  onChange={(place) => set(i, { place })}
                  placeholder="e.g. Kolkata"
                />
                <TextField
                  label="Date"
                  value={story.date}
                  onChange={(date) => set(i, { date })}
                  placeholder="e.g. February 2025"
                  hint="Free text — shown exactly as typed."
                />
              </div>

              <div className="mb-5">
                <TextArea
                  label="A line about the day"
                  value={story.note}
                  onChange={(note) => set(i, { note })}
                  rows={2}
                  placeholder="Haldi in the morning, sindoor daan by night…"
                  hint="Hidden on very narrow screens, so keep the names and place doing the work."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <PhotoField
                  label="Full-page photo"
                  value={story.cover}
                  onChange={(cover) => set(i, { cover })}
                  folder="portfolio"
                  withMobile
                  aspect="1 / 1"
                  hint="Fills one whole album page, edge to edge."
                />
                {([0, 1] as const).map((slot) => (
                  <PhotoField
                    key={slot}
                    label={`Small print ${slot + 1}`}
                    value={story.photos[slot]}
                    onChange={(p) => setSub(i, slot, p)}
                    folder="portfolio"
                    aspect="1 / 1"
                    hint="Sits at the foot of the facing page, beside the names."
                  />
                ))}
              </div>
            </EditorRow>
          );
        })}
      </div>

      <ListPager
        page={current}
        pages={pages}
        total={list.length}
        onPage={setPage}
        noun="spreads"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([
            ...list,
            {
              ...blank,
              cover: emptyPhoto(),
              photos: [emptyPhoto(), emptyPhoto()],
            },
          ]);
          setOpenRow(list.length);
          // the new spread goes on the end, so follow it there
          setPage(Math.ceil((list.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a story
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
