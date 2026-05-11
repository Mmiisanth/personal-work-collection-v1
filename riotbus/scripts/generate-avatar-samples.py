from pathlib import Path
import math
import random
import subprocess

SIZE = 512
ROOT = Path(__file__).resolve().parents[1]
TMP = Path("/private/tmp/riotbus-avatar-ppm")
TMP.mkdir(parents=True, exist_ok=True)

OUT = ROOT / "public" / "assets" / "artists"


def clamp(value):
    return max(0, min(255, int(value)))


def mix(a, b, t):
    return tuple(clamp(a[i] * (1 - t) + b[i] * t) for i in range(3))


def add(a, delta):
    return tuple(clamp(v + delta) for v in a)


def point_in_poly(x, y, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        intersect = ((yi > y) != (yj > y)) and (
            x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-6) + xi
        )
        if intersect:
            inside = not inside
        j = i
    return inside


def draw_polygon(pixels, poly, color):
    min_x = max(0, int(min(x for x, _ in poly)))
    max_x = min(SIZE - 1, int(max(x for x, _ in poly)))
    min_y = max(0, int(min(y for _, y in poly)))
    max_y = min(SIZE - 1, int(max(y for _, y in poly)))
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            if point_in_poly(x + 0.5, y + 0.5, poly):
                pixels[y][x] = color


def draw_ellipse(pixels, cx, cy, rx, ry, color):
    for y in range(max(0, cy - ry), min(SIZE, cy + ry + 1)):
        for x in range(max(0, cx - rx), min(SIZE, cx + rx + 1)):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1:
                pixels[y][x] = color


def draw_line(pixels, x1, y1, x2, y2, color, width=3):
    steps = max(abs(x2 - x1), abs(y2 - y1), 1)
    for index in range(steps + 1):
        t = index / steps
        x = round(x1 * (1 - t) + x2 * t)
        y = round(y1 * (1 - t) + y2 * t)
        draw_ellipse(pixels, x, y, width, width, color)


