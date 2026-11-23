import assert from 'node:assert/strict'
import { findLineAt, findWordAt, highlightLine, parseJson3, splitWords } from '../lib/karaoke.ts'

assert.deepEqual(splitWords('Hello  world '), ['Hello  ', 'world '])

let lines = parseJson3({
  events: [
    { tStartMs: 0, dDurationMs: 60239 },
    { tStartMs: 1000, dDurationMs: 1000, segs: [{ utf8: 'Hello' }, { utf8: ' world', tOffsetMs: 400 }] },
  ],
})
assert.equal(lines.length, 1)
assert.deepEqual(lines[0].words[0], { text: 'Hello', start: 1, end: 1.4 })
assert.deepEqual(lines[0].words[1], { text: ' world', start: 1.4, end: 2 })

lines = parseJson3({ events: [{ tStartMs: 2000, dDurationMs: 1000, segs: [{ utf8: 'a bb' }] }] })
assert.deepEqual(lines[0].words.map(w => w.text), ['a ', 'bb'])
assert.ok(Math.abs(lines[0].words[0].end - (2 + 1/3)) < 1e-6)
assert.ok(Math.abs(lines[0].words[1].end - 3) < 1e-6)

lines = parseJson3({
  events: [
    { tStartMs: 0, dDurationMs: 100, segs: [{ utf8: '\n' }] },
    { tStartMs: 500, dDurationMs: 500, segs: [{ utf8: 'Hi' }] },
  ],
})
assert.equal(lines.length, 1)
assert.equal(lines[0].words[0].text, 'Hi')

lines = parseJson3({
  events: [{
    tStartMs: 0, dDurationMs: 1000,
    segs: [{ utf8: 'one ' }, { utf8: 'two ', tOffsetMs: 300 }, { utf8: 'three', tOffsetMs: 600 }],
  }],
})
assert.equal(findWordAt(lines[0], 0.1), 0)
assert.equal(findWordAt(lines[0], 0.45), 1)
assert.equal(findWordAt(lines[0], 0.9), 2)
assert.deepEqual(highlightLine(lines[0], 0.45).map(w => w.active), [false, true, false])

console.log('ALL KARAOKE LOGIC TESTS PASSED')
