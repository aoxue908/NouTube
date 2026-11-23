// Data integrity check for the rebuilt Japanese compound vocabulary.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const ts = readFileSync(join(ROOT, 'content', 'phonetics-data.ts'), 'utf-8')

function extract(name) {
  const re = new RegExp(`export const ${name}: Record<string, string> = \\{(.*?)\\n\\}`, 's')
  const m = ts.match(re)
  if (!m) throw new Error(`${name} block not found`)
  const body = m[1]
  const entryRe = /"([^"]+)":\s*"([^"]*)"/g
  const map = new Map()
  const dup = []
  let e
  while ((e = entryRe.exec(body))) {
    const [, k, v] = e
    if (map.has(k)) dup.push(k)
    map.set(k, v)
  }
  return { map, dup }
}

const VOCAB = extract('JAPANESE_COMMON_VOCAB')

const KANA = /^[぀-ヿー]+$/
const PARTICLE_END = new Set('はをにのでへともやかながねよぞさ')
const badReading = []
const particleEnd = []
for (const [word, reading] of VOCAB.map) {
  if (!KANA.test(reading)) badReading.push([word, reading])
  if (PARTICLE_END.has(word[word.length - 1])) particleEnd.push(word)
}

const GREETINGS = ['今日は', '今日わ', '今晩は']
const leakedGreetings = GREETINGS.filter((g) => VOCAB.map.has(g))

console.log('JAPANESE_COMMON_VOCAB entries:', VOCAB.map.size)
console.log('duplicate keys:', VOCAB.dup.length ? VOCAB.dup : 'none')
console.log('non-kana readings:', badReading.length ? badReading.slice(0, 20) : 'none')
console.log('particle-ending phrases:', particleEnd.length ? particleEnd.slice(0, 20) : 'none')
console.log('leaked greetings:', leakedGreetings.length ? leakedGreetings : 'none')

// Screenshot regression: 綺麗 must read きれい as a compound, not うるわ.
const checks = {
  '綺麗': 'きれい',
  '大人': 'おとな',
  '今日': 'きょう',
  '明日': 'あした',
  '映画館': 'えいがかん',
  '約束': 'やくそく',
  '秘密': 'ひみつ',
}
let failed = []
for (const [word, want] of Object.entries(checks)) {
  const got = VOCAB.map.get(word)
  const ok = got === want
  if (!ok) failed.push(`${word}: want ${want}, got ${got ?? 'MISSING'}`)
  console.log(`  check ${word}: ${got ?? 'MISSING'}`)
}

if (
  VOCAB.dup.length ||
  badReading.length ||
  particleEnd.length ||
  leakedGreetings.length ||
  failed.length
) {
  console.error('\nFAILED checks:')
  for (const f of failed) console.error(' - ' + f)
  process.exit(1)
}
console.log('\nAll Japanese vocabulary checks passed.')
