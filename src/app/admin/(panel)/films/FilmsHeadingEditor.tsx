"use client";

import { HeadingFields } from "../../components/HeadingFields";
import { SaveBar } from "../../components/SaveBar";
import { Card, TextField } from "../../components/Field";
import { useSettings } from "../../components/useEditor";

export type FilmsMetaValue = {
  eyebrow: string;
  title: string;
  titleFoil: string;
  intro: string;
  channelUrl: string;
  channelLabel: string;
  [key: string]: unknown;
};

/* The whole films settings row: the words above the cards and the link out to
   the channel. One editor for the row, because a settings row is written whole
   — saving half of it would wipe the other half. */
export function FilmsHeadingEditor({ initial }: { initial: FilmsMetaValue }) {
  const ed = useSettings(initial, "films");
  const v = ed.draft;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <HeadingFields
          value={v}
          onChange={ed.update}
          description="The words above the film cards."
        />

        <Card title="Link to your channel">
          <TextField
            label="YouTube channel link"
            value={v.channelUrl}
            onChange={(channelUrl) => ed.update({ channelUrl })}
            placeholder="https://www.youtube.com/@yourchannel/videos"
            mono
          />
          <TextField
            label="Button wording"
            value={v.channelLabel}
            onChange={(channelLabel) => ed.update({ channelLabel })}
            placeholder="Watch more on YouTube"
            hint="The button under the last film."
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
