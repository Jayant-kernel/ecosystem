import React from 'react';
import Editor from '@monaco-editor/react';

interface EditorPanelProps {
  code: string;
  onCodeChange: (value: string | undefined) => void;
  readOnly?: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ code, onCodeChange, readOnly = false }) => {
  return (
    <div className="bg-[#1C1C1C] rounded-lg overflow-hidden h-full border border-[#262626] relative">
      <div className="absolute inset-0">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={onCodeChange}
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