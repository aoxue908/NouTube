// 模型（识别 311 MB）不随扩展打包，用到时从这里下载并缓存。
// 文件在 subkun.com 的 /live-transcribe/ 下（和网站的实况字幕页共用一份）：
// 同名文件内容不变，换模型就换文件名，所以边缘和浏览器都按一年缓存。
window.GRANITE_ASSET_BASE = 'https://subkun.com/live-transcribe/';

// 要下载的全部文件：Cache Storage 库名 -> 相对 GRANITE_ASSET_BASE 的路径。
// frame.js 按这份清单下载、算总进度；引擎要的文件必须都在这里。
// 换模型要连库名一起换，否则旧缓存里的同名小文件（词表、前端配置）会盖住新的。
window.GRANITE_MODEL_FILES = {
    'granite-ctc-models-v2': [
        'onnx-ctc/frontend_config.json',
        'onnx-ctc/mel_filters.bin',
        'onnx-ctc/stft_window.bin',
        'onnx-ctc/vocab.json',
        'onnx-ctc/ct5_conformer_q4f16.onnx',
        'onnx-ctc/ct5_conformer_q4f16.onnx.data',
    ],
};
