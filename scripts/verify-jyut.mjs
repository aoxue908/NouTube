// Data integrity check for the rebuilt Cantonese Jyutping table.
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

const READING = /^[a-z]+[1-6]$/
const chars = extract('CANTONESE_CHARS')
const phrases = extract('CANTONESE_PHRASES')

let bad = []
for (const [k, v] of chars.map) {
  if (!READING.test(v)) bad.push([k, v])
}

console.log('CANTONESE_CHARS entries:', chars.map.size)
console.log('CANTONESE_PHRASES entries:', phrases.map.size)
console.log('duplicate char keys:', chars.dup.length ? chars.dup : 'none')
console.log('duplicate phrase keys:', phrases.dup.length ? phrases.dup : 'none')
console.log('invalid readings:', bad.length ? bad.slice(0, 20) : 'none')

// Screenshot regression sentence: every Han character must resolve.
const sentence = '因為一念之差而要正法痛的痛在應該是一個忠心的人'
const missing = []
for (const ch of sentence) {
  if (/[\u3400-\u9fff\uf900-\ufaff]/.test(ch) && !chars.map.has(ch)) missing.push(ch)
}
console.log('screenshot sentence missing chars:', missing.length ? missing : 'none')

// Show the rebuilt reading for the screenshot line.
const line = [...sentence].map((ch) => chars.map.get(ch) ?? '·').join(' ')
console.log('readings:', line)

if (chars.dup.length || phrases.dup.length || bad.length || missing.length) {
  process.exit(1)
}
