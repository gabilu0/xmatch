"""Gera os ícones PWA a partir da marca X usada na tela de login."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parents[1] / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

for size in (180, 192, 512):
    image = Image.new("RGB", (size, size), "#0f172a")
    draw = ImageDraw.Draw(image)
    margin = int(size * 0.14)
    draw.rounded_rectangle(
        (margin, margin, size - margin, size - margin),
        radius=int(size * 0.15),
        fill="#38bdf8",
    )
    font = ImageFont.truetype("DejaVuSans-Bold.ttf", int(size * 0.48))
    bounds = draw.textbbox((0, 0), "X", font=font)
    draw.text(
        ((size - bounds[2] + bounds[0]) / 2 - bounds[0],
         (size - bounds[3] + bounds[1]) / 2 - bounds[1]),
        "X",
        font=font,
        fill="#082f49",
    )
    image.save(OUT / f"icon-{size}.png")
