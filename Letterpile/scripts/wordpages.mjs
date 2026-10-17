// Word pages (/word/{word}): one static page for each of the most common words of 3 to 8
// letters (SCOWL size 10, visible in ENABLE). Every fact on a page is computed from the word list,
// the engine's letter values and the CMU pronunciations in the same build. Other words are served
// by the lookup page /word?w= (content/pages/word.mjs), which computes the same facts in the browser.
import { fillList } from "./games/crossword.mjs";

const VOWELS = new Set("aeiou");
const num = n => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? n.toLocaleString("en-US");
const plural = (n, one, many = `${one}s`) => `${num(n)} ${n === 1 ? one : many}`;
const cap = t => t[0].toUpperCase() + t.slice(1);

// The words that get a page.
export function wordPageWords(data) {
  const out = [];
  // "index" would collide with the folder's own index; words the site's wording rules keep out of
  // page text (cheat, official, hack, exploit and their forms) get no page.
  const skip = w => w === "index" || /^(cheat|official|hack|exploit)/.test(w);
  for (const [w, lv] of fillList()) if (lv === 10 && w.length >= 3 && w.length <= 8 && data.set.has(w) && !data.blockedSet.has(w) && !skip(w)) out.push(w);
  return out.sort();
}

export function wordPages(ctx, data, words) {
  const { Engine, esc, pron, rhymeTail, syllables, WordTools: T } = ctx;
  const has = new Set(words);
  const visible = new Set(data.clean);
  const ok = w => visible.has(w);
  // Longer words containing each page word as a run of letters, from one pass over the list.
  const containing = new Map(words.map(w => [w, []]));
  for (const v of data.clean) {
    const seen = new Set();
    for (let i = 0; i < v.length; i++) for (let j = i + 3; j <= v.length; j++) {
      if (j - i === v.length) continue;
      const s = v.slice(i, j);
      if (containing.has(s) && !seen.has(s)) { seen.add(s); containing.get(s).push(v); }
    }
  }
  // Rhyme groups from the pronunciations.
  const tails = new Map();
  for (const [w, p] of pron) { const t = rhymeTail(p); if (!tails.has(t)) tails.set(t, []); tails.get(t).push(w); }

  const link = w => (has.has(w) ? `<a href="/word/${w}">${w}</a>` : w);
  const list = ws => `<p class="wordlist">${ws.map(link).join(" ")}</p>`;
  const byLenDesc = (a, b) => b.length - a.length || (a < b ? -1 : 1);
  const commonFirst = (a, b) => T.tier(b) - T.tier(a) || (a < b ? -1 : 1);
  const startsPages = new Set(ctx.pages.filter(p => p.path.startsWith("/words-starting-with/")).map(p => p.path));
  const endsPages = new Set(ctx.pages.filter(p => p.path.startsWith("/words-ending-in/")).map(p => p.path));

  return words.map(w => {
    const W = w.toUpperCase();
    const pts = Engine.score(w, "scrabble"), wwf = Engine.score(w, "wwf");
    const values = Engine.SCHEMES.scrabble.values;
    const top = [...new Set(w)].sort((a, b) => values[b] - values[a])[0];
    const vowels = [...w].filter(c => VOWELS.has(c)).length;
    const counts = {};
    for (const c of w) counts[c] = (counts[c] || 0) + 1;
    const repeats = Object.entries(counts).filter(([, n]) => n > 1).map(([c, n]) => `${c.toUpperCase()} ${n === 2 ? "twice" : `${num(n)} times`}`);
    const anagrams = Engine.anagrams(w).exact.filter(x => x !== w && ok(x)).sort();
    const inside = Engine.unscramble(w).map(x => x.word).filter(x => x.length >= 3 && x.length < w.length && ok(x)).sort((a, b) => b.length - a.length || commonFirst(a, b));
    const longer = containing.get(w).sort((a, b) => a.length - b.length || commonFirst(a, b));
    const front = [..."abcdefghijklmnopqrstuvwxyz"].map(l => l + w).filter(ok);
    const back = [..."abcdefghijklmnopqrstuvwxyz"].map(l => w + l).filter(ok);
    const p = pron.get(w);
    const syl = p ? syllables(p) : 0;
    const rhymes = p ? (tails.get(rhymeTail(p)) || []).filter(x => x !== w && ok(x)).sort(commonFirst) : [];
    const n = w.length;
    const rev = [...w].reverse().join("");

    const sections = [];
    sections.push(`<p><b>${W}</b> is ${n === 8 ? "an" : "a"} ${n}-letter word in the ENABLE word list, and one of the most common words in English. It has ${plural(vowels, "vowel")} and ${plural(n - vowels, "consonant")}${repeats.length ? `, with ${repeats.join(" and ")}` : ""}${syl ? `, and ${plural(syl, "syllable")} when spoken` : ""}. It starts with ${w[0].toUpperCase()} and ends with ${w.at(-1).toUpperCase()}; spelled backward it reads <code>${rev.toUpperCase()}</code>${rev !== w && ok(rev) ? ", which is also a word" : ""}.</p>`);
    sections.push(`<table><tr><th>Letters</th><td>${n}</td></tr><tr><th>Points, common tile values</th><td>${pts}</td></tr><tr><th>Points, Words With Friends values</th><td>${wwf}</td></tr><tr><th>Anagrams</th><td>${anagrams.length}</td></tr><tr><th>Shorter words inside it</th><td>${inside.length}</td></tr><tr><th>Longer words containing it</th><td>${longer.length}</td></tr><tr><th>Hooks (front / back)</th><td>${front.length} / ${back.length}</td></tr>${syl ? `<tr><th>Syllables</th><td>${syl}</td></tr>` : ""}</table>`);
    sections.push(`<h2>Points</h2><p>${W} scores ${pts} with common tile values (${top.toUpperCase()} is worth ${values[top]}) and ${wwf} with Words With Friends values, or ${pts * 2} and ${wwf * 2} on a double word square.</p>`);
    sections.push(`<h2>Anagrams of ${W}</h2>${anagrams.length ? `<p>${anagrams.length === 1 ? `One other word uses exactly the letters of ${W}:` : `${cap(plural(anagrams.length, "other word"))} use exactly the letters of ${W}:`}</p>${list(anagrams)}` : `<p>No other word in the list uses exactly the letters ${[...w].sort().join("-").toUpperCase()}, so ${W} has no anagrams.</p>`}`);
    sections.push(`<h2>Words made from the letters of ${W}</h2>${inside.length ? `<p>Using some of the letters of ${W}, each no more often than it appears, gives ${plural(inside.length, "shorter word")} of three or more letters${inside.length > 1 ? `, the longest being <code>${inside[0].toUpperCase()}</code>` : ""}.${inside.length > 120 ? " The 120 longest are listed." : ""}</p>${list(inside.slice(0, 120))}` : `<p>No shorter word of three or more letters can be made from the letters of ${W}.</p>`}`);
    sections.push(`<h2>Longer words containing ${W}</h2>${longer.length ? `<p>${cap(plural(longer.length, "longer word"))} contain${longer.length === 1 ? "s" : ""} ${W} as an unbroken run of letters${longer.length > 80 ? "; here are the 80 shortest, everyday words first within each length" : ""}.</p>${list(longer.slice(0, 80))}` : `<p>No longer word in the list contains ${W} as an unbroken run of letters.</p>`}`);
    sections.push(`<h2>Hooks</h2>${front.length || back.length ? `<p>${W} takes ${plural(front.length, "front hook")}${front.length ? ` (${front.map(x => x[0].toUpperCase()).join(" ")})` : ""} and ${plural(back.length, "back hook")}${back.length ? ` (${back.map(x => x.at(-1).toUpperCase()).join(" ")})` : ""}:</p>${list([...front, ...back])}` : `<p>No single letter added to either end of ${W} makes another word.</p>`}`);
    if (p) sections.push(`<h2>Rhymes</h2>${rhymes.length ? `<p>${cap(plural(rhymes.length, "word"))} in the list rhyme${rhymes.length === 1 ? "s" : ""} with ${W} in American English${rhymes.length > 40 ? "; these are 40 of them, the most common first" : ""}.</p>${list(rhymes.slice(0, 40))}` : `<p>No word in our pronunciation list is a perfect rhyme for ${W}; the <a href="/rhyming-words">Rhyming Words Finder</a> shows near rhymes.</p>`}`);
    sections.push(`<h2>Definition</h2><p><button type="button" class="word plain" data-word="${w}">Look up ${W}</button></p>`);

    const first = `/words-starting-with/${w[0]}`, last = `/words-ending-in/${w.at(-1)}`;
    const related = [
      { href: "/", label: "Word Unscrambler" },
      { href: "/anagram-solver", label: "Anagram Solver (two-word anagrams too)" },
      ...(p ? [{ href: "/rhyming-words", label: "Rhyming Words Finder" }] : []),
      ...(startsPages.has(first) ? [{ href: first, label: `Words starting with ${w[0].toUpperCase()}` }] : []),
      ...(endsPages.has(last) ? [{ href: last, label: `Words ending in ${w.at(-1).toUpperCase()}` }] : []),
      { href: `/words-by-length/${n}-letter-words`, label: `${n}-letter words` },
    ];
    let description = `${W}: ${pts} points, ${anagrams.length} anagram${anagrams.length === 1 ? "" : "s"}, ${front.length + back.length} hook${front.length + back.length === 1 ? "" : "s"} and ${inside.length} shorter word${inside.length === 1 ? "" : "s"} inside it, plus longer words that contain it${p ? " and rhymes" : ""}.`;
    if (description.length > 155) description = description.slice(0, 152).replace(/\s+\S*$/, "") + "…";
    return {
      key: `word-${w}`, path: `/word/${w}`, file: `word/${w}.html`, type: "word", source: "scripts/wordpages.mjs",
      title: `${W}: Points, Anagrams, Hooks and More | Letterpile`,
      description,
      h1: W,
      crumbs: [{ name: "Home", path: "/" }, { name: "Word pages", path: "/word" }, { name: W, path: `/word/${w}` }],
      prose: sections.join("\n"),
      related,
      updated: ctx.wordsUpdated,
    };
  });
}
