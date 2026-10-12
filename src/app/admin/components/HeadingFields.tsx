"use client";

import { Card, TextArea, TextField } from "./Field";

export type HeadingValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  [key: string]: unknown;
};

/* Every section opens the same way, so the fields for it are written once:
   a small label, a heading whose last words are drawn in gold, and a line of
   introduction. */
export function HeadingFields({
  value,
  onChange,
  title = "Section heading",
  description,
  /** the Instagram strip has no paragraph under its heading */
  withIntro = true,
  introHint,
}: {
  value: HeadingValue;
  onChange: (patch: Partial<HeadingValue>) => void;
  title?: string;
  description?: string;
  withIntro?: boolean;
  introHint?: string;
}) {
  return (
    <Card title={title} description={description}>
      <TextField
        label="Small label"
        value={value.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="e.g. Kind words"
        hint="The line in capitals above the heading, beside the lotus."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Heading"
          value={value.title}
          onChange={(t) => onChange({ title: t })}
          placeholder="e.g. Messages we"
        />
        <TextField
          label="Last words, in gold"
          value={value.titleFoil}
          onChange={(titleFoil) => onChange({ titleFoil })}
          placeholder="e.g. treasure"
          hint="Drawn in the gold foil that shimmers."
        />
      </div>
      {withIntro && (
        <TextArea
          label="Intro"
          value={value.intro}
          onChange={(intro) => onChange({ intro })}
          rows={2}
          hint={introHint ?? "The short paragraph beside the heading."}
        />
      )}
    </Card>
  );
}
