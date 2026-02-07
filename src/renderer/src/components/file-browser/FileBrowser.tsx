import { useEffect } from 'react'
import { useFileStore } from '../../stores/file-store'
import { useAppStore } from '../../stores/app-store'
import { FileTreeItem } from './FileTreeItem'
import './FileBrowser.css'

/**
 * 文件浏览器组件
 * 显示工作目录的文件树，支持展开/折叠目录和双击打开文件
 */
export function FileBrowser(): JSX.Element {
  const workingDirectory = useAppStore((s) => s.workingDirectory)
  const fileTree = useFileStore((s) => s.fileTree)
  const loadDirectory = useFileStore((s) => s.loadDirectory)
  const toggleDirectory = useFileStore((s) => s.toggleDirectory)
  const openFile = useFileStore((s) => s.openFile)

  // 当工作目录变化时，加载目录内容
  useEffect(() => {
    if (workingDirectory) {
      loadDirectory(workingDirectory)
    }
  }, [workingDirectory, loadDirectory])

  return (
    <div className="file-browser">
      <div className="file-browser-header">文件</div>
      <div className="file-browser-tree">
        {fileTree.map((node) => (
          <FileTreeItem
            key={node.id}
            node={node}
            depth={0}
            onToggleDir={toggleDirectory}
            onOpenFile={openFile}
          />
        ))}
      </div>
    </div>
  )
}
