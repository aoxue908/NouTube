import re
p = r"E:/player/NouTube/.karaoke_analysis/ext/content.fda02ec3.js"
s = open(p, encoding="utf-8", errors="replace").read()
print("length:", len(s))

for kw in ["karaoke", "Karaoke", "KARAOKE"]:
    idxs = [m.start() for m in re.finditer(kw, s)]
    print(f"\n===== '{kw}' count={len(idxs)} =====")
    for i in idxs[:40]:
        ctx = s[max(0,i-400):i+400]
        print(f"\n--- @{i} ---\n{ctx}")
