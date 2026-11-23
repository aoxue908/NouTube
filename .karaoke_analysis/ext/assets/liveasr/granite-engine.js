// [SubKun] Vendored from the Hugging Face Space ibm-granite/granite-speech-streaming-webgpu, then
// moved to the granite-speech-5.0-470m-turboctc engine of subkun.com/live-transcribe (7 languages,
// cased and punctuated output, no punctuation model). Local changes are marked [SubKun].
/*
 * The CTC frontend/tokenizer/engine/streaming modules concatenated into one
 * classic script, plus a DOM-free `window.GraniteEngine` API tail. A private
 * Space's cross-site iframe does not authenticate the module fetches issued
 * while the page is parsing (they 401, and the module map then caches that
 * failure), whereas classic scripts always carry the cookie -- that's why
 * this is one script rather than four ES modules plus an import of this file.
 *
 * The module logic (everything above the "app.js" section) originally came
 * from ctc-frontend.js, ctc-tokenizer.js, ctc-engine.js, and ctc-streaming.js
 * via a build script; that pipeline is gone, so this file is now hand-edited
 * directly.
 */
(() => {
'use strict';
// Stands in for the module namespace: each module destructures what it
// imports off this and assigns its exports back onto it.
const __M = {};

// Japanese is written without spaces, so whitespace splitting would make a whole
// sentence one "word" and the two-window agreement could never confirm part of it.
// Each kana/kanji becomes its own token (with the punctuation that follows it);
// everything else still splits on whitespace.
const CJK_LETTER = '\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}ー';
const CJK_PUNCT = '、-〿＀-￯';
const TOKEN_RE = new RegExp(`[${CJK_LETTER}][${CJK_PUNCT}]*|[${CJK_PUNCT}]+|[^\\s${CJK_LETTER}${CJK_PUNCT}]+`, 'gu');
const CJK_START_RE = new RegExp(`^[${CJK_LETTER}${CJK_PUNCT}]`, 'u');
const CJK_END_RE = new RegExp(`[${CJK_LETTER}${CJK_PUNCT}]$`, 'u');

function tokenize(text) {
    return text.match(TOKEN_RE) || [];
}

/** Inverse of tokenize(): a space between two tokens unless one of them is Japanese. */
function joinTokens(tokens) {
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
        if (i > 0 && !CJK_END_RE.test(tokens[i - 1]) && !CJK_START_RE.test(tokens[i])) out += ' ';
        out += tokens[i];
    }
    return out;
}

// ==== ctc-frontend.js ===================================================
(() => {
/**
 * Audio front-end for the FastConformer CTC model.
 *
 * A port of the model's `CtcConformerProcessor._frontend` (log-mel + deltas +
 * frame stacking) plus the sidecar's `_agc`. The mel filterbank and the STFT
 * window are NOT recomputed here -- they are loaded from `mel_filters.bin` /
 * `stft_window.bin`, dumped by export_ctc_onnx.py straight out of the torchaudio
 * objects the Python path uses. Reimplementing torchaudio's htk mel scale
 * (norm=None) and torch.stft's window centring in JS is the most likely place for
 * a silent mismatch, and a front-end that is subtly wrong degrades WER without
 * ever raising an error.
 *
 * Verified bit-for-bit against the Python features by test-frontend.mjs.
 */

const EPS = 1e-10;

/** In-place iterative radix-2 complex FFT (Cooley-Tukey, decimation in time). */
class FFT {
    constructor(size) {
        this.size = size;
        this.levels = Math.log2(size) | 0;
        if (2 ** this.levels !== size) throw new Error(`FFT size ${size} is not a power of two`);

        // Bit-reversal permutation and twiddle tables, precomputed once: the
        // front-end runs this transform ~100 times per second of audio.
        this.rev = new Uint32Array(size);
        for (let i = 0; i < size; i++) {
            let r = 0;
            for (let b = 0; b < this.levels; b++) r |= ((i >> b) & 1) << (this.levels - 1 - b);
            this.rev[i] = r;
        }
        this.cos = new Float32Array(size / 2);
        this.sin = new Float32Array(size / 2);
        for (let i = 0; i < size / 2; i++) {
            this.cos[i] = Math.cos((-2 * Math.PI * i) / size);
            this.sin[i] = Math.sin((-2 * Math.PI * i) / size);
        }
    }

    /** Transform `re`/`im` in place (both length `size`). */
    run(re, im) {
        const { size, rev, cos, sin } = this;
        for (let i = 0; i < size; i++) {
            const j = rev[i];
            if (j > i) {
                let t = re[i]; re[i] = re[j]; re[j] = t;
                t = im[i]; im[i] = im[j]; im[j] = t;
            }
        }
        for (let len = 2; len <= size; len <<= 1) {
            const half = len >> 1;
            const step = size / len;
            for (let i = 0; i < size; i += len) {
                for (let j = 0, k = 0; j < half; j++, k += step) {
                    const c = cos[k], s = sin[k];
                    const a = i + j, b = a + half;
                    const tre = re[b] * c - im[b] * s;
                    const tim = re[b] * s + im[b] * c;
                    re[b] = re[a] - tre; im[b] = im[a] - tim;
                    re[a] += tre; im[a] += tim;
                }
            }
        }
    }
}

/**
 * Centred moving average, cumsum-based (O(n)).
 *
 * Mirrors the sidecar's `_moving_avg`, including its edge handling: the valid
 * region is padded by replicating the first/last valid value, with the extra
 * sample going on the right when the window is even.
 */
function movingAvg(v, win) {
    const n = v.length;
    win = Math.max(1, win | 0);
    if (win <= 1 || n <= 1) return v;
    win = Math.min(win, n);

    // float64 accumulator: a float32 cumsum over ~10 s of samples loses enough
    // precision to shift the gain envelope (the Python side uses float64 too).
    const csum = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) csum[i + 1] = csum[i] + v[i];

    const valid = n - win + 1;
    const padL = (win - 1) >> 1;
    const out = new Float32Array(n);
    const first = (csum[win] - csum[0]) / win;
    const last = (csum[n] - csum[n - win]) / win;
    for (let i = 0; i < n; i++) {
        const k = i - padL;
        out[i] = k < 0 ? first : k >= valid ? last : (csum[k + win] - csum[k]) / win;
    }
    return out;
}

/**
 * Automatic gain control -- port of the sidecar's `_agc`.
 *
 * Not cosmetic: the CTC front-end normalizes log-mel against the clip's *global
 * peak*, so a quiet tail 20-40 dB below a loud head gets floored and silently
 * dropped. A smoothed moving-RMS gain toward `target` equalizes the levels.
 */
function agc(x, { sampleRate = 16000, target = 0.12, winMs = 150, maxGain = 20 } = {}) {
    const n = x.length;
    if (n === 0) return x;
    const win = Math.max(1, Math.round((sampleRate * winMs) / 1000));

    const sq = new Float32Array(n);
    for (let i = 0; i < n; i++) sq[i] = x[i] * x[i];
    const ms = movingAvg(sq, win);

    const g = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const env = Math.sqrt(ms[i] + 1e-9);
        g[i] = Math.min(Math.max(target / Math.max(env, 1e-4), 0), maxGain);
    }
    const gs = movingAvg(g, win); // smooth the gain to avoid pumping

    const y = new Float32Array(n);
    let peak = 0;
    for (let i = 0; i < n; i++) {
        y[i] = x[i] * gs[i];
        const a = Math.abs(y[i]);
        if (a > peak) peak = a;
    }
    if (peak > 0.97) {
        const k = 0.97 / peak;
        for (let i = 0; i < n; i++) y[i] *= k;
    }
    return y;
}

class CtcFrontend {
    constructor(config, melFilters, window) {
        this.config = config;
        this.melFilters = melFilters; // [n_mels][n_freqs], mel-major
        this.window = window;         // n_fft, already centred by the exporter
        this.fft = new FFT(config.n_fft);
        this.nFreqs = config.n_fft / 2 + 1;
    }

    static async load(baseUrl = './onnx-ctc/') {
        const get = async (name, as) => {
            // [SubKun] globalThis：这个函数里 `window` 是下面解构出来的 STFT 窗，不是全局对象
            const r = await globalThis.GraniteModelStore.fetch(baseUrl + name);
            return as === 'json' ? r.json() : new Float32Array(await r.arrayBuffer());
        };
        const [config, melFilters, window] = await Promise.all([
            get('frontend_config.json', 'json'),
            get('mel_filters.bin'),
            get('stft_window.bin'),
        ]);
        return new CtcFrontend(config, melFilters, window);
    }

    /** Feature frames a clip of `nSamples` produces (before padding to pad_multiple). */
    frameCount(nSamples) {
        const s = this.config.stack_factor;
        const melFrames = Math.floor(nSamples / this.config.hop_length);
        return s * Math.ceil(melFrames / s);
    }

    /**
     * waveform (Float32Array, 16 kHz mono) -> stacked log-mel(+delta) features.
     *
     * Returns `{ data, frames, dim }` where `data` is [frames, dim] row-major,
     * ready to become the model's `input_features` tensor.
     */
    compute(wav) {
        const { hop_length: hop, n_fft: nFft, n_mels: nMels, stack_factor: stack,
                logmel_floor_db: floorDb, deltas: useDeltas } = this.config;
        const nFrames = this.frameCount(wav.length);
        if (nFrames === 0) return { data: new Float32Array(0), frames: 0, dim: this.config.input_dim };

        // The processor right-pads the waveform so the trailing partial stack
        // group is filled rather than dropped, then slices to exactly nFrames.
        const need = (nFrames - 1) * hop + 1;
        let x = wav;
        if (x.length < need) {
            x = new Float32Array(need);
            x.set(wav);
        }

        // torch.stft(center=True, pad_mode='reflect'): reflect-pad by n_fft/2 so
        // frame i is centred on sample i*hop.
        const half = nFft >> 1;
        const padded = new Float32Array(x.length + nFft);
        padded.set(x, half);
        for (let i = 0; i < half; i++) {
            padded[half - 1 - i] = x[Math.min(i + 1, x.length - 1)];
            padded[half + x.length + i] = x[Math.max(x.length - 2 - i, 0)];
        }

        // Mel spectrogram, mel-major ([nMels][nFrames]) because deltas run along time.
        const mel = new Float32Array(nMels * nFrames);
        const re = new Float32Array(nFft);
        const im = new Float32Array(nFft);
        const power = new Float32Array(this.nFreqs);
        for (let t = 0; t < nFrames; t++) {
            const off = t * hop;
            for (let i = 0; i < nFft; i++) {
                re[i] = padded[off + i] * this.window[i];
                im[i] = 0;
            }
            this.fft.run(re, im);
            for (let k = 0; k < this.nFreqs; k++) power[k] = re[k] * re[k] + im[k] * im[k];
            for (let m = 0; m < nMels; m++) {
                const fb = m * this.nFreqs;
                let acc = 0;
                for (let k = 0; k < this.nFreqs; k++) acc += this.melFilters[fb + k] * power[k];
                mel[m * nFrames + t] = acc;
            }
        }

        // log10 with a floor relative to the clip's global peak, then the /4 +1
        // scaling the model was trained with.
        let mx = -Infinity;
        for (let i = 0; i < mel.length; i++) {
            const v = Math.log10(Math.max(mel[i], EPS));
            mel[i] = v;
            if (v > mx) mx = v;
        }
        const floor = mx - floorDb;
        for (let i = 0; i < mel.length; i++) mel[i] = Math.max(mel[i], floor) / 4 + 1;

        // Deltas: torchaudio.functional.compute_deltas(win_length=3) is
        // (x[t+1] - x[t-1]) / 2 with replicate edge padding.
        const nCh = useDeltas ? nMels * 2 : nMels;
        const chans = new Float32Array(nCh * nFrames);
        chans.set(mel);
        if (useDeltas) {
            for (let m = 0; m < nMels; m++) {
                const src = m * nFrames;
                const dst = (nMels + m) * nFrames;
                for (let t = 0; t < nFrames; t++) {
                    const prev = mel[src + Math.max(t - 1, 0)];
                    const next = mel[src + Math.min(t + 1, nFrames - 1)];
                    chans[dst + t] = (next - prev) / 2;
                }
            }
        }

        // Stack: (nCh, nFrames) -> (nFrames/stack, stack*nCh), i.e. row j is the
        // channels of frame stack*j followed by those of frame stack*j+1.
        const outFrames = nFrames / stack;
        const dim = stack * nCh;
        const data = new Float32Array(outFrames * dim);
        for (let j = 0; j < outFrames; j++) {
            for (let k = 0; k < stack; k++) {
                const t = j * stack + k;
                const base = j * dim + k * nCh;
                for (let c = 0; c < nCh; c++) data[base + c] = chans[c * nFrames + t];
            }
        }
        return { data, frames: outFrames, dim };
    }
}

Object.assign(__M, { agc, CtcFrontend });
})();

