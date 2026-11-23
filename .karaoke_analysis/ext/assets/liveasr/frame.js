/**
 * 实时语音识别运行页的消息桥。
 *
 * 父页面（YouTube 上的 content script）发来：
 *   { type: 'start' } / { type: 'stop' }   加载模型并开始识别 / 结束识别
 *   { type: 'audio', t, samples }          16 kHz 单声道 Float32Array，t 是 samples[0] 的媒体时间（秒）。
 *                                          相邻两条在媒体时间上首尾相接，除非中间隔着 reset
 *   { type: 'reset' }                      时间轴断开（跳转）：没识别完的音频和没定稿的词都丢掉，另起一个 epoch
 * 这里发回：
 *   { type: 'status', state, pct?, stalled?, ms?, device?, message?, kind? }
 *       state: loaded | downloading | downloaded | preparing | listening | stopped | error
 *       downloading 只在有文件要从网上下时才发：pct 是这一趟要用的模型文件按字节算的整数百分比（0..100），
 *       一趟之内只增不减；stalled: true 表示网络断了、正在等着重连，字节重新流动后的消息不带它。
 *       downloaded 在这次确实从网上下过文件、全部到齐时发一次：ms 是这个页面里花在下载上的毫秒数。
 *       error 的 kind 说明是哪一类：no-webgpu（这台电脑跑不动，没有下载）| storage（缓存写不进，
 *       多半是磁盘满了）| download（模型文件要不到，重试也没用的那种）| engine（其余）。
 *   { type: 'transcript', epoch, from, words: [{ w, t }], heardUntil }
 *       每个 epoch 一份只增不减的定稿词表，一条消息把父页面那份从下标 from 起整段换掉。
 *       t 是这个词开口的媒体时间（秒），一路不减。w 是模型直接输出的词（自带标点和大小写，
 *       日文每个字一个词），发出去就不再变。
 *       heardUntil：这个媒体时间之前开口的词都已经在词表里了。
 *       epoch 在每次 start 和 reset 时加一，每个 epoch 的第一条消息 from 为 0。
 *
 * 音频来得比播放快（开头一次十几秒，之后每几秒一批），这里排队，引擎消化完一批再喂下一批。
 *
 * 这个页面是 web_accessible 的，任何网站都能把它嵌进去，所以只认 YouTube 父页面。
 */
