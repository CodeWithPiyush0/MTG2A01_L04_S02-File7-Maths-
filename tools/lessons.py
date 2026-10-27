"""MTG2A01_L04_S02 - the lesson, page by page (SME deck MTG2A01_L04_S02_review1.pptx).

The one place the content lives: every slide, its on-screen text and its VO lines. Writes
    card.json               - the card (also embedded in index.html, <script id="cardData">)
    tools/vo_script.json    - clip id -> Hindi line, for tools/build_vo.py
and copies index.html to MTG2A01_L04_S02.html (the same game under the skill code's name).

    python tools/lessons.py

Built on MTG2A01_L04_S01's shell (the same flow, layout, buttons, animation, colours, type). Lines are the deck's,
verbatim, with spelling / agreement slips fixed (ब्लॉकस -> ब्लॉक्स, मे -> में, ओर -> और, लाएंगे -> लाएँगे, है -> हैं for
plurals, यानि -> यानी) and the copy-paste slips listed in CHANGES.md resolved.
"""
import json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

VO = {}          # clip id -> line


def vo(cid, line):
    if cid in VO and VO[cid] != line:
        raise SystemExit(f"clip {cid} given two different lines")
    VO[cid] = line
    return cid


# ---- shared lines (the first block: S01's clips, the same words) ---------------------------------------
vo("vo_landing", "नमस्ते दोस्त! मैं हूँ स्विफ्टी! आज हम दहाई खोलकर घटाना सीखेंगे।")
vo("vo_pt_tutorial", "ध्यान से देखिए और मेरे साथ जानिए। चलिए, शुरू करें!")
vo("vo_pt_guided", "बहुत बढ़िया! अब हम साथ मिलकर शुरू करते हैं। चलिए, साथ में करें!")
vo("vo_pt_practice", "वाह! अब आपकी बारी।")
RM = {
    "rm_ones_more": vo("vo_rm_ones_more", "आपने इकाई में ज़्यादा हटाए हैं। दोबारा कोशिश करिए।"),
    "rm_ones_less": vo("vo_rm_ones_less", "आपने इकाई में कम हटाए हैं। दोबारा कोशिश करिए।"),
    "rm_tens_more": vo("vo_rm_tens_more", "आपने दहाई में ज़्यादा हटाए हैं। दोबारा कोशिश करिए।"),
    "rm_guide": vo("vo_rm_guide", "इनमें से इतने हटाइए।"),
}
ASK_PICK = vo("vo_ask_pick", "अब कितने बचे? सही संख्या चुनिए।")
ASK_PAD = vo("vo_p1_ask", "अब कितने बचे? नीचे डिब्बे पर टैप करके सही संख्या लिखिए।")
RECOUNT = vo("vo_h_recount", "बची हुई दहाई और इकाई को दोबारा गिनिए।")
ORDER = vo("vo_h_order", "संख्याओं में से पहले इकाई घटाइए, फिर दहाई घटाइए।")
vo("vo_idle_build_t", "अब दहाई बनाइए।"); vo("vo_idle_build_o", "अब इकाई बनाइए।")
vo("vo_idle_rm_t", "अब दहाई हटाइए।"); vo("vo_idle_rm_o", "अब इकाई हटाइए।")
# the count said on each one taken away (deck: "1, 2, 3, 4, 5, 6, 7") - one to eight in this lesson
for _n, _w in enumerate(("एक।", "दो।", "तीन।", "चार।", "पाँच।", "छः।", "सात।", "आठ।"), 1):
    vo(f"vo_num_{_n}", _w)
# the 7s reminder while a ten is to be opened (user 2026-10-26: the child taps a rod; idle -> this line)
vo("vo_idle_open", "अब 1 दहाई को इकाई में लाइए।")


def split(n):
    return n // 10, n % 10


# ---- slides -------------------------------------------------------------------------------------------
slides = []

# the story cast (user 2026-10-27, renamed the same day): the giver is MADHAV, the one who receives is AANYA on page 1 and PARI on the second story
# page; each has their own round portrait (assets/char_<who>.webp + _blink, made from the user's character pictures)
CAST = {"माधव": "madhav", "आन्या": "aanya", "परी": "pari"}

