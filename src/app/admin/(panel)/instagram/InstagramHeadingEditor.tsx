"use client";

import { HeadingFields } from "../../components/HeadingFields";
import { SaveBar } from "../../components/SaveBar";
import { Card, TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";

export type InstagramMetaValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  handle: string;
  url: string;
  [key: string]: unknown;
};

/* The whole instagram settings row: the words above the strip and the account
   the photos link to. One editor for the row — it is written whole, so saving
   half of it would wipe the other half. */
export function InstagramHeadingEditor({
  initial,
}: {
  initial: InstagramMetaValue;
}) {
  const ed = useSettings(initial, "instagram");
  const v = ed.draft;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <HeadingFields
          value={v}
          onChange={ed.update}
          description="The words above the gliding photo strip."
          withIntro={false}
        />

        <Card title="Your account">
          <TextField
            label="Handle"
            value={v.handle}
            onChange={(handle) => ed.update({ handle })}
            placeholder="ds_photography"
            hint="Without the @."
          />
          <TextField
            label="Profile link"
            value={v.url}
            onChange={(url) => ed.update({ url })}
            placeholder="https://www.instagram.com/your_handle/"
            mono
            hint="Tapping any photo in the strip opens this."
          />
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
