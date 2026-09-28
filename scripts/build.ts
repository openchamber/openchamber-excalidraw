// Builds the editor page as one classic script plus its stylesheet. The host
// loads extension pages in a sandboxed iframe that cannot run ES modules, so
// everything Excalidraw loads lazily ends up in this one file. Two things are
// left out on purpose:
//  - the Mermaid converter (`@excalidraw/mermaid-to-excalidraw`, about two
//    thousand modules). The editor sets `aiEnabled={false}`, which removes the
//    menu entries that would open it.
//  - Excalidraw locales OpenChamber has no language for.
import { rm } from 'node:fs/promises';

import { SHIPPED_LANG_CODES } from '../src/scene.ts';

const shipped = new Set(SHIPPED_LANG_CODES);

const result = await Bun.build({
  entrypoints: ['src/main.tsx'],
  outdir: 'editor',
  naming: '[name].[ext]',
  format: 'iife',
  target: 'browser',
  minify: true,
  conditions: ['production'],
  // `import.meta` is a syntax error in a classic script, so every use left in
  // Excalidraw's module build gets a value here. The URL is only read by the
  // font-subsetting worker for image export, which this editor turns off.
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.IS_PREACT': '"false"',
    'import.meta.env': '{"MODE":"production","DEV":false,"PROD":true}',
    'import.meta.url': '""',
  },
  plugins: [{
    name: 'trim-excalidraw',
    setup(build) {
      build.onResolve({ filter: /^@excalidraw\/mermaid-to-excalidraw$/ }, () => ({ path: 'mermaid-stub', namespace: 'stub' }));
      build.onLoad({ filter: /^mermaid-stub$/, namespace: 'stub' }, () => ({
        contents: 'export const parseMermaidToExcalidraw = async () => { throw new Error("Mermaid is not included in this build."); };',
        loader: 'js',
      }));
      build.onLoad({ filter: /[\\/]@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/]locales[\\/][^\\/]+\.js$/ }, async (args) => {
        const code = args.path.split(/[\\/]/).pop()?.replace(/-[A-Z0-9]{8}\.js$/, '') ?? '';
        if (shipped.has(code) || code === 'percentages') return undefined;
        return { contents: 'export default {};', loader: 'js' };
      });
    },
  }],
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// Bun writes a sourcemap-free build; drop stray assets the editor never loads
// (fonts come from Excalidraw's CDN at runtime, see src/asset-path.ts).
for (const output of result.outputs) {
  const name = output.path.split(/[\\/]/).pop() ?? '';
  if (name !== 'main.js' && name !== 'main.css') await rm(output.path, { force: true });
  else console.log(`${name}: ${(output.size / 1024 / 1024).toFixed(2)} MB`);
}
