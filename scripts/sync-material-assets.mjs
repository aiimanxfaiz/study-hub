import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const APP_ROOT = path.resolve(__dirname, '..')
const SOURCE_ROOT = path.resolve(APP_ROOT, '..')
const MATERIALS_JSON = path.join(APP_ROOT, 'public', 'data', 'materials.json')
const TARGET_ROOT = path.join(APP_ROOT, 'public', 'materials')

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function main() {
  const payload = JSON.parse(await fs.readFile(MATERIALS_JSON, 'utf8'))
  const images = new Set()

  for (const subject of payload.subjects ?? []) {
    for (const category of subject.categories ?? []) {
      for (const item of category.items ?? []) {
        for (const image of item.images ?? []) {
          if (typeof image.src === 'string' && image.src.trim()) {
            images.add(image.src.trim())
          }
        }
      }
    }
  }

  let copied = 0
  let missing = 0

  for (const relSrc of images) {
    const srcAbs = path.resolve(SOURCE_ROOT, relSrc)
    const dstAbs = path.resolve(TARGET_ROOT, relSrc)

    if (!(await fileExists(srcAbs))) {
      missing += 1
      continue
    }

    await ensureDir(path.dirname(dstAbs))
    await fs.copyFile(srcAbs, dstAbs)
    copied += 1
  }

  console.log(`Asset sync complete: copied ${copied} files, missing ${missing} files.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