// ==== ctc-tokenizer.js ==================================================
(() => {
/**
 * Decoder for the model's 16384-entry SentencePiece BPE vocabulary.
 *
 * Only decoding is needed (the model never encodes text), so export_ctc_onnx.py
 * dumps the id->piece slice that can reach the decoder as vocab.json (~160 KB)
 * instead of shipping the whole tokenizer.json.
 *
 * granite-speech-5.0-470m-turboctc uses a SentencePiece-style tokenizer whose
 * `tokenizers` decoder is Sequence[Replace(U+2581 -> space), ByteFallback, Fuse,
 * Strip(1 leading space)]. Pieces are ordinary text with `▁` marking a word
 * start, except the 256 byte-fallback pieces `<0x00>`..`<0xFF>`, which spell out
 * characters outside the vocabulary one UTF-8 byte at a time. A run of
 * consecutive byte pieces is UTF-8 decoded *together* -- one character can span
 * several of them -- and a run that is not valid UTF-8 becomes one U+FFFD per
 * byte, exactly as `tokenizers`' ByteFallback does.
 *
 * (The 4.2 build used a GPT-2 ByteLevel tokenizer instead. That is a different
 * algorithm and would silently produce mojibake here, so the exporter asserts the
 * tokenizer's decoder chain matches this implementation.)
 */

const BYTE_PIECE = /^<0x([0-9A-Fa-f]{2})>$/;

class CtcDecoder {
    constructor(pieces, numSpecialTokens) {
        this.numSpecialTokens = numSpecialTokens;
        // Pre-resolve every piece, so decoding a frame of ids does no per-call
        // regex or replace work: a byte piece becomes its byte value (number),
        // any other piece its text with `▁` already turned into a space.
        this.pieces = pieces.map((piece) => {
            const m = BYTE_PIECE.exec(piece);
            return m ? parseInt(m[1], 16) : piece.replaceAll('\u2581', ' ');
        });
        this.utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    }

    static async load(baseUrl = './onnx-ctc/') {
        // [SubKun]
        const [vocab, config] = await Promise.all([
            window.GraniteModelStore.fetch(baseUrl + 'vocab.json').then((r) => r.json()),
            window.GraniteModelStore.fetch(baseUrl + 'frontend_config.json').then((r) => r.json()),
        ]);
        return new CtcDecoder(vocab, config.num_special_tokens);
    }

    /** Decode content ids (all >= numSpecialTokens) to text. */
    decode(ids) {
        let out = '';
        let bytes = [];
        const flushBytes = () => {
            if (bytes.length === 0) return;
            try {
                out += this.utf8Decoder.decode(new Uint8Array(bytes));
            } catch {
                out += '\uFFFD'.repeat(bytes.length);
            }
            bytes = [];
        };
        for (const id of ids) {
            const piece = this.pieces[id - this.numSpecialTokens];
            if (piece === undefined) continue; // out-of-range id: skip rather than poison the string
            if (typeof piece === 'number') {
                bytes.push(piece);
            } else {
                flushBytes();
                out += piece;
            }
        }
        flushBytes();
        return out.startsWith(' ') ? out.slice(1) : out;
    }

    /**
     * [SubKun] 和 decode() 同样的解码，但逐词返回，并带上每个词的帧范围：`starts` 是它第一个
     * token 出现的帧，`ends` 是它最后一个 token 结束的帧。`firstFrames[i]`、`lastFrames[i]` 是
     * `ids[i]` 这个 token 的起止帧。
     * 先整段解码成文字，给每个字符记下它所属 token 的帧，再按 tokenize() 的规则切词
     * （空白分词，日文每个字一个词）：连续的字节 token 要凑齐才能做 UTF-8 解码，所以不能逐 token 切。
     */
    decodeWords(ids, firstFrames, lastFrames) {
        let text = '';
        const charFirst = [];
        const charLast = [];
        const append = (piece, first, last) => {
            for (let k = 0; k < piece.length; k++) { // 按 UTF-16 单元记，和正则的下标对得上
                charFirst.push(first);
                charLast.push(last);
            }
            text += piece;
        };
        let bytes = [];
        let byteFirst = 0;
        let byteLast = 0;
        const flushBytes = () => {
            if (!bytes.length) return;
            let piece;
            try {
                piece = this.utf8Decoder.decode(new Uint8Array(bytes));
            } catch {
                piece = '\uFFFD'.repeat(bytes.length);
            }
            append(piece, byteFirst, byteLast);
            bytes = [];
        };
        for (let i = 0; i < ids.length; i++) {
            const piece = this.pieces[ids[i] - this.numSpecialTokens];
            if (piece === undefined) continue;
            if (typeof piece === 'number') {
                if (!bytes.length) byteFirst = firstFrames[i];
                byteLast = lastFrames[i];
                bytes.push(piece);
            } else {
                flushBytes();
                append(piece, firstFrames[i], lastFrames[i]);
            }
        }
        flushBytes();

        const words = [];
        const starts = [];
        const ends = [];
        for (const m of text.matchAll(TOKEN_RE)) {
            words.push(m[0]);
            starts.push(charFirst[m.index]);
            ends.push(charLast[m.index + m[0].length - 1]);
        }
        return { words, starts, ends };
    }
}

/**
 * Greedy CTC collapse: drop repeats, then the blank, then any remaining
 * below-content ids.
 *
 * Order matters and matches the Python path: repeats are collapsed against the
 * *raw* previous id (blanks included), which is what lets a blank between two
 * identical tokens preserve both. For this model `numSpecialTokens` is 255 --
 * the CTC blank (`<unk>`) at id 0 and the special/task tokens above it carry no
 * text, and everything from 255 up is a tokenizer id as-is.
 *
 * [SubKun] 传了 `frames` 时，同步记下每个保留下来的 id 首次出现的帧号（词的起始时间由它来）。
 */
function ctcCollapse(ids, { blankId = 0, numSpecialTokens = 255 } = {}, frames = null) {
    const out = [];
    let prev = -1;
    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (id !== prev && id !== blankId && id >= numSpecialTokens) {
            out.push(id);
            frames?.push(i);
        }
        prev = id;
    }
    return out;
}

Object.assign(__M, { CtcDecoder, ctcCollapse });
})();

