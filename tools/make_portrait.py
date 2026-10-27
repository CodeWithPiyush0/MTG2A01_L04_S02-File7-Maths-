"""make_portrait.py <src.png> <blink.png> <out_base> <disc r,g,b> - S01's round portrait (400px: white ring, coloured disc,
the head and shoulders inside), from a Gemini picture on a flat magenta-ish background; the blink copy gets the very same
placement. Prints the eyes-open / eyes-shut silhouette overlap (alignment check)."""
import sys
import numpy as np
from PIL import Image, ImageDraw
src, blink, out, disc = sys.argv[1], sys.argv[2], sys.argv[3], tuple(int(v) for v in sys.argv[4].split(","))
N, RING, SS = 400, 17, 4

def key(path):
    """the background = the near-magenta area CONNECTED TO THE EDGES (flood fill), so no colour inside the figure is ever
    touched; the outline is softened by one pixel and only its magenta-tinted pixels are cleaned (B well above G = spill)"""
    from PIL import ImageDraw, ImageFilter
    img = Image.open(path).convert("RGB"); a = np.asarray(img).astype(np.float32)
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    near = Image.fromarray(np.where(d < 75, 255, 0).astype(np.uint8), "L").copy()   # (copy: an array-backed image is read-only - the fill did nothing)
    h, w = d.shape
    for x in range(0, w, 8):
        for y in (6, h - 7):
            if near.getpixel((x, y)) == 255: ImageDraw.floodfill(near, (x, y), 128)
    for y in range(0, h, 8):
        for x in (6, w - 7):
            if near.getpixel((x, y)) == 255: ImageDraw.floodfill(near, (x, y), 128)
    bgm = np.asarray(near) == 128
    bgm |= d < 50                                                 # pockets enclosed by hair (between braids and neck): near-exact background colour
    bgm[:6] = bgm[-6:] = True; bgm[:, :6] = bgm[:, -6:] = True     # (the outermost pixels are off-colour: always background)
    alpha = Image.fromarray(np.where(bgm, 0, 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.0))
    al = np.asarray(alpha).astype(np.float32) / 255
    edge = (al < 0.999) & (al > 0)
    grown = np.asarray(Image.fromarray((bgm * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(7))) > 0
    fg = a.copy(); R, G, B = fg[..., 0], fg[..., 1], fg[..., 2]
    spill = (grown | edge) & (B > G + 15) & (R > G + 15)
    m = np.minimum(R, B) - G
    R[spill] -= m[spill] * 0.85; B[spill] -= m[spill] * 0.85
    fg = np.clip(fg, 0, 255)
    return np.dstack([fg, al * 255]).astype(np.uint8), al

im, al = key(src); imb, alb = key(blink)
ys, xs = np.where(al > 0.5); top, bot = ys.min(), ys.max(); cx = (xs.min() + xs.max()) / 2
inner = N / 2 - RING                                   # the disc's radius
s = (N - RING - 31 + 0.0) / (bot - top)               # hair top at 31px, the shoulders' cut at the disc's bottom edge
both = (al > 0.5); both_b = (alb > 0.5)
iou = (both & both_b).sum() / max((both | both_b).sum(), 1)

def build(rgba, path):
    big = N * SS
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0)); dr = ImageDraw.Draw(canvas)
    dr.ellipse([0, 0, big - 1, big - 1], fill=(255, 255, 255, 255))
    dr.ellipse([RING * SS, RING * SS, big - RING * SS - 1, big - RING * SS - 1], fill=disc + (255,))
    fig = Image.fromarray(rgba, "RGBA")
    w, h = fig.size; k = s * SS
    fig = fig.resize((round(w * k), round(h * k)), Image.LANCZOS)
    ox, oy = round(big / 2 - cx * k), round(31 * SS - top * k)
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0)); layer.paste(fig, (ox, oy), fig)
    mask = Image.new("L", (big, big), 0); ImageDraw.Draw(mask).ellipse([RING * SS, RING * SS, big - RING * SS - 1, big - RING * SS - 1], fill=255)
    la = np.asarray(layer).copy(); la[..., 3] = (la[..., 3].astype(np.float32) * np.asarray(mask) / 255).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(la, "RGBA"))
    canvas.resize((N, N), Image.LANCZOS).save(path, "WEBP", quality=90, method=6)

build(im, out + ".webp"); build(imb, out + "_blink.webp")
print(out, "scale %.3f" % s, "eyes open/shut overlap %.3f" % iou)
