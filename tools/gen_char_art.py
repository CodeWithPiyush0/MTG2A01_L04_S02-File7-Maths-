"""imggen.py <ref.png> <out.png> <prompt> [model] - Gemini image generation/edit with one reference image."""
import base64, json, os, sys, urllib.request, urllib.error
ref, out, prompt = sys.argv[1], sys.argv[2], sys.argv[3]
model = sys.argv[4] if len(sys.argv) > 4 else "gemini-2.5-flash-image"
key = os.environ["GEMINI_KEY"]
body = {"contents": [{"parts": [{"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(ref, "rb").read()).decode()}},
                                {"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE", "TEXT"]}}
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
try:
    r = json.loads(urllib.request.urlopen(urllib.request.Request(url, json.dumps(body).encode(), {"Content-Type": "application/json"}), timeout=180).read())
except urllib.error.HTTPError as e:
    sys.exit("HTTP %d %s" % (e.code, e.read()[:300]))
for c in r.get("candidates", []):
    for p in c.get("content", {}).get("parts", []):
        if "inlineData" in p:
            open(out, "wb").write(base64.b64decode(p["inlineData"]["data"])); print("ok", out); sys.exit(0)
sys.exit("no image: " + json.dumps(r)[:400])
