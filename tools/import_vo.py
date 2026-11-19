"""Puts RECORDED voice-over into the lesson: vo_source/recorded/<Audio ID>.<any audio ext> -> assets/voiceover/<Audio ID>.ogg

A recorded take keeps its own pace and pauses (no tempo, no pause trimming - those are build_vo.py's for the TTS); only its
ends are made the lesson's: the silence before / after the voice trimmed, then the lesson's 0.28 s lead and 0.36 s tail
(tools/lessons.py times the word-synced moments with them), -18.5 LUFS (measured, then one gain - peaks limited to -1.5 dBFS), Ogg/Opus 48 kHz mono 32 kbps.

    python tools/import_vo.py                  # every file in vo_source/recorded/
    python tools/import_vo.py vo_g1_prompt     # just these
Then:  python tools/lessons.py   and   node tools/gen_asset_sizes.js   (and bump ?v= in index.html).
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "vo_source", "recorded")
OUT = os.path.join(ROOT, "assets", "voiceover")
LEAD, TAIL, LUFS = 0.28, 0.36, -18.5
TRIM = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,"
        "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse")


def loudness(src):
    """integrated loudness (LUFS) of the trimmed voice - measured on it looped 4x, so a one-word clip (under 3 s, too short
    for the meter) is measured as well as a long line (a loop has the same loudness as the clip)"""
    p = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-stream_loop", "3", "-i", src, "-af",
                        TRIM + ",loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True, encoding="utf-8", errors="replace")
    return float(json.loads(re.findall(r"\{[^{}]*\}", p.stderr)[-1])["input_i"])


def finish(src, dst):
    gain = LUFS - loudness(src)
    af = TRIM + f",volume={gain:.2f}dB,alimiter=limit=0.84:attack=2:release=40:level=false,aresample=48000,adelay={int(LEAD * 1000)}:all=1,apad=pad_dur={TAIL}"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-af", af, "-ac", "1", "-ar", "48000",
                    "-c:a", "libopus", "-b:a", "32k", "-vbr", "on", "-application", "voip", dst], check=True)


def main(names):
    files = sorted(f for f in os.listdir(SRC) if os.path.splitext(f)[1].lower() in (".mp3", ".wav", ".ogg", ".m4a", ".flac"))
    done = 0
    for f in files:
        cid = os.path.splitext(f)[0]
        if names and cid not in names:
            continue
        finish(os.path.join(SRC, f), os.path.join(OUT, cid + ".ogg")); done += 1
    print(f"imported {done} recorded clips into assets/voiceover/")


if __name__ == "__main__":
    main(sys.argv[1:])