# deck page 2 - "कितने बचे?" 25 − 6 = ?, told as File6's story (user 2026-10-27: "the first page similar to my file6"):
# Madhav with his 25 blocks, Aanya with none, the equation under them; File6's lines with 6 for 13, then the deck's line
slides.append({
    "id": "T1", "phase": "tutorial", "eis": "iconic", "type": "STORY_SUB", "prompt_hi": "कितने बचे?",
    "audio": {"a": vo("vo_t1_a_madhav", "माधव के पास कुल पच्चीस ब्लॉक्स हैं,"),
              "b": vo("vo_t1_b6_madhav", "उनमें से छः ब्लॉक्स माधव ने आन्या को दिए हैं।"),
              "ask": vo("vo_t1_ask_madhav", "चलिए, पता करते हैं, माधव के पास अब कितने ब्लॉक्स बचे हैं?"),
              "learn": vo("vo_t1_learn", "आइए, ब्लॉक्स की सहायता से सीखते हैं कि 25 में से 6 घटाने पर कितने बचते हैं।")},
    "data": {"mode": "ask", "a": 25, "b": 6, "people": [{"who": "madhav"}, {"who": "aanya"}]}})

# deck page 3 (+ the 2nd page 2: "Appear the first screen") - Swiftee builds 25, opens a ten, takes 6 away. The deck's heading
# "पहले 25 बनाते हैं।" sat on the 25 card: left out, as on S01's T2 (S01 user 2026-10-17)
slides.append({
    "id": "T2", "phase": "tutorial", "eis": "iconic", "type": "PV_REGROUP_DEMO", "prompt_hi": "",
    "audio": {"intro": vo("vo_t2_intro", "सबसे पहले ब्लॉक्स की सहायता से 25 बनाते हैं।"),
              "digits": vo("vo_t2_digits", "25 में 2 दहाई और 5 इकाई हैं।"),
              "tens": vo("vo_t2_tens", "2 दहाई के लिए 2 बंडल रखते हैं।"),
              "ones": vo("vo_t2_ones5", "अब 5 इकाई के लिए 5 ब्लॉक्स रखते हैं।"),
              "built": vo("vo_t2_built", "यह हमने ब्लॉक्स से संख्या पच्चीस बना ली।"),
              "sub": vo("vo_t2_sub", "अब 25 में से 6 घटाते हैं। 6 में सिर्फ 6 इकाई होती हैं।"),
              "cant": vo("vo_t2_cant", "5 इकाई में से 6 इकाई नहीं घटाई जा सकती, चूँकि संख्या 6 बड़ी है और 5 छोटी।"),
              "open": vo("vo_t2_open", "तो हम 1 दहाई को यहाँ लाएँगे और इसको तोड़ेंगे, अब ये 1 दहाई, 10 इकाई में हो गई।"),
              "ones_now": vo("vo_t2_ones_now", "अब यहाँ 15 इकाई हो गईं।"),
              "rm_ones": vo("vo_t2_rm_ones", "अब इसमें से 6 इकाई को हटाते हैं,"),
              "ones_left": vo("vo_t2_ones_left", "इन 15 इकाई में से 6 इकाई घटाने पर बचीं, 9 इकाई।"),
              "tens_note": vo("vo_t2_tens_note", "चूँकि इसमें दहाइयाँ नहीं थीं, तो यहाँ 1 दहाई ही बची।"),
              "both_left": vo("vo_t2_both_left", "तो, अब यहाँ 1 दहाई और 9 इकाई बचीं।"),
              "total": vo("vo_t2_total", "यानी 25 में से 6 घटाने पर हमें मिलीं, 1 दहाई और 9 इकाई, यानी 19।"),
              "story_a": vo("vo_t2_story_a", "यहाँ हमने पच्चीस में से छः घटाए हैं, तो बचे 19।"),
              "story_b": vo("vo_t2_story_b", "अब इस डिब्बे में 19 आएगा।"),
              "story_c": vo("vo_t2_story_c_madhav", "यानी माधव के पास कुल 19 ब्लॉक्स बचे।")},   # (File6's closing line, user 2026-10-27)
    "data": {"a": 25, "b": 6, "demo": True}})

