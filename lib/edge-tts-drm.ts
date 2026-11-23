/**
 * Microsoft Edge "Read Aloud" (edge-tts) Sec-MS-GEC token generator.
 *
 * Ported line-for-line from the reference project's Dart implementation
 * (pilipala: realtime_caption/edge_tts_drm.dart), which itself mirrors
 * python edge-tts v2. It is deliberately dependency-free integer bit math so
 * it can run in both the React Native JS context and Node for verification.
 *
 * The server now REQUIRES this token: connecting with only the trusted client
 * token returns HTTP 403 (verified 2026-11-22).
 */

const WIN_EPOCH = 11644473600
export const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const U32 = 0xffffffff

const SHA256_INITIAL = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
]
const SHA256_STATE = [
  0xfd9fbea2, 0x91243ce7, 0xbe499094, 0xcd2e1e0a,
  0x6c006f49, 0x04bd35ab, 0xfeb0a7e4, 0x03effbd2,
]
const SHA256_SCHEDULE = [
  0xeb24bf9e, 0x1558691f, 0xa0c09ee2, 0x0cfa32ba,
  0xa622ee8c, 0xd1dd9491, 0xc0dd25a0, 0xf9e70ab6,
  0xf0c31573, 0x7058ce4e, 0x7188e606, 0x00e5ab33,
  0xd258b060, 0x72766564,
]
const SHA256_ROUND_CONSTANTS = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]
const SHA256_ADJUSTMENT = 0xc9dc06a7
const SHA256_BLOCK_CONSTANTS = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15),
]
const SHA256_SIGMA0_ADJUSTMENT = 0x059c0b80
const SHA256_SIGMA1_ADJUSTMENT = 0x000b92c0

const CS64_COEFFICIENTS: Array<[number, number]> = [
  [0xe82e91b1, 0xb32700d0],
  [0x44de24c6, 0x88dff51d],
  [0x3beb65bc, 0x29514038],
  [0xc89c5933, 0xb328cbdf],
  [0x8d1ec211, 0xd405b4d5],
  [0x314ef5d5, 0x26e55f3c],
  [0xe92491b1, 0x607801c6],
  [0xf0a5b9d5, 0x82b2c1fb],
  [0x06064cf3, 0xfa51a3da],
  [0xda79fa60, 0x207cc464],
  [0xbed20560, 0x3c3c74f3],
  [0x89f9c9f8, 0xd2d14b61],
  [0x35fa38c6, 0xbb04a2c1],
  [0xcb49e3c6, 0xc5626167],
]
const CS64_FACTOR = 0x82893933
const CS64_ADJUSTMENT0 = 0xf2f90b1a
const CS64_ADJUSTMENT1 = 0x0b1a0000

const u32 = (v: number) => v >>> 0
const mul = (a: number, b: number) => Math.imul(a, b) >>> 0
const rotr = (x: number, n: number) => ((x >>> n) | u32(x << (32 - n))) >>> 0
const rol16 = (v: number) => u32((u32(v) << 16) | (u32(v) >>> 16))
const sigma0 = (v: number) => u32(rotr(v, 7) ^ rotr(v, 18) ^ (v >>> 3))
const sigma1 = (v: number) => u32(rotr(v, 17) ^ rotr(v, 19) ^ (v >>> 10))

const asciiBytes = (text: string): number[] => {
  const out: number[] = []
  for (let i = 0; i < text.length; i++) out.push(text.charCodeAt(i) & 0x7f)
  return out
}

const hex = (bytes: number[]) =>
  bytes.map((b) => (b & 0xff).toString(16).padStart(2, '0')).join('').toUpperCase()

const wordsLe4Even = (data: number[]): number[] => {
  const padLen = (4 - (data.length % 4)) % 4
  const padded = [...data, ...new Array(padLen).fill(0)]
  const words: number[] = []
  for (let i = 0; i < padded.length; i += 4) {
    words.push(
      u32(
        padded[i] |
          (padded[i + 1] << 8) |
          (padded[i + 2] << 16) |
          (padded[i + 3] << 24),
      ),
    )
  }
  if (words.length % 2 !== 0) words.push(0)
  return words
}

const sha256Rounds = (state: number[], words: number[], firstRound = 0): number[] => {
  let [a, b, c, d, e, f, g, h] = state
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS
  for (let i = firstRound; i < 64; i++) {
    const s1 = u32(rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25))
    const ch = u32(g ^ (e & (f ^ g)))
    const t1 = u32((h + s1 + ch + constants[i] + words[i]) >>> 0)
    const s0 = u32(rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22))
    const maj = u32((a & b) | (c & (a | b)))
    const t2 = u32((s0 + maj) >>> 0)
    h = g; g = f; f = e
    e = u32((d + t1) >>> 0)
    d = c; c = b; b = a
    a = u32((t1 + t2) >>> 0)
  }
  return [a, b, c, d, e, f, g, h]
}

const expandSchedule = (words: number[], firstWord = 16): void => {
  for (let i = firstWord; i < 64; i++) {
    words.push(u32((sigma1(words[i - 2]) + words[i - 7] + sigma0(words[i - 15]) + words[i - 16]) >>> 0))
  }
}

