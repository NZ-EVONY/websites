# Deploy log

Record each deployment so the next one can be compared. Newest first.

| Date | Git commit | `public/` file count | Dry-run "Read N files" | Notes |
|---|---|---:|---:|---|
| 2026-10-20 | `54122b0` | 4161 | not run | Version `d21a41e0-0c67-4b7e-b599-91eabd285490`. Word of the Day published through 22 Dec (60 approved notes). Previous version `60e2bea2-9f94-4585-9a1f-70e8c165538a`. |
| 2026-10-20 | `eca7f27` | 4101 | not run | Version `60e2bea2-9f94-4585-9a1f-70e8c165538a`. Word of the Day published for 20-23 Oct (approved notes). Previous version `5b71eabf-4bb8-4ae5-a309-75ade1244fb1`. |
| 2026-10-20 | `a3367cc` (branch `claude/festive-sagan-qvxg1j`) | 4097 | not run | Version `5b71eabf-4bb8-4ae5-a309-75ade1244fb1` (3953 assets uploaded). Games, word tools, board solver, 3,090 word pages, offline app. Live CSS `style.6e1fde4a53.css`. Previous version `a74b420e` (commit `bed344d`). |
| 2026-10-20 | `862d3862` (branch `claude/festive-sagan-qvxg1j`, merged from `feature/crossword-generator`) | 4169 | not run | Version `6be9869c-2d3b-407e-8447-1f2b0e361ae0`. Daily Crossword 24-31 Oct published, every clue hand-written; crossword generator and clue bank. Previous version `d21a41e0-0c67-4b7e-b599-91eabd285490`. |
| 2026-10-20 | `c3631b98` (branch `claude/festive-sagan-qvxg1j`, from `feature/crossword-generator`) | 4169 | not run | Version `8369c22e-36c5-4011-a2cc-554f93dfa573`. Daily Crossword 1-7 Nov published (hand-written clues); extra clues for recurring answers. Previous version `6be9869c-2d3b-407e-8447-1f2b0e361ae0`. |

The dry-run counts folders as well as files (verified: 2 files in 1 subfolder → "Read 3 files").
| 2026-10-20 | `7e656881` (branch `claude/festive-sagan-qvxg1j`) | 4176 | npm test 125/125, regression 3/3, e2e 32/32 (one file at a time), check:deploy OK | Version `7b172fb0-8105-46de-b451-a8e04582befe`. Google readiness: CSP allows AdSense, Funding Choices and Cloudflare Web Analytics; /word/* and deep list pages noindex,follow and out of the sitemap (sitemap 3,855 -> 95 URLs, sitemap-words.xml removed); trademark-free titles/H1s; /scrabble-word-finder 301 -> /tile-word-finder; default share image; trailing slashes 301; longer short titles. Previous version `8369c22e-36c5-4011-a2cc-554f93dfa573`. |