# user 2026-10-27: a second story page (a copy of page 1) before the 30 − 17 page - Madhav has 30 blocks, gives 17 to Pari
slides.append({
    "id": "T3", "phase": "tutorial", "eis": "iconic", "type": "STORY_SUB", "prompt_hi": "",   # (no heading - user 2026-10-27)
    "audio": {"a": vo("vo_t3s_a_madhav", "आइए, एक और उदाहरण करते हैं। माधव के पास कुल 30 ब्लॉक्स थे।"),
              "b": vo("vo_t3s_b_pari", "उनमें से 17 परी को दे दिए।"),
              "ask": vo("vo_t3s_ask_madhav", "चलिए, पता करते हैं, माधव के पास अब कितने ब्लॉक्स बचे?")},
    "data": {"mode": "ask", "a": 30, "b": 17, "people": [{"who": "madhav"}, {"who": "pari"}]}})

# deck page 4 (its lines are in the deck's cover-slide notes) - 30 − 17: the child builds 30, the ten opens with the VO,
# the child takes 7 ones (counted) and 1 ten; "= 13" lands in the equation
slides.append({
    "id": "T4", "phase": "tutorial", "eis": "iconic", "type": "PV_REGROUP_DEMO", "prompt_hi": "",   # (no heading - laid out as T2, user 2026-10-27)
    "audio": {"sub0": vo("vo_t3_sub0", "अब 30 में से 17 घटाते हैं।"),
              "intro": vo("vo_t3_intro", "सबसे पहले ब्लॉक्स की सहायता से 30 बनाते हैं।"),
              "digits": vo("vo_t3_digits", "30 में 3 दहाई और 0 इकाई होती हैं।"),
              "tens": vo("vo_t3_build", "आप दहाई के ब्लॉक्स बनाइए।"),
              "built": vo("vo_t3_built", "यह आपने ब्लॉक्स से संख्या 30 बना ली।"),
              "sub": vo("vo_t3_sub", "अब 30 में से 17 घटाते हैं। तो पहले हम इकाई से घटाएँगे।"),
              "open": vo("vo_t3_open", "यहाँ शून्य इकाई हैं, तो हम 1 दहाई को यहाँ लाएँगे और इसको तोड़ेंगे, अब ये 1 दहाई, 10 इकाई में हो गई।"),
              "rm_ones": vo("vo_t3_rm_ones", "अब इसमें से 7 इकाई को हटाइए।"),
              "ones_left": vo("vo_t3_ones_left", "इन 10 इकाई में से 7 इकाई घटाने पर बचीं, 3 इकाई।"),
              "rm_tens": vo("vo_t3_rm_tens", "अब आप दहाइयाँ घटाइए। 2 दहाई में से 1 दहाई हटाइए।"),
              "tens_left": vo("vo_t3_tens_left", "बहुत बढ़िया! 2 दहाई में से 1 दहाई घटाने पर बची, 1 दहाई।"),
              "total": vo("vo_t3_total", "30 में से 17 घटाने पर हमें मिलीं, 1 दहाई और 3 इकाई, यानी 13।"),
              # page 2's ending here too (user 2026-10-27): the story row of the second story page comes back
              "story_a": vo("vo_t4_story_a", "यहाँ हमने तीस में से सत्रह घटाए हैं, तो बचे 13।"),
              "story_b": vo("vo_t4_story_b", "अब इस डिब्बे में 13 आएगा।"),
              "story_c": vo("vo_t4_story_c_madhav", "यानी माधव के पास कुल 13 ब्लॉक्स बचे।"),
              **{k: v for k, v in RM.items()}},
    "data": {"a": 30, "b": 17, "demo": False, "idle_ms": 3000}})


def pv_sub(sid, phase, a, b, lines, answer, options=None, count=False, extra_data=None):
    """a guided / practice screen: build a, open a ten (the child taps a rod), take b away, then answer"""
    au = dict(RM)
    au.update(lines)
    d = {"a": a, "b": b, "answer": answer, "build": True, "steps": True, "right_table": False, "count": count}
    if options:
        d["options"] = options
    if extra_data:
        d.update(extra_data)
    return {"id": sid, "phase": phase, "eis": "iconic", "type": "PV_SUB", "prompt_hi": "संख्याएँ घटाइए।",
            "audio": au, "data": d}


