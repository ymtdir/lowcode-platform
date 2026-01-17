'use client';

import { useRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

/**
 * コードエディタのProps型
 */
export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language: 'css' | 'javascript' | 'typescript' | 'html' | 'json';
  height?: string;
  readOnly?: boolean;
};

/**
 * Monaco Editorをラップした汎用コードエディタコンポーネント
 */
export function CodeEditor({
  value,
  onChange,
  language,
  height = '400px',
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleChange: OnChange = (newValue) => {
    onChange(newValue ?? '');
  };

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme="vs-dark"
      onChange={handleChange}
      onMount={handleEditorDidMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        automaticLayout: true,
        tabSize: 2,
        insertSpaces: true,
        folding: true,
        bracketPairColorization: { enabled: true },
      }}
    />
  );
}
