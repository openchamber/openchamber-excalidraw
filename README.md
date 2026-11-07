# Excalidraw for OpenChamber

Draw in `.excalidraw` files and Obsidian `.excalidraw.md` drawings right in OpenChamber's Files view.

Open a matching file and you get the Excalidraw canvas instead of the text. OpenChamber keeps the file: Cmd/Ctrl+S, autosave, the unsaved-changes prompt, and changes made on disk work the same as for any other file. The source toggle shows the file's text, and fullscreen gives the canvas the whole window.

Obsidian drawings are written back in place. Frontmatter, text elements, and everything outside the `## Drawing` block stay as they were, and compressed drawings stay compressed.

## Install

In OpenChamber, open Settings → Extensions and add this repository's Git URL. Web and desktop only; the phone app shows the file's text.

## What's not here

- Mermaid and text-to-diagram. The converter is about two thousand modules on its own, so this build leaves it out and hides its menu entries.
- Export and "save as image". OpenChamber owns the file, and the canvas can't write elsewhere.

Excalidraw loads its hand-drawn fonts from the esm.sh CDN the first time you open a drawing. OpenChamber asks you to approve esm.sh; without approval, canvas text falls back to a system font.

## Build

```bash
bun install
bun run build   # writes editor/main.js and editor/main.css
bun run test
bun run typecheck
```

The built files are committed: OpenChamber installs extensions without building them. Bump `version` in `package.json` to ship an update through Git.

## Credits

The canvas integration started in OpenChamber itself, contributed by [Maksym Mospanenko](https://github.com/mmospanenko) in [openchamber#4064](https://github.com/openchamber/openchamber/pull/4064), and moved here when Excalidraw became an extension.

## License

MIT. Excalidraw itself is MIT, © Excalidraw.