# deck page 5 - 42 − 27 (15 / 6 / 105): the child builds 42, brings a ten over, takes 7 ones (counted), then 2 tens
slides.append(pv_sub("G1", "guided", 42, 27, {
    "prompt": vo("vo_g1_prompt", "42 में से 27 घटाइए।"),
    "build": vo("vo_g1_build", "सबसे पहले ब्लॉक्स की सहायता से 42 बनाइए, जिसमें 4 दहाई और 2 इकाई होते हैं।"),
    "sub": vo("vo_g1_sub", "और अब 27 घटाते हैं, 27 में 2 दहाई और 7 इकाई हैं।"),
    "regroup": vo("vo_g1_regroup", "पहले इकाइयाँ घटाइए। 2 इकाई में से 7 इकाई नहीं घटाई जा सकती। तो आप 1 दहाई को यहाँ लाइए।"),
    "opened": vo("vo_g1_opened", "अब ये 1 दहाई, 10 इकाई में हो गई।"),
    "ones_now": vo("vo_g1_ones_now", "अब यहाँ 12 इकाई हो गईं।"),
    "rm_ones": vo("vo_g1_rm_ones", "अब इसमें से 7 इकाई को हटाइए, एक-एक पर टैप करके।"),
    "ones_left": vo("vo_g1_ones_left", "इन 12 इकाई में से 7 इकाई हटाने पर बचीं, 5 इकाई।"),
    "rm_tens": vo("vo_g1_rm_tens", "अब दहाइयाँ घटाइए। 3 दहाई में से 2 दहाई हटाइए।"),
    "ask": ASK_PICK, "recount": RECOUNT, "h2": vo("vo_g1_h2", "42 में से 27 घटाने पर, 1 दहाई और 5 इकाई बचती हैं।"),
    "reveal": vo("vo_g1_reveal", "42 में से 27 घटाने पर 15 बचता है। तो सही संख्या यह है।"),
    "correct": vo("vo_g1_correct", "शाबाश! 42 में से 27 घटाने पर हमें मिलीं 1 दहाई और 5 इकाई, यानी 15।"),
    "eq": vo("vo_g1_eq", "इसलिए 42 घटा 27 बराबर 15।")},
    answer="mcq", options=[15, 6, 105], count=True, extra_data={"reveal_hand": True}))

# deck page 6 - 53 − 14 (39 / 12 / 93)
slides.append(pv_sub("G2", "guided", 53, 14, {
    "prompt": vo("vo_g2_prompt", "53 में से 14 घटाइए।"),
    "build": vo("vo_g2_build", "सबसे पहले ब्लॉक्स की सहायता से 53 बनाइए।"),
    "sub": vo("vo_g2_sub", "और अब इसमें से 14 घटाइए।"),
    "rm_ones": vo("vo_g2_rm_ones", "इसमें से 4 इकाई को हटाइए।"),
    "rm_tens": vo("vo_g2_rm_tens", "अब दहाइयाँ घटाइए।"),
    "ask": ASK_PICK, "recount": RECOUNT, "h2": vo("vo_g2_h2", "53 में से 14 घटाने पर, 3 दहाई और 9 इकाई बचती हैं।"),
    "reveal": vo("vo_g2_reveal", "53 में से 14 घटाने पर 39 बचता है। तो सही संख्या यह है।"),
    "correct": vo("vo_g2_correct", "शाबाश! 53 घटा 14 बराबर 39।")},
    answer="mcq", options=[39, 12, 93], count=True, extra_data={"reveal_hand": True}))

# deck page 7 - 46 − 28 (18 / 9 / 81)
slides.append(pv_sub("G3", "guided", 46, 28, {
    "prompt": vo("vo_g3_prompt", "46 में से 28 घटाइए।"),
    "build": vo("vo_g3_build", "सबसे पहले ब्लॉक्स से 46 बनाइए।"),
    "sub": vo("vo_g3_sub", "और अब इसमें से 28 घटाइए।"),
    "rm_ones": vo("vo_g3_rm_ones", "इसमें से 8 इकाई को हटाइए।"),
    "rm_tens": vo("vo_g3_rm_tens", "अब दहाइयाँ हटाइए।"),
    "ask": ASK_PICK, "recount": RECOUNT, "h2": vo("vo_g3_h2", "46 में से 28 घटाने पर, 1 दहाई और 8 इकाई बचती हैं।"),
    "reveal": vo("vo_g3_reveal", "46 में से 28 घटाने पर 18 बचता है। तो सही संख्या यह है।"),
    "correct": vo("vo_g3_correct", "शाबाश! 46 घटा 28 बराबर 18।")},
    answer="mcq", options=[18, 9, 81], count=True, extra_data={"reveal_hand": True}))

