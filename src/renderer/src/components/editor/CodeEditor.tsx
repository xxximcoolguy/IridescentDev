import { useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useFileStore } from '../../stores/file-store'
import { EditorTabs } from './EditorTabs'
import './CodeEditor.css'

export function CodeEditor(): JSX.Element {
  const openFiles = useFileStore((s) => s.openFiles)
  const activeFileId = useFileStore((s) => s.activeFileId)
  const updateFileContent = useFileStore((s) => s.updateFileContent)
  const saveFile = useFileStore((s) => s.saveFile)

  const activeFile = openFiles.find((f) => f.id === activeFileId)

  // Ctrl+S 保存
  const handleSave = useCallback(() => {
    if (activeFileId) {
      saveFile(activeFileId)
    }
  }, [activeFileId, saveFile])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  if (openFiles.length === 0) {
    return (
      <div className="code-editor">
        <div className="code-editor-empty">
          <p>双击文件树中的文件打开编辑</p>
        </div>
      </div>
    )
  }

  return (
    <div className="code-editor">
      <EditorTabs />
      {activeFile && (
        <div className="code-editor-content">
          <Editor
            key={activeFile.id}
            language={activeFile.language}
            value={activeFile.content}
            theme="vs-dark"
            onChange={(value) => {
              if (value !== undefined) {
                updateFileContent(activeFile.id, value)
              }
            }}
            options={{
              fontSize: 14,
              fontFamily: "'Cascadia Code', 'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              tabSize: 2,
              wordWrap: 'on',
              automaticLayout: true
            }}
          />
        </div>
      )}
    </div>
  )
}
