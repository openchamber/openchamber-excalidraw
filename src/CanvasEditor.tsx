import React from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import { createFileSaveTracker, type FileEditorChange, type FileEditorDocument, type FileEditorSnapshot } from '@openchamber/sdk';

import { openExcalidrawDocument, serializeExcalidrawDocument } from './document';
import { excalidrawFormatForPath, excalidrawLangCode, excalidrawSceneSignature } from './scene';

/** What the page-level host handlers call on the mounted canvas. */
export type CanvasSession = {
  snapshot: () => FileEditorSnapshot;
  markSaved: (version: string) => void;
};

type LiveScene = {
  elements: readonly OrderedExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};

type CanvasEditorProps = {
  file: FileEditorDocument;
  theme: 'light' | 'dark';
  locale: string;
  onSession: (session: CanvasSession | null) => void;
  onChange: (change: FileEditorChange) => void;
  onUnsupported: () => void;
};

/**
 * One document. Excalidraw reads `initialData` once, so a new document means a
 * new mount (the page keys this component by the file the host handed over).
 */
export const CanvasEditor: React.FC<CanvasEditorProps> = ({ file, theme, locale, onSession, onChange, onUnsupported }) => {
  const [parsed] = React.useState(() => openExcalidrawDocument(file.content, excalidrawFormatForPath(file.name)));
  const initialVersion = parsed ? excalidrawSceneSignature(parsed.scene.elements, parsed.scene.appState) : null;
  const [tracker] = React.useState(() => createFileSaveTracker(initialVersion));
  const liveSceneRef = React.useRef<LiveScene | null>(null);
  const dirtyRef = React.useRef(false);
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // A file the canvas cannot read never mounts: a blank scene saved over it
  // would destroy the drawing. The host shows the source instead.
  const reportedUnsupportedRef = React.useRef(false);
  React.useEffect(() => {
    if (parsed || reportedUnsupportedRef.current) return;
    reportedUnsupportedRef.current = true;
    onUnsupported();
  }, [onUnsupported, parsed]);

  const report = React.useCallback((change: FileEditorChange) => {
    // Excalidraw calls onChange on every pointer move; only real edits and
    // dirty flips cross the frame boundary.
    if (!change.edited && change.dirty === dirtyRef.current) return;
    dirtyRef.current = change.dirty;
    onChangeRef.current(change);
  }, []);

  React.useEffect(() => {
    if (!parsed || initialVersion === null) return;
    onSession({
      snapshot: () => {
        const scene = liveSceneRef.current;
        if (!scene) return { content: file.content, version: initialVersion };
        return {
          content: serializeExcalidrawDocument(parsed.container, scene),
          version: excalidrawSceneSignature(scene.elements, scene.appState),
        };
      },
      markSaved: (version) => report({ dirty: tracker.markSaved(version), edited: false }),
    });
    return () => onSession(null);
  }, [file.content, initialVersion, onSession, parsed, report, tracker]);

  const handleChange = React.useCallback(
    (elements: readonly OrderedExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      liveSceneRef.current = { elements, appState, files };
      report(tracker.observe(excalidrawSceneSignature(elements, appState)));
    },
    [report, tracker],
  );

  if (!parsed) return null;

  return (
    <div className="oc-excalidraw">
      <Excalidraw
        initialData={parsed.scene}
        onChange={handleChange}
        theme={theme}
        langCode={excalidrawLangCode(locale)}
        viewModeEnabled={file.readOnly}
        aiEnabled={false}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            saveToActiveFile: false,
            saveAsImage: false,
            export: false,
            toggleTheme: null,
          },
        }}
        detectScroll={false}
      />
    </div>
  );
};
