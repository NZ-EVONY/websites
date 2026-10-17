// Printable Holiday word searches (/printables/holidays): three ready-made puzzles from the
// "Holidays" theme (kids, teens, adults), each downloadable as a PDF with its answer key.
import { readyMade, puzzleBlock } from "../../printables.mjs";

export default ctx => {
  const puzzles = readyMade(ctx, "Holidays", "holidays");
  const [k, t, a] = puzzles;
  return {
    key: "printable-holidays", path: "/printables/holidays", file: "printables/holidays.html", type: "printable", plain: ["games/ws-core", "games/sd-core", "js/printables"],
    title: "Printable Holiday Word Search, Kids to Adults | Letterpile",
    description: "Free printable holiday word searches for kids, teens and adults, from our Holidays theme. Download a PDF with the answer key, or make a new one.",
    h1: "Printable holiday word searches",
    crumbs: [{ name: "Home", path: "/" }, { name: "Printables", path: "/printables" }, { name: "Holiday", path: "/printables/holidays" }],
    prose: `<p>Holidays bring their own vocabulary: costumes and pumpkins in the fall, candles and wreaths in winter, fireworks and parades whenever there's something to celebrate. This set covers holidays from around the year and around the world, so the same puzzle works in October, December or spring.</p>
<p>There are three puzzles below: a ${k.size} × ${k.size} grid for kids with ${k.words.length} short words running across, down or diagonally; a ${t.size} × ${t.size} grid for teens with ${t.words.length} words, some of them backward; and a ${a.size} × ${a.size} grid for adults with ${a.words.length} words in all eight directions. Each PDF has the puzzle on page 1 and the answer key on page 2.</p>
<p>Use one as a quiet activity at a class party, or tuck a printed copy into a holiday card for a child.</p>
<div data-printables data-jspdf="${ctx.assets["jspdf/jspdf.umd.min.js"]}">
${puzzles.map(p => puzzleBlock(ctx, p)).join("\n")}
</div>
<p>Want a different one? The <a href="/printables">printable puzzle maker</a> makes a fresh holiday word search, or one from any of our other themes, every time you press the button.</p>`,
    faq: [
      { q: "Are these word searches free to print?", a: "Yes. Print as many copies as you like for home or classroom use." },
      { q: "Does every word appear only once?", a: "Yes. Each puzzle is checked so that every listed word appears exactly once in the grid." },
      { q: "Are they safe for a classroom?", a: "Yes. Rude words are never used, and the filler letters are checked so none can be read in any direction." },
      { q: "Can I get a different puzzle?", a: "Use the printable puzzle maker: pick the Holidays theme and an age level, then press Make puzzle." },
    ],
    related: [{ href: "/printables", label: "Printable puzzle maker" }, { href: "/games/wordsearch", label: "Daily Word Search" }, { href: "/lists", label: "Curated word lists" }],
  };
};
