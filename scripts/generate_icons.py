"""Render AutoDex's simple vector mark into Chrome's required PNG icon sizes."""

from pathlib import Path
import math
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"


def png_chunk(kind: bytes, data: bytes) -> bytes:
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def render(size: int) -> bytes:
    scale = 4
    dim = size * scale
    pixels = bytearray(dim * dim * 4)
    corner = int(dim * 0.266)
    for y in range(dim):
        if y < corner:
            inset = corner - math.sqrt(max(0, corner * corner - (corner - y) ** 2))
        elif y >= dim - corner:
            inset = corner - math.sqrt(max(0, corner * corner - (y - (dim - corner)) ** 2))
        else:
            inset = 0
        left, right = int(inset), dim - int(inset)
        t = y / max(1, dim - 1)
        top = (34, 111, 84)
        bottom = (14, 73, 54)
        color = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
        row = bytes(color) * (right - left)
        start = (y * dim + left) * 4
        pixels[start:start + len(row)] = row

    factor = dim / 512

    def paint(x: int, y: int, color: tuple[int, int, int, int]):
        if 0 <= x < dim and 0 <= y < dim:
            index = (y * dim + x) * 4
            pixels[index:index + 4] = bytes(color)

    def line(a, b, width, color):
        ax, ay = a[0] * factor, a[1] * factor
        bx, by = b[0] * factor, b[1] * factor
        radius = width * factor / 2
        min_x, max_x = max(0, int(min(ax, bx) - radius - 1)), min(dim, int(max(ax, bx) + radius + 2))
        min_y, max_y = max(0, int(min(ay, by) - radius - 1)), min(dim, int(max(ay, by) + radius + 2))
        vx, vy = bx - ax, by - ay
        length_sq = vx * vx + vy * vy
        for py in range(min_y, max_y):
            for px in range(min_x, max_x):
                t = max(0, min(1, ((px + .5 - ax) * vx + (py + .5 - ay) * vy) / length_sq))
                dx, dy = px + .5 - (ax + t * vx), py + .5 - (ay + t * vy)
                if dx * dx + dy * dy <= radius * radius:
                    paint(px, py, color)

    white = (246, 255, 248, 255)
    line((160, 365), (256, 143), 42, white)
    line((256, 143), (352, 365), 42, white)
    line((202, 282), (310, 282), 37, white)

    # A small four-point mint sparkle gives the mark a quick-fill cue.
    cx, cy = 388 * factor, 153 * factor
    rx, ry = 22 * factor, 22 * factor
    inner_x, inner_y = 7 * factor, 7 * factor
    polygon = [(cx, cy - ry), (cx + inner_x, cy - inner_y), (cx + rx, cy),
               (cx + inner_x, cy + inner_y), (cx, cy + ry), (cx - inner_x, cy + inner_y),
               (cx - rx, cy), (cx - inner_x, cy - inner_y)]
    min_y = max(0, int(cy - ry - 1))
    max_y = min(dim, int(cy + ry + 2))
    min_x = max(0, int(cx - rx - 1))
    max_x = min(dim, int(cx + rx + 2))
    for py in range(min_y, max_y):
        for px in range(min_x, max_x):
            inside = False
            j = len(polygon) - 1
            for i, (xi, yi) in enumerate(polygon):
                xj, yj = polygon[j]
                if ((yi > py) != (yj > py)) and px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi:
                    inside = not inside
                j = i
            if inside:
                paint(px, py, (166, 239, 192, 255))

    # Average each 4x4 sample block for crisp, antialiased PNGs.
    final = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            sums = [0, 0, 0, 0]
            for sy in range(scale):
                for sx in range(scale):
                    index = (((y * scale + sy) * dim) + x * scale + sx) * 4
                    for channel in range(4):
                        sums[channel] += pixels[index + channel]
            out = (y * size + x) * 4
            final[out:out + 4] = bytes(round(value / (scale * scale)) for value in sums)

    scanlines = b"".join(b"\0" + final[y * size * 4:(y + 1) * size * 4] for y in range(size))
    return b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + png_chunk(b"IDAT", zlib.compress(scanlines, 9)) + png_chunk(b"IEND", b"")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        (OUT / f"icon{size}.png").write_bytes(render(size))


if __name__ == "__main__":
    main()
