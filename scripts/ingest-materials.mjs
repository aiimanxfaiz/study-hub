import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { load } from 'cheerio'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..', '..')
const APP_DIR = path.resolve(__dirname, '..')
const DATA_DIR = path.join(APP_DIR, 'public', 'data')

const IGNORED_TOP_LEVEL_DIRS = new Set([
  '.git',
  'css',
  'img',
  'js',
  'node_modules',
  'study-hub-v2',
])

const NON_SUBJECT_HTML = new Set([
  'Credits.html',
  'Exam Format.html',
  'Module Format.html',
  'Notes Format.html',
  'PPP PDS.html',
  'Subject Format.html',
  'Update logs.html',
  'index.html',
  'googled56de59a594a0c09.html',
])

const CATEGORY_ORDER = ['lecture', 'tutorial', 'test', 'exam', 'notes', 'lab', 'quiz', 'other']

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/')
}

export function createStableId(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12)
}

export function classifyCategory(filePath) {
  const normalized = filePath.toLowerCase()
  if (normalized.includes('module') || normalized.includes('lecture')) return 'lecture'
  if (normalized.includes('tutorial')) return 'tutorial'
  if (normalized.includes('test')) return 'test'
  if (normalized.includes('exam')) return 'exam'
  if (normalized.includes('notes')) return 'notes'
  if (normalized.includes('lab')) return 'lab'
  if (normalized.includes('quiz')) return 'quiz'
  return 'other'
}

function titleFromCategory(type) {
  const labels = {
    lecture: 'Lectures',
    tutorial: 'Tutorials',
    test: 'Tests',
    exam: 'Exam Papers',
    notes: 'Notes',
    lab: 'Labs',
    quiz: 'Quizzes',
    other: 'Other Materials',
  }
  return labels[type] ?? 'Other Materials'
}

export function normalizeImageSrc(fileRelPath, rawSrc) {
  if (!rawSrc) return ''

  const cleaned = rawSrc.trim()
  if (!cleaned) return ''
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://') || cleaned.startsWith('data:')) {
    return cleaned
  }

  const normalized = path.posix.normalize(path.posix.join(path.posix.dirname(fileRelPath), cleaned.replace(/\\/g, '/')))
  return normalized.replace(/^\.\//, '')
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function collectTextBlocks($, $scope) {
  const blocks = []
  $scope.find('pre, p').each((_, el) => {
    const text = cleanText($(el).text())
    if (text) {
      blocks.push(text)
    }
  })
  return Array.from(new Set(blocks))
}

function collectImages($, $scope, fileRelPath) {
  const images = []
  $scope.find('img').each((index, imgEl) => {
    const rawSrc = $(imgEl).attr('src')
    const src = normalizeImageSrc(fileRelPath, rawSrc)
    if (!src) {
      return
    }

    const alt = cleanText($(imgEl).attr('alt') || `Material page ${index + 1}`)
    images.push({
      src,
      alt,
      pageNo: index + 1,
    })
  })

  const deduped = []
  const seen = new Set()
  for (const image of images) {
    if (seen.has(image.src)) continue
    seen.add(image.src)
    deduped.push({ ...image, pageNo: deduped.length + 1 })
  }

  return deduped
}

export function extractAccordionSections(html, fileRelPath) {
  const $ = load(html)
  const sections = []

  $('label[for^="accordion"]').each((_, labelEl) => {
    const labelText = cleanText($(labelEl).text())
    let $content = $(labelEl).next()

    while ($content.length && !$content.hasClass('content')) {
      $content = $content.next()
    }

    if (!$content.length) {
      return
    }

    const images = collectImages($, $content, fileRelPath)
    const textBlocks = collectTextBlocks($, $content)

    if (images.length === 0 && textBlocks.length === 0) {
      return
    }

    const heading = cleanText($content.find('h1').first().text())
    const title = heading || labelText || path.basename(fileRelPath, '.html')

    sections.push({
      title,
      termDateLabel: labelText || undefined,
      images,
      textBlocks,
    })
  })

  return sections
}

function extractDocumentTitle($, fallback) {
  const title = cleanText($('title').first().text())
  if (title) return title
  return fallback
}

function parseRegularItem(html, fileRelPath) {
  const $ = load(html)
  const fileTitle = path.basename(fileRelPath, '.html')
  const title = extractDocumentTitle($, fileTitle)
  const images = collectImages($, $.root(), fileRelPath)
  const textBlocks = collectTextBlocks($, $.root())

  if (images.length === 0 && textBlocks.length === 0) {
    return null
  }

  return {
    title,
    images,
    textBlocks,
  }
}

async function fileExists(absPath) {
  try {
    await fs.access(absPath)
    return true
  } catch {
    return false
  }
}

async function listSubjectDirs() {
  const entries = await fs.readdir(ROOT_DIR, { withFileTypes: true })
  const dirs = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    if (IGNORED_TOP_LEVEL_DIRS.has(entry.name)) continue

    const subjectDir = path.join(ROOT_DIR, entry.name)
    const children = await fs.readdir(subjectDir)
    if (!children.some((item) => item.toLowerCase().endsWith('.html'))) {
      continue
    }
    dirs.push(entry.name)
  }

  return dirs.sort((a, b) => a.localeCompare(b))
}

