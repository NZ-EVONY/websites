// Printable Seasons word searches (/printables/seasons): three ready-made puzzles from the
// "Four Seasons" theme (kids, teens, adults), each downloadable as a PDF with its answer key.
import { readyMade, puzzleBlock } from "../../printables.mjs";

export default ctx => {
  const puzzles = readyMade(ctx, "Four Seasons", "seasons");
  const [k, t, a] = puzzles;
  return {
    key: "printable-seasons", path: "/printables/seasons", file: "printables/seasons.html", type: "printable", plain: ["games/ws-core", "games/sd-core", "js/printables"],
    title: "Printable Seasons Word Search, Kids to Adults | Letterpile",
    description: "Free printable seasons word searches for kids, teens and adults, from our Four Seasons theme. Download a PDF with the answer key, or make a new one.",
    h1: "Printable seasons word searches",
    crumbs: [{ name: "Home", path: "/" }, { name: "Printables", path: "/printables" }, { name: "Seasons", path: "/printables/seasons" }],
    prose: `<p>Spring blossom, summer sunshine, autumn leaves and winter snowflakes: the seasons are one of the first science topics in school, and their words make a cheerful puzzle. The Four Seasons theme mixes weather, plants and the things people do at each time of year.</p>
<p>There are three puzzles below: a ${k.size} × ${k.size} grid for kids with ${k.words.length} short words running across, down or diagonally; a ${t.size} × ${t.size} grid for teens with ${t.words.length} words, some of them backward; and a ${a.size} × ${a.size} grid for adults with ${a.words.length} words in all eight directions. Each PDF has the puzzle on page 1 and the answer key on page 2.</p>
<p>Once the puzzle is done, ask children to sort the words they found into the four seasons; a few, like umbrella, start a good discussion.</p>
<div data-printables data-jspdf="${ctx.assets["jspdf/jspdf.umd.min.js"]}">
${puzzles.map(p => puzzleBlock(ctx, p)).join("\n")}
</div>
<p>Want a different one? The <a href="/printables">printable puzzle maker</a> makes a fresh seasons word search, or one from any of our other themes, every time you press the button.</p>`,
    faq: [
      { q: "Are these word searches free to print?", a: "Yes. Print as many copies as you like for home or classroom use." },
      { q: "Does every word appear only once?", a: "Yes. Each puzzle is checked so that every listed word appears exactly once in the grid." },
      { q: "Are they safe for a classroom?", a: "Yes. Rude words are never used, and the filler letters are checked so none can be read in any direction." },
      { q: "Can I get a different puzzle?", a: "Use the printable puzzle maker: pick the Four Seasons theme and an age level, then press Make puzzle." },
    ],
    related: [{ href: "/printables", label: "Printable puzzle maker" }, { href: "/games/wordsearch", label: "Daily Word Search" }, { href: "/lists", label: "Curated word lists" }],
  };
};