# deck page 8 - 74 − 58, the answer typed on the number pad (16)
slides.append(pv_sub("P1", "practice", 74, 58, {
    "prompt": vo("vo_p1_prompt", "74 में से 58 घटाइए।"),
    "build": vo("vo_p1_build", "सबसे पहले ब्लॉक्स से 74 बनाइए।"),
    "sub": vo("vo_p1_sub", "और अब इसमें से 58 घटाते हैं।"),
    "rm_ones": vo("vo_p1_rm_ones", "14 इकाई में से 8 इकाई हटाइए।"),
    "rm_tens": vo("vo_p1_rm_tens", "अब दहाइयाँ घटाइए।"),
    "ask": ASK_PAD, "recount": RECOUNT, "h2": vo("vo_p1_h2", "74 में से 58 घटाने पर, 1 दहाई और 6 इकाई बचती हैं।"),
    "reveal": vo("vo_p1_reveal", "74 में से 58 घटाने पर 16 बचता है। तो सही संख्या यह है।"),
    "correct": vo("vo_p1_correct", "शाबाश! 74 में से 58 घटाने पर हमें मिला 16।")},
    answer="numpad", extra_data={"ones_first": True}))

# deck page 9 - 61 − 35, number pad (26)
slides.append(pv_sub("P2", "practice", 61, 35, {
    "prompt": vo("vo_p2_prompt", "61 में से 35 घटाइए।"),
    "build": vo("vo_p2_build", "सबसे पहले ब्लॉक्स से 61 बनाइए।"),
    "sub": vo("vo_p2_sub", "और अब इसमें से 35 घटाते हैं।"),
    "rm_ones": vo("vo_p2_rm_ones", "इकाई हटाइए।"),
    "rm_tens": vo("vo_p2_rm_tens", "अब दहाइयाँ हटाइए।"),
    "ask": ASK_PAD, "recount": RECOUNT, "h2": vo("vo_p2_h2", "61 में से 35 घटाने पर, 2 दहाई और 6 इकाई बचती हैं।"),
    "reveal": vo("vo_p2_reveal", "61 में से 35 घटाने पर 26 बचता है। तो सही संख्या यह है।"),
    "correct": vo("vo_p2_correct", "शाबाश! 61 में से 35 घटाने पर हमें मिला 26।")},
    answer="numpad", extra_data={"ones_first": True}))


def mental(sid, a, b, options):
    d = a - b
    return {"id": sid, "phase": "practice", "eis": "symbolic", "type": "MENTAL_SUB", "prompt_hi": "संख्याएँ घटाइए।",
            "audio": {"prompt": vo(f"vo_{sid.lower()}_prompt", f"{a} में से {b} घटाइए और सही संख्या चुनिए।"),
                      "order": ORDER,
                      "h2": vo(f"vo_{sid.lower()}_h2", f"{a} में से {b} घटाने पर, {d // 10} दहाई और {d % 10} इकाई बचती हैं।"),
                      "reveal": vo(f"vo_{sid.lower()}_reveal", f"{a} में से {b} घटाने पर {d} बचता है। तो सही संख्या यह है।"),
                      "correct": vo(f"vo_{sid.lower()}_correct", f"शाबाश! आपने सही संख्या चुन ली। {a} घटा {b} बराबर {d}।")},
            "data": {"a": a, "b": b, "answer": "mcq", "options": options}}


# deck page 10 - 84 − 46: the equation and three answers (38 / 42 / 83)
slides.append(mental("P3", 84, 46, [38, 42, 83]))
# deck page 11 - 91 − 14 (77 / 83 / 87)
slides.append(mental("P4", 91, 14, [77, 83, 87]))

# deck pages 12-16: deleted

# deck page 17 - the end
slides.append({"id": "CEL", "phase": "practice", "eis": "enactive", "type": "CELEBRATION", "prompt_hi": "",
               "audio": {"prompt": vo("vo_cel", "शाबाश! आपने दहाई खोलकर घटाना सीख लिया!")}, "data": {}})

