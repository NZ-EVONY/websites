// Footer (links, credits, disclaimer, copyright), the definition dialog and the toast.
import { esc } from "./util.mjs";

export const WORDLIST_NOTE = "Words come from the open ENABLE word list. Different games use different dictionaries, so always check the rules of your game.";
export const TRADEMARKS = "Scrabble® is a registered trademark of Hasbro, Inc. in the United States and Canada and of Mattel, Inc. elsewhere. Wordle™ is a trademark of The New York Times Company. Words With Friends is a trademark of Zynga Inc. Letterpile is an independent site and is not affiliated with, endorsed by or sponsored by any of them. Game names are used only to describe the kinds of games these tools can help with.";

export default function footer({ nav, site, year }) {
  return `<footer class="footer">
  <div class="wrap">
    <nav aria-label="All word tools"><div class="cols">${[...nav.main, ...nav.more].map(n => `<a href="${n.href}">${esc(n.label)}</a>`).join("")}</div></nav>
    <nav aria-label="About this site"><div class="cols legal">${nav.legal.map(n => `<a href="${n.href}">${esc(n.label)}</a>`).join("")}
      <!-- CMP: the consent platform re-opens its dialog from this link. Unhide it (remove "hidden") when the CMP is wired in. See docs/BEE-TODO.md -->
      <a href="#" id="privacy-settings-link" hidden>Privacy settings</a></div></nav>
    <p>${WORDLIST_NOTE} The ENABLE list was compiled by M. Cooper and Alan Beale and released into the public domain (<a href="/licenses/enable.txt">ENABLE licence</a>). Definitions on request from the <a href="https://dictionaryapi.dev/" rel="noopener">Free Dictionary API</a>.</p>
    <p class="fine">${TRADEMARKS}</p>
    <p class="fine">© ${year} ${esc(site.brand)}. Site code, design and text © ${esc(site.brand)}; the ENABLE word list is public domain and free to redistribute.</p>
  </div>
</footer>
<dialog class="define" id="defineDialog" aria-labelledby="defineWord">
  <header><h2 id="defineWord"></h2><span class="pts" id="definePts"></span><button type="button" id="defineClose" aria-label="Close">×</button></header>
  <div class="body">
    <p class="hint">In the ENABLE word list. Definitions come from the Free Dictionary API; looking one up sends the word and your IP address to that service.</p>
    <button type="button" class="btn small" id="defineLookup">Look up definition</button>
    <div id="defineResult" aria-live="polite"></div>
    <div class="links">
      <a id="defineWiktionary" href="https://en.wiktionary.org/" target="_blank" rel="noopener">Wiktionary ↗</a>
      <a id="defineMW" href="https://www.merriam-webster.com/" target="_blank" rel="noopener">Merriam-Webster ↗</a>
      <button type="button" class="btn secondary small" id="copyWord">Copy word</button>
    </div>
  </div>
</dialog>
<div class="toast" id="toast" role="status" hidden></div>`;
}
