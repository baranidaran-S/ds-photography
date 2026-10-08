"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { move, useEditor } from "../../components/useEditor";

export type InstagramValue = {
  photo: PhotoValue;
  likes: string;
  active: boolean;
};

/* One screenful of collapsed rows. The whole list stays in the draft — this
   only decides which rows are drawn, so Save still writes every photo. */
const PER_PAGE = 10;

const blank: InstagramValue = {
  photo: { src: "", alt: "", position: "50% 50%" },
  likes: "",
  active: true,
};

export function InstagramEditor({ initial }: { initial: InstagramValue[] }) {
  const ed = useEditor(initial, "/api/admin/instagram", "photos");
  const list = ed.draft;
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // deleting the last row of the last page would otherwise strand you there
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = list.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<InstagramValue>) =>
    ed.update(list.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  /* Moving or deleting shifts every index below, so the open row is shut rather
     than left pointing at whichever photo slid into its place. */
  function reorder(next: InstagramValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  /* A photo can be moved past the top or bottom of a page. Following it keeps
     "move up" from looking as though the row vanished. */
  function moveTo(from: number, to: number) {
    reorder(move(list, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  const live = list.filter((p) => p.active && p.photo.src).length;
  const half = Math.ceil(list.length / 2);

  return (
    <>
      <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-[0.84rem] text-slate-600">
        {live} live {live === 1 ? "photo" : "photos"} · top row: 1–{half} ·
        bottom row: {half + 1}–{list.length}
      </p>

      <div className="space-y-3">
        {visible.map((item, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          return (
            <EditorRow
              key={i}
              index={i}
              title={
                item.photo.alt ||
                (item.photo.src ? "No description yet" : "Empty slot")
              }
              /* which of the two gliding rows it lands in, which is what the
                 order on this page actually decides */
              subtitle={[
                i < half ? "Top row" : "Bottom row",
                item.likes && `${item.likes} likes`,
              ]
                .filter(Boolean)
                .join(" · ")}
              thumb={item.photo.src}
              dimmed={!item.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={list.length}
                  active={item.active}
                  onMove={moveTo}
                noun="Photo"
                label={item.photo.alt}
                  onToggle={(x) => set(x, { active: !list[x].active })}
                  onRemove={(x) => reorder(list.filter((_, y) => y !== x))}
                />
              }
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                <PhotoField
                  label="Photo"
                  value={item.photo}
                  onChange={(photo) => set(i, { photo })}
                  folder="instagram"
                  aspect="1 / 1"
                  hint="Square crop. Tapping it opens your Instagram profile."
                />

                <label className="block">
                  <span className="mb-1 block font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                    Likes label
                  </span>
                  <input
                    value={item.likes}
                    onChange={(e) => set(i, { likes: e.target.value })}
                    placeholder="e.g. 1.8k"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.88rem] text-ink placeholder:text-slate-300 focus:border-brand focus:outline-none"
                  />
                  <span className="mt-1 block text-[0.76rem] leading-relaxed text-slate-400">
                    Shown on hover. Just text — it is not pulled from Instagram.
                  </span>
                </label>
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
        noun="photos"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([...list, { ...blank }]);
          setOpenRow(list.length);
          // the new photo goes on the end, so follow it there
          setPage(Math.ceil((list.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a photo
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
