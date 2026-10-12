"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { TextField } from "../../components/Field";
import { move, useEditor } from "../../components/useEditor";

export type FilmValue = {
  title: string;
  label: string;
  url: string;
  thumbnail: PhotoValue;
  active: boolean;
};

/* One screenful of collapsed rows. The whole list stays in the draft — this
   only decides which rows are drawn, so Save still writes every film. */
const PER_PAGE = 10;

const blank: FilmValue = {
  title: "",
  label: "",
  url: "",
  thumbnail: { src: "", alt: "", position: "50% 50%" },
  active: true,
};

const YT = /(?:youtu\.be\/|[?&]v=|\/(?:shorts|embed|live)\/)([\w-]{11})/;

export function FilmsEditor({ initial }: { initial: FilmValue[] }) {
  const ed = useEditor(initial, "/api/admin/films", "films");
  const list = ed.draft;
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // deleting the last row of the last page would otherwise strand you there
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = list.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<FilmValue>) =>
    ed.update(list.map((f, k) => (k === i ? { ...f, ...patch } : f)));

  /* Moving or deleting shifts every index below, so the open row is shut rather
     than left pointing at whichever film slid into its place. */
  function reorder(next: FilmValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  function moveTo(from: number, to: number) {
    reorder(move(list, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  return (
    <>
      <div className="space-y-3">
        {visible.map((film, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          const id = film.url.match(YT)?.[1];
          const badLink = film.url.trim() !== "" && !id;

          return (
            <EditorRow
              key={i}
              index={i}
              title={film.title}
              subtitle={
                badLink
                  ? "The YouTube link is not readable"
                  : [i === 0 ? "Large card" : "", film.label]
                      .filter(Boolean)
                      .join(" · ") || (id ? `Video ${id}` : "No film link yet")
              }
              /* an empty thumbnail is normal here: the card falls back to the
                 film's own picture from YouTube */
              thumb={
                film.thumbnail.src ||
                (id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "")
              }
              dimmed={!film.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={list.length}
                  active={film.active}
                  onMove={moveTo}
                noun="Film"
                label={film.title}
                  onToggle={(x) => set(x, { active: !list[x].active })}
                  onRemove={(x) => reorder(list.filter((_, y) => y !== x))}
                />
              }
            >
              <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                <div className="space-y-4">
                  <TextField
                    label="Title"
                    value={film.title}
                    onChange={(title) => set(i, { title })}
                    placeholder="e.g. Aravindh & Thenmozhi"
                  />
                  <TextField
                    label="Caption"
                    value={film.label}
                    onChange={(label) => set(i, { label })}
                    placeholder="e.g. Wedding film · Madurai"
                    hint="The smaller line under the title."
                  />
                  <div>
                    <TextField
                      label="YouTube link"
                      value={film.url}
                      onChange={(url) => set(i, { url })}
                      placeholder="https://www.youtube.com/watch?v=…"
                      mono
                    />
                    <p
                      className={`mt-1 text-[0.78rem] ${
                        badLink ? "text-accent" : "text-slate-400"
                      }`}
                    >
                      {badLink
                        ? "That link has no video id in it. Copy the address straight from YouTube."
                        : id
                          ? `Video id: ${id} — plays in a pop-up on the page.`
                          : "watch?v=, youtu.be/, shorts/ and live/ links all work."}
                    </p>
                  </div>
                </div>

                <PhotoField
                  label="Card picture (optional)"
                  value={film.thumbnail}
                  onChange={(thumbnail) => set(i, { thumbnail })}
                  folder="films"
                  aspect="16 / 9"
                  optional
                  hint="Leave empty to use the film's own YouTube thumbnail. Upload one only if you want a different frame."
                />
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
        noun="films"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([...list, { ...blank }]);
          setOpenRow(list.length);
          setPage(Math.ceil((list.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a film
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
