// Static smoke check for the subtitle translation toggle / target language /
// colour & font-scale settings. Pure source parsing (no DOM mock), mirroring
// the style of verify-jyut.mjs.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(ROOT, p), 'utf-8')

const toolbar = read('content/subtitle-toolbar.ts')
const subs = read('content/interactive-subtitles.ts')
const css = read('content/css.ts')

const failures = []
const check = (label, ok) => {
  if (!ok) failures.push(label)
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`)
}

// --- toolbar: defaults -------------------------------------------------
check('default translationEnabled = true', /translationEnabled:\s*true/.test(toolbar))
check('default targetLang = ""', /targetLang:\s*''/.test(toolbar))
check('default subtitleColor = ""', /subtitleColor:\s*''/.test(toolbar))
check('default phoneticColor = ""', /phoneticColor:\s*''/.test(toolbar))
check('default translationColor = ""', /translationColor:\s*''/.test(toolbar))
check('default translationFontScale = 1', /translationFontScale:\s*1\b/.test(toolbar))

// --- toolbar: load() validation ----------------------------------------
check('load() keeps translationEnabled unless false', /translationEnabled:\s*parsed\.translationEnabled\s*!==\s*false/.test(toolbar))
check('load() whitelists targetLang', /TRANSLATION_LANGUAGES\.some\(\(o\)\s*=>\s*o\.id\s*===\s*parsed\.targetLang\)/.test(toolbar))
check('load() validates subtitleColor by regex', /subtitleColor:\s*COLOR_RE\.test/.test(toolbar))
check('load() validates phoneticColor by regex', /phoneticColor:\s*COLOR_RE\.test/.test(toolbar))
check('load() validates translationColor by regex', /translationColor:\s*COLOR_RE\.test/.test(toolbar))
check('load() clamps translationFontScale 0.5-1.4', /translationFontScale:\s*clamp\(Number\(parsed\.translationFontScale\)\s*\|\|\s*1,\s*0\.5,\s*1\.4\)/.test(toolbar))

// --- toolbar: language table -------------------------------------------
const langBlock = toolbar.match(/const TRANSLATION_LANGUAGES[\s\S]*?\]/)
const langIds = [...(langBlock?.[0] ?? '').matchAll(/id:\s*'([^']*)'/g)].map((m) => m[1])
check('language table offers "follow default" id', langIds.includes(''))
check('language table has 15 entries (default + 14)', langIds.length === 15)

// --- toolbar: swatch UI -------------------------------------------------
check('swatch container class present', toolbar.includes('nou-sub-tb-swatches'))
check('swatch button class present', toolbar.includes('nou-sub-tb-swatch'))
check('default chip uses is-default', toolbar.includes('is-default'))

// --- subtitles: translation guards -------------------------------------
check('loadTranslation honours translationEnabled', /if\s*\(!toolbar\.translationEnabled/.test(subs))
check('displayWordsFor guards translationEnabled', /toolbar\.translationEnabled\s*&&\s*toolbar\.displayMode\s*===\s*'translation'/.test(subs))
check('bilingual line guarded by translationEnabled', /toolbarNow\.translationEnabled\s*&&\s*toolbarNow\.displayMode\s*===\s*'bilingual'/.test(subs))
check('hover translation guarded by translationEnabled', /!getToolbarSettings\(\)\.translationEnabled/.test(subs))
check('targetLang preferred over App setting', /if\s*\(toolbar\.targetLang\)\s*return\s*toolbar\.targetLang/.test(subs))

// --- subtitles: style variables ---------------------------------------
check('syncContainerStyle writes rt colour', /--nou-sub-rt-color/.test(subs))
check('syncContainerStyle writes translation colour', /--nou-sub-translation-color/.test(subs))
check('translation size multiplies translationFontScale', /translationRatio\s*\*\s*toolbar\.translationFontScale/.test(subs))
check('change watcher tracks translationEnabled', /lastTranslationEnabled/.test(subs))
check('change watcher tracks targetLang', /lastTargetLang/.test(subs))

// --- css: variables + swatch styling ------------------------------------
check('css defines rt colour fallback var', /--nou-sub-rt-color/.test(css))
check('css defines translation colour fallback var', /--nou-sub-translation-color/.test(css))
check('rt uses rt colour var', /color:\s*var\(--nou-sub-rt-color/.test(css))
check('translation line uses translation colour var', /color:\s*var\(--nou-sub-translation-color/.test(css))
check('css styles swatch container', /\.nou-sub-tb-swatches/.test(css))
check('css styles swatch button', /\.nou-sub-tb-swatch\b/.test(css))
check('css swatch active ring', /\.nou-sub-tb-swatch\.is-active/.test(css))
check('css swatch default chip', /\.nou-sub-tb-swatch\.is-default/.test(css))

console.log('')
if (failures.length) {
  console.error(`FAILED ${failures.length} check(s):`)
  for (const f of failures) console.error(' - ' + f)
  process.exit(1)
}
console.log('All subtitle-settings smoke checks passed.')
