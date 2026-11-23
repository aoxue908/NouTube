# -*- coding: utf-8 -*-
"""
Rebuild the CANTONESE_CHARS block of content/phonetics-data.ts from:
  1. the existing hand-curated Jyutping readings (kept verbatim, highest priority)
  2. the open Cantonese dictionary CSV (CC BY 3.0, kfcd/yyzd) used only to fill
     characters the hand table does not know.

Re-run this script whenever the source CSV is updated. It rewrites ONLY the
CANTONESE_CHARS block; every other table in phonetics-data.ts is left untouched.

Source: https://github.com/kfcd/yyzd  (CC BY 3.0)
  scripts/data/jyut/yue-jyut-simp.csv  - Simplified-key readings
  scripts/data/jyut/yue-jyut-trad.csv  - Traditional-key readings
  scripts/data/jyut/LICENSE-CC-BY-3.0.txt

Usage:
  python scripts/build-jyut-dict.py            # dry run, print stats + preview
  python scripts/build-jyut-dict.py --write    # rewrite phonetics-data.ts
"""
import csv, io, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_TS = os.path.join(ROOT, "content", "phonetics-data.ts")

CSV_CANDIDATES = {
    "simp": [
        os.path.join(ROOT, "scripts", "data", "jyut", "yue-jyut-simp.csv"),
        os.path.join(ROOT, ".karaoke_analysis", "jyut-source", "yue-jyut-simp.csv"),
    ],
    "trad": [
        os.path.join(ROOT, "scripts", "data", "jyut", "yue-jyut-trad.csv"),
        os.path.join(ROOT, ".karaoke_analysis", "jyut-source", "yue-jyut-trad.csv"),
    ],
}

WRITE = "--write" in sys.argv

BLOCK_RE = re.compile(
    r"(export const CANTONESE_CHARS: Record<string, string> = \{)(.*?)(\n\})",
    re.S,
)
ENTRY_RE = re.compile(r'"([^"]+)":\s*"([^"]*)"')
READING_RE = re.compile(r"^[a-z]+[1-6]$")

ATTRIBUTION = (" * Cantonese Jyutping character readings augmented from "
                "kfcd/yyzd (CC BY 3.0, https://github.com/kfcd/yyzd); "
                "hand-curated entries take priority over source readings.")


def first_existing(paths):
    for p in paths:
        if os.path.exists(p):
            return p
    return None


def load_csv(paths):
    """Return {char: first-reading jyutping}, first row wins for polyphones."""
    out = {}
    path = first_existing(paths)
    if not path:
        return out
    rows = list(csv.reader(io.open(path, encoding="utf-8-sig")))
    for r in rows[1:]:
        if len(r) < 3:
            continue
        trad, simp, py = r[0].strip(), r[1].strip(), r[2].strip()
        first = re.split(r"[,，\s/]+", py)[0] if py else ""
        if not READING_RE.match(first):
            continue
        for ch in (simp, trad):
            if ch and ch not in out:
                out[ch] = first
    return out


def parse_block(body):
    return {m.group(1): m.group(2) for m in ENTRY_RE.finditer(body)}


def fmt_block(ordered_items):
    entries = [f'  "{ch}": "{py}"' for ch, py in ordered_items]
    lines = ["export const CANTONESE_CHARS: Record<string, string> = {"]
    # six entries per line, mirroring the existing hand table layout.
    for i in range(0, len(entries), 6):
        lines.append("  " + ", ".join(entries[i:i + 6]) + ",")
    lines.append("}")
    return "\n".join(lines)


def add_attribution(ts):
    if "kfcd/yyzd" in ts:
        return ts
    # Append after the leading description sentence, keeping it intact.
    return re.sub(
        r"(\* and English captions\. No network request is ever made for phonetics\.\n)",
        r"\1" + ATTRIBUTION + "\n",
        ts,
        count=1,
    )


def main():
    ts = io.open(DATA_TS, encoding="utf-8").read()
    m = BLOCK_RE.search(ts)
    if not m:
        sys.exit("CANTONESE_CHARS block not found in phonetics-data.ts")

    existing = parse_block(m.group(2))
    print(f"existing hand-curated entries: {len(existing)}")

    source = {}
    source.update(load_csv(CSV_CANDIDATES["simp"]))
    source.update(load_csv(CSV_CANDIDATES["trad"]))
    print(f"source dictionary characters: {len(source)}")

    added, kept, conflicts, dropped_bad = [], 0, 0, 0
    merged = dict(existing)  # hand readings win
    for ch, py in source.items():
        if ch in existing:
            if existing[ch] != py:
                conflicts += 1
            else:
                kept += 1
            continue
        if not READING_RE.match(py):
            dropped_bad += 1
            continue
        merged[ch] = py
        added.append((ch, py))

    print(f"kept (source agrees with hand): {kept}")
    print(f"conflicts (hand reading preserved): {conflicts}")
    print(f"newly added from source: {len(added)}")
    print(f"skipped bad readings: {dropped_bad}")
    print(f"merged total entries: {len(merged)}")

    # sanity: the characters that were missing in the reported screenshot
    for ch in ["之", "差", "應", "忠", "应", "麼", "的"]:
        print(f"  check {ch}: {merged.get(ch, 'MISSING')}")

    # keep original hand order, append new source entries after it
    ordered = list(existing.items()) + added
    new_block = fmt_block(ordered)

    if not WRITE:
        print("\n--- dry run, first 12 added ---")
        for ch, py in added[:12]:
            print(f'  "{ch}": "{py}",')
        print("\n(dry run: re-run with --write to update phonetics-data.ts)")
        return

    new_ts = add_attribution(ts[:m.start()] + new_block + ts[m.end():])
    io.open(DATA_TS, "w", encoding="utf-8", newline="\n").write(new_ts)
    print(f"\nWrote {DATA_TS}")


if __name__ == "__main__":
    main()
