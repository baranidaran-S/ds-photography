"use client";

import { HeadingFields, type HeadingValue } from "./HeadingFields";
import { SaveBar } from "./SaveBar";
import { useSettings } from "./useEditor";

/* The words around a list — the label, the heading and the line under it —
   saved into the section's own settings row.

   Sections whose row holds more than a heading (Films keeps its channel link
   there, Instagram its account) have their own editor beside this one: a
   settings row is written whole, so one component has to own all of it. */
export function HeadingEditor<T extends HeadingValue>({
  initial,
  settingKey,
  description,
  withIntro,
  introHint,
}: {
  initial: T;
  settingKey: string;
  description?: string;
  withIntro?: boolean;
  introHint?: string;
}) {
  const ed = useSettings(initial, settingKey);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <HeadingFields
          value={ed.draft}
          onChange={(patch) => ed.update(patch as Partial<T>)}
          description={description}
          withIntro={withIntro}
          introHint={introHint}
        />
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
