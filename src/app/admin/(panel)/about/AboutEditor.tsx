"use client";

import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { SaveBar } from "../../components/SaveBar";
import { Card, LinesField, TextField } from "../../components/Field";
import { HeadingFields } from "../../components/HeadingFields";
import { useSettings } from "../../components/useEditor";

export type Stat = { value: number; suffix: string; label: string };

export type AboutValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  name: string;
  firstName: string;
  role: string;
  story: string[];
  stats: Stat[];
  photo: PhotoValue;
  [key: string]: unknown;
};

export function AboutEditor({ initial }: { initial: AboutValue }) {
  const ed = useSettings(initial, "about");
  const a = ed.draft;

  const setStat = (i: number, patch: Partial<Stat>) =>
    ed.update({
      stats: a.stats.map((s, k) => (k === i ? { ...s, ...patch } : s)),
    });

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <PhotoField
          label="Portrait"
          value={a.photo}
          onChange={(photo) => ed.update({ photo })}
          folder="about"
          aspect="100 / 108"
          hint="Shown through a broken grid of tiles that fly together. Keep the face near the middle — the large centre tile sits there."
        />

        <div className="space-y-4">
          <HeadingFields
            value={a}
            onChange={ed.update}
            description="The words above your story."
            withIntro={false}
          />
          <Card title="Who you are">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Full name"
                value={a.name}
                onChange={(name) => ed.update({ name })}
                placeholder="e.g. Sivakumar"
              />
              <TextField
                label="Signature name"
                value={a.firstName}
                onChange={(firstName) => ed.update({ firstName })}
                placeholder="e.g. Sivakumar"
                hint="Written in handwriting under the story. Usually the first name."
              />
            </div>
            <TextField
              label="Role"
              value={a.role}
              onChange={(role) => ed.update({ role })}
              placeholder="e.g. Founder & lead photographer"
            />
          </Card>

          <Card
            title="Your story"
            description="One paragraph per line. Blank lines are ignored."
          >
            <LinesField
              label="Paragraphs"
              value={a.story}
              onChange={(story) => ed.update({ story })}
              rows={8}
              hint="Two or three paragraphs reads best beside the portrait."
            />
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card
          title="The numbers"
          description="Counted up from zero when a visitor scrolls to them."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {a.stats.map((stat, i) => (
              <div key={i} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-3 flex gap-2">
                  <label className="flex-1">
                    <span className="mb-1 block font-heading text-[0.56rem] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      Number
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={stat.value}
                      onChange={(e) =>
                        setStat(i, { value: Math.max(0, Number(e.target.value) || 0) })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.9rem] tabular-nums focus:border-brand focus:outline-none"
                    />
                  </label>
                  <label className="w-16">
                    <span className="mb-1 block font-heading text-[0.56rem] font-bold tracking-[0.14em] text-slate-500 uppercase">
                      After
                    </span>
                    <input
                      value={stat.suffix}
                      onChange={(e) => setStat(i, { suffix: e.target.value })}
                      placeholder="+"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-center text-[0.9rem] focus:border-brand focus:outline-none"
                    />
                  </label>
                </div>
                <TextField
                  label="Label"
                  value={stat.label}
                  onChange={(label) => setStat(i, { label })}
                  placeholder="e.g. Years behind the lens"
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

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