# ---- checks: every number in the content is the subtraction it claims to be, and every one needs a regroup ----
for s in slides:
    d = s["data"]
    if "a" in d and "b" in d:
        assert d["a"] > d["b"], s["id"]
        (at, ao), (bt, bo) = split(d["a"]), split(d["b"])
        assert ao < bo, f"{s['id']}: needs regrouping"
        diff = d["a"] - d["b"]
        if "options" in d:
            assert d["options"].count(diff) == 1, s["id"]

phase_n = {}
for s in slides:
    phase_n[s["phase"]] = phase_n.get(s["phase"], 0) + 1

import subprocess
def clip_len(cid):
    f = os.path.join(ROOT, "assets", "voiceover", cid + ".ogg")
    if not os.path.exists(f):
        return None
    try:
        return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f],
                                    capture_output=True, text=True).stdout.strip())
    except Exception:
        return None


def weight(t):
    """a rough spoken length: a number is a word (two digits ~ 7 letters), a pause mark a beat"""
    t = re.sub(r"\d{2,}", "ooooooo", t); t = re.sub(r"\d", "ooo", t)
    return len(re.sub(r"[।,.!?—]", "oo", t))


def frac(cid, phrase, after=None):
    text = VO[cid]; i0 = text.index(after) + len(after) if after else 0
    i = text.index(phrase, i0); dur = clip_len(cid)
    pos = weight(text[:i]) / weight(text)
    if not dur:
        return round(.06 + .88 * pos, 3)
    return round((0.28 + pos * (dur - 0.28 - 0.36)) / dur, 3)


def eq_cues(cid, a, b, n, op="घटा"):
    """"... a घटा b बराबर n" - the equation's five parts lit as they are said ([Number Sync with VO])"""
    t = VO[cid]; ia = t.index(str(a))
    return [frac(cid, str(a)), frac(cid, op, after=t[:ia]), frac(cid, str(b), after=t[:ia] + str(a)),
            frac(cid, "बराबर"), frac(cid, str(n), after="बराबर")]


