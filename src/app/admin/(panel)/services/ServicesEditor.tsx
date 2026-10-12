"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { TextField } from "../../components/Field";
import { move, useEditor } from "../../components/useEditor";

export type ServiceValue = {
  name: string;
  wide: PhotoValue;
  tall: PhotoValue;
  exif: { lens: string; aperture: string; shutter: string; iso: string };
  active: boolean;
};

/* One screenful of collapsed rows. The whole list stays in the draft — this
   only decides which rows are drawn, so Save still writes every service. */
const PER_PAGE = 10;

const blank: ServiceValue = {
  name: "",
  wide: { src: "", alt: "", position: "50% 50%" },
  tall: { src: "", alt: "", position: "50% 50%" },
  exif: { lens: "50mm", aperture: "f/2.8", shutter: "1/250", iso: "ISO 400" },
  active: true,
};

export function ServicesEditor({ initial }: { initial: ServiceValue[] }) {
  const ed = useEditor(initial, "/api/admin/services", "services");
  const list = ed.draft;
  // one row open at a time; a page of six full editors was all scrolling
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // deleting the last row of the last page would otherwise strand you there
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = list.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<ServiceValue>) =>
    ed.update(list.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  /* Moving or deleting shifts every index below, so the open row is shut rather
     than left pointing at whichever service slid into its place. */
  function reorder(next: ServiceValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  /* A service can be moved past the top or bottom of a page. Following it keeps
     "move up" from looking as though the row vanished. */
  function moveTo(from: number, to: number) {
    reorder(move(list, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  return (
    <>
      <div className="space-y-3">
        {visible.map((svc, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          return (
            <EditorRow
              key={i}
              index={i}
              title={svc.name}
              subtitle={
                svc.wide.src && svc.tall.src
                  ? svc.wide.alt || "Both photos set"
                  : svc.wide.src || svc.tall.src
                    ? "Only one of the two photos is set"
                    : "No photos yet"
              }
              thumb={svc.wide.src || svc.tall.src}
              dimmed={!svc.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={list.length}
                  active={svc.active}
                  onMove={moveTo}
                noun="Service"
                label={svc.name}
                  onToggle={(x) => set(x, { active: !list[x].active })}
                  onRemove={(x) => reorder(list.filter((_, y) => y !== x))}
                />
              }
            >
              <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_2fr]">
                <TextField
                  label="Service name"
                  value={svc.name}
                  onChange={(name) => set(i, { name })}
                  placeholder="e.g. Weddings"
                  hint="Shown large over the photo, and in the menu and footer."
                />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["lens", "Lens"],
                      ["aperture", "Aperture"],
                      ["shutter", "Shutter"],
                      ["iso", "ISO"],
                    ] as const
                  ).map(([field, label]) => (
                    <TextField
                      key={field}
                      label={label}
                      mono
                      value={svc.exif[field]}
                      onChange={(v) =>
                        set(i, { exif: { ...svc.exif, [field]: v } })
                      }
                    />
                  ))}
                  <p className="col-span-full -mt-1 text-[0.76rem] text-slate-400">
                    Decorative camera readout in the viewfinder corner. Any text
                    works.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <PhotoField
                  label="Wide photo — tablets & computers"
                  value={svc.wide}
                  onChange={(wide) => set(i, { wide })}
                  folder="services"
                  aspect="3 / 2"
                  hint="Landscape. Also used for this service's thumbnail on larger screens."
                />
                <PhotoField
                  label="Tall photo — phones"
                  value={svc.tall}
                  onChange={(tall) => set(i, { tall })}
                  folder="services"
                  aspect="4 / 5"
                  hint="Portrait. The same file can be used for both if you only have one."
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
        noun="services"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([...list, { ...blank }]);
          setOpenRow(list.length);
          // the new service goes on the end, so follow it there
          setPage(Math.ceil((list.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a service
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
