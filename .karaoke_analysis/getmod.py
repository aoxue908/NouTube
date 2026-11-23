import re, os
p = r"E:/player/NouTube/.karaoke_analysis/ext/content.fda02ec3.js"
s = open(p, encoding="utf-8", errors="replace").read()

# find module start for 1E1Tx (Renderer)
m = re.search(r'"1E1Tx":\[', s)
start = m.start()
print("module start:", start)
# find next module marker of form ],"XXXX": [ or ,"XXXX":[
tail = s[start:]
mm = re.search(r'\],"[0-9A-Za-z]{5}":\[', tail[10:])
end = start + 10 + mm.start() + 1 if mm else start+200000
print("module end approx:", end, "len:", end-start)
mod = s[start:end]

# pretty print
pretty = mod.replace(";", ";\n").replace("},", "},\n").replace("function ", "\nfunction ").replace("else", "\nelse")
out = r"E:/player/NouTube/.karaoke_analysis/renderer_mod.txt"
open(out, "w", encoding="utf-8").write(pretty)
print("written to", out, "lines:", pretty.count("\n"))
print("\n===== exports line =====")
print(mod[:1500])
