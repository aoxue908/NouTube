import re, os
base = r"E:/player/NouTube/.karaoke_analysis/ext"

# 1) look at CSS for highlight/word/active styling
for css in ["content.4c6d35ed.css", "content.33e7798f.css", "bilibili.ccd1b1a2.css"]:
    p = os.path.join(base, css)
    if not os.path.exists(p): continue
    s = open(p, encoding="utf-8", errors="replace").read()
    print(f"\n########## CSS {css} len={len(s)} ##########")
    for kw in ["highlight", "word", "active", "karaoke", "current", "playing", "-hl", "focus"]:
        idxs = [m.start() for m in re.finditer(kw, s, re.I)]
        if idxs:
            print(f"  [{kw}] count={len(idxs)}")
            for i in idxs[:4]:
                print("   ...", s[max(0,i-120):i+180].replace("\n"," "))

# 2) JS keyword scan with counts
js = os.path.join(base, "content.fda02ec3.js")
s = open(js, encoding="utf-8", errors="replace").read()
kws = ["wordLevel", "word-level", "wordLevelTimings", "activeWord", "currentWord",
       "highlightWord", "wordHighlight", "wordStart", "wordEnd", "wordTime",
       "wordTiming", "word_timing", "karaoke", "perWord", "wordIndex",
       "onActive", "activeIndex", "curWord", "wordSpan", "word-time",
       "startMs", "endMs", "timing", "subtitle", "cue", "caption"]
print("\n\n########## JS keyword counts (content.js) ##########")
for kw in kws:
    c = len(re.findall(re.escape(kw), s, re.I))
    if c:
        print(f"  {kw}: {c}")
