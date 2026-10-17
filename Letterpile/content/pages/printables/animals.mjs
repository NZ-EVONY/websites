// Printable Animal word searches (/printables/animals): three ready-made puzzles from the
// "On Safari" theme (kids, teens, adults), each downloadable as a PDF with its answer key.
import { readyMade, puzzleBlock } from "../../printables.mjs";

export default ctx => {
  const puzzles = readyMade(ctx, "On Safari", "animals");
  const [k, t, a] = puzzles;
  return {
    key: "printable-animals", path: "/printables/animals", file: "printables/animals.html", type: "printable", plain: ["games/ws-core", "games/sd-core", "js/printables"],
    title: "Printable Animal Word Search, Kids to Adults | Letterpile",
    description: "Free printable animal word searches for kids, teens and adults, from our On Safari theme. Download a PDF with the answer key, or make a new one.",
    h1: "Printable animal word searches",
    crumbs: [{ name: "Home", path: "/" }, { name: "Printables", path: "/printables" }, { name: "Animal", path: "/printables/animals" }],
    prose: `<p>Lions, giraffes, zebras and the rest of the savanna: an animal word search is the classic first puzzle for young readers, and a good way to practice spelling the names of animals they already know from books and zoo visits. These puzzles use the On Safari theme, from the big cats to the birds and grasses of the plains.</p>
<p>There are three puzzles below: a ${k.size} × ${k.size} grid for kids with ${k.words.length} short words running across, down or diagonally; a ${t.size} × ${t.size} grid for teens with ${t.words.length} words, some of them backward; and a ${a.size} × ${a.size} grid for adults with ${a.words.length} words in all eight directions. Each PDF has the puzzle on page 1 and the answer key on page 2.</p>
<p>Pair one with a story about a safari or a zoo trip, then have children circle each animal as it comes up in the story.</p>
<div data-printables data-jspdf="${ctx.assets["jspdf/jspdf.umd.min.js"]}">
${puzzles.map(p => puzzleBlock(ctx, p)).join("\n")}
</div>
<p>Want a different one? The <a href="/printables">printable puzzle maker</a> makes a fresh animal word search, or one from any of our other themes, every time you press the button.</p>`,
    faq: [
      { q: "Are these word searches free to print?", a: "Yes. Print as many copies as you like for home or classroom use." },
      { q: "Does every word appear only once?", a: "Yes. Each puzzle is checked so that every listed word appears exactly once in the grid." },
      { q: "Are they safe for a classroom?", a: "Yes. Rude words are never used, and the filler letters are checked so none can be read in any direction." },
      { q: "Can I get a different puzzle?", a: "Use the printable puzzle maker: pick the On Safari theme and an age level, then press Make puzzle." },
    ],
    related: [{ href: "/printables", label: "Printable puzzle maker" }, { href: "/games/wordsearch", label: "Daily Word Search" }, { href: "/lists", label: "Curated word lists" }],
  };
};
