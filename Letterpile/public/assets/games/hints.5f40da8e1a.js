(function () {
  "use strict";
  const G = window.Games, list = document.getElementById("hintList");
  if (!G || !list) return;
  const VOWELS = "aeiou";
  const n = k => ["no", "one", "two", "three", "four", "five"][k];

  function hints(a) {
    const vowels = [...a].filter(c => VOWELS.includes(c)).length;
    const repeat = [...new Set(a)].length < 5;
    const counts = {};
    for (const c of a) counts[c] = (counts[c] || 0) + 1;
    const twice = Object.keys(counts).filter(c => counts[c] > 1).map(c => c.toUpperCase());
    return [
      { label: "How many vowels?", text: `The word has ${n(vowels)} vowel${vowels === 1 ? "" : "s"} (A, E, I, O or U)${a.includes("y") ? ", and it contains a Y" : ""}.` },
      { label: "Any repeated letters?", text: repeat ? `Yes: ${twice.join(" and ")} appear${twice.length === 1 ? "s" : ""} more than once.` : "No. All five letters are different." },
      { label: "First letter", text: `It starts with ${a[0].toUpperCase()}.` },
      { label: "Last letter", text: `It ends with ${a[4].toUpperCase()}.` },
      { label: "Show the answer", text: `Today's word is ${a.toUpperCase()}.`, answer: true },
    ];
  }

  G.open("word").then(res => {
    if (!res.puzzle) { G.comeBackSoon(list.parentElement); return; }
    const a = G.decode(res.puzzle.a, `word:${res.date}`);
    list.innerHTML = hints(a).map((h, i) => `<li class="hint"><button type="button" class="btn ${h.answer ? "" : "secondary "}small" aria-expanded="false" aria-controls="hint${i}">${h.label}</button><p id="hint${i}" class="hint-text" hidden>${h.text}</p></li>`).join("");
    list.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b) return;
      const p = document.getElementById(b.getAttribute("aria-controls"));
      p.hidden = false;
      b.setAttribute("aria-expanded", "true");
      b.disabled = true;
    });
    document.getElementById("game").dataset.ready = "1";
  });
})();