(() => {
    const PARENT_ORIGIN = 'https://www.youtube.com';
    const TAG = 'subkun-liveasr';
    const post = (msg) => window.parent.postMessage({ source: TAG, ...msg }, PARENT_ORIGIN);

    // ------------------------------------------------------------- transcript
    let epoch = 0;
    let frozen = 0;        // 已经定死、不会再发的词数
    let posted = -Infinity; // 上一条消息报出去的 heardUntil

    function newEpoch() {
        epoch++;
        frozen = 0;
        posted = -Infinity;
    }

    function publish(from, words, heardUntil) {
        posted = heardUntil;
        post({ type: 'transcript', epoch, from, words, heardUntil });
    }

    // 引擎每定稿一段就调一次。定稿的词不会再变，到手就定死。
    // 先放一轮事件循环：WASM 后端推理时页面收不进消息，父页面这期间发来的 reset / stop 生效后，这一段就不该再发了。
    async function onSegment({ words, starts }) {
        const at = epoch;
        await window.GraniteEngine.nextTask();
        if (at !== epoch || !session) return;
        publish(frozen, words.map((w, i) => ({ w, t: starts[i] })), session.heardUntil);
        frozen += words.length;
    }

    // ------------------------------------------------------------------ audio
    let queue = [];       // 还没喂给引擎的音频：{ t, samples }
    let pumping = false;

    async function pump() {
        if (pumping) return;
        pumping = true;
        while (session && queue.length) {
            const active = session;
            const at = epoch;
            const { t, samples } = queue.shift();
            await active.push(samples, t);
            // 一段话都没有的音频不会触发 onSegment，进度单独报一次
            if (active === session && at === epoch && active.heardUntil > posted) {
                publish(frozen, [], active.heardUntil);
            }
        }
        pumping = false;
    }

    // ----------------------------------------------------------------- models
    // 模型文件（清单在 config.js：识别模型约 311 MB）
    // 边收边切成固定大小的分片，收满一片就存进
    // Cache Storage 一片：关标签页、重启浏览器，最多丢还没收满的那一片，下次接着下。
    // 一个文件的分片到齐后拼成一条整份缓存，分片随即删掉。引擎只读整份的那条，所以载入已下完的
    // 模型只读一次缓存，磁盘上也只留一份（拼的那一下除外）。
    //
    // 缓存里的键：
    //   <url>                   整份文件
    //   <url>?subkun-size       文件总字节数，下载途中才有
    //   <url>?subkun-piece=<n>  第 n 片，下载途中才有
    //
    // 一次请求用 Range 从已有的字节一直要到文件末尾，连接不断就不再发第二次：实测每多发一次
    // 请求要多等 0.6 秒以上，速度还得重新爬坡。连接断了，从断掉的那个字节接着要。
    // 每次请求都发给 GRANITE_ASSET_BASE 下的原始地址。
    const PIECE_BYTES = 4 * 1024 * 1024;
    // 连接上这么久一个字节都没来，就当它死了，掐掉重连
    const SILENCE_TIMEOUT_MS = 20000;
    // 连续失败时，下一次请求前等多久；收到字节就从头数
    const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

    const files = Object.entries(window.GRANITE_MODEL_FILES).flatMap(([cacheName, paths]) => paths.map((path) => ({
        url: window.GRANITE_ASSET_BASE + path,
        cacheName,
        total: null,    // 总字节数，查过缓存或问过服务器才知道
        have: 0,        // 已到手的字节数
        failing: false, // 上一次请求失败了，之后还没收到过字节
        done: false,    // 整份已在缓存里
        pending: null,  // 进行中的 obtain()
    })));

    // 旧版模型（识别 + 标点，共约 520 MB）的缓存库已经没人读了，顺手清掉
    for (const name of ['granite-ctc-models-v1', 'granite-speech-local-models']) void caches.delete(name);

    let halt = new AbortController(); // abort(error)：重试也没用了（文件不存在、缓存写不进），所有下载都停
    let remote = false;               // 这一趟有文件要从网上下；全在缓存里时不报下载状态
    let reported = null;              // 这一趟上一次报给父页面的 { pct, stalled }
    const sleepers = new Set();       // 正在等重试的下载，调一下就提前醒

    // kind：报给父页面的错误类别，见文件头
    const permanent = (message, kind) => Object.assign(new Error(message), { permanent: true, kind });

    function report() {
        if (!remote) return;
        const pending = files.filter((file) => !file.done);
        const stalled = pending.length > 0 && pending.every((file) => file.failing);
        let pct = reported ? reported.pct : 0;
        if (files.every((file) => file.total !== null)) {
            const sum = (key) => files.reduce((n, file) => n + file[key], 0);
            // 页面重开后只算已落盘的分片，可能比之前报过的略少；报出去的数不往回走
            pct = Math.max(pct, Math.min(100, Math.floor((sum('have') / sum('total')) * 100)));
        } else if (!stalled) {
            return; // 还有文件没问到大小，算不出百分比
        }
        if (reported && reported.pct === pct && reported.stalled === stalled) return;
        reported = { pct, stalled };
        post({ type: 'status', state: 'downloading', pct, ...(stalled && { stalled: true }) });
    }

    // 等一会儿再重试。浏览器报告网络恢复、或者父页面再次 start 时提前醒；
    // 父页面不要识别了就一直睡着，不再发请求。
    function sleep(ms) {
        return new Promise((resolve) => {
            const wake = () => {
                clearTimeout(timer);
                sleepers.delete(wake);
                resolve();
            };
            const timer = setTimeout(() => {
                if (wanted) wake();
            }, ms);
            sleepers.add(wake);
        });
    }

    function wakeSleepers() {
        for (const wake of [...sleepers]) wake();
    }

    window.addEventListener('online', () => {
        if (wanted) wakeSleepers();
    });

    function giveUp(error) {
        if (!halt.signal.aborted) halt.abort(error);
        wakeSleepers();
        return halt.signal.reason;
    }

    async function readBody(response, onChunk) {
        const reader = response.body.getReader();
        for (;;) {
            const { done, value } = await reader.read();
            if (done) return;
            await onChunk(value);
        }
    }

    async function download(file) {
        const cache = await caches.open(file.cacheName);
        const sizeKey = `${file.url}?subkun-size`;
        const pieceKey = (n) => `${file.url}?subkun-piece=${n}`;
        const pieceSize = (n) => Math.min(PIECE_BYTES, file.total - n * PIECE_BYTES);
        const dropPieces = async () => {
            let n = 0;
            while (await cache.delete(pieceKey(n))) n++;
            await cache.delete(sizeKey); // 最后删：它还在就说明分片可能没删干净
        };
        // 缓存写不进（多半是磁盘满了），重试也没用
        const save = (key, body, headers) => cache.put(key, new Response(body, { headers })).catch((e) => {
            throw permanent(`cache write failed: ${e.message}`, 'storage');
        });
        const keep = async (blob) => {
            await save(file.url, blob, { 'Content-Type': 'application/octet-stream', 'Content-Length': String(blob.size) });
            await dropPieces();
            file.total = file.have = blob.size;
            file.done = true;
            report();
        };

        const whole = await cache.match(file.url);
        if (whole) {
            file.total = file.have = (await whole.blob()).size;
            file.done = true;
            // 上次拼好整份、分片还没删完页面就关了
            if (await cache.match(sizeKey)) await dropPieces();
            report();
            return;
        }

        remote = true;
        file.failing = false;
        const size = await cache.match(sizeKey);
        let sizeKept = Boolean(size);
        const known = size ? Number(await size.text()) : null;
        let next = 0; // 已落盘的分片数
        while (known !== null && next * PIECE_BYTES < known) {
            const piece = await cache.match(pieceKey(next));
            if (!piece || (await piece.blob()).size !== Math.min(PIECE_BYTES, known - next * PIECE_BYTES)) break;
            next++;
        }
        // 大小和已有字节数一起亮出来：别的文件算总进度时，不会看到一个数完一半的
        file.total = known;
        file.have = Math.min(next * PIECE_BYTES, known ?? 0);
        report();

        let chunks = []; // 第 next 片里已经收到、还没落盘的部分。连接断了它留着，从断点接着要
        let got = 0;
        let failures = 0;
        // 一圈是一次请求
        while (file.total === null || next * PIECE_BYTES < file.total) {
            halt.signal.throwIfAborted();
            const silence = new AbortController();
            let timer = 0;
            const heard = () => {
                clearTimeout(timer);
                timer = setTimeout(() => silence.abort(), SILENCE_TIMEOUT_MS);
            };
            const flowing = () => {
                heard();
                failures = 0;
                file.failing = false;
            };
            let entire = null; // 服务器不认 Range 时回来的整个文件
            let failure = null;
            heard();
            try {
                const offset = next * PIECE_BYTES + got;
                const response = await fetch(file.url, {
                    headers: { Range: `bytes=${offset}-` },
                    cache: 'no-store', // 分片自己存，不让 HTTP 缓存再占一份磁盘
                    signal: AbortSignal.any([halt.signal, silence.signal]),
                });
                if (response.status === 206) {
                    const header = response.headers.get('content-range') || '';
                    const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(header);
                    const [from, to, total] = (range || []).slice(1).map(Number);
                    if (!range || from !== offset || to < from || to >= total
                        || (file.total !== null && total !== file.total)) {
                        throw permanent(`${file.url}: unexpected Content-Range "${header}"`, 'download');
                    }
                    file.total = total;
                    if (!sizeKept) {
                        await save(sizeKey, String(total));
                        sizeKept = true;
                    }
                    let received = 0;
                    await readBody(response, async (chunk) => {
                        flowing();
                        received += chunk.length;
                        while (chunk.length) {
                            if (next * PIECE_BYTES >= total) throw permanent(`${file.url}: body longer than its Content-Range`, 'download');
                            const part = chunk.subarray(0, pieceSize(next) - got);
                            chunks.push(part);
                            got += part.length;
                            chunk = chunk.subarray(part.length);
                            if (got === pieceSize(next)) {
                                await save(pieceKey(next), new Blob(chunks));
                                next++;
                                chunks = [];
                                got = 0;
                            }
                        }
                        file.have = Math.min(next * PIECE_BYTES, total) + got;
                        report();
                    });
                    if (!received) throw new Error('empty body');
                } else if (response.status === 200) {
                    if (file.total === null) file.total = Number(response.headers.get('content-length')) || null;
                    const body = [];
                    let length = 0;
                    await readBody(response, (chunk) => {
                        flowing();
                        body.push(chunk);
                        length += chunk.length;
                        file.have = Math.max(file.have, length);
                        report();
                    });
                    entire = new Blob(body);
                } else if (response.status >= 500 || response.status === 429 || response.status === 408) {
                    throw new Error(`HTTP ${response.status}`);
                } else {
                    throw permanent(`${file.url}: HTTP ${response.status}`, 'download');
                }
            } catch (e) {
                failure = e;
            } finally {
                clearTimeout(timer);
            }
            if (failure) {
                halt.signal.throwIfAborted();
                if (failure.permanent) throw failure;
                // 剩下的都是网络问题（连接断了、超时、5xx、429）：等一会儿再要
                file.failing = true;
                report();
                await sleep(RETRY_DELAYS_MS[Math.min(failures++, RETRY_DELAYS_MS.length - 1)]);
            } else if (entire) {
                return keep(entire);
            }
        }

        const pieces = [];
        for (let n = 0; n < next; n++) pieces.push(await (await cache.match(pieceKey(n))).blob());
        await keep(new Blob(pieces));
    }

    // 让一个文件整份进缓存。同一个文件同一时间只让一个页面下（Web Lock）：两个标签页各下各的话，
    // 先拼完的那个会把另一个还在用的分片删掉。
    function obtain(file) {
        if (!file.pending) {
            file.pending = navigator.locks
                .request(`subkun-liveasr:${file.url}`, { signal: halt.signal }, () => download(file))
                .catch((e) => {
                    throw giveUp(e);
                })
                .finally(() => {
                    file.pending = null;
                });
        }
        return file.pending;
    }

    // 让这一场要用的文件到齐。已经整份在缓存里的不再碰。
    // 网络问题一直重试，所以只有重试也没用时才会失败。一个文件失败，其余的也停手。
    // 这一趟确实从网上下过文件时，到齐后报一次 downloaded。
    async function downloadModels() {
        const missing = files.filter((file) => !file.done);
        if (!missing.length) return;
        const began = performance.now();
        remote = false;
        reported = null;
        halt = new AbortController();
        await Promise.allSettled(missing.map(obtain));
        halt.signal.throwIfAborted();
        if (remote) post({ type: 'status', state: 'downloaded', ms: Math.round(performance.now() - began) });
    }

    // 引擎和标点模型取文件的入口：返回整份文件的 Response
    window.GraniteModelStore = {
        async fetch(url) {
            const file = files.find((candidate) => candidate.url === url);
            if (!file) throw new Error(`${url} is not listed in GRANITE_MODEL_FILES`);
            if (!file.done) await obtain(file);
            return (await caches.open(file.cacheName)).match(url);
        },
    };

    // ---------------------------------------------------------------- session
    let session = null;
    let wanted = false;    // 父页面当前是否希望识别在跑
    let busy = false;

    // 没有 WebGPU（或要不到显卡）时引擎只能退回单线程 WASM，跟不上直播：下载之前就拦住，不白下几百 MB。
    // 和 src/liveAsr/bridge.ts 的 canRunLiveAsr 是同一条规矩
    async function requireWebGpu() {
        const adapter = navigator.gpu ? await navigator.gpu.requestAdapter().catch(() => null) : null;
        if (!adapter) throw Object.assign(new Error('WebGPU unavailable'), { kind: 'no-webgpu' });
    }

    // start/stop 可能在加载途中交替到达，统一收敛到 wanted 指向的状态。
    async function settle() {
        if (busy) return;
        busy = true;
        try {
            while (wanted ? !session : Boolean(session)) {
                if (session) {
                    const active = session;
                    session = null;
                    active.reset(); // 说到一半的那段不要了，否则引擎停下前会把它定稿发出来
                    await active.stop();
                    if (!wanted) post({ type: 'status', state: 'stopped' });
                } else {
                    await requireWebGpu();
                    await downloadModels();
                    // 识别模型整个页面只载入一次，载入过了这里直接返回
                    const { device } = await window.GraniteEngine.init();
                    post({ type: 'status', state: 'preparing', device });
                    session = await window.GraniteEngine.startPush({
                        onSegment,
                        onError: (e) => post({ type: 'status', state: 'error', kind: 'engine', message: String(e?.message || e) }),
                    });
                    post({ type: 'status', state: 'listening', device });
                    void pump();
                }
            }
        } catch (e) {
            wanted = false;
            queue = [];
            post({ type: 'status', state: 'error', kind: e?.kind || 'engine', message: String(e?.message || e) });
        } finally {
            busy = false;
        }
    }

    window.addEventListener('message', (e) => {
        if (e.source !== window.parent || e.origin !== PARENT_ORIGIN) return;
        const msg = e.data;
        if (!msg || msg.source !== TAG) return;
        if (msg.type === 'audio') {
            if (!wanted) return;
            queue.push({ t: msg.t, samples: msg.samples });
            void pump();
        } else if (msg.type === 'reset') {
            queue = [];
            session?.reset();
            newEpoch();
        } else if (msg.type === 'start' || msg.type === 'stop') {
            if (wanted !== (msg.type === 'start')) {
                wanted = !wanted;
                queue = [];
                if (wanted) {
                    newEpoch();
                    wakeSleepers();
                }
            }
            settle();
        }
    });

    post({ type: 'status', state: 'loaded' });
})();