for sl in slides:
    au, d = sl["audio"], sl["data"]; cues = {}
    if "a" not in d:
        continue
    a, b = d["a"], d["b"]; diff = a - b
    (at, ao), (bt, bo), (rt, ro) = split(a), split(b), split(diff)
    if "h2" in au:                                   # "a में से b घटाने पर, x दहाई और y इकाई बचती हैं।"
        cues["h2"] = {"a": frac(au["h2"], str(a)), "b": frac(au["h2"], str(b), after="में से"),
                      "t": frac(au["h2"], f"{rt} दहाई"), "o": frac(au["h2"], f"{ro} इकाई")}
    if "recount" in au:
        cues["recount"] = {"t": frac(au["recount"], "दहाई"), "o": frac(au["recount"], "इकाई")}
    if "order" in au:
        cues["order"] = {"o": frac(au["order"], "इकाई"), "t": frac(au["order"], "दहाई")}
    eqs = {}
    for role in ("eq", "correct"):
        if role in au and "बराबर" in VO[au[role]]:
            eqs[role] = eq_cues(au[role], a, b, diff)
    if eqs:
        cues["eqs"] = eqs
    if sl["type"] == "PV_SUB":
        tx = VO[au["build"]]
        cues["build"] = ({"t": frac(au["build"], f"{at} दहाई"), "o": frac(au["build"], f"{ao} इकाई")} if "दहाई" in tx
                         else {"t": frac(au["build"], str(a)), "o": min(.95, frac(au["build"], str(a)) + .1)})
        tx = VO[au["sub"]]; c = {"b": frac(au["sub"], str(b))}
        if "दहाई" in tx:
            c.update({"t": frac(au["sub"], f"{bt} दहाई"), "o": frac(au["sub"], f"{bo} इकाई")})
        if "इसमें" in tx:
            c["this"] = frac(au["sub"], "इसमें")
        cues["sub"] = c
        if "regroup" in au:
            cues["regroup"] = {"o": frac(au["regroup"], f"{ao} इकाई"), "t": frac(au["regroup"], "1 दहाई")}
        if "ones_now" in au:
            cues["ones_now"] = {"o": frac(au["ones_now"], "इकाई")}
        if "ones_left" in au:
            cues["ones_left"] = {"o": frac(au["ones_left"], f"{ro} इकाई", after="बचीं")}
        cues["rm_ones"] = {"o": frac(au["rm_ones"], "इकाई")}
        tx = VO[au["rm_tens"]]
        cues["rm_tens"] = {"t": frac(au["rm_tens"], f"{at - 1} दहाई") if f"{at - 1} दहाई" in tx else frac(au["rm_tens"], "दहाइयाँ")}
    if sl["type"] == "STORY_SUB" and "learn" in au:
        cues["learn"] = {"a": frac(au["learn"], str(a)), "b": frac(au["learn"], str(b), after="में से"),
                         "q": frac(au["learn"], "कितने")}
    # File6: a portrait lights as its name is said (the story lines): role -> [[fraction, who], ...]
    if sl["type"] in ("STORY_SUB", "PV_REGROUP_DEMO"):
        names = {}
        for role, cid in au.items():
            txt = VO[cid]; hits = []
            for word, who in CAST.items():
                i = txt.find(word)
                while i >= 0:
                    hits.append([frac(cid, word, after=txt[:i] if i else None), who]); i = txt.find(word, i + 1)
            if hits:
                names[role] = sorted(hits)
        if names:
            cues["names"] = names
    if sl["type"] == "PV_REGROUP_DEMO":
        c = cues
        if "sub0" in au:
            c["sub0"] = {"a": frac(au["sub0"], str(a)), "op": frac(au["sub0"], "में से"), "b": frac(au["sub0"], str(b), after="में से"),
                         "q": frac(au["sub0"], "घटाते")}
        c["intro"] = {"n": frac(au["intro"], str(a))}
        c["digits"] = {"t": frac(au["digits"], f"{at} दहाई"), "o": frac(au["digits"], f"{ao} इकाई")}
        c["sub"] = {"a": frac(au["sub"], str(a)), "op": frac(au["sub"], "में से"), "b": frac(au["sub"], str(b), after="में से"),
                    "q": frac(au["sub"], "घटाते")}
        if f"{bo} इकाई" in VO[au["sub"]]:
            c["sub"]["o"] = frac(au["sub"], f"{bo} इकाई", after="घटाते")
        if "cant" in au:   # "5 इकाई में से 6 इकाई नहीं…": the 5 of 25, then the 6 light in the equation (user 2026-10-27)
            c["cant"] = {"o": frac(au["cant"], f"{ao} इकाई"), "b": frac(au["cant"], f"{bo} इकाई", after="में से")}
        ot = VO[au["open"]]
        c["open"] = {"o": frac(au["open"], "शून्य इकाई") if "शून्य इकाई" in ot else None,
                     "bring": frac(au["open"], "1 दहाई को"), "split": frac(au["open"], "तोड़ेंगे"),
                     "ten": frac(au["open"], "10 इकाई")}
        if "ones_now" in au:
            c["ones_now"] = {"o": frac(au["ones_now"], "इकाई")}
        c["ones_left"] = {"o": frac(au["ones_left"], f"{ro} इकाई", after="बचीं")}
        if "tens_note" in au:
            c["tens_note"] = {"t": frac(au["tens_note"], f"{rt} दहाई")}
        if "both_left" in au:
            c["both_left"] = {"t": frac(au["both_left"], f"{rt} दहाई"), "o": frac(au["both_left"], f"{ro} इकाई")}
        if "tens_left" in au:
            c["tens_left"] = {"t": frac(au["tens_left"], f"{rt} दहाई", after="बची")}
        if "rm_tens" in au:
            c["rm_tens"] = {"t": frac(au["rm_tens"], f"{at - 1} दहाई")}
        c["total"] = {"t": frac(au["total"], f"{rt} दहाई"), "o": frac(au["total"], f"{ro} इकाई"),
                      "n": frac(au["total"], "यानी", after="इकाई")}
        if "story_a" in au:
            NW = {25: "पच्चीस", 6: "छः", 30: "तीस", 17: "सत्रह"}   # (the story lines say a and b in words)
            c["story"] = {"a": frac(au["story_a"], NW[a]), "b": frac(au["story_a"], NW[b]), "n": frac(au["story_a"], "बचे"),
                          "fill": frac(au["story_b"], str(diff)), "c": frac(au["story_c"], str(diff))}
    if cues:
        d["cues"] = cues