// ==== ctc-engine.js =====================================================
(() => {
const { CtcFrontend, agc, CtcDecoder, ctcCollapse } = __M;
/**
 * FastConformer CTC inference engine (onnxruntime-web, WebGPU).
 *
 * The model is a custom `ctc_conformer` architecture with no transformers.js
 * support, so this drives an ONNX session directly: features -> one forward pass
 * -> greedy CTC collapse. There is no autoregressive loop, no KV cache and no
 * chat template; a window is one `session.run`.
 *
 * Two contracts come from export_ctc_onnx.py and must hold here:
 *
 *  - **Frames are padded to `pad_multiple`.** The encoder chunks attention into
 *    context_size (128) blocks at every layer and subsamples time by 4, so a
 *    frame count with no partial block anywhere is a multiple of 512 (10.24 s).
 *    The exported graph therefore has no tail-block path, and short windows are
 *    padded up with `padding_mask` marking the pad. Measured cost of the masked
 *    padding on granite-speech-4.2-470m-turboctc: none -- all 14 fixture clips
 *    decode identically to the unpadded path, with zero per-frame argmax flips.
 *    (Its encoder masks inside the conv module specifically so a padded frame
 *    cannot leak through the stride-2 kernel into the last valid frames.)
 *
 *  - **The graph returns ids, not logits.** `[1, T/4, 16384]` float32 logits
 *    would be an ~8 MB device-to-host copy per window; argmax and the
 *    log-softmax max happen inside the graph instead, so a window costs ~1 KB of
 *    output. `top_logprob` is the confidence signal the streaming gate uses.
 */



/**
 * [SubKun] 模型文件的下载、续传、缓存和进度上报都在 frame.js 的 GraniteModelStore 里，
 * 这里只取整份字节。
 */
async function cachedFetch(url) {
    return (await window.GraniteModelStore.fetch(url)).arrayBuffer();
}

class CtcEngine {
    constructor({ session, frontend, decoder, config, device }) {
        this.session = session;
        this.frontend = frontend;
        this.decoder = decoder;
        this.config = config;
        this.device = device;
    }

    /**
     * Create the session and load the front-end assets.
     *
     * `device: 'webgpu'` falls back to wasm if the adapter or a kernel is
     * missing -- a CTC pass is still usable on wasm, just slower.
     */
    static async load({
        baseUrl = './onnx-ctc/',
        modelFile = 'ct5_conformer_q4f16.onnx',
        device = 'webgpu',
        allowFallback = true,
    } = {}) {
        const [frontend, decoder] = await Promise.all([
            CtcFrontend.load(baseUrl),
            CtcDecoder.load(baseUrl),
        ]);

        const modelUrl = baseUrl + modelFile;
        // The exporter writes weights to `<model>.onnx.data` and records that
        // basename inside the graph, so the session's externalData path must
        // match it exactly.
        const dataName = `${modelFile}.data`;
        const [modelBuffer, dataBuffer] = await Promise.all([
            cachedFetch(modelUrl),
            cachedFetch(baseUrl + dataName),
        ]);

        const options = {
            executionProviders: [device],
            externalData: [{ path: dataName, data: dataBuffer }],
            graphOptimizationLevel: 'all',
        };
        let session;
        let used = device;
        let fallbackError = null;
        try {
            session = await ort.InferenceSession.create(modelBuffer, options);
        } catch (e) {
            if (device !== 'webgpu' || !allowFallback) throw e;
            console.warn('WebGPU session failed, falling back to wasm:', e);
            fallbackError = String(e?.message || e);
            used = 'wasm';
            session = await ort.InferenceSession.create(modelBuffer, {
                ...options,
                executionProviders: ['wasm'],
            });
        }
        const engine = new CtcEngine({ session, frontend, decoder, config: frontend.config, device: used });
        // A WebGPU kernel can also fail on its *first run* rather than at session
        // build (ORT-web reports unsupported MatMulNBits shapes that way), so the
        // warmup pass is where a fallback is really decided.
        const warmupError = await engine.warmup();
        if (warmupError && used === 'webgpu') {
            if (!allowFallback) throw new Error(`WebGPU warmup failed: ${warmupError}`);
            console.warn('WebGPU warmup failed, falling back to wasm:', warmupError);
            fallbackError = warmupError;
            engine.device = 'wasm';
            engine.session = await ort.InferenceSession.create(modelBuffer, {
                ...options,
                executionProviders: ['wasm'],
            });
            await engine.warmup();
        }
        engine.fallbackError = fallbackError;
        return engine;
    }

    /**
     * Run one throwaway pass so shader compilation doesn't land on the user's
     * first spoken window (measured on WebGPU: 1271 ms first call vs 295 ms
     * steady state). Every window is padded to the same frame count, so a single
     * warmup covers the shapes the streaming loop will use.
     */
    async warmup() {
        try {
            const frames = this.config.pad_multiple;
            await this.session.run({
                input_features: new ort.Tensor('float32', new Float32Array(frames * this.config.input_dim), [1, frames, this.config.input_dim]),
                padding_mask: new ort.Tensor('float32', new Float32Array(frames), [1, frames]),
            });
            return null;
        } catch (e) {
            return String(e?.message || e);
        }
    }

    /** Encoder output frames covering `frames` of real audio (both subsample blocks floor-halve). */
    static realOutFrames(frames) {
        return Math.floor(Math.floor(frames / 2) / 2);
    }

    /**
     * Transcribe a waveform (Float32Array, 16 kHz mono).
     *
     * `applyAgc` mirrors the sidecar: the log-mel front-end normalizes against
     * the clip's global peak, so without it a quiet tail after a loud passage is
     * floored away and its words are silently dropped.
     */
    async transcribe(wav, { applyAgc = true } = {}) {
        const t0 = performance.now();
        const audio = applyAgc ? agc(wav, { sampleRate: this.config.sample_rate }) : wav;
        const { data, frames, dim } = this.frontend.compute(audio);
        // [SubKun] wordStarts / wordEnds
        if (frames === 0) return { text: '', words: [], wordStarts: [], wordEnds: [], avgLogprob: null, frames: 0, ms: 0 };

        const multiple = this.config.pad_multiple;
        const padded = Math.ceil(frames / multiple) * multiple;
        const features = new Float32Array(padded * dim);
        features.set(data);
        const mask = new Float32Array(padded).fill(1);
        mask.fill(0, 0, frames);

        const outputs = await this.session.run({
            input_features: new ort.Tensor('float32', features, [1, padded, dim]),
            padding_mask: new ort.Tensor('float32', mask, [1, padded]),
        });

        // The graph emits padded/4 frames; only those covering real audio may
        // contribute tokens, so trim before collapsing.
        const nOut = CtcEngine.realOutFrames(frames);
        const ids = outputs.ids.data.subarray(0, nOut);
        const logp = outputs.top_logprob.data.subarray(0, nOut);

        const tokenFrames = [];
        const content = ctcCollapse(ids, {
            blankId: this.config.blank_id,
            numSpecialTokens: this.config.num_special_tokens,
        }, tokenFrames);
        const text = this.decoder.decode(content).trim();
        // [SubKun] 词和它的时间出自同一次切分，个数必然一致。一个输出帧对应
        // hop_length * stack_factor * subsample_factor 个采样（80 ms），帧号乘上它就是
        // 距 wav 开头的秒数。同一个 token 连续占几帧时，最后一帧才是它的结束。
        const tokenEnds = tokenFrames.map((frame) => {
            while (frame + 1 < nOut && ids[frame + 1] === ids[frame]) frame++;
            return frame;
        });
        const { words, starts, ends } = this.decoder.decodeWords(content, tokenFrames, tokenEnds);
        const frameSec = (this.config.hop_length * this.config.stack_factor * this.config.subsample_factor)
            / this.config.sample_rate;

        // Confidence: mean top log-probability over non-blank frames. The CTC
        // analogue of a mean per-token logprob -- clean speech sits near -0.03,
        // silence/noise confabulation near -1.85 and below.
        let sum = 0, n = 0;
        for (let i = 0; i < nOut; i++) {
            if (ids[i] !== this.config.blank_id) { sum += logp[i]; n++; }
        }
        return {
            text,
            // [SubKun] 每个词在 wav 里的起止（秒），和 words 一一对应
            words,
            wordStarts: starts.map((frame) => frame * frameSec),
            wordEnds: ends.map((frame) => (frame + 1) * frameSec),
            avgLogprob: n ? sum / n : null,
            frames,
            paddedFrames: padded,
            ms: performance.now() - t0,
        };
    }
}

Object.assign(__M, { CtcEngine });
})();