def make_avatar(spec):
    rng = random.Random(spec["seed"])
    bg1, bg2 = spec["bg"]
    pixels = []
    for y in range(SIZE):
        row = []
        for x in range(SIZE):
            t = (x * 0.62 + y * 0.38) / SIZE
            base = mix(bg1, bg2, t)
            noise = rng.randint(-8, 8)
            row.append(add(base, noise))
        pixels.append(row)

    # Acid diagonal shard background.
    for index in range(9):
        x0 = -120 + index * 88 + rng.randint(-12, 12)
        color = add(mix(bg2, spec["accent"], 0.45), rng.randint(-18, 18))
        draw_polygon(
            pixels,
            [
                (x0, 0),
                (x0 + 54, 0),
                (x0 + 292, SIZE),
                (x0 + 220, SIZE),
            ],
            color,
        )

    skin = spec["skin"]
    shade = add(skin, -28)
    light = add(skin, 24)
    hair = spec["hair"]
    hair_hi = add(hair, 36)
    outfit = spec["outfit"]

    # Neck and shoulders.
    draw_polygon(pixels, [(214, 318), (298, 318), (324, 422), (188, 422)], shade)
    if spec["artist"] == "gaga":
        draw_polygon(pixels, [(92, 512), (170, 396), (256, 454), (342, 396), (420, 512)], outfit)
        draw_polygon(pixels, [(92, 512), (170, 396), (104, 360), (46, 512)], add(outfit, -18))
        draw_polygon(pixels, [(342, 396), (408, 360), (466, 512), (420, 512)], add(outfit, -18))
    else:
        draw_polygon(pixels, [(112, 432), (400, 432), (470, 512), (42, 512)], outfit)
        draw_polygon(pixels, [(156, 420), (356, 420), (388, 512), (124, 512)], add(outfit, 28))

    # Face faceted planes.
    face = [(170, 132), (342, 132), (384, 230), (346, 344), (256, 392), (166, 344), (128, 230)]
    draw_polygon(pixels, face, skin)
    draw_polygon(pixels, [(170, 132), (256, 112), (256, 392), (166, 344), (128, 230)], add(skin, 8))
    draw_polygon(pixels, [(256, 112), (342, 132), (384, 230), (346, 344), (256, 392)], shade)
    draw_polygon(pixels, [(202, 180), (256, 132), (312, 182), (258, 226)], light)
    draw_polygon(pixels, [(196, 250), (256, 226), (258, 342), (190, 322)], add(skin, 14))
    draw_polygon(pixels, [(258, 226), (326, 250), (322, 322), (258, 342)], add(shade, -6))

    # Hair silhouette varies by artist/mode.
    if spec["artist"] == "taylor":
        draw_polygon(pixels, [(124, 128), (176, 62), (266, 48), (356, 76), (394, 148), (352, 174), (256, 126), (168, 170)], hair)
        draw_polygon(pixels, [(132, 156), (176, 116), (162, 350), (104, 364), (90, 236)], hair)
        draw_polygon(pixels, [(342, 132), (398, 166), (420, 322), (360, 354), (340, 220)], add(hair, -18))
        draw_polygon(pixels, [(178, 82), (254, 54), (248, 128), (150, 156)], hair_hi)
        # Sharp blonde bangs: the most important Taylor cue.
        draw_polygon(pixels, [(168, 122), (214, 98), (208, 176), (174, 188)], add(hair, -10))
        draw_polygon(pixels, [(206, 100), (256, 82), (252, 180), (214, 176)], hair_hi)
        draw_polygon(pixels, [(250, 84), (312, 100), (296, 176), (254, 180)], add(hair, -4))
    else:
        draw_polygon(pixels, [(126, 120), (200, 64), (306, 60), (386, 126), (372, 176), (256, 118), (142, 176)], hair)
        draw_polygon(pixels, [(136, 176), (184, 138), (166, 334), (112, 332), (96, 232)], add(hair, -10))
        draw_polygon(pixels, [(330, 138), (386, 176), (408, 330), (350, 336), (330, 230)], hair)
        draw_polygon(pixels, [(210, 72), (300, 70), (326, 126), (244, 112)], hair_hi)
        # Platinum sculptural front piece for Gaga.
        draw_polygon(pixels, [(188, 78), (252, 42), (332, 78), (286, 122), (220, 120)], add(hair, 16))
        draw_polygon(pixels, [(144, 130), (204, 92), (182, 190), (128, 210)], add(hair, 8))

    # Face features.
    if spec["artist"] == "gaga" and spec["mode"] == "mean":
        # Black angular sunglasses.
        draw_polygon(pixels, [(178, 216), (240, 206), (234, 246), (180, 248)], (8, 8, 8))
        draw_polygon(pixels, [(276, 206), (338, 216), (336, 248), (282, 246)], (8, 8, 8))
        draw_polygon(pixels, [(236, 224), (280, 224), (280, 234), (236, 234)], (8, 8, 8))
    else:
        draw_polygon(pixels, [(190, 232), (230, 224), (226, 238), (190, 242)], (10, 10, 10))
        draw_polygon(pixels, [(286, 224), (326, 232), (326, 242), (290, 238)], (10, 10, 10))
    draw_polygon(pixels, [(250, 238), (272, 292), (244, 294)], add(shade, -24))
    draw_polygon(pixels, [(212, 318), (300, 318), (278, 340), (236, 340)], spec["lip"])

    # Artist-specific glyphs: no text labels, just visual cues.
    if spec["artist"] == "taylor":
        if spec["mode"] == "mean":
            # Snake curve + black star.
            draw_line(pixels, 92, 112, 120, 92, (8, 8, 8), 5)
            draw_line(pixels, 120, 92, 156, 124, (8, 8, 8), 5)
            draw_line(pixels, 156, 124, 112, 166, (8, 8, 8), 5)
            draw_polygon(pixels, [(382, 64), (398, 108), (444, 112), (408, 138), (420, 184), (382, 156), (344, 184), (356, 138), (320, 112), (366, 108)], (8, 8, 8))
        else:
            # Lyric sheet + star.
            draw_polygon(pixels, [(78, 104), (146, 86), (164, 164), (96, 182)], (255, 248, 220))
            draw_line(pixels, 98, 126, 144, 114, (80, 60, 50), 2)
            draw_line(pixels, 102, 146, 148, 134, (80, 60, 50), 2)
            draw_polygon(pixels, [(386, 92), (398, 126), (432, 128), (404, 148), (414, 182), (386, 162), (358, 182), (368, 148), (340, 128), (374, 126)], spec["accent"])
    else:
        if spec["mode"] == "mean":
            # Lightning + stage dot.
            draw_polygon(pixels, [(388, 62), (438, 62), (406, 126), (448, 126), (358, 220), (382, 148), (338, 148)], spec["accent"])
            draw_ellipse(pixels, 112, 126, 28, 28, (8, 8, 8))
        else:
            # Silver mic + spotlight.
            draw_polygon(pixels, [(82, 110), (116, 88), (140, 130), (104, 152)], (220, 220, 224))
            draw_line(pixels, 116, 144, 154, 202, (30, 30, 30), 4)
            draw_ellipse(pixels, 396, 116, 34, 34, spec["accent"])

    ppm = TMP / f"{spec['file']}.ppm"
    jpg = OUT / spec["mode"] / f"{spec['file']}.jpg"
    with ppm.open("w") as handle:
        handle.write(f"P3\n{SIZE} {SIZE}\n255\n")
        for row in pixels:
            handle.write(" ".join(f"{r} {g} {b}" for r, g, b in row))
            handle.write("\n")
    subprocess.run(["sips", "-s", "format", "jpeg", str(ppm), "--out", str(jpg)], check=True, stdout=subprocess.DEVNULL)


