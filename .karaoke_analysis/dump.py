import re
p = r"E:/player/NouTube/.karaoke_analysis/ext/content.fda02ec3.js"
s = open(p, encoding="utf-8", errors="replace").read()

def dump(kw, before=900, after=1400, limit=10):
    idxs = [m.start() for m in re.finditer(re.escape(kw), s)]
    print(f"\n\n===================== '{kw}' count={len(idxs)} =====================")
    for i in idxs[:limit]:
        print(f"\n----------- @{i} -----------")
        print(s[max(0,i-before):i+after])

for kw in ["wordHighlight", "wordStart", "wordTime", "activeIndex", "startMs", "snow-hl", "snow-mix"]:
    dump(kw)
