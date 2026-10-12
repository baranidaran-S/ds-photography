"use client";

import { SaveBar } from "../../components/SaveBar";
import { Card, LinesField, TextArea, TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";

export type HeroCopyValue = {
  eyebrow: string;
  lines: string[];
  foilLine: number;
  sub: string;
  portfolioLabel: string;
  [key: string]: unknown;
};

/** The lines either side of the arch, once the first photo has shrunk into it. */
export type HeroOutroValue = {
  left: string;
  right: string;
  intro: string;
  cta: { label: string; href: string };
  [key: string]: unknown;
};

/* The biggest words on the site. They used to be written into the component,
   which made the headline the one thing the studio could not change. */
export function HeroCopyEditor({
  initial,
  outro,
}: {
  initial: HeroCopyValue;
  outro: HeroOutroValue;
}) {
  const ed = useSettings(initial, "hero");
  const ar = useSettings(outro, "heroOutro");
  const v = ed.draft;
  const o = ar.draft;

  // two settings rows, one Save button
  async function saveBoth() {
    if (ed.dirty) await ed.save();
    if (ar.dirty) await ar.save();
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="The headline"
          description="One line per row. The break points are part of the design, so they are set here rather than left to the width of the window."
        >
          <TextField
            label="Small label"
            value={v.eyebrow}
            onChange={(eyebrow) => ed.update({ eyebrow })}
            placeholder="Weddings · Celebrations · Little ones"
            hint="Shown above the headline, and again beside the arch."
          />
          <LinesField
            label="Headline"
            value={v.lines}
            onChange={(lines) =>
              ed.update({
                lines,
                // a line number left over from a longer headline would lose the gold
                foilLine: Math.min(v.foilLine, Math.max(0, lines.length - 1)),
              })
            }
            rows={4}
            hint="One line per row."
          />
          <div>
            <p className="mb-1 font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
              Which line is gold
            </p>
            <div className="flex flex-wrap gap-1.5">
              {v.lines.map((line, i) => (
                <button
                  key={`${i}-${line}`}
                  type="button"
                  onClick={() => ed.update({ foilLine: i })}
                  aria-pressed={v.foilLine === i}
                  className={`max-w-full truncate rounded-lg px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors ${
                    v.foilLine === i
                      ? "bg-brand text-ink"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {line || `Line ${i + 1}`}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[0.76rem] text-slate-400">
              That line is drawn in the gold foil that shimmers.
            </p>
          </div>
        </Card>

        <Card
          title="Under the headline"
          description="The sentence and the second button. The booking button takes its wording from System Settings, so all four on the site say the same thing."
        >
          <TextArea
            label="Sentence"
            value={v.sub}
            onChange={(sub) => ed.update({ sub })}
            rows={3}
            placeholder="From wedding rituals and baby showers to first birthdays…"
          />
          <TextField
            label="Second button"
            value={v.portfolioLabel}
            onChange={(portfolioLabel) => ed.update({ portfolioLabel })}
            placeholder="View portfolio"
            hint="Scrolls down to the album."
          />
        </Card>

        <Card
          title="Beside the arch"
          description="Once the first photo shrinks into the arch, these lines appear either side of it."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Left of the arch"
              value={o.left}
              onChange={(left) => ar.update({ left })}
              placeholder="Rooted in tradition,"
            />
            <TextField
              label="Right of the arch, in gold"
              value={o.right}
              onChange={(right) => ar.update({ right })}
              placeholder="framed for today."
            />
          </div>
          <TextArea
            label="Short paragraph"
            value={o.intro}
            onChange={(intro) => ar.update({ intro })}
            rows={3}
            hint="Sits under the left line."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Link wording"
              value={o.cta.label}
              onChange={(label) => ar.update({ cta: { ...o.cta, label } })}
              placeholder="Our story"
            />
            <TextField
              label="Where it goes"
              value={o.cta.href}
              onChange={(href) => ar.update({ cta: { ...o.cta, href } })}
              placeholder="#about"
              mono
              hint="A section on the page: #about, #portfolio, #contact."
            />
          </div>
        </Card>
      </div>

      <SaveBar
        dirty={ed.dirty || ar.dirty}
        saving={ed.saving || ar.saving}
        error={ed.error || ar.error}
        saved={ed.saved || ar.saved}
        onSave={saveBoth}
        onReset={() => {
          ed.reset();
          ar.reset();
        }}
      />
    </>
  );
}
