import React, { useEffect, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

interface EditorPanelProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  readOnly?: boolean;
  /** 1-based line numbers the tutor is currently talking about. */
  highlightLines?: number[];
  onMountEditor?: (editor: any, monaco: any) => void;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  code,
  onCodeChange,
  readOnly = false,
  highlightLines = [],
  onMountEditor,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    onMountEditor?.(editor, monaco);
  };

  // Paint (and clear) the tutor's highlight as it talks through the code.
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const lines = (highlightLines || []).filter(
      (line) => Number.isFinite(line) && line > 0,
    );

    const decorations = lines.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'tutor-line-highlight',
        linesDecorationsClassName: 'tutor-line-gutter',
      },
    }));

    // deltaDecorations is widely available but deprecated; guard so a future
    // Monaco upgrade degrades to "no highlight" instead of throwing.
    if (typeof editor.deltaDecorations === 'function') {
      decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
    }

    if (lines.length) {
      editor.revealLineInCenterIfOutsideViewport(Math.min(...lines));
    }
  }, [highlightLines, code]);

  return (
    <div className="bg-[#1C1C1C] rounded-lg overflow-hidden h-full border border-[#262626] relative">
      <div className="absolute inset-0">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={onCodeChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            readOnly: readOnly,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
