import struct, zipfile, os, sys

src = r"E:/player/NouTube/.karaoke_analysis/xueqiu.crx"
outzip = r"E:/player/NouTube/.karaoke_analysis/unpacked.zip"
outdir = r"E:/player/NouTube/.karaoke_analysis/ext"

data = open(src, "rb").read()
assert data[:4] == b"Cr24", "not a crx"
version = struct.unpack_from("<I", data, 4)[0]
print("CRX version:", version)
if version == 3:
    header_len = struct.unpack_from("<I", data, 8)[0]
    zip_start = 8 + 4 + header_len
else:
    pub_len = struct.unpack_from("<I", data, 8)[0]
    sig_len = struct.unpack_from("<I", data, 12)[0]
    zip_start = 16 + pub_len + sig_len
print("zip starts at:", zip_start, "total:", len(data))
zipdata = data[zip_start:]
open(outzip, "wb").write(zipdata)
print("zip magic:", zipdata[:4])

os.makedirs(outdir, exist_ok=True)
with zipfile.ZipFile(outzip) as z:
    names = z.namelist()
    print("file count:", len(names))
    for n in names:
        print(n)
    z.extractall(outdir)
print("DONE")