async function resolveSubjectName(subjectCode) {
  const subjectHtml = path.join(ROOT_DIR, `${subjectCode}.html`)
  if (!(await fileExists(subjectHtml))) {
    return subjectCode
  }

  const html = await fs.readFile(subjectHtml, 'utf8')
  const $ = load(html)
  const configured = cleanText($('#header-config').attr('data-title') || '')
  if (configured) return configured

  const title = cleanText($('title').first().text())
  if (title) return title

  const menuText = cleanText($('#header-config').attr('data-menu-links') || '')
  if (menuText) return menuText

  return subjectCode
}

function buildItem({ subjectCode, sourceHtml, title, termDateLabel, images, textBlocks, tags }) {
  const fingerprint = `${subjectCode}|${sourceHtml}|${title}|${termDateLabel ?? ''}`
  return {
    id: createStableId(fingerprint),
    title,
    sourceHtml,
    images,
    textBlocks: textBlocks.length > 0 ? textBlocks : undefined,
    tags,
    termDateLabel,
  }
}

function createEmptyCategory(type) {
  return {
    type,
    title: titleFromCategory(type),
    items: [],
  }
}

async function ingest() {
  const subjectDirs = await listSubjectDirs()
  const subjects = []
  let imageCount = 0
  let materialCount = 0

  for (const subjectCode of subjectDirs) {
    const subjectDirPath = path.join(ROOT_DIR, subjectCode)
    const files = (await fs.readdir(subjectDirPath))
      .filter((file) => file.toLowerCase().endsWith('.html'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const categories = new Map()
    const seenMaterialIds = new Set()

    for (const fileName of files) {
      const sourceHtml = toPosix(path.join(subjectCode, fileName))
      const absPath = path.join(subjectDirPath, fileName)
      const html = await fs.readFile(absPath, 'utf8')
      const categoryType = classifyCategory(sourceHtml)

      if (!categories.has(categoryType)) {
        categories.set(categoryType, createEmptyCategory(categoryType))
      }

      const category = categories.get(categoryType)
      const baseTag = path.basename(fileName, '.html')
      const tags = [categoryType, baseTag]

      const sectioned =
        fileName.toLowerCase().includes('exam') || fileName.toLowerCase().includes('test')
          ? extractAccordionSections(html, sourceHtml)
          : []

      if (sectioned.length > 0) {
        for (const section of sectioned) {
          const item = buildItem({
            subjectCode,
            sourceHtml,
            title: section.title,
            termDateLabel: section.termDateLabel,
            images: section.images,
            textBlocks: section.textBlocks,
            tags,
          })

          if (seenMaterialIds.has(item.id)) continue
          seenMaterialIds.add(item.id)
          category.items.push(item)
          imageCount += item.images.length
          materialCount += 1
        }
      } else {
        const regular = parseRegularItem(html, sourceHtml)
        if (!regular) continue

        const item = buildItem({
          subjectCode,
          sourceHtml,
          title: regular.title,
          termDateLabel: undefined,
          images: regular.images,
          textBlocks: regular.textBlocks,
          tags,
        })

        if (seenMaterialIds.has(item.id)) continue
        seenMaterialIds.add(item.id)
        category.items.push(item)
        imageCount += item.images.length
        materialCount += 1
      }
    }

    const orderedCategories = CATEGORY_ORDER
      .map((type) => categories.get(type))
      .filter((category) => category && category.items.length > 0)

    if (orderedCategories.length === 0) continue

    subjects.push({
      id: slugify(subjectCode),
      code: subjectCode,
      name: await resolveSubjectName(subjectCode),
      categories: orderedCategories,
    })
  }

  subjects.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))

  const manifest = {
    generatedAt: new Date().toISOString(),
    subjectCount: subjects.length,
    materialCount,
    imageCount,
    subjects: subjects.map((subject) => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      counts: subject.categories.reduce((acc, category) => {
        acc[category.type] = category.items.length
        return acc
      }, {}),
    })),
  }

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(path.join(DATA_DIR, 'materials.json'), `${JSON.stringify({ subjects }, null, 2)}\n`, 'utf8')
  await fs.writeFile(path.join(DATA_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

  console.log(`Ingest complete: ${subjects.length} subjects, ${materialCount} materials, ${imageCount} images.`)
}

export const __testables = {
  cleanText,
  collectTextBlocks,
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  ingest().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
