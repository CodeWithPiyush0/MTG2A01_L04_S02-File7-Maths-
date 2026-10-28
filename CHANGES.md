# MTG2A01_L04_S02 — CHANGES (review 1 → build v2)

Source: `MTG2A01_L04_S02_review1.pptx` (20 deck slides). Base for flow / layout / buttons / animation / colours / type:
`MTG2A01_L04_S01 (File6 Maths)` (the subtraction-without-regrouping sibling), as instructed. v1 build archived in `_archive_v1/`.

Status vocabulary: ✅ DONE · ⚑ FLAGGED-BACK · ⏳ PENDING · N/C (deck slide asks nothing).

## Decisions taken with the user before building (2026-10-26)
| Question | Deck | Decided |
|---|---|---|
| Landing | "Keep the same blue landing layout … as S01"; mockup 23 − 15 = ?, text 42 − 17 = ? | S01's current castle cover, no equation |
| Pages 5–9: a second (right) table for the blocks left | yes | one table, as S01 (the taken blocks stay grey in it) |
| Table heads with counts ("1 दहाई / 15 इकाई") | mockups show counts | words only, as S01 |
| Who opens the ten on pages 6–9 (the VO does not say) | — | the child taps a rod; idle 7 s → "अब 1 दहाई को इकाई में लाइए।" |

## Checklist and status

Proof key: **play** = played in headless Chrome by a scripted child (real taps on the real page, VO playing), frames read
by eye; **wrong** = played with three wrong answers (every help layer); **full** = one unbroken run landing → end screen.

