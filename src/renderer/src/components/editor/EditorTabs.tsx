import { useFileStore } from '../../stores/file-store'
import './EditorTabs.css'

export function EditorTabs(): JSX.Element | null {
  const openFiles = useFileStore((s) => s.openFiles)
  const activeFileId = useFileStore((s) => s.activeFileId)
  const setActiveFile = useFileStore((s) => s.setActiveFile)
  const closeFile = useFileStore((s) => s.closeFile)

  if (openFiles.length === 0) return null

  return (
    <div className="editor-tabs">
      {openFiles.map((file) => (
        <div
          key={file.id}
          className={`editor-tab ${activeFileId === file.id ? 'active' : ''}`}
          onClick={() => setActiveFile(file.id)}
        >
          <span className="editor-tab-name">
            {file.isDirty && <span className="editor-tab-dirty">●</span>}
            {file.name}
          </span>
          <button
            className="editor-tab-close"
            onClick={(e) => {
              e.stopPropagation()
              closeFile(file.id)
            }}
            title="关闭"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
