import re
p = r"E:/player/NouTube/.karaoke_analysis/ext/content.fda02ec3.js"
s = open(p, encoding="utf-8", errors="replace").read()

def pretty(txt):
    # insert newlines after ; and braces for readability
    txt = txt.replace(";", ";\n").replace("},", "},\n").replace("function", "\nfunction")
    return txt

def dump(kw, before=200, after=2600, limit=8, fmt=True):
    idxs = [m.start() for m in re.finditer(re.escape(kw), s)]
    print(f"\n\n===================== '{kw}' count={len(idxs)} =====================")
    for i in idxs[:limit]:
        seg = s[max(0,i-before):i+after]
        print(f"\n----------- @{i} -----------")
        print(pretty(seg) if fmt else seg)

for kw in ["wordStarts", "renderLiveLine", "function h(", "updateSubtitles", "requestAnimationFrame", "getWord", "currentWord", "activeWord", "highlightWord", "snow-hl-"]:
    dump(kw)