// ==== ctc-streaming.js ==================================================
(() => {
/**
 * Live dictation: growing window + LocalAgreement-2, ported from the macOS
 * GraniteLiveDictation app (SpeechGate / Reconciler / StreamingCoordinator).
 *
 *   continuous 16 kHz capture -> rolling window + energy SpeechGate
 *      every `step` while speech is in the window:
 *         window = audio[segment start .. now]        (grows; overlaps the last)
 *         hypo   = words(CTC transcription of window)
 *         a word COMMITS once two consecutive windows agree on it (longest
 *         common prefix); everything past that is TENTATIVE (shown grey)
 *      on a pause: one clean full-window pass commits the segment and re-anchors
 *
 * The window *grows* rather than sliding because the model returns text with no
 * word timestamps -- there is no safe place to trim a fixed window without
 * risking a mid-word cut. Anchoring each window at the start of the current
 * speech segment makes reconciliation a plain prefix comparison and keeps the
 * window bounded (a phrase between pauses).
 *
 * The tuning constants are the ones the macOS app converged on against real
 * far-field recordings, not defaults -- see the comments on each.
 */

const SAMPLE_RATE = 16000;
const INT16_SCALE = 32768; // gate thresholds are in Int16 RMS units (as tuned)

/**
 * URL to hand `audioWorklet.addModule()`.
 *
 * addModule fetches its argument as a *module*, which is the one request type a
 * private Space's cross-site iframe fails to authenticate — measured there, the
 * same file returns 200 to a plain fetch and intermittently fails as a module
 * import. That would break dictation at the moment the user presses record, well
 * after everything else had loaded cleanly. So fetch the source (plain fetches
 * work) and hand addModule a blob: URL, which needs no network request at all.
 * Falls back to the direct URL, which is what works everywhere else.
 *
 * Resolved against `document.baseURI` so it survives being served from a
 * subdirectory.
 */
let cachedWorkletUrl = null;
async function captureWorkletUrl() {
    if (cachedWorkletUrl) return cachedWorkletUrl;
    const direct = new URL('./ctc-capture-worklet.js', document.baseURI).href;
    try {
        const r = await fetch(direct);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const source = await r.text();
        cachedWorkletUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    } catch (e) {
        console.warn('could not preload the capture worklet; using its URL directly:', e);
        cachedWorkletUrl = direct;
    }
    return cachedWorkletUrl;
}

/**
 * Energy speech/silence gate with an adaptive noise floor.
 *
 * Not a neural VAD -- an RMS gate whose enter/exit thresholds float with the
 * measured background level. That matters for its one job: finding a *pause* so
 * the growing window can flush. With fixed thresholds, a room whose ambient RMS
 * sits above the silence cutoff never produces a silence frame, the endpoint
 * timer never fires, and every window runs to the maxWindow cap and cuts
 * mid-sentence.
 */
class SpeechGate {
    constructor(config = {}) {
        this.config = {
            endpointSilenceMs: 600, // contiguous below-exit audio that ends a segment
            frameMs: 30,
            // Biased toward inclusion: this CTC model doesn't confabulate on
            // silence the way an autoregressive decoder does (it decodes to empty
            // / low confidence, and the confidence gate backstops it), so
            // admitting soft audio costs nothing -- while excluding it dropped
            // real words (soft onsets never triggered, soft tails got endpointed
            // mid-phrase).
            onRatio: 1.5,
            minEnter: 80,
            // Exit stays near the original: dropping it toward ambient stops
            // pause detection altogether and every segment runs to maxWindow,
            // which wrecks paragraphing.
            offRatio: 1.4,
            minExit: 60,
            onFrames: 2, // debounce transient clicks
            // Seeded from the *mean* RMS over the startup window, not the min: the
            // min tracks the quietest valley of fluctuating noise and seeds the
            // floor far below the ambient body, which then lets noise read as
            // speech.
            calibrationMs: 360,
            floorAdapt: 0.05, // per-frame EMA; at 30 ms frames ~0.6 s to settle
            initialNoiseFloor: 60,
            maxNoiseFloor: 4000,
            ...config,
        };
        this.frameLen = Math.max(1, (SAMPLE_RATE * this.config.frameMs) / 1000);
        this.calibrationFrames = Math.floor(this.config.calibrationMs / this.config.frameMs);
        this.onEvent = null;
        this.isSpeaking = false;
        this.noiseFloor = this.config.initialNoiseFloor;
        this.silenceMs = 0;
        this.onCount = 0;
        this.pending = [];
        this.pendingLen = 0;
        this.calibLeft = this.calibrationFrames;
        this.calibSum = 0;
        this.calibCount = 0;
    }

    get enterThreshold() { return Math.max(this.config.minEnter, this.noiseFloor * this.config.onRatio); }
    get exitThreshold() { return Math.max(this.config.minExit, this.noiseFloor * this.config.offRatio); }

    /**
     * Clear per-utterance state. The noise floor and calibration are deliberately
     * preserved: they describe the *room*, not the utterance, and this is called
     * on every commit (including maxWindow cuts taken mid-speech), where
     * re-seeding would calibrate the floor from speech energy and blind the gate.
     */
    reset() {
        this.isSpeaking = false;
        this.silenceMs = 0;
        this.onCount = 0;
        this.pending = [];
        this.pendingLen = 0;
    }

    /** Re-arm calibration -- for a fresh capture session / new environment. */
    recalibrate() {
        this.noiseFloor = this.config.initialNoiseFloor;
        this.calibLeft = this.calibrationFrames;
        this.calibSum = 0;
        this.calibCount = 0;
    }

    /** Feed a chunk of float samples (any length); re-framed into fixed blocks. */
    feed(samples) {
        if (!samples.length) return;
        this.pending.push(samples);
        this.pendingLen += samples.length;
        while (this.pendingLen >= this.frameLen) {
            const frame = this.takeFrame();
            // process() emits events synchronously and a handler may call reset()
            // re-entrantly (which drops `pending`), so the frame is removed first.
            this.process(frame);
        }
    }

    takeFrame() {
        const frame = new Float32Array(this.frameLen);
        let at = 0;
        while (at < this.frameLen) {
            const head = this.pending[0];
            const take = Math.min(head.length, this.frameLen - at);
            frame.set(take === head.length ? head : head.subarray(0, take), at);
            at += take;
            if (take === head.length) this.pending.shift();
            else this.pending[0] = head.subarray(take);
        }
        this.pendingLen -= this.frameLen;
        return frame;
    }

    process(frame) {
        const rms = rmsInt16(frame);

        if (this.calibLeft > 0) {
            this.calibLeft--;
            this.calibSum += rms;
            this.calibCount++;
            this.noiseFloor = Math.min(Math.max(this.calibSum / this.calibCount, 1), this.config.maxNoiseFloor);
            return;
        }

        this.adaptNoise(rms);
        if (this.isSpeaking) {
            if (rms < this.exitThreshold) {
                this.silenceMs += this.config.frameMs;
                if (this.silenceMs >= this.config.endpointSilenceMs) {
                    this.isSpeaking = false;
                    this.silenceMs = 0;
                    this.onCount = 0;
                    this.onEvent?.('speechEnded');
                }
            } else {
                this.silenceMs = 0; // speech resumed; reset the endpoint timer
            }
        } else if (rms >= this.enterThreshold) {
            this.onCount++;
            if (this.onCount >= this.config.onFrames) {
                this.isSpeaking = true;
                this.silenceMs = 0;
                this.onCount = 0;
                this.onEvent?.('speechStarted');
            }
        } else {
            this.onCount = 0;
        }
    }

    /**
     * Learn the floor from ambient frames only, tracking the *body* (mean) of the
     * ambient level. Updating solely when not in a segment AND below the enter
     * threshold keeps sustained speech (or a speech attack) from dragging the
     * floor up to speech level.
     */
    adaptNoise(rms) {
        if (this.isSpeaking || rms >= this.enterThreshold) return;
        const a = this.config.floorAdapt;
        this.noiseFloor = Math.min(Math.max((1 - a) * this.noiseFloor + a * rms, 1), this.config.maxNoiseFloor);
    }
}

function rmsInt16(samples) {
    if (!samples.length) return 0;
    let acc = 0;
    for (let i = 0; i < samples.length; i++) acc += samples[i] * samples[i];
    return Math.sqrt(acc / samples.length) * INT16_SCALE;
}

/**
 * LocalAgreement-2 reconciliation.
 *
 * Each step transcribes the growing window and yields a fresh hypothesis. Because
 * the window overlaps the previous one, the two should agree on the stable part
 * and differ only at the unfinished tail. A word is committed once two
 * *consecutive* hypotheses agree on it (their longest common prefix, compared
 * case-insensitively and ignoring edge punctuation); everything past that is
 * tentative and may still change.
 */
class Reconciler {
    constructor() {
        this.confirmed = [];
        this.prevHypo = [];
    }

    update(hypothesis) {
        const agreed = commonPrefixCount(this.prevHypo, hypothesis);
        if (agreed > this.confirmed.length) {
            this.confirmed.push(...hypothesis.slice(this.confirmed.length, agreed));
        }
        this.prevHypo = hypothesis;
        const tentative = hypothesis.length > this.confirmed.length
            ? hypothesis.slice(this.confirmed.length)
            : [];
        return { confirmed: this.confirmed, tentative };
    }

    /** End of segment: a clean full-window hypothesis is authoritative. */
    finalize(words) {
        this.confirmed = words;
        this.prevHypo = words;
        return this.confirmed;
    }

    reset() {
        this.confirmed = [];
        this.prevHypo = [];
    }
}

/** Lowercase and strip edge punctuation so "Cat," and "cat" match. */
function normalizeWord(word) {
    return word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
}

function commonPrefixCount(a, b) {
    const n = Math.min(a.length, b.length);
    let i = 0;
    while (i < n && normalizeWord(a[i]) === normalizeWord(b[i])) i++;
    return i;
}

/**
 * Stock phrases the model confidently emits on ambient/silence -- the classic ASR
 * hallucination. Confidence can't catch these (they score *higher* than genuine
 * soft speech), so they're matched against the whole commit and dropped only when
 * word density is low: a silence-padded hallucination is long and slow, a real
 * crisp "thank you" is short and fast.
 */
const CANNED_HALLUCINATIONS = new Set([
    'thank you', 'thank you very much', 'thanks for watching',
    'thank you for watching', 'thanks for watching everyone',
]);

// Serializes every call into the CTC engine's ONNX session. onnxruntime-web's
// threaded backends can silently hang if two calls run concurrently,
// so live dictation and file transcription must funnel through this one lock
// rather than each keeping their own -- otherwise a still-running
// transcribeFile() call left behind by a superseded upload can race a
// freshly started live dictation session and wedge both.
let engineOpLock = Promise.resolve();
async function withEngineOp(fn) {
    const prior = engineOpLock;
    let release;
    engineOpLock = new Promise((r) => { release = r; });
    try {
        await prior;
        return await fn();
    } finally {
        release();
    }
}

class StreamingCoordinator {
    /**
     * @param {object} opts
     * @param {import('./ctc-engine.js').CtcEngine} opts.engine
     * @param {(state: {committed: string, tentative: string}) => void} opts.onTranscript
     * @param {(level: number) => void} [opts.onLevel]      0..1 input level
     * @param {(info: object) => void} [opts.onStep]        per-window diagnostics
     * @param {(error: Error) => void} [opts.onError]       step/commit transcription failures
     * @param {(segment: {words: string[], starts: number[], gapMs: number}) => Promise<void>} [opts.onSegment]
     *        [SubKun] 推送模式：每段定稿的词连同起始媒体时间（秒）交给它，标点和成段都归调用方。
     *        在推理锁内被 await，所以里面可以安全地跑标点模型。
     */
    constructor({ engine, onTranscript, onLevel = null, onStep = null, onError = null, onSegment = null, tuning = {} }) {
        this.engine = engine;
        this.onTranscript = onTranscript;
        this.onLevel = onLevel;
        this.onStep = onStep;
        this.onError = onError;
        this.onSegment = onSegment;
        // [SubKun] 推送模式的时间轴：fedUntil 是已喂进来的音频末尾的媒体时间（秒）；
        // epoch 在时间轴断开时加一，断开前开始的 commit 靠它作废。
        this.fedUntil = 0;
        this.epoch = 0;

        this.tuning = {
            stepMs: 400,        // re-transcribe cadence. A window costs one padded
                                // forward pass (>= 10.24 s of frames, see
                                // ctc-engine), so this is coarser than the macOS
                                // app's 100 ms; an in-flight tick is dropped, so
                                // it self-limits either way.
            minWindowSec: 0.4,  // don't transcribe windows shorter than this
            maxWindowSec: 10.0, // force-commit a window that grows this long with no pause
            newlineGapMs: 1200, // a pause >= this starts a new paragraph
            hardPauseMs: 1500,
            prerollSec: 0.5,    // audio kept before speech onset, so the first word isn't clipped
            // Calibrated on real far-field logs: clean speech ~ -0.03, but genuine
            // soft utterances scored -0.98..-1.34 and were wrongly rejected at a
            // -0.6 gate, dropping whole clips; silence confabulation sits at
            // -1.85 and below, so -1.5 lands in the gap.
            minCommitAvgLogprob: -1.5,
            cannedHallucinationMaxWps: 2.0,
            ...tuning,
        };

        this.gate = new SpeechGate();
        this.gate.onEvent = (e) => this.handleGate(e);
        this.reconciler = new Reconciler();

        this.window = [];          // Float32Array chunks since the last commit
        this.windowLen = 0;
        this.windowHasSpeech = false;
        this.transcribing = false;
        this.windowGen = 0;
        this.paragraphs = [];      // committed text, one entry per paragraph
        this.lastVoiceAt = 0;
        this.segmentGapMs = Infinity;
        this.active = false;
        this.audioContext = null;
        this.mediaStream = null;
        this.stepTimer = null;
        // Commits are started from the gate callback (inside onSamples), which
        // can't await them; stop() drains these so the last words aren't lost.
        this.pending = new Set();
    }

    /** Serialize engine access (shared with file transcription); returns the callback's result. */
    withEngine(fn) {
        return withEngineOp(fn);
    }

    /** Track a fire-and-forget async task so stop() can wait for it. */
    track(promise) {
        this.pending.add(promise);
        promise.catch(() => {}).finally(() => this.pending.delete(promise));
        return promise;
    }

    /** Resolve once no commit or step is outstanding. */
    async idle() {
        while (this.pending.size) await Promise.allSettled([...this.pending]);
        await engineOpLock;
    }

    async start(providedStream) {
        if (this.active) return;
        // A caller that also wants a mic-driven waveform can pass its own
        // already-open stream so both consumers share one getUserMedia grant;
        // in that case we must not stop tracks we don't own.
        this.ownsStream = !providedStream;
        this.mediaStream = providedStream || await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: false, // the gate wants the true ambient level
                autoGainControl: false,  // the engine's own AGC handles levels
            },
        });
        this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
        await this.audioContext.audioWorklet.addModule(await captureWorkletUrl());
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        const node = new AudioWorkletNode(this.audioContext, 'ctc-capture');
        node.port.onmessage = (e) => this.onSamples(e.data);
        source.connect(node);
        // Keep the graph pulling without routing mic audio to the speakers.
        const sink = this.audioContext.createGain();
        sink.gain.value = 0;
        node.connect(sink).connect(this.audioContext.destination);

        this.resetWindow();
        this.gate.recalibrate();
        this.paragraphs = [];
        this.lastVoiceAt = 0;
        this.segmentGapMs = Infinity;
        this.active = true;
        this.publish([], []);
        this.stepTimer = setInterval(() => this.tick(), this.tuning.stepMs);
    }

    async stop() {
        if (!this.active) return;
        this.active = false;
        clearInterval(this.stepTimer);
        this.stepTimer = null;
        if (this.ownsStream) this.mediaStream?.getTracks().forEach((t) => t.stop());
        this.mediaStream = null;
        await this.audioContext?.close();
        this.audioContext = null;
        this.onLevel?.(0);
        // Let any commit the gate started finish before deciding whether the
        // window still holds uncommitted speech.
        await this.idle();
        if (this.windowHasSpeech) await this.commit('stop');
        this.resetWindow();
        this.publish([], []);
    }

    // ---------------------------------------------------------------- capture

    // [SubKun] 推送模式带上 t：chunk 首个采样的媒体时间（秒）。
    onSamples(chunk, t) {
        this.window.push(chunk);
        this.windowLen += chunk.length;

        // Before speech is detected, keep only a short pre-roll. The window is
        // otherwise cleared only on commit, so a long ambient stretch would
        // accumulate unbounded and the first real utterance would commit an
        // enormous mostly-noise window.
        if (!this.windowHasSpeech) {
            const maxPreroll = Math.floor(SAMPLE_RATE * this.tuning.prerollSec);
            while (this.windowLen > maxPreroll && this.window.length > 1) {
                this.windowLen -= this.window.shift().length;
            }
        }

        // [SubKun] 推送来的音频比播放快，停顿有多长得按音频自己的时间算，不能看墙上时钟。
        let now = performance.now();
        if (t !== undefined) {
            this.fedUntil = t + chunk.length / SAMPLE_RATE;
            now = this.fedUntil * 1000;
        }
        this.onLevel?.(meterLevel(rmsInt16(chunk)));
        this.gate.feed(chunk); // may fire speechEnded -> commit

        // Drive the window's speech state from the gate's debounced,
        // calibration-aware decision rather than a parallel per-chunk RMS test:
        // such a test has no debounce and runs during calibration, so one noise
        // chunk latches the window open and the model transcribes ambient.
        if (this.gate.isSpeaking) {
            if (!this.windowHasSpeech) {
                this.segmentGapMs = this.lastVoiceAt ? now - this.lastVoiceAt : Infinity;
                this.windowHasSpeech = true;
            }
            this.lastVoiceAt = now;
        }
    }

    handleGate(event) {
        if (event !== 'speechEnded') return; // capture is continuous; onset needs nothing
        // Called synchronously from onSamples, so the commit can only be tracked,
        // not awaited (see idle()).
        if (this.windowHasSpeech) this.track(this.commit('pause'));
        else this.resetWindow(); // pure-silence window: drop it
    }

    // -------------------------------------------------------------- step loop

    async tick() {
        if (!this.active || !this.windowHasSpeech || this.transcribing) return;
        if (this.windowLen / SAMPLE_RATE >= this.tuning.maxWindowSec) {
            // Same guard as the regular step path below: without it, the
            // 400ms timer keeps firing while this forced commit's engine call
            // is in flight and can queue an overlapping step transcription.
            this.transcribing = true;
            try {
                await this.commit('maxWindow');
            } finally {
                this.transcribing = false;
            }
            return;
        }
        const speech = this.trimmedSpeech();
        if (speech.length / SAMPLE_RATE < this.tuning.minWindowSec) return;

        const gen = this.windowGen;
        this.transcribing = true;
        try {
            const result = await this.withEngine(() => this.engine.transcribe(speech));
            if (gen !== this.windowGen) return; // window committed meanwhile; discard
            const { confirmed, tentative } = this.reconciler.update(result.words);
            this.publish(confirmed, tentative);
            this.onStep?.({ kind: 'step', windowSec: speech.length / SAMPLE_RATE, ...result });
        } catch (e) {
            console.error('step transcription failed:', e);
            this.onError?.(e);
        } finally {
            this.transcribing = false;
        }
    }

    /**
     * Commit the current window: snapshot it, immediately clear and re-anchor (so
     * capture continues uninterrupted and any in-flight partial is discarded),
     * then transcribe the snapshot once cleanly and append it.
     */
    async commit(reason) {
        const speech = this.trimmedSpeech();
        const windowSec = speech.length / SAMPLE_RATE;
        if (windowSec < this.tuning.minWindowSec) {
            this.resetWindow();
            return;
        }
        const gapMs = this.segmentGapMs;
        // [SubKun] speech 是窗口的子数组，窗口末尾就是 fedUntil：由此倒推它首个采样的媒体时间。
        const audio = this.window[0];
        const speechOffset = (speech.byteOffset - audio.byteOffset) / Float32Array.BYTES_PER_ELEMENT;
        const speechT = this.fedUntil - (this.windowLen - speechOffset) / SAMPLE_RATE;
        const epoch = this.epoch;
        this.resetWindow();
        this.publish([], []);

        await this.withEngine(async () => {
            let result;
            try {
                result = await this.engine.transcribe(speech);
            } catch (e) {
                console.error('commit transcription failed:', e);
                this.onError?.(e);
                return;
            }
            if (epoch !== this.epoch) return; // [SubKun] 推理期间时间轴断开了，这一段作废
            const words = result.words;
            const wps = windowSec > 0 ? words.length / windowSec : 0;

            // Confidence gate: a low mean logprob means the model wasn't sure of
            // its own tokens -- the signature of confabulation on noise/silence.
            // A null confidence fails open.
            if (result.avgLogprob !== null && result.avgLogprob < this.tuning.minCommitAvgLogprob) {
                this.onStep?.({ kind: 'reject', why: 'confidence', reason, windowSec, wps, ...result });
                this.publish([], []);
                return;
            }
            const normalized = joinTokens(words.map(normalizeWord).filter(Boolean));
            if (CANNED_HALLUCINATIONS.has(normalized) && wps < this.tuning.cannedHallucinationMaxWps) {
                this.onStep?.({ kind: 'reject', why: 'canned', reason, windowSec, wps, ...result });
                this.publish([], []);
                return;
            }
            if (!words.length) {
                this.publish([], []);
                return;
            }

            if (this.onSegment) { // [SubKun]
                const keep = reason === 'maxWindow' ? this.carryOver(audio, speechOffset, result) : words.length;
                await this.onSegment({
                    words: words.slice(0, keep),
                    starts: result.wordStarts.slice(0, keep).map((s) => speechT + s),
                    gapMs,
                });
            } else {
                await this.appendSegment(joinTokens(words), gapMs, reason);
            }
            this.onStep?.({ kind: 'commit', reason, windowSec, wps, gapMs, ...result });
            this.publish([], []);
        });
    }

    /**
     * Append a committed segment, opening a new paragraph after a real pause.
     *
     * Sentence punctuation and capitalization come from the model itself. A
     * maxWindow cut is mid-utterance, so it extends the current paragraph.
     */
    async appendSegment(text, gapMs, reason) {
        const startsParagraph = this.paragraphs.length === 0
            || gapMs >= this.tuning.hardPauseMs
            || (gapMs >= this.tuning.newlineGapMs && reason !== 'maxWindow');

        if (startsParagraph) this.paragraphs.push(text);
        else this.paragraphs[this.paragraphs.length - 1] = joinTokens([this.paragraphs[this.paragraphs.length - 1], text]);
    }

    /**
     * [SubKun] 推送模式下窗口攒满、被迫在话中间切段时用。窗口末尾那一刀多半落在某个词中间
     * （实测 24 次里 9 次把词切坏：重复、拆开或拼错），所以改为退到后半段里最安静的词间空隙：
     * 空隙之前的词这次定稿，之后的音频放回窗口，和接下来的话一起重新识别。
     * 只在后半段找，放回去的音频就不超过半个窗口，每次强制切段至少往前走半个窗口。
     * `audio` 是 commit 时的整个窗口，`speechOffset` 是送去识别的那段在其中的起点。
     * 返回这次定稿多少个词。前提是推理期间没有新音频进来（推送模式如此），此刻窗口是空的。
     */
    carryOver(audio, speechOffset, { wordStarts, wordEnds }) {
        const samples = audio.subarray(speechOffset);
        const half = samples.length >> 1;
        // 用 120 ms 的能量找空隙：塞音的闭塞只有几十毫秒，两边的语音会把它抬高，真正的停顿不会。
        const span = Math.round(SAMPLE_RATE * 0.12);
        const hop = Math.round(SAMPLE_RATE * 0.03);
        let quietest = Infinity;
        let keep = 0;
        let cutAt = 0;
        // 候选空隙：第 i 个词之前；i 等于词数时是最后一个词之后（窗口正好停在停顿上）
        for (let i = 1; i <= wordStarts.length; i++) {
            const from = Math.max(half, Math.round(wordEnds[i - 1] * SAMPLE_RATE));
            const to = i < wordStarts.length ? Math.round(wordStarts[i] * SAMPLE_RATE) : samples.length;
            if (to < from) continue;
            // 空隙不够 120 ms 宽时只看它正中间那一处
            const first = to - from >= span ? from + span / 2 : (from + to) >> 1;
            const last = to - from >= span ? to - span / 2 : first;
            for (let centre = first; centre <= last; centre += hop) {
                const level = rmsInt16(samples.subarray(Math.max(0, centre - span / 2), centre + span / 2));
                if (level <= quietest) {
                    quietest = level;
                    keep = i;
                    cutAt = centre;
                }
            }
        }

        const rest = samples.subarray(cutAt);
        this.window = [rest];
        this.windowLen = rest.length;
        this.windowHasSpeech = true;
        this.segmentGapMs = 0;
        this.gate.isSpeaking = true; // 话还没说完：之后的停顿照常由门限来收尾
        return keep;
    }

    // ---------------------------------------------------------------- helpers

    /**
     * The speech-bearing span of the window, with leading/trailing silence
     * removed. Trailing trim matters: the front-end normalizes against the clip's
     * global peak, so an untrimmed quiet tail gets amplified and decoded into
     * spurious words.
     */
    trimmedSpeech() {
        const audio = this.flattenWindow();
        const frame = 480; // 30 ms
        const floor = this.gate.exitThreshold;
        let first = -1, last = -1;
        for (let i = 0; i < audio.length; i += frame) {
            const end = Math.min(i + frame, audio.length);
            if (rmsInt16(audio.subarray(i, end)) >= floor) {
                if (first < 0) first = i;
                last = end;
            }
        }
        if (first < 0) return new Float32Array(0);
        const margin = frame * 3; // ~90 ms of context each side
        return audio.subarray(Math.max(0, first - margin), Math.min(audio.length, last + margin));
    }

    flattenWindow() {
        if (this.window.length === 1) return this.window[0];
        const out = new Float32Array(this.windowLen);
        let at = 0;
        for (const c of this.window) { out.set(c, at); at += c.length; }
        this.window = [out]; // collapse so repeated ticks don't re-copy
        return out;
    }

    resetWindow() {
        this.window = [];
        this.windowLen = 0;
        this.windowHasSpeech = false;
        this.reconciler.reset();
        this.gate.reset();
        this.windowGen++;
    }

    publish(confirmed, tentative) {
        const live = joinTokens(confirmed);
        const committed = live
            ? [...this.paragraphs, live].join('\n\n')
            : this.paragraphs.join('\n\n');
        this.onTranscript({ committed, live, tentative: joinTokens(tentative) });
    }

    /** Plain text of everything committed so far. */
    get transcript() {
        return this.paragraphs.join('\n\n');
    }
}

