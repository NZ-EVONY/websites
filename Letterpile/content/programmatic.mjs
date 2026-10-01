// Copy templates for the generated word-list pages. Facts are passed in from
// scripts/pagegen.mjs; each sentence slot has several phrasings, picked by the page key,
// so neighboring pages don't read the same. Edit freely; keep every number a ${f(...)}.
import { stats, wordList } from "../scripts/pagegen.mjs";

const up = s => s.toUpperCase();
const n0 = n => n.toLocaleString("en-US");

export function renderNode(node, tree, ctx) {
  const { fact: f, code, listOf, shareText, score, set, pick } = tree.helpers;
  const fam = node.family;
  const K = fam === "length" ? `${node.n}:${node.prefix || ""}` : node.key;
  const s = stats(node.words, { family: fam, key: node.key, set, score });
  const P = (slot, opts) => pick(node.path, slot, opts);
  const isOverview = !!node.children;

  // ---------- names ----------
  let h1, what, short;
  if (fam === "length") {
    h1 = node.prefix ? `${node.n}-Letter Words Starting With ${up(node.prefix)}` : `${node.n}-Letter Words`;
    what = node.prefix ? `${node.n}-letter words that start with ${code(node.prefix)}` : `words with exactly ${node.n} letters`;
    short = node.prefix ? `${node.n}-letter ${up(node.prefix)} words` : `${node.n}-letter words`;
  } else if (fam === "starts") {
    h1 = `Words Starting With ${up(node.key)}`;
    what = `words that start with ${code(node.key)}`;
    short = `${up(node.key)}- words`;
  } else {
    h1 = `Words Ending In ${up(node.key)}`;
    what = `words that end in ${code(node.key)}`;
    short = `-${up(node.key)} words`;
  }

  // ---------- intro (varied phrasing, computed facts) ----------
  const count = f("count", s.count, n0(s.count));
  const pct = f("share", shareText(s.count), `${shareText(s.count)}%`);
  // data-value is "length:how many words have that length" (compact, and recomputable).
  const longest = f("longest", `${s.maxLen}:${s.longest.length}`, listOf(s.longest, 3));
  const shortest = f("shortest", `${s.minLen}:${s.shortest.length}`, listOf(s.shortest, 3));
  const topw = f("topscore", `${s.top}:${s.topScore}`, `${code(s.top)} (${s.topScore} points)`);
  const distinct = f("distinct", s.distinct, n0(s.distinct));

  const open = P("open", [
    `The open ENABLE word list has ${count} ${what}, about ${pct} of the ${n0(tree.total)} words this site shows.`,
    `There are ${count} ${what} in the ENABLE list, which is roughly ${pct} of the words Letterpile uses.`,
    `Counting only the ENABLE word list, ${count} entries are ${what}. That is about ${pct} of the list.`,
    `${count} of the ${n0(tree.total)} ENABLE words shown on this site are ${what} (about ${pct}).`,
  ]);
  const span = s.maxLen === s.minLen
    ? P("span1", [`All of them have the same length, so they differ only in their letters.`, `Every word here is the same length.`])
    : P("span", [
      `The longest ${s.longest.length > 1 ? "are" : "is"} ${longest}; the shortest ${s.shortest.length > 1 ? "are" : "is"} ${shortest}.`,
      `They run from ${shortest} at the short end to ${longest} at the long end.`,
      `Lengths range from ${s.minLen} letters (${shortest}) to ${s.maxLen} (${longest}).`,
    ]);
  const scoreLine = P("score", [
    `Using commonly used tile values, ${topw} scores the most.`,
    `The highest base score belongs to ${topw}, using commonly used tile values.`,
    `By common tile values the top scorer is ${topw}; board bonuses aren't counted.`,
  ]);
  const distinctLine = P("distinct", [
    `${distinct} of them use no letter twice, which matters in games where every tile is separate.`,
    `${distinct} have no repeated letter at all.`,
    `Words with no repeated letter: ${distinct}.`,
  ]);
  const caveat = P("caveat", [
    `Different games use different dictionaries, so check your game's rules before relying on a word.`,
    `Games use their own dictionaries, so a word here isn't automatically playable everywhere.`,
    `This is a general word list, not any game's official one; always check the rules of your game.`,
  ]);
  const intro = `<p>${open} ${span} ${scoreLine} ${distinctLine} ${caveat}</p>`;

  // ---------- neighbor table ----------
  const nbTitle = fam === "starts" ? `Most common next letter after ${up(node.key)}` : fam === "ends" ? `Most common letter before ${up(node.key)}` : "Most common first letters";
  const nbTable = s.neighbors.length ? `<h2>${nbTitle}</h2>
<table><tr><th>Letter</th><th>Words</th></tr>${s.neighbors.map(([c, n]) => `<tr><td>${up(c)}</td><td>${n0(n)}</td></tr>`).join("")}</table>` : "";

  // ---------- observations (at least three, all computed) ----------
  const obs = [];
  const pal = s.palindromes;
  obs.push(pal.length
    ? `${f("palindromes", pal.length, n0(pal.length))} ${pal.length === 1 ? "reads" : "read"} the same backward and forward, such as ${listOf(pal, 3)}.`
    : `${f("palindromes", 0, "None")} of these words is a palindrome (the same backward and forward).`);
  if (fam === "starts" && s.stems.length) obs.push(`${f("stems", s.stems.length, n0(s.stems.length))} still form a word when the leading ${code(node.key)} is removed, for example ${listOf(s.stems.slice(0, 5).map(w => w), 5)} → ${listOf(s.stems.slice(0, 5).map(w => w.slice(node.key.length)), 5)}.`);
  if (fam === "ends" && s.stems.length) obs.push(`${f("stems", s.stems.length, n0(s.stems.length))} leave another word when the final ${code(node.key)} is taken off, for example ${listOf(s.stems.slice(0, 5), 5)} → ${listOf(s.stems.slice(0, 5).map(w => w.slice(0, -node.key.length)), 5)}.`);
  if (s.topEnds.length && fam !== "ends") obs.push(`The most common endings here are ${s.topEnds.map(([e, n]) => `${code("-" + e)} (${n0(n)})`).join(", ")}.`);
  const vc = Object.entries(s.vowelCounts).sort((a, b) => b[1] - a[1])[0];
  obs.push(`The most common number of vowels (A, E, I, O, U) is ${vc[0]}, found in ${n0(vc[1])} of these words.`);
  obs.push(`The average length is ${s.avgLen.toFixed(1)} letters.`);
  if (s.neighbors[0]) obs.push(fam === "length"
    ? `More of them start with ${code(s.neighbors[0][0])} than with any other letter (${n0(s.neighbors[0][1])}).`
    : fam === "starts" ? `After ${up(node.key)}, the letter ${code(s.neighbors[0][0])} comes next most often (${n0(s.neighbors[0][1])} words).`
      : `Before ${up(node.key)}, the letter ${code(s.neighbors[0][0])} appears most often (${n0(s.neighbors[0][1])} words).`);

  // ---------- the words ----------
  const groupBy = fam === "length" ? (w => w[(node.prefix || "").length] || "") : (w => w.length);
  const groupLabel = fam === "length" ? (g => node.prefix ? `${up(node.prefix)}${up(g)}…` : `Starting with ${up(g)}`) : (g => `${g} letters`);
  let wordsHtml;
  if (!isOverview) {
    wordsHtml = `<h2>All ${short}</h2>\n${wordList(node.words, groupBy, groupLabel)}`;
  } else {
    const kids = node.children.map(c => `<li><a href="${c.path}">${childLabel(c)}</a> <span class="count">${n0(c.words.length)}</span></li>`).join("");
    const step = Math.max(1, Math.floor(node.words.length / 150));
    const sample = node.words.filter((_, i) => i % step === 0).slice(0, 150);
    wordsHtml = `<h2>${P("browse", ["Browse the full lists", "Choose a narrower list", "Open a smaller list"])}</h2>
<p>With ${n0(s.count)} words, this list is split into smaller pages${fam === "length" ? " by the next letter" : fam === "starts" ? " by the next letter" : " by the letter before"}. Each page shows its complete list.</p>
<ul class="link-cols">${kids}</ul>
${node.folded.length ? `<h2>Other ${short}</h2>\n<p>These groups are too small for a page of their own, so they are listed here in full.</p>\n${wordList(node.folded, groupBy, groupLabel)}` : ""}
<h2>A sample of ${short}</h2>
<p>An evenly spaced sample of ${n0(sample.length)} words in alphabetical order (every ${n0(step)}${step === 1 ? "" : "th"} word), to give a feel for the list.</p>
<p class="wordlist">${sample.join(" ")}</p>`;
  }

  // ---------- using the words ----------
  const ex = node.words.find(w => w.length >= 5 && w.length <= 8 && new Set(w).size === w.length) || node.words[0];
  const scr = [...ex].sort().join("");
  const use = fam === "length"
    ? P("use", [
      `To find ${node.n}-letter words in your own letters, use the <a href="/">Word Unscrambler</a> and set <b>Length</b> to ${node.n} under Advanced filters. For example, the letters ${code(scr)} include ${code(ex)}.`,
      `Have a rack or a jumble? The <a href="/">Word Unscrambler</a> can limit results to ${node.n} letters with its Length filter: entering ${code(scr)} would find ${code(ex)} among others.`,
    ])
    : fam === "starts"
      ? `To find words that start with ${code(node.key)} using only your letters, open the <a href="/">Word Unscrambler</a>, enter your letters and type ${code(node.key)} in <b>Starts with</b>. For a known pattern, the <a href="/crossword-solver">Crossword Solver</a> accepts ${code(node.key + "???")}-style patterns.`
      : `To find words ending in ${code(node.key)} from your own letters, use the <a href="/">Word Unscrambler</a> with ${code(node.key)} in <b>Ends with</b>, or try a pattern such as ${code("???" + node.key)} in the <a href="/crossword-solver">Crossword Solver</a>.`;

  // ---------- related ----------
  const rel = [];
  const root = tree.families[fam].root;
  if (node.parent) rel.push([node.parent.path, `All ${nodeShort(node.parent)}`]);
  rel.push([root.path, root.name]);
  const sibs = (node.parent ? node.parent.children : tree.nodes.filter(n => n.family === fam && !n.parent && !n.standalone)) || [];
  const i = sibs.indexOf(node);
  if (i > 0) rel.push([sibs[i - 1].path, nodeShort(sibs[i - 1])]);
  if (i >= 0 && i < sibs.length - 1) rel.push([sibs[i + 1].path, nodeShort(sibs[i + 1])]);
  if (node.curated) rel.push(["/guides/hooks-prefixes-and-suffixes", "Hooks, Prefixes and Suffixes"]);

  const curated = node.curated ? `<h2>About ${node.curated.type === "prefix" ? "the prefix" : "the suffix"} ${node.curated.type === "prefix" ? up(node.key) + "-" : "-" + up(node.key)}</h2>\n${node.curated.html}` : "";

  const prose = `<div class="wl" data-kind="${fam}" data-key="${K}">
${intro}
${curated}
<!--@slot after-intro-->
<h2>At a glance</h2>
<table>
<tr><th>Fact</th><th>Value</th></tr>
<tr><td>Words in this list</td><td>${n0(s.count)}</td></tr>
<tr><td>Share of the ENABLE list shown on this site</td><td>${shareText(s.count)}%</td></tr>
<tr><td>Longest</td><td>${listOf(s.longest, 3)}</td></tr>
<tr><td>Shortest</td><td>${listOf(s.shortest, 3)}</td></tr>
<tr><td>Highest base score (common values)</td><td>${code(s.top)}, ${s.topScore}</td></tr>
<tr><td>No repeated letters</td><td>${n0(s.distinct)}</td></tr>
</table>
${nbTable}
<h2>${P("obs", ["Useful observations", "Patterns in this list", "What stands out"])}</h2>
<ul>${obs.map(o => `<li>${o}</li>`).join("")}</ul>
${wordsHtml}
<h2>Using these words</h2>
<p>${use} ${ctx.WORDLIST_NOTE}</p>
<h2>Related lists</h2>
<ul class="related-list">${rel.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("")}</ul>
</div>`;

  const titleBase = h1;
  const desc = clip(`All ${n0(s.count)} ${stripTags(what)} in the open ENABLE word list${isOverview ? ", split into smaller lists" : ""}, with the longest, top-scoring and pattern facts.`, 155);
  return {
    key: `wl-${fam}-${K}`, path: node.path, file: node.path.slice(1) + ".html", type: node.curated ? "affix" : "programmatic", template: !node.curated,
    title: `${titleBase} | Letterpile`, description: desc, h1, prose, kind: fam,
    crumbs: crumbsFor(node, tree),
    wordsListed: isOverview ? [...node.folded] : [...node.words],
  };
}

function stripTags(s) { return s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, ""); }
function clip(s, n) { return s.length <= n ? s : s.slice(0, n - 1).replace(/[ ,]+[^ ]*$/, "") + "."; }
export function nodeShort(n) {
  if (n.family === "length") return n.prefix ? `${n.n}-letter words starting with ${up(n.prefix)}` : `${n.n}-letter words`;
  return n.family === "starts" ? `words starting with ${up(n.key)}` : `words ending in ${up(n.key)}`;
}
function childLabel(c) {
  if (c.family === "length") return `${up(c.prefix)}…`;
  return c.family === "starts" ? `${up(c.key)}…` : `…${up(c.key)}`;
}
function crumbsFor(node, tree) {
  const chain = [];
  for (let n = node; n; n = n.parent) chain.unshift(n);
  const root = tree.families[node.family].root;
  return [{ name: "Home", path: "/" }, { name: root.name, path: root.path },
    ...chain.map(n => ({ name: n.family === "length" ? (n.prefix ? up(n.prefix) : `${n.n} letters`) : up(n.key), path: n.path }))];
}
