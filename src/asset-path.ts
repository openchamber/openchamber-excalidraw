// Excalidraw fetches its hand-drawn fonts at runtime. Inside a bundled script
// it cannot find them next to itself, so point it at the same version on the
// CDN Excalidraw falls back to anyway. The sandboxed frame may fetch it: the
// CDN answers with CORS for any origin. Imported first, before Excalidraw.
declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}

window.EXCALIDRAW_ASSET_PATH = 'https://esm.sh/@excalidraw/excalidraw@0.18.1/dist/prod/';

export {};
