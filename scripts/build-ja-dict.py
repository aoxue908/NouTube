# -*- coding: utf-8 -*-
"""
Augment the JAPANESE_COMMON_VOCAB block of content/phonetics-data.ts from the
JMdict/EDRDG common-word dictionary, so multi-kanji words and compounds are
annotated as a whole (word-level reading) instead of falling back to a single
kanji's default on-yomi / kun-yomi.

Only the minimal form -> kana-reading fact is extracted; English glosses and
other senses are dropped. Existing hand-curated entries take priority and are
never overwritten.

Source: JMdict, compiled by Jim Breen and the EDRDG (Monash University),
released under CC BY-SA 4.0. https://www.edrdg.org/  https://www.jmdict.net/
  scripts/data/ja/jmdict-eng-common-3.6.2.json  (jmdict-simplified common pack)
  scripts/data/ja/LICENSE-CC-BY-SA-4.0.txt

Usage:
  python scripts/build-ja-dict.py            # dry run: stats + preview
  python scripts/build-ja-dict.py --write     # rewrite phonetics-data.ts
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_TS = os.path.join(ROOT, "content", "phonetics-data.ts")
SOURCE_JSON = os.path.join(ROOT, "scripts", "data", "ja", "jmdict-eng-common-3.6.2.json")

WRITE = "--write" in sys.argv

HEADER = "export const JAPANESE_COMMON_VOCAB: Record<string, string> = {"
ENTRY_RE = re.compile(r'"([^"]+)":\s*"([^"]*)"')

HAN_RE = re.compile(r"[㐀-鿿豈-﫿]")
# Word form: kanji plus kana (okurigana, small kana, long-vowel mark) only.
SHAPE_RE = re.compile(r"^[ぁ-ゖァ-ヶー㐀-鿿豈-﫿々〆ヵヶー]+$")
# Reading: hiragana/katakana only (including ー, っ, ゃゅょ).
KANA_RE = re.compile(r"^[぀-ヿー]+$")

MAX_LEN = 8
MIN_KANJI = 2

# Sentence-final particles mark a phrase, not a headword: a prefix match on
# "実は" / "又は" inside a clause picks the wrong reading for the kanji.
PARTICLE_END = set("はをにのでへともやかながねよぞさ")
# Greeting forms that collide with the plain "today/tonight" reading in a
# clause (今日は = hello, but 今日は天気です reads きょうは).
GREETING_FORMS = {"今日は", "今日わ", "今晩は"}

ATTRIBUTION = (" * Japanese compound readings augmented from JMdict/EDRDG "
               "(CC BY-SA 4.0, https://www.edrdg.org/); hand-curated entries "
               "take priority over dictionary readings.")


def parse_block(body):
    return {m.group(1): m.group(2) for m in ENTRY_RE.finditer(body)}


def choose_kana(word, kanji_text):
    """Pick the kana reading aligned to this kanji form; prefer common."""
    kanas = word.get("kana") or []
    if not kanas:
        return None
    exact = [k for k in kanas if kanji_text in (k.get("appliesToKanji") or [])]
    star = [k for k in kanas if "*" in (k.get("appliesToKanji") or [])]
    pool = exact or star or kanas
    common = [k for k in pool if k.get("common")]
    pick = (common or pool)[0]
    return pick.get("text")


def main():
    if not os.path.exists(SOURCE_JSON):
        sys.exit(f"source dictionary not found: {SOURCE_JSON}")

    ts = open(DATA_TS, encoding="utf-8").read()
    src_lines = ts.split("\n")
    try:
        hdr_idx = next(i for i, l in enumerate(src_lines) if l.startswith(HEADER))
        close_idx = next(i for i in range(hdr_idx + 1, len(src_lines)) if src_lines[i].strip() == "}")
    except StopIteration:
        sys.exit("JAPANESE_COMMON_VOCAB block not found in phonetics-data.ts")

    body = "\n".join(src_lines[hdr_idx + 1:close_idx])
    existing = parse_block(body)
    print(f"existing hand-curated entries: {len(existing)}")

    with open(SOURCE_JSON, encoding="utf-8") as f:
        data = json.load(f)

    candidates = {}
    skipped_shape = skipped_kana = skipped_dup = skipped_phrase = 0
    for word in data.get("words", []):
        for kanji in word.get("kanji") or []:
            form = kanji.get("text") or ""
            han_count = len(HAN_RE.findall(form))
            if han_count < MIN_KANJI:
                continue
            if not (2 <= len(form) <= MAX_LEN) or not SHAPE_RE.match(form):
                skipped_shape += 1
                continue
            reading = choose_kana(word, form)
            if not reading or not KANA_RE.match(reading) or reading == form:
                skipped_kana += 1
                continue
            if form in GREETING_FORMS or form[-1] in PARTICLE_END:
                skipped_phrase += 1
                continue
            if form in existing:
                skipped_dup += 1
                continue
            if form not in candidates:  # first reading wins for polyphonic forms
                candidates[form] = reading

    print(f"source compound candidates: {len(candidates)}")
    print(f"skipped (bad shape / length): {skipped_shape}")
    print(f"skipped (bad reading): {skipped_kana}")
    print(f"skipped (particle-ending phrase): {skipped_phrase}")
    print(f"kept (already hand-curated): {skipped_dup}")

    merged = dict(existing)
    # Defensive: drop any greeting/particle-ending form already present from
    # an earlier run (the hand table never ships these).
    for bad in [k for k in merged if k in GREETING_FORMS or k[-1] in PARTICLE_END]:
        del merged[bad]
    added = []
    for form, reading in candidates.items():
        if form in merged:
            continue
        merged[form] = reading
        added.append((form, reading))

    print(f"newly added from JMdict: {len(added)}")
    print(f"merged total entries: {len(merged)}")

    # regression spot checks from the reported screenshot
    for form in ["綺麗", "大人", "今日", "明日", "映画館", "気持ち", "約束", "秘密"]:
        print(f"  check {form}: {merged.get(form, 'MISSING')}")

    ordered = list(merged.items())
    entries = [f'  "{form}": "{reading}"' for form, reading in ordered]
    lines = ["export const JAPANESE_COMMON_VOCAB: Record<string, string> = {"]
    for i in range(0, len(entries), 6):
        lines.append("  " + ", ".join(entries[i:i + 6]) + ",")
    lines.append("}")
    new_block = "\n".join(lines)

    if not WRITE:
        print("\n--- dry run, first 12 added ---")
        for form, reading in added[:12]:
            print(f'  "{form}": "{reading}",')
        print("\n(dry run: re-run with --write to update phonetics-data.ts)")
        return

    if "JMdict/EDRDG" not in ts:
        ts = re.sub(
            r"(\* and English captions\. No network request is ever made for phonetics\.\n)",
            r"\1" + ATTRIBUTION + "\n",
            ts,
            count=1,
        )
        src_lines = ts.split("\n")
        hdr_idx = next(i for i, l in enumerate(src_lines) if l.startswith(HEADER))
        close_idx = next(i for i in range(hdr_idx + 1, len(src_lines)) if src_lines[i].strip() == "}")

    new_lines = src_lines[:hdr_idx] + lines + src_lines[close_idx + 1:]
    open(DATA_TS, "w", encoding="utf-8", newline="\n").write("\n".join(new_lines))
    print(f"\nWrote {DATA_TS}")


if __name__ == "__main__":
    main()
