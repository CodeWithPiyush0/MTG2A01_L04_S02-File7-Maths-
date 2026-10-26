# MTG2A01_L04_S02 — दहाई खोलकर घटाइए (Subtract horizontally with regrouping)

**Grade:** G2 · **LO:** MTG2A01_L04 · **Attribute:** A01 · **Type:** CORE
**Slides:** 11 · Tutorial 3 / Guided 3 / Practice 5 (the celebration counts as practice)
**Source:** `MTG2A01_L04_S02_review1.pptx` (SME review 1). Every deck page is mapped in `CHANGES.md`.

## Built on MTG2A01_L04_S01's shell
The flow, layout, buttons, animation, colours and type are S01's (`../MTG2A01_L04_S01 (File6 Maths)`), unchanged: the
castle cover, the tutorial card, the header band with Swiftie's moods, the yellow → button, SFX + music, the three phase
screens, confetti, the nudge hand, the place-value table and its + source box, the take-away (a block pops out where it
stands, its grey copy stays), the removal help ladder, the answer cards and the 3 × 4 keypad, the 7 s reminders, the
celebration. The first draft (another engine) is kept in `_archive_v1/`.

What this skill adds (`app.js` `[pv regroup]`):
- **open a ten**: a rod of the दहाई column moves into the इकाई column and opens into ten cubes; they fill the ten-frame's
  two rows inside the dashed ring and the ones that were there move below (`PVK.bringTen`, `splitTen`, `openTen`)
- **the child opens it** on the guided / practice pages: when the ones are too few every rod pulses; the rod tapped comes
  across and opens. The ones cannot be taken until then. Idle 7 s: "अब 1 दहाई को इकाई में लाइए।" (`PVK.openChild`)
- **counting** each one taken away ("1, 2, 3 …", deck pages 4–7) — the next tap waits for the count
- the equation lit part by part as the right-answer line says it (`PVK.eqSyncAt`, times measured from the clips)

## The lesson
| slide | deck | type | what happens |
|---|---|---|---|
| landing | p1 | — | S01's castle cover, title "दहाई खोलकर घटाइए", greeting "…आज हम दहाई खोलकर घटाना सीखेंगे।" |
| T1 | p2 | EQ_STORY | "कितने बचे?" 25 − 6 = ?, each part with the VO |
| T2 | p3 + p2b | PV_REGROUP_DEMO | Swiftee builds 25; "5 इकाई में से 6 …नहीं"; a ten comes over and opens (15 इकाई); she takes 6 (counted); "= 19"; the first screen returns and 19 fills the "?" |
| T3 | p4 | PV_REGROUP_DEMO | 30 − 17 = ? asked; the child builds 30; the ten opens with the VO; the child takes 7 ones (counted) and 1 ten; "30 − 17 = 13" |
| G1 | p5 | PV_SUB mcq | 42 − 27 (15 / 6 / 105): build, "…तो आप 1 दहाई को यहाँ लाइए" - the child brings it, takes 7 (counted), 2 tens |
| G2 | p6 | PV_SUB mcq | 53 − 14 (39 / 12 / 93), the child opens the ten unprompted (reminder after 7 s) |
| G3 | p7 | PV_SUB mcq | 46 − 28 (18 / 9 / 81) |
| P1 | p8 | PV_SUB numpad | 74 − 58 → 16, typed into the "?" |
| P2 | p9 | PV_SUB numpad | 61 − 35 → 26 |
| P3 | p10 | MENTAL_SUB mcq | 84 − 46 (38 / 42 / 83), the equation only; the 2nd help shows the blocks (a ten opened) |
| P4 | p11 | MENTAL_SUB mcq | 91 − 14 (77 / 83 / 87) |
| CEL | p17 | CELEBRATION | "शाबाश! आपने दहाई खोलकर घटाना सीख लिया!" |

Deleted (deck): pages 12–16. Every problem needs a regroup (`tools/lessons.py` asserts it).

## Rebuilding
```
python tools/lessons.py          # card.json + tools/vo_script.json; embeds the card in index.html, copies MTG2A01_L04_S02.html
python tools/build_vo.py         # renders any VO line not yet on disk (GEMINI_KEY in the environment; ffmpeg)
python tools/lessons.py          # again after new VO: the cue times are measured from the clips
node tools/gen_asset_sizes.js    # the preload manifest - after ANY asset change
```
The key in `.env` is named `GKEY`: `set -a; . ./.env; set +a; export GEMINI_KEY=$GKEY`.
Dev: `index.html?slide=N` opens slide N directly; `?dev=1` adds the slide navigator.

## Deploying (Vercel)
As S01: a plain static site, `vercel.json` pins no build and the output directory `.`; `.vercelignore` keeps the dev files
out. The upload is `index.html`, `MTG2A01_L04_S02.html`, `app.js`, `style.css`, `swiftpal-bridge.js`, `vercel.json`, `assets/`.
