import json, os

base = r"E:/player/NouTube/locales"
zh = {
    "label": "逐词高亮字幕",
    "hint": "播放时逐个高亮正在读到的原文单词（卡拉OK效果）。需要该视频提供字幕。",
    "colorLabel": "高亮颜色",
}
zh_hant = {
    "label": "逐字高亮字幕",
    "hint": "播放時逐個高亮正在讀到的原文單字（卡拉OK效果）。需要該影片提供字幕。",
    "colorLabel": "高亮顏色",
}
en = {
    "label": "Karaoke word highlighting",
    "hint": "Highlight each word as it is spoken, like karaoke. Requires captions to be available for the video.",
    "colorLabel": "Highlight color",
}

special = {"zh_Hans": zh, "zh_Hant": zh_hant, "en": en}

for name in sorted(os.listdir(base)):
    if not name.endswith(".json"):
        continue
    path = os.path.join(base, name)
    with open(path, encoding="utf-8") as f:
        raw = f.read()
    try:
        data = json.loads(raw)
    except Exception as e:
        print("SKIP (parse error)", name, e)
        continue
    settings = data.get("settings")
    if not isinstance(settings, dict):
        print("SKIP (no settings)", name)
        continue
    lang = name[:-5]
    settings["karaokeHighlight"] = special.get(lang, en)
    out = json.dumps(data, ensure_ascii=False, indent=2)
    out = out.replace("\n", "\r\n") + "\r\n"
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(out)
    print("updated", name)