SPECS = [
    {
        "file": "taylor-swift-mean",
        "artist": "taylor",
        "mode": "mean",
        "seed": 101,
        "bg": [(127, 255, 0), (0, 213, 255)],
        "accent": (255, 79, 216),
        "skin": (238, 190, 150),
        "hair": (226, 192, 96),
        "outfit": (20, 20, 20),
        "lip": (170, 52, 76),
        "hair_shape": "waves",
    },
    {
        "file": "taylor-swift-neutral",
        "artist": "taylor",
        "mode": "neutral",
        "seed": 102,
        "bg": [(255, 79, 216), (155, 92, 255)],
        "accent": (234, 255, 61),
        "skin": (244, 198, 160),
        "hair": (238, 204, 118),
        "outfit": (255, 246, 232),
        "lip": (196, 72, 98),
        "hair_shape": "waves",
    },
    {
        "file": "lady-gaga-mean",
        "artist": "gaga",
        "mode": "mean",
        "seed": 201,
        "bg": [(127, 255, 0), (0, 213, 255)],
        "accent": (255, 79, 216),
        "skin": (232, 180, 142),
        "hair": (246, 238, 194),
        "outfit": (12, 12, 12),
        "lip": (110, 24, 42),
        "hair_shape": "bob",
    },
    {
        "file": "lady-gaga-neutral",
        "artist": "gaga",
        "mode": "neutral",
        "seed": 202,
        "bg": [(255, 79, 216), (155, 92, 255)],
        "accent": (234, 255, 61),
        "skin": (238, 188, 150),
        "hair": (248, 238, 204),
        "outfit": (250, 238, 255),
        "lip": (180, 48, 78),
        "hair_shape": "bob",
    },
]


for spec in SPECS:
    make_avatar(spec)

print("Generated", len(SPECS), "avatar samples")
