import { useFileStore } from '../../stores/file-store'
import './FileTreeItem.css'

interface FileTreeItemProps {
  node: { id: string; name: string; isDirectory: boolean; children?: any[] }
  depth: number
  onToggleDir: (nodeId: string) => void
  onOpenFile: (node: { id: string; name: string }) => void
}

/**
 * 文件树单项组件
 * 直接从 store 读取 expandedDirs，避免 prop drilling
 */
export function FileTreeItem({
  node,
  depth,
  onToggleDir,
  onOpenFile
}: FileTreeItemProps): JSX.Element {
  // 直接从 store 读取展开状态，确保子节点也能正确判断
  const isExpanded = useFileStore((s) => s.expandedDirs.has(node.id))

  const handleClick = (): void => {
    if (node.isDirectory) {
      onToggleDir(node.id)
    }
  }

  const handleDoubleClick = (): void => {
    if (!node.isDirectory) {
      onOpenFile(node)
    }
  }

  return (
    <>
      <div
        className="file-tree-item"
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        title={node.id}
      >
        {node.isDirectory ? (
          <span className={`file-tree-arrow ${isExpanded ? 'expanded' : ''}`}>
            &#9654;
          </span>
        ) : (
          <span className="file-tree-arrow-placeholder" />
        )}
        <span className="file-tree-icon">
          {node.isDirectory ? (isExpanded ? '\uD83D\uDCC2' : '\uD83D\uDCC1') : '\uD83D\uDCC4'}
        </span>
        <span className="file-tree-name">{node.name}</span>
      </div>

      {/* 递归渲染子节点 */}
      {node.isDirectory &&
        isExpanded &&
        node.children?.map((child: any) => (
          <FileTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            onToggleDir={onToggleDir}
            onOpenFile={onOpenFile}
          />
        ))}
    </>
  )
}
