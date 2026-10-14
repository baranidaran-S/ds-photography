/** Moves the soft light and gold edge (globals.css → .gc-tile) to follow the mouse across a tile. */
export function followPointer(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const box = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - box.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - box.top}px`);
}
