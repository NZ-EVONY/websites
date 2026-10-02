// Small helpers shared by templates.
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Plain text of an HTML fragment (used for JSON-LD so it matches the visible text).
export function textOf(html) {
  return String(html).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
// Tile colour classes in display order (coral, sunshine, blue, mint, violet), cycled by index.
export const TILE_COLORS = ["c-coral", "c-sun", "c-blue", "c-mint", "c-violet"];
export const tileColor = i => TILE_COLORS[i % TILE_COLORS.length];
// A decorative letter tile with its point value (the value comes from the engine's scheme).
export function tile(letter, { color = "", size = "", value } = {}) {
  return `<span class="tile${size ? ` ${size}` : ""}${color ? ` ${color}` : ""}" aria-hidden="true">${esc(letter)}${value != null ? `<sup>${esc(value)}</sup>` : ""}</span>`;
}
