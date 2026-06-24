#!/usr/bin/env python3
"""
Turn a full-bleed square logo into a macOS-style app icon:
artwork scaled down with transparent padding and rounded ("squircle") corners,
matching the Big Sur+ icon grid proportions.

Usage:
    python3 scripts/make-mac-icon.py <source.png> <output.png>
"""
import sys
from PIL import Image, ImageDraw

# macOS icon grid: artwork occupies ~0.80 of the canvas, corner radius ~0.225.
CANVAS = 1024
CONTENT_RATIO = 0.80
RADIUS_RATIO = 0.225


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def main() -> None:
    src_path, out_path = sys.argv[1], sys.argv[2]

    content = int(CANVAS * CONTENT_RATIO)
    radius = int(content * RADIUS_RATIO)
    offset = (CANVAS - content) // 2

    logo = Image.open(src_path).convert("RGBA").resize(
        (content, content), Image.LANCZOS
    )
    logo.putalpha(rounded_mask(content, radius))

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(logo, (offset, offset), logo)
    canvas.save(out_path)
    print(f"Wrote {out_path} ({CANVAS}x{CANVAS}, content {content}px, radius {radius}px)")


if __name__ == "__main__":
    main()
