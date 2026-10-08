"use client";

import { useCallback, useMemo, useState } from "react";

/* Fired on the window after any editor saves. The live preview listens for it
   and reloads; nothing else needs to know the two exist. */
export const SAVED_EVENT = "ds:saved";

/* Shared state for every section editor: holds a working copy, tracks whether it
   differs from what was loaded, and saves the whole thing back in one request. */
export function useEditor<T>(initial: T, endpoint: string, bodyKey: string) {
  const [original, setOriginal] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original],
  );

  const update = useCallback((next: T) => {
    setDraft(next);
    setSaved(false);
    setError("");
  }, []);

  const reset = useCallback(() => {
    setDraft(original);
    setError("");
    setSaved(false);
  }, [original]);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: draft }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Could not save. Please try again.");
        return;
      }

      setOriginal(draft);
      setSaved(true);
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [draft, endpoint, bodyKey]);

  return { draft, update, dirty, saving, error, saved, save, reset };
}

/* Settings save as { key, value } rather than a named list, so they get their own
   wrapper around the same state handling. */
export function useSettings<T extends Record<string, unknown>>(
  initial: T,
  settingKey: string,
) {
  const [original, setOriginal] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(original),
    [draft, original],
  );

  const update = useCallback((patch: Partial<T>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setSaved(false);
    setError("");
  }, []);

  const reset = useCallback(() => {
    setDraft(original);
    setError("");
    setSaved(false);
  }, [original]);

  const save = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: draft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save. Please try again.");
        return;
      }
      setOriginal(draft);
      setSaved(true);
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }, [draft, settingKey]);

  return { draft, update, dirty, saving, error, saved, save, reset };
}

/** Moves an item within a list, returning a new array. */
export function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
