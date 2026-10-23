#!/usr/bin/env python3
"""Generate every launcher / splash / store icon for X28 Mobile.

Run from the repo root:  python3 tools/gen_icons.py
Requires Pillow (pip install pillow).
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")
WEB = os.path.join(ROOT, "web", "assets")

MINT = (94, 234, 212)
MINT_D = (46, 230, 174)
SKY = (56, 189, 248)
DOT = (209, 250, 229)


def vertical_gradient(size, top, bottom):
    img = Image.new("RGB", (1, size))
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        px[0, y] = (
            int(top[0] + (bottom[0] - top[0]) * t),
            int(top[1] + (bottom[1] - top[1]) * t),
            int(top[2] + (bottom[2] - top[2]) * t),
        )
    return img.resize((size, size), Image.BILINEAR)


def glow(size, center, radius, color, alpha):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    steps = 14
    for i in range(steps, 0, -1):
        r = radius * i / steps
        a = int(alpha * (1 - i / steps) ** 1.6)
        d.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r], fill=color + (a,))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.035))


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def stroke(draw, p1, p2, width, color):
    draw.line([p1, p2], fill=color, width=width)
    for p in (p1, p2):
        draw.ellipse([p[0] - width / 2, p[1] - width / 2, p[0] + width / 2, p[1] + width / 2], fill=color)


def draw_mark(size, scale=0.46, with_bg=False, radius_ratio=0.225):
    """The X28 mark: a mint→sky X with a small dot."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))

    if with_bg:
        bg = vertical_gradient(size, (14, 27, 40), (6, 11, 18)).convert("RGBA")
        bg.alpha_composite(glow(size, (size * 0.78, size * 0.18), size * 0.55, MINT_D, 90))
        bg.alpha_composite(glow(size, (size * 0.15, size * 0.95), size * 0.5, SKY, 55))
        edge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ImageDraw.Draw(edge).rounded_rectangle(
            [1, 1, size - 2, size - 2], radius=size * radius_ratio,
            outline=(255, 255, 255, 26), width=max(2, size // 220))
        bg.alpha_composite(edge)
        bg.putalpha(rounded_mask(size, size * radius_ratio))
        canvas.alpha_composite(bg)

    span = size * scale
    cx, cy = size / 2, size / 2
    pad = span / 2
    a = (cx - pad, cy - pad)
    b = (cx + pad, cy + pad)
    c = (cx + pad, cy - pad)
    d = (cx - pad, cy + pad)
    width = int(size * scale * 0.30)
    if width % 2:
        width += 1

    mark = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    md = ImageDraw.Draw(mark)
    stroke(md, a, b, width, MINT)
    stroke(md, c, d, width, SKY)
    # soft light where the strokes cross
    cross = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cross)
    rr = width * 0.62
    cd.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=(255, 255, 255, 26))
    mark.alpha_composite(cross.filter(ImageFilter.GaussianBlur(size * 0.012)))

    dot_r = span * 0.105
    dcx = cx + pad + dot_r * 1.9
    dcy = cy - pad - dot_r * 1.9
    md.ellipse([dcx - dot_r, dcy - dot_r, dcx + dot_r, dcy + dot_r], fill=DOT)

    canvas.alpha_composite(mark)
    return canvas


def save(img, path, size):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print("·", os.path.relpath(path, ROOT), size)


def main():
    legacy = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    foreground = {
        "mipmap-mdpi": 108,
        "mipmap-hdpi": 162,
        "mipmap-xhdpi": 216,
        "mipmap-xxhdpi": 324,
        "mipmap-xxxhdpi": 432,
    }
    full = draw_mark(1024, scale=0.44, with_bg=True)
    for folder, size in legacy.items():
        save(full, os.path.join(RES, folder, "ic_launcher.png"), size)
        save(full, os.path.join(RES, folder, "ic_launcher_round.png"), size)

    fg = draw_mark(1024, scale=0.34, with_bg=False)
    for folder, size in foreground.items():
        save(fg, os.path.join(RES, folder, "ic_launcher_foreground.png"), size)

    save(draw_mark(1024, scale=0.46, with_bg=True), os.path.join(RES, "drawable-nodpi", "ic_splash_mark.png"), 312)
    save(draw_mark(1024, scale=0.44, with_bg=True), os.path.join(WEB, "icon-512.png"), 512)
    save(draw_mark(1024, scale=0.44, with_bg=True), os.path.join(WEB, "icon-192.png"), 192)
    for extra in ("icon-1024.png",):
        save(draw_mark(1024, scale=0.44, with_bg=True), os.path.join(WEB, extra), 1024)


if __name__ == "__main__":
    main()