# the landing's picture comes in on "आज हम" (S01: landing_hero.start_at, the word's time in vo_landing)
_ld = clip_len("vo_landing")
START_AT = round(frac("vo_landing", "आज हम") * _ld, 2) if _ld else 2.9

AUDIO_IDS = sorted(set(VO) | {"sfx_celebrate"})
card = {
    "version": "0.2",
    "skill_code": "MTG2A01_L04_S02",
    "lo_code": "MTG2A01_L04",
    "grade": "G2",
    "attribute": "A01",
    "skill_type": "CORE",
    "part_label": "",
    "theme": "toybox",
    "title": {"hi": "दहाई खोलकर घटाइए", "en": "Subtract horizontally with regrouping"},
    "landing_hero": {"kind": "pv_story", "people": ["madhav", "aanya"], "build": "tens", "title_look": "wall", "start_at": START_AT},
    "skill_description_hi": "दो अंकों की संख्या में से दो अंकों की संख्या (हासिल के साथ) क्षैतिज रूप में घटाता है: इकाई कम हों, तो एक दहाई खोलकर दस इकाई बनाता है।",
    "phase_distribution": phase_n,
    "scaffold_rules": {"nudge_timeout_ms": {"tutorial": 7000, "guided": 7000, "practice": 7000, "independent": 7000},
                       "max_attempts": 3},
    "signals_expected": ["slide_entered", "slide_completed", "pv_build_done", "pv_ten_opened", "pv_remove_done", "mcq_correct",
                         "numpad_correct", "mastery_score", "lesson_completed"],
    "assets": {"audio_ext": "ogg", "img_ext": "webp",
               "audio": {k: f"assets/voiceover/{k}.ogg" for k in AUDIO_IDS},
               "audio_text": {k: VO[k] for k in sorted(VO)}},
    "slides": slides,
}

# the celebration Swiftie (S01's kit): the lip-sync track measured from OUR celebration line (re-measured on every build)
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location("make_lipsync", os.path.join(HERE, "make_lipsync.py")); _ml = _ilu.module_from_spec(_spec); _spec.loader.exec_module(_ml)
_cel = os.path.join(ROOT, "assets", "voiceover", "vo_cel.ogg")
_bits, _ms = _ml.lipsync(_cel) if os.path.exists(_cel) else ("0", 25)
card["end_anim"] = {"base": "assets/celebration/", "vo": "vo_cel",
    "meta": {"cols": 6, "frames": 36, "fw": 329, "fh": 440,
             "shabaash": {"src": "cel_shabaash.webp", "pre": [0, 1, 2, 3, 4, 5], "word": list(range(6, 30)), "post": list(range(30, 36))},
             "talk": {"src": "cel_talk.webp", "open": [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32]},
             "idle": {"src": "cel_idle.webp", "loop": [0, 1, 2, 3, 4, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]}},
    "track": {"bits": _bits, "step_ms": 25, "ms": _ms}}

with open(os.path.join(ROOT, "card.json"), "w", encoding="utf-8") as f:
    json.dump(card, f, ensure_ascii=False, indent=1)
with open(os.path.join(HERE, "vo_script.json"), "w", encoding="utf-8") as f:
    json.dump({k: VO[k] for k in sorted(VO)}, f, ensure_ascii=False, indent=1)

# embed the card in index.html, and keep the page title and the landing's title in step
idx = os.path.join(ROOT, "index.html")
html = open(idx, encoding="utf-8").read()
blob = json.dumps(card, ensure_ascii=False, indent=1)
html, n = re.subn(r'(<script type="application/json" id="cardData">\n).*?(\n</script>)',
                  lambda m: m.group(1) + blob + m.group(2), html, count=1, flags=re.S)
assert n == 1, "cardData block not found in index.html"
html = re.sub(r"<title>.*?</title>", f"<title>SwiftPAL · {card['skill_code']} · {card['title']['hi']}</title>", html, count=1)
open(idx, "w", encoding="utf-8", newline="\n").write(html)
shutil.copyfile(idx, os.path.join(ROOT, "MTG2A01_L04_S02.html"))
print(f"card: {len(slides)} slides {phase_n} · {len(VO)} VO lines")
