import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import type { MaterialImage } from '../../types/materials'

interface MaterialViewerProps {
  title: string
  images: MaterialImage[]
}

type FitMode = 'contain' | 'width' | 'height'

export function MaterialViewer({ title, images }: MaterialViewerProps) {
  const [pageIndex, setPageIndex] = useState(0)
  const [continuous, setContinuous] = useState(false)
  const [fitMode, setFitMode] = useState<FitMode>('width')
  const [missing, setMissing] = useState<Record<string, boolean>>({})
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 960px)').matches
      : false,
  )
  const [showFullscreenNav, setShowFullscreenNav] = useState(true)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const wrapperRef = useRef<ReactZoomPanPinchRef | null>(null)
  const navHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragScrollRef = useRef<{
    active: boolean
    pointerId: number
    startX: number
    startY: number
    startScrollLeft: number
    startScrollTop: number
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  })

  const image = images[pageIndex]

  useEffect(() => {
    setPageIndex((prev) => Math.min(prev, Math.max(images.length - 1, 0)))
  }, [images.length])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (images.length === 0) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setPageIndex((prev) => Math.min(prev + 1, images.length - 1))
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setPageIndex((prev) => Math.max(prev - 1, 0))
      }
      if (event.key === '+') {
        event.preventDefault()
        wrapperRef.current?.zoomIn()
      }
      if (event.key === '-') {
        event.preventDefault()
        wrapperRef.current?.zoomOut()
      }
      if (event.key === '0') {
        event.preventDefault()
        wrapperRef.current?.resetTransform()
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFullscreen()
      }
      if (event.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => undefined)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [images.length])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const media = window.matchMedia('(max-width: 960px)')
    const onChange = (event: MediaQueryListEvent) => setIsMobileViewport(event.matches)
    setIsMobileViewport(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    return () => {
      if (navHideTimerRef.current) {
        clearTimeout(navHideTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (continuous) return
    if (isMobileViewport || isFullscreen) {
      setFitMode('width')
      return
    }
    setFitMode('contain')
  }, [isMobileViewport, isFullscreen, continuous])

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = document.fullscreenElement === frameRef.current
      setIsFullscreen(active)
      if (active) {
        frameRef.current?.focus()
      }
      if (!active) {
        setShowFullscreenNav(true)
        if (navHideTimerRef.current) {
          clearTimeout(navHideTimerRef.current)
        }
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const fitStyle = useMemo(() => {
    const targetHeight = isFullscreen ? 'calc(100vh - 2rem)' : '75vh'

    if (fitMode === 'width') {
      return { width: '100%', height: 'auto' }
    }
    if (fitMode === 'height') {
      return { width: 'auto', height: targetHeight }
    }
    return { width: 'auto', maxWidth: '100%', height: 'auto', maxHeight: targetHeight }
  }, [fitMode, isFullscreen])

  const continuousFitStyle = useMemo(
    () => ({
      width: '100%',
      height: 'auto',
      maxHeight: 'none',
      maxWidth: '100%',
    }),
    [],
  )

  function applyAutoFitTransform() {
    if (continuous) return
    wrapperRef.current?.resetTransform(0)
    wrapperRef.current?.centerView(1, 0)
  }

  function toAssetUrl(src: string) {
    const encodedPath = src
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/')
    return `./materials/${encodedPath}`
  }

  function toggleFullscreen() {
    if (!frameRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
      return
    }
    frameRef.current.requestFullscreen().catch(() => undefined)
  }

  useEffect(() => {
    if (continuous) return
    const id = requestAnimationFrame(() => {
      applyAutoFitTransform()
    })
    return () => cancelAnimationFrame(id)
  }, [pageIndex, fitMode, isFullscreen, continuous])

  function showNavTemporarily() {
    if (!(isFullscreen && !continuous)) return
    setShowFullscreenNav(true)

    if (!isMobileViewport) return

    if (navHideTimerRef.current) {
      clearTimeout(navHideTimerRef.current)
    }
    navHideTimerRef.current = setTimeout(() => {
      setShowFullscreenNav(false)
    }, 1600)
  }

  useEffect(() => {
    if (isFullscreen && !continuous) {
      showNavTemporarily()
      return
    }
    setShowFullscreenNav(true)
  }, [isFullscreen, continuous, isMobileViewport, pageIndex])

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    showNavTemporarily()

    if (event.pointerType !== 'mouse' || event.button !== 0) return
    if (!(isFullscreen || continuous)) return

    const target = event.target as HTMLElement
    if (target.closest('button, input, a, label')) return
    if (!continuous && target.closest('.react-transform-wrapper, .react-transform-component')) return

    const frame = frameRef.current
    if (!frame) return

    dragScrollRef.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: frame.scrollLeft,
      startScrollTop: frame.scrollTop,
    }
    frame.classList.add('dragging')
    frame.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const frame = frameRef.current
    const state = dragScrollRef.current
    if (!frame || !state.active || state.pointerId !== event.pointerId) return

    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY
    frame.scrollLeft = state.startScrollLeft - dx
    frame.scrollTop = state.startScrollTop - dy
    showNavTemporarily()
    event.preventDefault()
  }

  function endPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const frame = frameRef.current
    const state = dragScrollRef.current
    if (!frame || !state.active || state.pointerId !== event.pointerId) return

    dragScrollRef.current.active = false
    frame.classList.remove('dragging')
    if (frame.hasPointerCapture(event.pointerId)) {
      frame.releasePointerCapture(event.pointerId)
    }
  }

  if (images.length === 0) {
    return <p className="state-text">No images in this material.</p>
  }

  return (
    <section className="viewer-shell" aria-label="Material image viewer">
      <div className="viewer-toolbar" role="toolbar" aria-label="Viewer controls">
        <button className="ghost-btn" type="button" onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}>
          Prev
        </button>
        <button className="ghost-btn" type="button" onClick={() => setPageIndex((prev) => Math.min(prev + 1, images.length - 1))}>
          Next
        </button>
        <button className="ghost-btn" type="button" onClick={() => wrapperRef.current?.zoomIn()}>
          Zoom +
        </button>
        <button className="ghost-btn" type="button" onClick={() => wrapperRef.current?.zoomOut()}>
          Zoom -
        </button>
        <button className="ghost-btn" type="button" onClick={() => wrapperRef.current?.resetTransform()}>
          Reset
        </button>
        <button className="ghost-btn" type="button" onClick={() => setFitMode('width')}>
          Fit width
        </button>
        <button className="ghost-btn" type="button" onClick={() => setFitMode('height')}>
          Fit height
        </button>
        <button className="ghost-btn" type="button" onClick={() => setFitMode('contain')}>
          Fit page
        </button>
        <button className="ghost-btn" type="button" onClick={toggleFullscreen}>
          Fullscreen
        </button>
        <label className="toggle-row">
          <input type="checkbox" checked={continuous} onChange={(event) => setContinuous(event.target.checked)} />
          Continuous mode
        </label>
        <span className="viewer-counter">
          {pageIndex + 1}/{images.length}
        </span>
      </div>

      <div
        className={`viewer-main ${continuous ? 'continuous-active' : ''}`}
        ref={frameRef}
        tabIndex={-1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
        onTouchStart={() => showNavTemporarily()}
        onClick={() => showNavTemporarily()}
      >
        {continuous ? (
          <div className="continuous-list">
            {images.map((entry) => {
              const isMissing = missing[entry.src]
              const isLoaded = loaded[entry.src]

              return (
                <figure key={entry.src} className="continuous-item">
                  <figcaption>{entry.alt}</figcaption>
                  {!isLoaded && !isMissing ? <div className="image-skeleton" aria-hidden="true" /> : null}
                  <img
                    src={toAssetUrl(entry.src)}
                    alt={entry.alt}
                    loading="lazy"
                    onError={() => setMissing((prev) => ({ ...prev, [entry.src]: true }))}
                    onLoad={() => setLoaded((prev) => ({ ...prev, [entry.src]: true }))}
                    style={continuousFitStyle}
                  />
                  {isMissing ? <span className="missing-badge">missing file</span> : null}
                </figure>
              )
            })}
          </div>
        ) : (
          <TransformWrapper
            minScale={0.5}
            maxScale={5}
            initialScale={1}
            centerOnInit
            ref={wrapperRef}
            wheel={{ activationKeys: ['Control'] }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', minHeight: isFullscreen ? 'calc(100vh - 1.5rem)' : '70vh' }}
              contentStyle={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              <figure className="viewer-image-wrap">
                <figcaption>{title}</figcaption>
                {!loaded[image.src] && !missing[image.src] ? <div className="image-skeleton" aria-hidden="true" /> : null}
                <img
                  key={image.src}
                  src={toAssetUrl(image.src)}
                  alt={image.alt}
                  loading="lazy"
                  onError={() => setMissing((prev) => ({ ...prev, [image.src]: true }))}
                  onLoad={() => {
                    setLoaded((prev) => ({ ...prev, [image.src]: true }))
                    applyAutoFitTransform()
                  }}
                  style={fitStyle}
                />
                {missing[image.src] ? <span className="missing-badge">missing file</span> : null}
              </figure>
            </TransformComponent>
          </TransformWrapper>
        )}

        {!continuous ? (
          <aside className="thumb-rail" aria-label="Page thumbnails">
            {images.map((thumb, idx) => (
              <button
                key={thumb.src}
                className={`thumb-btn ${idx === pageIndex ? 'active' : ''}`}
                type="button"
                onClick={() => setPageIndex(idx)}
              >
                <img src={toAssetUrl(thumb.src)} alt={`Page ${idx + 1}`} loading="lazy" />
                <span>{idx + 1}</span>
              </button>
            ))}
          </aside>
        ) : null}

        {isFullscreen && !continuous ? (
          <div className={`fullscreen-nav ${isMobileViewport && !showFullscreenNav ? 'hidden' : ''}`} aria-label="Fullscreen page navigation">
            <button
              type="button"
              className="ghost-btn fullscreen-nav-btn fullscreen-nav-btn-left"
              onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
              aria-label="Previous page"
            >
              {isMobileViewport ? '‹' : 'Prev'}
            </button>
            <button
              type="button"
              className="ghost-btn fullscreen-nav-btn fullscreen-nav-btn-right"
              onClick={() => setPageIndex((prev) => Math.min(prev + 1, images.length - 1))}
              aria-label="Next page"
            >
              {isMobileViewport ? '›' : 'Next'}
            </button>
          </div>
        ) : null}
      </div>

      <p className="kbd-help">
        Keyboard: ← → navigate, +/- zoom, 0 reset, f fullscreen, esc exit. Zoom wheel: hold Ctrl + wheel.
      </p>
    </section>
  )
}