/** Int16 RMS -> 0..1 meter level on a dBFS scale (-60 dBFS -> 0, 0 dBFS -> 1). */
function meterLevel(rms) {
    if (rms <= 0) return 0;
    const dbfs = 20 * Math.log10(rms / 32767);
    return Math.max(0, Math.min(1, (dbfs + 60) / 60));
}

Object.assign(__M, { SpeechGate, Reconciler, StreamingCoordinator, withEngineOp });
})();

// ==== app.js ============================================================
(() => {
const { CtcEngine, SpeechGate, StreamingCoordinator, withEngineOp } = __M;
/**
 * Granite Live Dictation engine (WebGPU)
 *
 * Real-time in-browser dictation with ibm-granite/granite-speech-5.0-470m-turboctc,
 * a 473M-parameter FastConformer CTC model. Unlike the previous
 * granite-speech-4.1-2b build, this is not a transformers.js pipeline:
 * transformers.js has no GraniteSpeech5ForCTC support, so the ONNX session is driven directly
 * (see ctc-engine.js) -- one forward pass and a greedy collapse per window, no
 * autoregressive decode. That is what makes it fast enough to re-transcribe a
 * growing window several times a second.
 *
 * The model emits cased, punctuated English directly, so no separate
 * punctuation/capitalization pass is needed.
 *
 * `ort` is the global from the onnxruntime-web script tag in index.html.
 *
 * This module has no DOM references -- it exposes `window.GraniteEngine`, a
 * plain callback-based API, so any UI shell can drive the real engine.
 */

// [SubKun] 模型不随扩展打包，从 GRANITE_ASSET_BASE 下载后进 Cache Storage。
const MODEL_DIR = (window.GRANITE_ASSET_BASE || './') + 'onnx-ctc/';
// 4-bit weights, block 32, on an fp16 graph (312 MB from a 1.9 GB fp32 export).
// This is the only shape WebGPU can actually run: ORT-web's WebGPU EP enforces
// `nbits == 4 || nbits == 2` on MatMulNBits, so an 8-bit build silently falls
// back to wasm (1320 ms per window against 305 ms) and buys nothing -- on 8
// minutes of LibriSpeech the 4-bit weights cost 0.26% WER against the fp32
// export (CPU EP), and what residue remains in the browser comes from fp16 activations,
// which more weight bits would not fix.
const MODEL_FILE = 'ct5_conformer_q4f16.onnx';
const SAMPLE_RATE = 16000;
// One padded forward pass covers 10.24 s of frames, so file segments are capped
// near that: longer segments cost proportionally more and buy nothing.
const MAX_SEGMENT_SEC = 20;

let engine = null;
let coordinator = null;
let isLoading = false;

// ---------------------------------------------------------------- model load

/**
 * Hand ORT its wasm assets directly, fetched with a plain `fetch()`.
 *
 * ORT locates its backend by dynamically `import()`ing
 * ort-wasm-simd-threaded.jsep.mjs. In a private Space's cross-site iframe that
 * module fetch is not authenticated -- the same failure that stopped app.js's own
 * imports and forced the bundle -- and it surfaces from session creation as
 * "no available backend found. ERR: [wasm] previous call to 'initWasm()' failed".
 *
 * Plain fetches *are* authenticated in that context, so the glue is fetched here
 * and handed over as a blob: URL, which `import()` reads with no network request
 * at all, and the wasm bytes go across as `wasmBinary` so nothing else is looked
 * up either. Falls back to letting ORT fetch them itself, which is what works
 * everywhere other than that iframe.
 */
async function configureOrtWasm(baseUrl = './ort/') {
    const dir = new URL(baseUrl, document.baseURI).href;
    // [SubKun] 扩展页的 CSP（script-src 'self'）拒绝 import(blob:)，下面的 blob 预载
    // 方案在这里走不通；扩展自己的文件用直接 URL 加载即可。
    if (location.protocol === 'chrome-extension:') {
        ort.env.wasm.wasmPaths = dir;
        return;
    }
    const get = async (name, as) => {
        const r = await fetch(dir + name);
        if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`);
        return as === 'text' ? r.text() : r.arrayBuffer();
    };
    try {
        const [glue, binary] = await Promise.all([
            get('ort-wasm-simd-threaded.jsep.mjs', 'text'),
            get('ort-wasm-simd-threaded.jsep.wasm'),
        ]);
        ort.env.wasm.wasmBinary = binary;
        ort.env.wasm.wasmPaths = {
            mjs: URL.createObjectURL(new Blob([glue], { type: 'text/javascript' })),
        };
    } catch (e) {
        console.warn('could not preload the ORT wasm assets; letting ORT fetch them:', e);
        // Absolute, not './ort/': ORT resolves a relative wasmPaths against the
        // location of ort.all.min.js (already in ort/), which would look for
        // ort/ort/ort-wasm-simd-threaded.jsep.mjs and find no backend.
        ort.env.wasm.wasmPaths = dir;
    }
}

/**
 * Load the CTC model and prepare an ONNX Runtime session.
 *
 * `onStatus(state, message)` reports coarse lifecycle state ('loading',
 * 'ready', 'error'), mirroring the shape of the old DOM-writing setStatus().
 * Returns `{ device }` ('webgpu' or 'wasm') once ready.
 */
async function initEngine({ onStatus } = {}) {
    if (engine || isLoading) return engine ? { device: engine.device } : null;
    isLoading = true;
    try {
        // The runtime is a blocking classic script in index.html, so reaching here
        // without it means it was blocked (Edge Tracking Prevention, an extension,
        // a CSP). Say that plainly instead of throwing a bare ReferenceError.
        if (typeof ort === 'undefined') {
            throw new Error('the ONNX runtime failed to load (ort/ort.all.min.js) — '
                + 'check for a blocked request in the network tab');
        }
        await configureOrtWasm();
        // Threaded wasm needs cross-origin isolation (COOP *and* COEP). Hugging
        // Face Spaces send COOP but not COEP, so asking for threads there only
        // produces a console warning and a wasted init before ORT falls back.
        ort.env.wasm.numThreads = self.crossOriginIsolated ? (navigator.hardwareConcurrency || 4) : 1;
        // Without this, WebGPU's adapter choice is left to the browser default,
        // which on a multi-GPU Mac can hand ORT the integrated GPU -- Safari in
        // particular has been observed defaulting there, running this model's
        // fp16/int4 matmul kernels far slower than the discrete GPU Chrome/Edge
        // tend to pick instead.
        ort.env.webgpu.powerPreference = 'high-performance';

        onStatus?.('loading', 'Downloading model...');
        engine = await CtcEngine.load({
            baseUrl: MODEL_DIR,
            modelFile: MODEL_FILE,
            device: navigator.gpu ? 'webgpu' : 'wasm',
        });
        // A wasm fallback is ~4x slower per window (1325 ms vs 305 ms for a 10 s
        // window), which is the difference between live and not, so say so
        // rather than letting it look like the model is just slow.
        onStatus?.('ready', engine.device === 'webgpu'
            ? 'Ready — start dictation or upload audio'
            : 'Ready — WebGPU unavailable, running on WASM (dictation will lag well behind speech)');
        return { device: engine.device };
    } catch (e) {
        console.error('Model loading failed:', e);
        onStatus?.('error', `Error: ${e.message || e}`);
        throw e;
    } finally {
        isLoading = false;
    }
}

// ------------------------------------------------------------ live dictation

/**
 * Start streaming dictation.
 *
 * `stream` is an already-open MediaStream (e.g. from a caller that also wants
 * a mic-driven waveform visualization off the same getUserMedia grant); if
 * omitted, the coordinator opens its own. `onTranscript({committed,
 * tentative})`, `onLevel(0..1)`, `onStep(info)`, and `onError(error)` mirror
 * StreamingCoordinator's own callbacks. Returns `{ stop() }`.
 */
async function startDictation({ stream, onTranscript, onLevel, onStep, onError } = {}) {
    if (!engine) throw new Error('GraniteEngine.init() must complete before startDictation()');
    if (coordinator) throw new Error('dictation already active — call stop() first');
    coordinator = new StreamingCoordinator({ engine, onTranscript, onLevel, onStep, onError });
    try {
        await coordinator.start(stream);
    } catch (e) {
        coordinator = null;
        throw e;
    }
    return {
        stop: async () => {
            if (!coordinator) return;
            const active = coordinator;
            coordinator = null;
            await active.stop();
        },
    };
}

// ------------------------------------------------------------- pushed audio

/**
 * [SubKun] 让出一次事件循环。WASM 后端的推理全程只让出微任务，连着消化几段积压音频时，
 * 页面既发不出消息（postMessage 要等到下一个任务才真正送走）也收不进消息；实测 5 条
 * 结果会憋到 23 秒后一起到。用 MessageChannel 而不是定时器：隐藏的跨源 iframe 里定时器会被降频。
 */
function nextTask() {
    return new Promise((resolve) => {
        const { port1, port2 } = new MessageChannel();
        port1.onmessage = () => {
            port1.close();
            resolve();
        };
        port2.postMessage(0);
    });
}

// [SubKun] 推送模式下一个窗口最多攒多少秒音频，原因见 startPush
const PUSH_MAX_WINDOW_SEC = 5;

/**
 * [SubKun] 由调用方喂音频的识别会话：音频带着媒体时间、成批到达，比播放快。
 *
 * 门限、停顿检测和 commit 时那一遍完整推理都和 startDictation() 相同，
 * 所以在停顿处收尾的段，切法和定稿的词跟麦克风实时输入时一样。不同的有四点：
 *  - 不跑 400 ms 一次的中间推理。那一步只产出「暂定词」，commit 并不用它的结果；
 *    这里只要定稿词，省掉它之后每段只推理一次，积压的音频能以远快于实时的速度消化。
 *  - 时间跟着音频走：音频按门限的帧长切碎了喂，停顿在哪一帧结束、窗口在哪一帧攒满，
 *    都只由音频内容决定，和它到得多快无关。
 *  - 窗口上限是 PUSH_MAX_WINDOW_SEC 而不是 10 秒：词要等所在的窗口定稿才交得出去，而直播常年垫着
 *    背景音乐和游戏声，能量门限等不到停顿，每一段都得攒满窗口。字幕要赶在画面播到之前译好，等不起 10 秒。
 *  - 窗口攒满被迫切段时不在末尾硬切，而是退到一个词间空隙（见 carryOver）。
 *
 * 返回：
 *   push(samples, t)  16 kHz Float32Array，t 是 samples[0] 的媒体时间（秒）。相邻两次在媒体时间上
 *                     首尾相接。返回的 promise 在这批音频触发的推理全部结束后完成；上一次没完成前
 *                     不要再调。
 *   reset()           时间轴断开：丢掉当前窗口，推理到一半的那段作废。噪声底是这条流的属性，保留。
 *   heardUntil        这个媒体时间之前开口的词都已经交给 onSegment 了
 *   stop()
 * onSegment 见 StreamingCoordinator 的构造参数。
 */
async function startPush({ onSegment, onStep, onError } = {}) {
    if (!engine) throw new Error('GraniteEngine.init() must complete before startPush()');
    if (coordinator) throw new Error('dictation already active — call stop() first');

    const active = new StreamingCoordinator({
        engine, onTranscript: () => {}, onStep, onError, onSegment,
        tuning: { maxWindowSec: PUSH_MAX_WINDOW_SEC },
    });
    active.ownsStream = false;
    active.resetWindow();
    active.gate.recalibrate();
    active.active = true;
    coordinator = active;

    const step = active.gate.frameLen;
    return {
        async push(samples, t) {
            const epoch = active.epoch;
            for (let i = 0; i < samples.length; i += step) {
                if (!active.active || epoch !== active.epoch) return;
                active.onSamples(samples.subarray(i, i + step), t + i / SAMPLE_RATE);
                if (active.windowHasSpeech && active.windowLen / SAMPLE_RATE >= active.tuning.maxWindowSec) {
                    active.track(active.commit('maxWindow'));
                }
                // 停顿触发的 commit 是在 onSamples 里发起的，和上面那个一样等它结束再往下喂：
                // 推理本来就是瓶颈，这样 reset 时最多白跑一段。
                if (active.pending.size) {
                    await active.idle();
                    await nextTask();
                }
            }
        },
        reset() {
            active.epoch++;
            active.resetWindow();
            active.lastVoiceAt = 0;
            active.segmentGapMs = Infinity;
        },
        get heardUntil() {
            return active.fedUntil - active.windowLen / SAMPLE_RATE;
        },
        stop: async () => {
            if (coordinator === active) coordinator = null;
            await active.stop();
        },
    };
}

// --------------------------------------------------------- file transcription

/**
 * Split a file into speech segments with the same energy gate the live path uses.
 *
 * This replaces the old Silero VAD download: the gate is already here, it is what
 * the streaming path is tuned against, and long audio has to be split anyway --
 * a single pass over a 5-minute file would allocate a ~250 MB logits tensor
 * inside the graph.
 */
function segmentAudio(audio) {
    const gate = new SpeechGate();
    const frame = 480;
    const segments = [];
    let start = null;
    let consumed = 0;

    gate.onEvent = (event) => {
        const t = consumed / SAMPLE_RATE;
        if (event === 'speechStarted') start = t;
        else if (start !== null) {
            segments.push({ start, end: t });
            start = null;
        }
    };
    for (let i = 0; i < audio.length; i += frame) {
        const chunk = audio.subarray(i, Math.min(i + frame, audio.length));
        consumed = i + chunk.length;
        gate.feed(chunk);
    }
    if (start !== null) segments.push({ start, end: audio.length / SAMPLE_RATE });
    if (!segments.length) return [{ start: 0, end: audio.length / SAMPLE_RATE }];

    // Pad each segment slightly (the gate's onset debounce trims the first
    // phoneme) and cap the length.
    const out = [];
    for (const seg of segments) {
        let from = Math.max(0, seg.start - 0.2);
        const to = Math.min(audio.length / SAMPLE_RATE, seg.end + 0.2);
        while (to - from > MAX_SEGMENT_SEC) {
            out.push({ start: from, end: from + MAX_SEGMENT_SEC });
            from += MAX_SEGMENT_SEC;
        }
        out.push({ start: from, end: to });
    }
    return out;
}

/**
 * Transcribe a decoded audio buffer, splitting it into speech segments first.
 *
 * `onProgress({ index, count, text })` fires after each segment with the
 * joined transcript so far, so a caller can render incrementally. `isCancelled()`
 * is checked between segments so a caller that has moved on (a newer upload, or
 * live dictation started) can stop this from burning any more engine time --
 * without it, a superseded call would keep running in the background and its
 * unsynchronized engine calls could race a caller that started after
 * it, which is exactly the kind of concurrent session use that hangs
 * onnxruntime-web's threaded backends. Returns `{ text, stats: { audioSec,
 * segments, totalMs, realtimeFactor } }`.
 */
async function transcribeFile(audioData, { onProgress, onError, isCancelled } = {}) {
    if (!engine) throw new Error('GraniteEngine.init() must complete before transcribeFile()');

    const segments = segmentAudio(audioData);
    const parts = [];
    let totalMs = 0;

    for (let i = 0; i < segments.length; i++) {
        if (isCancelled?.()) break;
        const seg = segments[i];
        const slice = audioData.subarray(
            Math.floor(seg.start * SAMPLE_RATE),
            Math.floor(seg.end * SAMPLE_RATE),
        );
        // Caught per-segment rather than letting one bad segment (e.g. a
        // transient WebGPU failure) abort the whole file and discard every
        // segment already transcribed before it.
        let result;
        try {
            result = await withEngineOp(() => engine.transcribe(slice));
        } catch (e) {
            console.error(`segment ${i + 1}/${segments.length} transcription failed:`, e);
            onError?.(e);
            continue;
        }
        totalMs += result.ms;
        if (result.text) parts.push(result.text);
        onProgress?.({ index: i, count: segments.length, text: parts.join('\n\n') });
    }

    const audioSec = audioData.length / SAMPLE_RATE;
    return {
        text: parts.join('\n\n'),
        stats: {
            audioSec,
            segments: segments.length,
            totalMs,
            realtimeFactor: totalMs > 0 ? audioSec / (totalMs / 1000) : 0,
        },
    };
}

/** Decode any audio file to 16 kHz mono float32 (resampling is decodeAudioData's job). */
async function loadAudioFile(file) {
    const audioCtx = new AudioContext({ sampleRate: SAMPLE_RATE });
    try {
        const buffer = await audioCtx.decodeAudioData(await file.arrayBuffer());
        let audio = buffer.getChannelData(0);
        if (buffer.numberOfChannels > 1) {
            const mixed = new Float32Array(audio.length);
            for (let c = 0; c < buffer.numberOfChannels; c++) {
                const ch = buffer.getChannelData(c);
                for (let i = 0; i < mixed.length; i++) mixed[i] += ch[i] / buffer.numberOfChannels;
            }
            audio = mixed;
        }
        return audio;
    } finally {
        await audioCtx.close();
    }
}

// ---------------------------------------------------------------------- API

window.GraniteEngine = {
    init: initEngine,
    startDictation,
    startPush,
    nextTask, // [SubKun]
    transcribeFile,
    loadAudioFile,
};
})();

})();