const sha256Init = (data: number[]): number[] => {
  const words: number[] = new Array(14).fill(0)
  const w14 = (data[0] << 16) | (data[1] << 8) | data[2]
  const w15 = (data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6]
  words.push(u32(w14), u32(w15))
  for (let i = 16; i < 30; i++) {
    let value = SHA256_SCHEDULE[i - 16]
    if (i - 2 >= 14) value += i === 16 ? (sigma1(words[i - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) : sigma1(words[i - 2])
    if (i - 7 >= 14) value += words[i - 7]
    if (i - 15 >= 14) value += i === 29 ? (sigma0(words[i - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) : sigma0(words[i - 15])
    words.push(u32(value))
  }
  words.push(
    u32(
      (sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14] + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]) >>>
        0,
    ),
  )
  expandSchedule(words, 31)
  const working = sha256Rounds(SHA256_STATE, words, 14)
  return SHA256_INITIAL.map((v, i) => u32((v + working[i]) >>> 0))
}

const sha256Digest = (data: number[]): number[] => {
  const length = 57 + data.length
  const padLength = (((55 - length) % 64) + 64) % 64
  const padded = [...data.slice(7), 0x80, ...new Array(padLength).fill(0)]
  const bitLength = BigInt(length * 8)
  for (let i = 7; i >= 0; i--) padded.push(Number((bitLength >> BigInt(i * 8)) & 0xffn))

  let state = sha256Init(data.slice(0, 7))
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words: number[] = []
    for (let i = 0; i < 64; i += 4) {
      words.push(
        u32(
          (padded[offset + i] << 24) |
            (padded[offset + i + 1] << 16) |
            (padded[offset + i + 2] << 8) |
            padded[offset + i + 3],
        ),
      )
    }
    expandSchedule(words)
    const working = sha256Rounds(state, words)
    state = state.map((v, i) => u32((v + working[i]) >>> 0))
  }
  const out: number[] = []
  for (let i = 0; i < 8; i++) {
    out.push((state[i] >>> 24) & 0xff, (state[i] >>> 16) & 0xff, (state[i] >>> 8) & 0xff, state[i] & 0xff)
  }
  return out
}

const cs64Digest = (data: number[], digest: number[]): [number, number] => {
  const le = (i: number) => digest[i] | (digest[i + 1] << 8) | (digest[i + 2] << 16) | (digest[i + 3] << 24)
  let keyA = u32(le(0) | 1)
  let keyB = u32(le(4) | 1)
  const factors = [mul(keyA, CS64_FACTOR), mul(keyB, CS64_FACTOR)]
  const terms: number[] = []
  for (let i = 0; i < CS64_COEFFICIENTS.length; i++) {
    terms.push(mul(CS64_COEFFICIENTS[i][0], factors[i % 2]))
  }
  const offsets: number[] = CS64_COEFFICIENTS.map((c) => c[1])

  const prefixed = [0, ...data]
  const words = wordsLe4Even(prefixed)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const even = i % 2 === 0
    let term = mul(word, even ? keyA : keyB)
    let offset = mul(rol16(word), even ? 0xef0569fb : 0xc31713db)
    if (i === 0) {
      term = u32((term + mul(CS64_ADJUSTMENT0, factors[0])) >>> 0)
      offset = u32((offset + CS64_ADJUSTMENT1) >>> 0)
    }
    terms.push(term)
    offsets.push(offset)
  }

  let swapAcc = 0
  let swapLast = 0
  let state = 0
  let acc = 0
  for (let i = 0; i < terms.length; i += 2) {
    const x = terms[i]
    const y = terms[i + 1]
    let t = rol16(u32((offsets[i] + x) >>> 0))
    let q = mul(t, 0x76f50f34)
    swapAcc = u32((swapAcc + mul(rol16(q), 0xc3efea97) + q) >>> 0)
    t = rol16(u32((offsets[i + 1] + y) >>> 0))
    q = mul(t, 0x1881ce3c)
    swapLast = u32((mul(rol16(q), 0x35bd1ec9) + q) >>> 0)
    swapAcc = u32((swapAcc + swapLast) >>> 0)

    state = u32((mul(state, keyA) + x) >>> 0)
    state = mul(rol16(state), 0xcf98b111)
    state = mul(rol16(state), 0x87085b9f)
    state = mul(rol16(state), 0x12ceb96d)
    state = mul(rol16(state), 0x257e1d83)
    acc = u32((acc + state) >>> 0)

    t = u32((mul(state, keyB) + y) >>> 0)
    t = mul(rol16(t), 0xa27416f5)
    t = mul(rol16(t), 0xd38396ff)
    state = mul(rol16(mul(rol16(t), 0x7c932b89)), 0xbfa49f69)
    acc = u32((acc + state) >>> 0)
  }
  return [u32(swapLast ^ state), u32(swapAcc ^ acc)]
}

/** Generate the v2 Sec-MS-GEC token required by the edge read-aloud endpoint. */
export const generateSecMsGec = (unixTimestamp?: number): string => {
  let ticks = unixTimestamp ?? Date.now() / 1000
  ticks += WIN_EPOCH
  ticks -= ticks % 300
  ticks *= 1e7
  const strToHash = `${Math.round(ticks)}${TRUSTED_CLIENT_TOKEN}`
  const data = asciiBytes(strToHash)
  const digest = sha256Digest(data)
  const [w0, w1] = cs64Digest(data, digest)
  const cs64Hex = hex([w0 & 0xff, (w0 >>> 8) & 0xff, (w0 >>> 16) & 0xff, (w0 >>> 24) & 0xff,
    w1 & 0xff, (w1 >>> 8) & 0xff, (w1 >>> 16) & 0xff, (w1 >>> 24) & 0xff])
  return `${cs64Hex}-${hex(digest)}`
}
