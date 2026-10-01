# Letterpile: word game helper

A static word-tools site in the style of wordunscrambler.net, with its own branding, design and text. Ten pages share one word engine and one dictionary, and it runs entirely in the browser.

## Pages

| Menu | Page | What it does |
|---|---|---|
| Word Unscrambler | `index.html` | Every word in your letters, grouped by length. `?` blanks; starts-with, ends-with, contains, length and use-every-letter filters |
| Word Scrambler | `word-scrambler.html` | Scrambles text five ways, with up to 10 versions at once, plus an unscramble challenge game with hints and a streak counter |
| Word Combiner | `word-combiner.html` | Blends 2–4 words into portmanteaus (breakfast + lunch → brunch), with real-word blends listed first |
| Scrabble Word Finder | `scrabble-word-finder.html` | Plays for your rack ranked by Scrabble points: blanks score 0, 50-point bingo, board letters to build through |
| More ▸ Words With Friends | `words-with-friends.html` | The same finder with Words With Friends letter values and its 35-point all-tiles bonus |
| More ▸ Wordle Solver | `wordle-solver.html` | Tap tiles to set colours; handles repeated letters correctly, ranks the best next guess, supports 4–8 letter variants |
| More ▸ Anagram Solver | `anagram-solver.html` | Single-word and two-word anagrams (dormitory → dirty room) |
| More ▸ Jumble Solver | `jumble-solver.html` | Solves up to 8 jumbled words at once, plus the final circled-letters phrase |
| More ▸ Crossword Solver | `crossword-solver.html` | Pattern search (`C?O?S`) with must-include and exclude letters |
| More ▸ Text Twist & Wordscapes | `text-twist-solver.html` | 3+ letter words from a letter wheel, with slot patterns and a shuffle button |

Every page also has:
- A shareable URL: results are saved in the link.
- Tap any word for its definition and point value.
- Light and dark themes.
- A layout that works on phones.

## Run it

Double-click `index.html`. There's no server, build step or install. The dictionary loads as a script, so the site works from `file://`.

To host it, upload the folder to any static host: GitHub Pages, Netlify, or `python3 -m http.server`.

## Layout

```
assets/engine.js   Word logic (unscramble, scoring, anagrams, Wordle, blends, scrambling). Also runs in Node for testing.
assets/site.js     Header, More Word Games dropdown, sidebar, footer, definition popup, and shared results display
assets/style.css   All styles
data/words.js      274,136-word dictionary (~2.8 MB, loaded once, then cached by the browser)
*.html             One file per tool; each page's own logic sits in its bottom <script>
```

To add a page to the menus, add it to `NAV` or `MORE` at the top of `assets/site.js`. The header, sidebar and footer on every page update automatically.

## Credits and caveats

- The word list is the [`word-list`](https://github.com/sindresorhus/word-list) package (MIT). See `data/LICENSE-wordlist.txt`.
- Definitions come from the [Free Dictionary API](https://dictionaryapi.dev/) when you're online, with links to Wiktionary and Merriam-Webster as a fallback.
- The list is broad English, not an official Scrabble or Words With Friends tournament dictionary. Expect some obscure words those games reject.
- Scores are base tile values. Premium board squares aren't included.
- Scrabble® and Words With Friends® are trademarks of their owners; this project isn't affiliated with either.