| # | Deck slide · page | Change (from the deck) | Status | Proof |
|---|---|---|---|---|
| 0 | user brief | Rebuild on S01's shell: everything as S01 | ✅ DONE | `index.html` / `app.js` / `style.css` / assets / tools from S01; v1 in `_archive_v1/` |
| 1 | S1 (cover notes) | Page 4's lines (30 − 17) — see #7 | ✅ DONE | built as T3 |
| 2 | S2 (overview of v1) | — | N/C | describes v1 |
| 3 | S3 · p1 landing | VO "नमस्ते दोस्त! मैं हूँ स्विफ्टी! आज हम दहाई खोलकर घटाना सीखेंगे।"; Text "दहाई खोलकर घटाइए"; S01's landing | ✅ DONE | title painted on the castle cover's wall (frame), `vo_landing`; the picture comes in on "आज हम" (2.69 s, measured). Equation: not shown (user) |
| 4 | S4 · p2 | Text "कितने बचे?"; VO "यहाँ एक संख्या वाक्य दिया हुआ है। पच्चीस घटा छः बराबर कितना?" + "आइए, ब्लॉक्स की सहायता से सीखते हैं कि 25 में से 6 घटाने पर कितने बचते हैं।"; sync 25, −, 6, =, ? with the VO | ✅ DONE | T1 (new `EQ_STORY`): each part comes in on its word (cue times from the clip); play |
| 5 | S5 · p3 | Only 25; VO1; table + buttons; VO2; Swiftee + ×2, + ×5; "यह हमने…पच्चीस बना ली।"; "अब 25 में से 6…"; "5 इकाई में से 6 इकाई नहीं…"; a rod moves into the ones on "हम 1 दहाई को यहाँ लाएँगे", breaks into 10; "अब यहाँ 15 इकाई हो गईं।"; 6 removed with "1…6"; "…बचीं, 9 इकाई।"; "…1 दहाई ही बची।"; "…1 दहाई और 9 इकाई बचीं।"; "…यानी 19", show 19 | ✅ DONE | T2: play (frames: build, the ten opened in the ring, 6 taken, "= 19") |
| 6 | S6 · p2 again | "Appear the first screen"; "यहाँ हमने पच्चीस में से छः घटाए हैं, तो बचे 19। अब इस डिब्बे में 19 आएगा।"; 19 into the box on "19 आएगा" | ✅ DONE | end of T2: the table goes, T1's screen returns, 19 fills the "?" on its word + confetti; play |
| 7 | S7 · p4 (lines in S1's notes) | "कितने बचे?" 30 − 17 = ?; the child builds 3 rods (+ inactive after 3); "यह आपने…30 बना ली।"; "…शून्य इकाई हैं, तो हम 1 दहाई को यहाँ लाएँगे…10 इकाई में हो गई।" (the rod moves on the VO); the child removes 7 ones, counted; "…बचीं, 3 इकाई।"; "अब आप दहाइयाँ घटाइए…" - the tens pulse, the child taps one (grey copy), 3 s idle → hand; "…बची, 1 दहाई।"; "…यानी 13", the 13 shown | ✅ DONE | T3: play (child build ×3, ten opened on the VO, 7 counted taps, 1 rod, "30 − 17 = 13") |
| 8 | S8 · p5 | "संख्याएँ घटाइए।" 42 − 27 = ?; the child builds 42; "…2 इकाई में से 7 इकाई नहीं…तो आप 1 दहाई को यहाँ लाइए" - the child brings it; "अब यहाँ 12 इकाई हो गईं।"; 7 removed one by one "1…7"; "…बचीं, 5 इकाई।"; "3 दहाई में से 2 दहाई हटाइए।"; "अब कितने बचे? सही संख्या चुनिए।" 15 / 6 / 105; right: "शाबाश!…यानी 15." + "इसलिए 42 घटा 27 बराबर 15" in sync; wrong: reveal, 15 glows + hand, others locked | ✅ DONE | G1: play + wrong (frames: the ten opened, 15 flies into the "?"). Ladder: see "Contradictions" |
| 9 | S9 · p6 | 53 − 14 = ?; build (buttons go inactive when built); "और अब इसमें से 14 घटाइए।"; "इसमें से 4 इकाई को हटाइए, 1…4"; "अब दहाइयाँ घटाइए।" 1 ten; 39 / 12 / 93; "शाबाश! 53 घटा 14 बराबर 39" in sync; reveal 39 + hand | ✅ DONE | G2: play + wrong; the child opens the ten (reminder checked: `vo_idle_open` 7 s after the step, again every 7 s) |
| 10 | S10 · p7 | 46 − 28 = ?; build; "…इसमें से 28 घटाइए।"; "…8 इकाई को हटाइए, 1…8"; "अब दहाइयाँ हटाइए।"; 18 / 9 / 81; "शाबाश! 46 घटा 28 बराबर 18" in sync; reveal 18 + hand | ✅ DONE | G3: play + wrong |
| 11 | S11 · p8 | 74 − 58 = ?; build; "और अब इसमें से 58 घटाते हैं"; "14 इकाई में से 8 इकाई हटाइए।"; "अब दहाइयाँ घटाइए।" 5 tens; "…नीचे डिब्बे पर टैप करके सही संख्या लिखिए।" keypad on tapping the box; "शाबाश! 74 में से 58 घटाने पर हमें मिला 16।"; wrong → reveal, 1 then 6 glow, other keys locked | ✅ DONE | P1: play + wrong (S01's keypad page; typed into the "?") |
| 12 | S12 · p9 | 61 − 35 = ?; build; "…35 घटाते हैं"; "इकाई हटाइए।"; "अब दहाइयाँ हटाइए।" 3 tens; keypad; "…हमें मिला 26।"; reveal 2 then 6 | ✅ DONE | P2: play + wrong (frame: only "2" live, the rest off) |
| 13 | S13 · p10 | Replace with 84 − 46 = ? and 38 / 42 / 83; "84 में से 46 घटाइए और सही संख्या चुनिए।"; "शाबाश! आपने सही संख्या चुन ली। 84 घटा 46 बराबर 38।" in sync; reveal 38, others locked | ✅ DONE | P3 (`MENTAL_SUB`): play + wrong; the 2nd help's blocks open a ten first (as the deck's tables under the mockup: "7 दहाई / 14 इकाई" → "3 दहाई / 8 इकाई") |
| 14 | S14 · p11 | 91 − 14 = ?, 77 / 83 / 87; same pattern | ✅ DONE | P4: play + wrong |
| 15–19 | S15–S19 · p12–p16 | delete | ✅ DONE | card has 11 slides; no COUNT_DRAG_MATCH / MAKE_SET / COUNT_ACTION / PICK_SET / SEQUENCE_COMPLETE |
| 20 | S20 · p17 | VO "शाबाश! आपने दहाई खोलकर घटाना सीख लिया!" | ✅ DONE | `vo_cel`; S01's celebration, its lip-sync re-measured from this line |

**full** (2026-10-26): landing → T1 … P4 → celebration → end screen in one run (539 s), the three phase screens, 0 console
errors; signals: slide_entered ×11, slide_completed ×10, pv_build_done ×7, pv_ten_opened ×7, pv_remove_done ×7,
mcq_correct ×5, numpad_correct ×2, phase_transition ×3, mastery_score, lesson_completed. Every slide also played alone
with three wrong answers (0 console errors). Not click-tested by a person yet — please play it once on a device.

## Where the deck contradicts itself — resolved as below (please confirm)
| Where | Deck says | Built as | Why |
|---|---|---|---|
| S1 notes (page 4) VO1 | "…सहायता से **25** बनाते हैं" | 30 | the page is 30 − 17; the next line is "30 में 3 दहाई…" |
| S5 (page 3) | "तो यहाँ 1 **इकाई** ही बची।" | 1 **दहाई** ही बची | 25 − 6 leaves 1 ten (the sentence is about the tens) |
| S5 (page 3) | Text "पहले 25 बनाते है।" | no heading | it sat on the 25 card; S01's same page had it taken out for the same reason (S01 user 2026-10-17) |
| S9 (page 6) | "Replace … with the Equation: **42 − 27** = ?", "the child builds **42** and removes **27**" | 53 − 14 | copy-paste from page 5; mockup + every VO line say 53 − 14 |
| S10 (page 7) | "Child will tap and remove the **1** tens rods" | 2 tens | 46 − 28: after one ten is opened 3 are left and 2 are taken |
| S8–S14 wrong answers | wrong 1 "फिर से सोचिए, कितने बचे।" / "फिर से घटाइए।", wrong 2 the reveal | ⚑ S01's ladder: wrong 1 recount ("बची हुई दहाई और इकाई को दोबारा गिनिए।") / P3–P4 the order line; wrong 2 "a में से b घटाने पर, x दहाई और y इकाई बचती हैं।" (P3–P4: with the blocks); wrong 3 the deck's reveal line + glow (+ hand on G1–G3) | S01 had the same two-step text in its deck and the user changed it to this three-step ladder there; you asked for S01's flow. **Say if you want the deck's two steps instead** — it is one place in `app.js` |
| Spelling | ब्लॉकस, मे, ओर, लाएंगे, बनाली, यानि, है (plural) | ब्लॉक्स, में, और, लाएँगे, बना ली, यानी, हैं | spelling and agreement only |

## Changed beyond the deck (consequences, not extras)
- New mechanic code (`app.js` `[pv regroup]`): open a ten, the child's open step, the count on each take, the equation sync
  from measured times; one kit fix — a cue the card has no time for no longer holds back the cues after it.
- New VO not written in the deck: the S01 ladder's lines for this lesson's numbers (`vo_*_h2` ×7), the open-step reminder
  `vo_idle_open`, the count words `vo_num_4…8`. Re-used from S01 unchanged: phase lines, removal ladder, recount / order,
  build / remove reminders, `vo_num_1…3`, `vo_p1_ask`, T2's first four lines (the same 25).
- P1 / P2 are built by the child (the deck asks for it; S01's keypad pages come pre-built).
- `vercel.json`'s cache rule names `MTG2A01_L04_S02.html`.

## Observations — noticed, NOT decided by the deck (please confirm)
- Pages 6–9: the VO never says that a ten has to be opened; the child has to see it. The rods pulse and the reminder
  comes after 7 s — the deck may want a line like page 5's ("…तो आप 1 दहाई को यहाँ लाइए") on G2 at least.
- G2 / G3 end on the short "शाबाश! 53 घटा 14 बराबर 39।" — G1 also says "…मिलीं 1 दहाई और 5 इकाई"; fine if intended.
- The answer 105 (page 5) is far from the others — an easy rule-out.
- On P1 / P2 (keypad pages) the + box under the table ends ~25 px above the bottom edge — it fits, but it is close.
- The celebration shows no text (S01's); the deck's page-17 picture shows a title and a line — only its VO was asked for.

## EAR-CHECK (a human must listen before children hear it)
All 87 new clips are Gemini TTS (voice Kore, S01's finish). Each was transcribed back by Gemini; the ones that did not
say their line were re-rendered (`vo_num_5/6/7`, `vo_t3_build`, `vo_t3_rm_ones`, `vo_p2_rm_ones`, `vo_p2_rm_tens`,
`vo_t2_ones_now`, `vo_t2_cant`, `vo_t2_tens_note`). Still to confirm by ear:
- `vo_num_8` ("आठ।") — the transcriber hears every single-word count as "एक" (it does so for S01's approved "तीन" too), so it could not be confirmed
- `vo_t2_cant` — the transcriber hears "क्योंकि" where the line says "चूँकि"
- every count word `vo_num_4…8`

## Sync with MTG2A01_L04_S01 — 2026-10-27 (its commits 7a4e2db + a29b606, after this build was copied from it)
Merged three-way (S01 7a4e2db = the version this build was copied from, as the base): S01's changes came in as written, no conflicts.
| S01 change | Here |
|---|---|
| QA BUG_01: no Google Translate offer (`translate="no"`, `notranslate`) | ✅ |
| QA BUG_09 / 04 / 07: the speaker takes a tap only while the page waits for the child or has ended; steady pulse while the page talks; none once answered | ✅ + the open-a-ten step registers as "waiting for the child" (measured on G2: speaker off while Swiftee talks, on while the rods wait) |
| No taps while a voice line plays (`body.vo-busy`) | ✅ |
| QA BUG_06: Swiftee stays sad through the whole wrong-answer help | ✅ |
| The VO manifest `lesson_vo_manifest.xlsx` (`tools/gen_vo_manifest.py`) | ✅ ported with this lesson's pages (the regroup demo, the open-a-ten step and its reminder, the counts): 170 rows, 107 recordings, none missing |
| Cache stamps | `?v=20261027a` |
Verified: both games played landing → end side by side (frames compared page by page), 0 console errors in either.

## User changes — 2026-10-27
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | Page 1 like File6 (user's choice: File6's story with 25 − 6) | ✅ | `STORY_SUB` (File6's module): Meera with her 25 blocks, Aman with none, 25 − 6 = ? under them, the portrait lights on its name. VO: "मीरा के पास कुल पच्चीस ब्लॉक्स हैं," + "चलिए, पता करते हैं, मीरा के पास अब कितने ब्लॉक्स बचे हैं?" (File6's own clips), new "उनमें से छः ब्लॉक्स मीरा ने अमन को दिए हैं।", and the deck's "आइए, ब्लॉक्स की सहायता से सीखते हैं कि 25 में से 6 घटाने पर कितने बचते हैं।" (25, 6, ? light on their words). The equation-only page is removed |
| 2a | Page 2: "5 इकाई में से 6 इकाई नहीं…" - highlight 5 and 6 in the equation | ✅ | the 5 of 25 lights on «5 इकाई», the 6 on «6 इकाई»; both stay lit through the line (times from the clip) |
| 2b | The border round the opened ten: no animation | ✅ | an even dotted line that stands still: no travelling gap, no pop, no pulsing dots (`dashBox(..., still)`, `.pv-ring` CSS) - measured: 0 animations on it |
| 2c | Page 2's end like File6's | ✅ | the story row comes back; on «छः» one of Meera's rods opens into ten cubes (she has only five ones), 6 of them fly into Aman's picture and hers turn grey; her 19 beat on «बचे 19»; «19 आएगा» fills the "?"; new closing line "यानी मीरा के पास कुल 19 ब्लॉक्स बचे।" (File6's) |
| 3a | Page 3: the 30 flashed as the page opened | ✅ | the 30 card is hidden from its first frame when the page opens on the question - measured: 0 of 178 frames show it |
| 3b | Page 3: no "कितने बचे?", laid out as page 2 | ✅ | heading removed; the equation, the 30 card, the table and the + box stand exactly where page 2's do |
New VO: `vo_t1_b6`, `vo_t2_story_c` (Gemini, Kore), both checked by transcription. Manifest regenerated (110 recordings). Cache stamp `?v=20261027c`.
Verified: pages 1-3 played through (every line in order, 0 console errors), frames checked.

## User changes — 2026-10-27 (2)
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | The characters' names: Raju, Vaani (user's choice: Raju gives on both story pages) | ✅ | page 1: Raju (the boy's picture, left) has 25 and gives 6 to Vaani (the girl's picture, right): "राजू के पास कुल पच्चीस ब्लॉक्स हैं," / "उनमें से छः ब्लॉक्स राजू ने वाणी को दिए हैं।" / "चलिए, पता करते हैं, राजू के पास अब कितने ब्लॉक्स बचे हैं?"; page 2's ending: Raju's rod opens, 6 go into Vaani's picture, "यानी राजू के पास कुल 19 ब्लॉक्स बचे।". Each picture lights on its name |
| 2 | A copy of page 1 after T2: "आइए, एक और उदाहरण करते हैं। राजू के पास कुल 30 ब्लॉक्स थे। उनमें से 17 मीरा को दे दिए। चलिए, पता करते हैं, राजू के पास अब कितने ब्लॉक्स बचे?" — Raju, Meera | ✅ | new T3 (`STORY_SUB`, 30 − 17): Raju with his 30 (3 rods), Meera (the girl's picture), the equation under them coming in with the lines; the 30 − 17 demo is now T4. Spelling only: है → हैं, ब्लॉकस → ब्लॉक्स, उनमे → उनमें |
New VO (Gemini, Kore, each checked by transcription; two re-rendered once): `vo_t1_a_raju`, `vo_t1_b6_raju`, `vo_t1_ask_raju`, `vo_t2_story_c_raju`, `vo_t3s_a`, `vo_t3s_b`, `vo_t3s_ask`; the four old Meera/Aman clips removed. The lesson is now 12 slides (tutorial 4). Manifest regenerated (113 recordings). Cache stamp `?v=20261027d`.
Note: Vaani (page 1) and Meera (page 3) share the girl's picture - the game has one boy and one girl picture.
Verified: one unbroken run landing → end (12 pages, the 3 phase screens, 0 console errors); story frames checked.

## User changes — 2026-10-27 (3)
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | T3 (the second story page): no "कितने बचे?" | ✅ | heading removed |
| 2 | New pictures for Raju, Vaani, Meera (from the user's three character pictures) | ✅ | for each: a head-and-shoulders picture drawn by Gemini (gemini-2.5-flash-image) from the user's picture as the reference, and an eyes-shut copy of it; cut out and made into the story portrait the way the old ones are (400px: white ring, coloured disc - Raju blue, Vaani peach, Meera pink): `char_raju`, `char_vaani`, `char_meera` (+ `_blink` each - the characters blink, as before). Page 1: Raju + Vaani; page 2's ending: Raju + Vaani; page 3: Raju + Meera. The old portraits `char_aman` / `_blink` removed (no longer used); the old Meera portrait replaced |
Tools kept for redoing the pictures: `tools/gen_char_art.py` (Gemini, the reference picture + a prompt; GEMINI_KEY) and `tools/make_portrait.py` (the cut-out and the round portrait; the eyes-shut copy placed exactly as the open one - measured overlap ≥ 0.995).
Not changed: the first screen's two children (the castle cover) are still the old art - their animation needs whole-figure poses (standing, cheering, holding the block), not a portrait.
Verified: pages 1-3 played (0 console errors); the blinks seen on page 1 (Raju, Vaani); frames checked. Cache stamp `?v=20261027e`.

## User changes — 2026-10-27 (4)
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | The same characters on the cover page | ✅ | the castle cover's two children are now Raju (left) and Vaani (right) - the story's page-1 pair (the cover has two places). Their whole-figure poses, made like the old ones: standing (`char_<who>_full`, drawn by Gemini from the user's picture - Raju hands in pockets, Vaani hands together) and cheering with both arms up (`char_<who>_cheer`, an edit of the standing picture so the size and the feet stay put), each with its eyes-shut copy (`_blink`, overlap ≥ 0.97 with the open one). Cut out with `tools/make_poses.py` (the standing child 640px tall, the cheer at the same scale; it also finds the raised palms → `PVLanding.HANDS.raju / vaani`, where the red top they lift is held). The cover's animation itself is unchanged (glide in, lift the red tops off the castle, cheer, blink). The old cover art (`char_aman_*`, `char_meera_full*` / `_cheer*`) removed |
Verified: the cover played through (frames checked: the glide in, the tops lifted into the raised hands, the cheer), both children blink, 0 console errors. Cache stamp `?v=20261027f`.


## User changes — 2026-10-27 (5)
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | Page 4's ending: the same animation as page 2's | ✅ | after "…यानी 13" the table and the equation go and the second story row comes back (Madhav with his 30, Pari, 30 − 17 = ?): "यहाँ हमने तीस में से सत्रह घटाए हैं, तो बचे 13।" - his 30 beat; on «सत्रह» one of his rods opens into ten cubes (he has no ones), then 1 rod + 7 cubes fly into Pari's picture and his turn grey; his 13 beat; "अब इस डिब्बे में 13 आएगा।" - the "?" becomes 13, confetti; "यानी माधव के पास कुल 13 ब्लॉक्स बचे।" - Madhav's picture lights. Page 2's own words, with this page's numbers. (The confetti that came on "यानी 13" now waits for the "?") |
| 2 | Names: Madhav, Aanya, Pari (the VO too) | ✅ | Raju → Madhav (माधव), Vaani → Aanya (आन्या), Meera → Pari (परी), in every line, the pictures' files (`char_madhav*`, `char_aanya*`, `char_pari*` - the same art) and the cover. Re-recorded: `vo_t1_a_madhav`, `vo_t1_b6_madhav`, `vo_t1_ask_madhav`, `vo_t2_story_c_madhav`, `vo_t3s_a_madhav`, `vo_t3s_b_pari`, `vo_t3s_ask_madhav`; new for page 4: `vo_t4_story_a`, `vo_t4_story_b`, `vo_t4_story_c_madhav`. Each checked by transcription (three re-rendered until right: one had dropped its first sentence, one said "दे दो", one slurred "आन्या"). The old Raju clips removed |
| 3 | The cover: a new, better animation that fits this lesson | ✅ | the castle is replaced by the lesson's own blocks (`PVLanding.ART.tens`, same stage, title and play button): three green rods and two orange cubes drop in one by one (a squash and a knock each); Madhav and Aanya glide in; Madhav leans in and the rod beside the cubes rises, wobbles, glows and sparkles - and breaks into its ten cubes ("दहाई खोलकर"), which hop off it one by one, top first, in tumbling arcs, and stack with the two into a 5-4-3 pyramid; each child takes a top cube off and holds it up ("घटाइए"); a burst, the chime, the cheer, then the play button. The old castle art (`castle_*.webp`) removed |
Verified: the cover played through (frames checked: drop in, glide, the rod opening, the cubes stacking, the cubes held up, the play button; 0 console errors); page 4 played to its new ending (0 errors); a full run landing → end. Cache stamp `?v=20261027g`.


## SME feedback — 2026-10-28
| # | Asked | Status | How it is built |
|---|---|---|---|
| 1 | Landing screen: "The VO is not synchronized with the interaction. Please align the visuals and interactions with the narration." | ✅ | the cover's animation now runs WITH the greeting, each beat on its word (it used to start on «आज हम» and run ~15 s past the line). The words' times were measured in `vo_landing.ogg` (its loudness) and are in the card (`landing_hero.beats`); each beat waits for the clip to reach its word (or, if the clip is not playing, for the clock - a second late at most): «नमस्ते दोस्त» (0.28 s) - Madhav and Aanya glide in; «मैं हूँ स्विफ्टी» (1.32 s) - the three rods and two cubes drop in; «आज हम» (2.6 s) - Madhav leans in; «दहाई» (2.92 s) - the rod beside the cubes rises, glows and wobbles; «खोलकर» (3.7 s) - it breaks into its ten cubes, eight of which hop off into a 4-3-2-1 pyramid with the two; «घटाना» (4.2 s) - the last two fly into the children's hands, held up; «सीखेंगे» (4.66 s) - the burst, the chime, the cheer; the play button about a second after the line ends. Measured in the browser: glide 0.39 s, drop 1.42 s, rise 2.95 s, open 3.74 s, cheer 4.71 s |
| 2 | T3: change the name Pari to Myra | ✅ | Pari → Myra (मायरा): "उनमें से 17 मायरा को दे दिए।" re-recorded (`vo_t3s_b_myra`, checked by transcription; one re-render - the first said "दे दो"); her picture's files renamed `char_myra` / `_blink` (the same art); page 4's ending gives the 17 to Myra. `vo_t3s_b_pari` removed |
| 3 | G1 / G2 / G3: no counting VO while removing blocks - the child taps, the block goes; Swiftee does not count aloud | ✅ | the count is off on G1-G3 (`data.count` false): each tap takes its block at once, no "एक, दो, तीन…" (the tutorial pages T2 / T4, where Swiftee shows it, keep their count - not in this feedback) |
| 4 | G3 to P2: no adding blocks - start with the table holding the blocks, then the activity | ✅ | G3, P1, P2 (`data.build` false): the page opens with the table already holding 46 / 74 / 61, then the take-away as before (open a ten, ones, tens, the answer). Their build lines are out of the card (`vo_g3_build`, `vo_p1_build`, `vo_p2_build` removed); G1 and G2 still build. The count clip "आठ" (`vo_num_8`, used only by G3's count) removed |
Verified: the cover's beats logged against the clip (above), frames checked; G1, G3, P1, P2 played (no count clips heard; G3 / P1 / P2 open on the filled table; 0 console errors); a full run landing → end. Cache stamp `?v=20261028a`.
