import '@testing-library/jest-dom'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  // react-zoom-pan-pinch relies on this in jsdom tests.
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
}
