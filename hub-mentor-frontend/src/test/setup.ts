import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// jsdom is missing a few browser APIs that Radix UI components touch on render.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserverStub;

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

(Element.prototype as any).scrollIntoView = vi.fn();
(Element.prototype as any).hasPointerCapture = vi.fn();
(Element.prototype as any).setPointerCapture = vi.fn();
(Element.prototype as any).releasePointerCapture = vi.fn();
