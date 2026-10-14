import json
import urllib.request
import io
import colorsys
import concurrent.futures
from PIL import Image

def rgb_to_hex(r, g, b):
    return f"#{r:02x}{g:02x}{b:02x}"

def analyze_palette(colors):
    candidates = []
    for r, g, b in colors:
        h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
        if v > 0.94 and s < 0.12:
            continue
        if v < 0.06:
            continue
        score = (s ** 1.2) * 2.2 + (1.0 - abs(v - 0.40)) * 1.0
        candidates.append((score, (r, g, b), (h, s, v)))

    if not candidates:
        return "#1b1d22", "#30343f"

    candidates.sort(key=lambda x: x[0], reverse=True)
    best_rgb = candidates[0][1]
    h, s, v = candidates[0][2]

    if s < 0.10:
        return "#191b20", "#323742"

    v_hero = max(0.28, min(0.48, v))
    s_hero = max(0.32, min(0.72, s))
    r1, g1, b1 = [int(c * 255) for c in colorsys.hsv_to_rgb(h, s_hero, v_hero)]

    v_dark = max(0.12, min(0.20, v_hero * 0.48))
    s_dark = min(0.85, s_hero * 1.1)
    r0, g0, b0 = [int(c * 255) for c in colorsys.hsv_to_rgb(h, s_dark, v_dark)]

    return rgb_to_hex(r0, g0, b0), rgb_to_hex(r1, g1, b1)

def get_fallback_color(title):
    palettes = [
        ("#1f242d", "#364052"),
        ("#2c1d1a", "#5c3830"),
        ("#1a2624", "#2d4742"),
        ("#291e2b", "#523857"),
        ("#26221a", "#4f4430"),
        ("#1a222e", "#2c3e57"),
        ("#2b1a1c", "#572e33"),
    ]
    idx = sum(ord(c) for c in title) % len(palettes)
    return palettes[idx]

def process_book(book):
    url = book.get("coverUrl")
    if not url:
        dark, hero = get_fallback_color(book.get("title", ""))
        return book["id"], dark, hero

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=6).read()
        im = Image.open(io.BytesIO(data)).convert("RGB")
        im.thumbnail((60, 90))
        res = im.quantize(colors=12, method=2)
        pal = res.getpalette()[:36]
        colors = [tuple(pal[i:i+3]) for i in range(0, 36, 3)]
        dark, hero = analyze_palette(colors)
        return book["id"], dark, hero
    except Exception as e:
        dark, hero = get_fallback_color(book.get("title", ""))
        return book["id"], dark, hero

def main():
    with open("data/books.json", "r", encoding="utf-8") as f:
        books = json.load(f)

    print(f"Starting hero color generation for {len(books)} books...")
    color_map = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        results = list(executor.map(process_book, books))

    for bid, dark, hero in results:
        color_map[bid] = (dark, hero)

    for book in books:
        bid = book["id"]
        dark, hero = color_map.get(bid, get_fallback_color(book.get("title", "")))
        book["heroColorDark"] = dark
        book["heroColor"] = hero

    with open("data/books.json", "w", encoding="utf-8") as f:
        json.dump(books, f, ensure_ascii=False, indent=2)

    print("Successfully updated data/books.json with hero colors!")

if __name__ == "__main__":
    main()
