/* @vitest-environment node */
import { describe, expect, it } from 'vitest'
import {
  classifyCategory,
  createStableId,
  extractAccordionSections,
  normalizeImageSrc,
} from './ingest-materials.mjs'

describe('ingest helpers', () => {
  it('classifies category from filename', () => {
    expect(classifyCategory('TSN 2201/Module 1.html')).toBe('lecture')
    expect(classifyCategory('TSN 2201/Tutorial 1.html')).toBe('tutorial')
    expect(classifyCategory('TSN 2201/Tests.html')).toBe('test')
    expect(classifyCategory('TSN 2201/Exams.html')).toBe('exam')
  })

  it('normalizes image path', () => {
    expect(normalizeImageSrc('TSN 2201/Exams.html', 'Images/Exams/image 1.png')).toBe(
      'TSN 2201/Images/Exams/image 1.png',
    )
    expect(normalizeImageSrc('TSN 2201/Exams.html', '')).toBe('')
  })

  it('extracts accordion sections', () => {
    const html = `
      <label for="accordion1">Trimester 1</label>
      <div class="content hidecontent">
        <h1>Question 1</h1>
        <img src="Images/Exams/q1.png" />
      </div>
      <label for="accordion2">Trimester 2</label>
      <div class="content hidecontent">
        <img src="Images/Exams/q2.png" />
      </div>
    `

    const sections = extractAccordionSections(html, 'TSN 2201/Exams.html')
    expect(sections).toHaveLength(2)
    expect(sections[0]?.termDateLabel).toBe('Trimester 1')
    expect(sections[0]?.images[0]?.src).toBe('TSN 2201/Images/Exams/q1.png')
  })

  it('creates deterministic ids', () => {
    const first = createStableId('a|b|c')
    const second = createStableId('a|b|c')
    expect(first).toBe(second)
    expect(first).toHaveLength(12)
  })
})
