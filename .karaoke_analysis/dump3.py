import re
p = r"E:/player/NouTube/.karaoke_analysis/ext/content.fda02ec3.js"
s = open(p, encoding="utf-8", errors="replace").read()

def dump(kw, before=150, after=900, limit=6):
    idxs = [m.start() for m in re.finditer(re.escape(kw), s)]
    print(f"\n===== '{kw}' count={len(idxs)} =====")
    for i in idxs[:limit]:
        seg = s[max(0,i-before):i+after]
        print(f"\n--- @{i} ---\n{seg.replace(';',';\n').replace('function ','\nfunction ')}")

# getThemeHighlightColor definition (a=)
dump("getThemeHighlightColor")
# findWordsInRange
dump("findWordsInRange", after=1400)
# data-snow-hl
dump("data-snow-hl", before=300, after=200)
