"use client";

import { useState } from "react";
import { EditorRow } from "../../components/EditorRow";
import { ListPager } from "../../components/ListPager";
import { PhotoField, type PhotoValue } from "../../components/PhotoField";
import { RowControls } from "../../components/RowControls";
import { SaveBar } from "../../components/SaveBar";
import { TextField } from "../../components/Field";
import { move, useEditor } from "../../components/useEditor";

export type MessageValue = {
  from: "client" | "studio";
  text: string;
  photo: PhotoValue;
  time: string;
  reaction: string;
};

export type ReviewValue = {
  name: string;
  shoot: string;
  status: string;
  date: string;
  clock: string;
  avatar: PhotoValue;
  messages: MessageValue[];
  active: boolean;
};

/* One screenful of collapsed rows. The whole list stays in the draft - this
   only decides which rows are drawn, so Save still writes every review. */
const PER_PAGE = 10;

const emptyPhoto = (): PhotoValue => ({
  src: "",
  alt: "",
  position: "50% 50%",
});

const blankMessage = (): MessageValue => ({
  from: "client",
  text: "",
  photo: emptyPhoto(),
  time: "",
  reaction: "",
});

const blank = (): ReviewValue => ({
  name: "",
  shoot: "",
  status: "online",
  date: "Today",
  clock: "9:41",
  avatar: emptyPhoto(),
  messages: [blankMessage()],
  active: true,
});

