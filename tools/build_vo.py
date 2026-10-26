"""Renders the lesson's Hindi VO from tools/vo_script.json (clip id -> line) into assets/voiceover/<id>.ogg.

Voice: Gemini TTS (gemini-2.5-flash-preview-tts), "Kore" - the voice of this lesson's first build. Finish as
MTG2A01_L03_S01's tools/build_vo.py: pauses inside a line pulled in to ~0.4s, x1.028 (atempo), 0.28s lead /
0.36s tail, -18.5 LUFS (two-pass loudnorm), Ogg/Opus 48 kHz mono 32 kbps. Only clips not on disk are made,
unless --force (all) or ids are named:

    python tools/build_vo.py                 # the missing ones
    python tools/build_vo.py vo_g1_prompt    # just these (re-render)
    python tools/build_vo.py --force         # everything

Key: GEMINI_KEY from the environment (never written here). Needs ffmpeg on PATH and internet.
Then run  node tools/gen_asset_sizes.js  (the preload manifest).
"""
import base64, json, os, re, struct, subprocess, sys, tempfile, time, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets", "voiceover")
MODEL, VOICE = "gemini-2.5-flash-preview-tts", os.environ.get("VO_VOICE", "Kore")
LEAD, TAIL, TEMPO, LUFS = 0.28, 0.36, 1.028, -18.5
STYLE = "Read aloud in a warm, clear, friendly Hindi voice for young children, at a calm pace: "


def wav(pcm, rate=24000):
    return (b"RIFF" + struct.pack("<I", 36 + len(pcm)) + b"WAVE" + b"fmt " +
            struct.pack("<IHHIIHH", 16, 1, 1, rate, rate * 2, 2, 16) + b"data" + struct.pack("<I", len(pcm)) + pcm)


def tts(text, key, styled):
    body = {"contents": [{"parts": [{"text": (STYLE + text) if styled else text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": VOICE}}}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    data = json.loads(urllib.request.urlopen(req, timeout=180).read().decode())
    for c in data.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                return base64.b64decode(p["inlineData"]["data"])
    raise RuntimeError("no audio: " + json.dumps(data)[:200])


def synth(text, key):
    err = None
    for attempt in range(8):
        try:
            return tts(text, key, styled=attempt % 2 == 1)      # plain first; the styled wrapper if refused
        except urllib.error.HTTPError as e:
            err = f"HTTP {e.code}"
            time.sleep(min(60, 6 * (attempt + 1)) if e.code in (429, 500, 503) else 2)
        except Exception as e:
            err = str(e)[:160]; time.sleep(3)
    raise RuntimeError(err)


def finish(src, dst):
    core = (f"silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0:"
            f"stop_periods=-1:stop_threshold=-42dB:stop_duration=0.42:stop_silence=0.40,"
            f"areverse,silenceremove=start_periods=1:start_threshold=-46dB:start_silence=0.02,areverse,"
            f"atempo={TEMPO}")
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", src, "-af",
                        core + f",loudnorm=I={LUFS}:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    m = json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])
    ln = (f"loudnorm=I={LUFS}:TP=-1.5:LRA=7:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    af = core + "," + ln + f",aresample=48000,adelay={int(LEAD * 1000)}:all=1,apad=pad_dur={TAIL}"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", af, "-ac", "1", "-ar", "48000",
                    "-c:a", "libopus", "-b:a", "32k", "-vbr", "on", "-application", "voip", dst], check=True)


def main(args):
    key = os.environ.get("GEMINI_KEY") or os.environ.get("GEMINI_API_KEY")
    if not key:
        sys.exit("set GEMINI_KEY in the environment")
    script = json.load(open(os.path.join(HERE, "vo_script.json"), encoding="utf-8"))
    force = "--force" in args
    named = [a for a in args if not a.startswith("--")]
    todo = {k: v for k, v in script.items()
            if (k in named) or (not named and (force or not os.path.exists(os.path.join(OUT, k + ".ogg"))))}
    os.makedirs(OUT, exist_ok=True)
    if not todo:
        print("VO: nothing to render"); return
    tmp = tempfile.mkdtemp(prefix="vo_")
    failed = []

    def one(item):
        k, text = item
        try:
            w = os.path.join(tmp, k + ".wav")
            open(w, "wb").write(wav(synth(text, key)))
            finish(w, os.path.join(OUT, k + ".ogg"))
            print("ok", k, flush=True)
        except Exception as e:
            failed.append(k); print("FAILED", k, e, flush=True)

    with ThreadPoolExecutor(3) as ex:
        list(ex.map(one, todo.items()))
    print(f"VO: {len(todo) - len(failed)}/{len(todo)} clips rendered" + (f"; FAILED: {failed}" if failed else ""))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main(sys.argv[1:])
