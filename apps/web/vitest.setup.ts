import { vi } from "vitest";

// TanStack Router's scroll-restoration calls window.scrollTo on every mount;
// jsdom has no layout engine, so we stub it once for the whole suite.
window.scrollTo = vi.fn();