export function ReviewsEditor({ initial }: { initial: ReviewValue[] }) {
  const ed = useEditor(initial, "/api/admin/reviews", "reviews");
  const list = ed.draft;
  // one chat open at a time; a page of six full chat editors was all scrolling
  const [openRow, setOpenRow] = useState(-1);
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  // deleting the last row of the last page would otherwise strand you there
  const current = Math.min(page, pages);
  const start = (current - 1) * PER_PAGE;
  const visible = list.slice(start, start + PER_PAGE);

  const set = (i: number, patch: Partial<ReviewValue>) =>
    ed.update(list.map((r, k) => (k === i ? { ...r, ...patch } : r)));

  /* Moving or deleting shifts every index below, so the open row is shut rather
     than left pointing at whichever chat slid into its place. */
  function reorder(next: ReviewValue[]) {
    setOpenRow(-1);
    ed.update(next);
  }

  /* A review can be moved past the top or bottom of a page. Following it keeps
     "move up" from looking as though the row vanished. */
  function moveTo(from: number, to: number) {
    reorder(move(list, from, to));
    setPage(Math.floor(to / PER_PAGE) + 1);
  }

  const setMsg = (i: number, m: number, patch: Partial<MessageValue>) =>
    set(i, {
      messages: list[i].messages.map((msg, k) =>
        k === m ? { ...msg, ...patch } : msg,
      ),
    });

  return (
    <>
      <div className="space-y-3">
        {visible.map((review, k) => {
          // the real position in the list, which every handler below works on
          const i = start + k;
          return (
            <EditorRow
              key={i}
              index={i}
              title={review.name}
              subtitle={
                review.messages.length === 1
                  ? "1 message"
                  : `${review.messages.length} messages`
              }
              thumb={review.avatar.src}
              dimmed={!review.active}
              open={openRow === i}
              onToggle={() => setOpenRow(openRow === i ? -1 : i)}
              controls={
                <RowControls
                  index={i}
                  count={list.length}
                  active={review.active}
                  onMove={moveTo}
                noun="Review"
                label={review.name}
                  onToggle={(k) => set(k, { active: !list[k].active })}
                  onRemove={(k) => reorder(list.filter((_, x) => x !== k))}
                />
              }
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
                {/* Who the chat is with */}
                <div className="space-y-4">
                  <PhotoField
                    label="Profile picture"
                    value={review.avatar}
                    onChange={(avatar) => set(i, { avatar })}
                    folder="reviews"
                    aspect="1 / 1"
                    hint="Shown as a small circle at the top of the chat."
                  />
                  <TextField
                    label="Contact name"
                    value={review.name}
                    onChange={(name) => set(i, { name })}
                    placeholder="e.g. Ananya & Sourav"
                  />
                  <TextField
                    label="Shoot"
                    value={review.shoot}
                    onChange={(shoot) => set(i, { shoot })}
                    placeholder="e.g. Wedding"
                    hint="Not shown — read out to screen readers so the chat makes sense."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label="Status"
                      value={review.status}
                      onChange={(status) => set(i, { status })}
                      placeholder="online"
                    />
                    <TextField
                      label="Phone clock"
                      value={review.clock}
                      onChange={(clock) => set(i, { clock })}
                      placeholder="9:41"
                      mono
                    />
                  </div>
                  <TextField
                    label="Date chip"
                    value={review.date}
                    onChange={(date) => set(i, { date })}
                    placeholder="Today"
                    hint="The little pill above the first message."
                  />
                </div>

                {/* The chat itself */}
                <div>
                  <p className="mb-2 font-heading text-[0.58rem] font-bold tracking-[0.16em] text-slate-500 uppercase">
                    Messages
                  </p>
                  <div className="space-y-3">
                    {review.messages.map((msg, m) => (
                      <div
                        key={m}
                        className={`rounded-lg border p-3 ${
                          msg.from === "studio"
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-slate-200 bg-slate-50/60"
                        }`}
                      >
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <div className="flex rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
                            {(["client", "studio"] as const).map((who) => (
                              <button
                                key={who}
                                type="button"
                                onClick={() => setMsg(i, m, { from: who })}
                                aria-pressed={msg.from === who}
                                className={`rounded-md px-2.5 py-1 text-[0.72rem] font-medium transition-colors ${
                                  msg.from === who
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-500 hover:text-ink"
                                }`}
                              >
                                {who === "client" ? "They said" : "We replied"}
                              </button>
                            ))}
                          </div>

                          <input
                            value={msg.time}
                            onChange={(e) =>
                              setMsg(i, m, { time: e.target.value })
                            }
                            placeholder="9:12 pm"
                            aria-label="Message time"
                            className="w-24 rounded-md border border-slate-200 px-2 py-1 font-mono text-[0.74rem] focus:border-brand focus:outline-none"
                          />
                          <input
                            value={msg.reaction}
                            onChange={(e) =>
                              setMsg(i, m, { reaction: e.target.value })
                            }
                            placeholder="❤️"
                            aria-label="Reaction emoji"
                            className="w-14 rounded-md border border-slate-200 px-2 py-1 text-center text-[0.84rem] focus:border-brand focus:outline-none"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              set(i, {
                                messages: review.messages.filter(
                                  (_, x) => x !== m,
                                ),
                              })
                            }
                            aria-label="Remove message"
                            className="ml-auto grid size-7 place-items-center rounded-md text-slate-300 transition-colors hover:bg-accent/10 hover:text-accent"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden
                              className="size-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M6 6l12 12M18 6 6 18" />
                            </svg>
                          </button>
                        </div>

                        <textarea
                          value={msg.text}
                          onChange={(e) =>
                            setMsg(i, m, { text: e.target.value })
                          }
                          rows={2}
                          placeholder="What they wrote…"
                          aria-label="Message text"
                          className="w-full rounded-md border border-slate-200 px-2.5 py-2 text-[0.86rem] leading-relaxed focus:border-brand focus:outline-none"
                        />

                        {msg.photo.src ? (
                          <div className="mt-2">
                            <PhotoField
                              label="Photo in this message"
                              value={msg.photo}
                              onChange={(photo) => setMsg(i, m, { photo })}
                              folder="reviews"
                              aspect="4 / 3"
                              hint="Sent inside the chat bubble."
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setMsg(i, m, { photo: emptyPhoto() })
                              }
                              className="mt-1.5 text-[0.76rem] text-slate-400 underline-offset-2 hover:text-accent hover:underline"
                            >
                              Remove photo
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setMsg(i, m, {
                                photo: { ...emptyPhoto(), src: "", alt: "" },
                              })
                            }
                            className="mt-2 text-[0.78rem] text-slate-400 underline-offset-2 hover:text-accent-deep hover:underline"
                          >
                            + Attach a photo to this message
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      set(i, { messages: [...review.messages, blankMessage()] })
                    }
                    className="mt-3 w-full rounded-lg border border-dashed border-slate-300 py-2.5 text-[0.84rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
                  >
                    + Add a message
                  </button>
                </div>
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
        noun="reviews"
      />

      <button
        type="button"
        onClick={() => {
          ed.update([...list, blank()]);
          setOpenRow(list.length);
          // the new review goes on the end, so follow it there
          setPage(Math.ceil((list.length + 1) / PER_PAGE));
        }}
        className="mt-4 w-full rounded-xl border border-dashed border-slate-300 py-4 text-[0.88rem] font-medium text-slate-500 transition-colors hover:border-brand hover:text-accent-deep"
      >
        + Add a review
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
