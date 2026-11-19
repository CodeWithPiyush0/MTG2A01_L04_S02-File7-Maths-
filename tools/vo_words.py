"""Measures when each word is said in the lesson's VO clips -> tools/vo_words.json  {clip id: [[word, start, end], ...]} (s).

tools/lessons.py reads it: every cue (the equation lit part by part, the table's words pulsing, the cover's beats) is the
time its word is said in the clip, found by lining the line's text up with these words. Re-run after any VO change:

    python tools/vo_words.py                 # every clip in tools/vo_script.json
    python tools/vo_words.py vo_g1_eq ...    # just these

Needs faster-whisper (pip install faster-whisper; the "small" model, ~0.5 GB, downloads once) and ffmpeg on PATH.
Whisper's word starts run a little early (a word starts where the one before it ended, pause and all): a start is moved
to the end of a pause (-38 dB, 60 ms+) that begins near it, i.e. to where the voice really comes in.
"""
import json, os, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

HERE = os.path.dirname(os.path.abspath(__file__))
VO = os.path.join(os.path.dirname(HERE), "assets", "voiceover")
OUT = os.path.join(HERE, "vo_words.json")


def pauses(f):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", f, "-af", "silencedetect=n=-38dB:d=0.06", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace").stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", e)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", e)]
    return list(zip(st, en))


def words(model, cid):
    f = os.path.join(VO, cid + ".ogg")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    segs, _ = model.transcribe(np.frombuffer(pcm, np.int16).astype(np.float32) / 32768, language="hi",
                               word_timestamps=True, beam_size=5, vad_filter=False)
    ws = [[w.word.strip(), w.start, w.end] for s in segs for w in s.words if w.word.strip()]
    ps = pauses(f)
    for w in ws:
        near = [b for a, b in ps if w[1] - .25 <= a <= w[1] + .15 and b < w[2]]
        if near:
            w[1] = max(near)
    return [[w, round(a, 2), round(b, 2)] for w, a, b in ws]


def main(ids):
    script = json.load(open(os.path.join(HERE, "vo_script.json"), encoding="utf-8"))
    ids = ids or [k for k in script if os.path.exists(os.path.join(VO, k + ".ogg"))]
    data = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    model = WhisperModel("small", device="cpu", compute_type="int8")
    for k in ids:
        data[k] = words(model, k)
        print(k, " ".join(f"{w}@{a}" for w, a, _ in data[k]), flush=True)
    data = {k: data[k] for k in sorted(data) if k in script}
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write("{\n" + ",\n".join(f" {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)}" for k, v in data.items()) + "\n}\n")
    print(f"vo_words.json: {len(data)} clips")


if __name__ == "__main__":
    main(sys.argv[1:])
