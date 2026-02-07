import { create } from 'zustand'
import type { FileTreeNode } from '../../../shared/types'

/** 已打开的文件 */
export interface OpenFile {
  /** 文件路径 */
  id: string
  /** 文件名 */
  name: string
  /** 文件内容 */
  content: string
  /** 是否有未保存修改 */
  isDirty: boolean
  /** 语言标识 */
  language: string
}

/** 根据扩展名推断语言 */
function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    json: 'json',
    html: 'html',
    css: 'css',
    md: 'markdown',
    py: 'python',
    rs: 'rust',
    go: 'go',
    java: 'java',
    yml: 'yaml',
    yaml: 'yaml',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    sql: 'sql',
    xml: 'xml',
    svg: 'xml',
    toml: 'toml',
    ini: 'ini',
    env: 'plaintext',
    txt: 'plaintext',
    gitignore: 'plaintext'
  }
  return map[ext] || 'plaintext'
}

interface FileState {
  /** 文件树节点列表 */
  fileTree: FileTreeNode[]
  /** 已展开的目录集合 */
  expandedDirs: Set<string>
  /** 已打开的文件列表 */
  openFiles: OpenFile[]
  /** 当前激活的文件 ID */
  activeFileId: string | null

  /** 加载目录内容 */
  loadDirectory: (dirPath: string) => Promise<void>
  /** 切换目录展开/折叠 */
  toggleDirectory: (nodeId: string) => Promise<void>
  /** 打开文件 */
  openFile: (node: { id: string; name: string }) => Promise<void>
  /** 关闭文件 */
  closeFile: (fileId: string) => void
  /** 设置当前激活文件 */
  setActiveFile: (fileId: string) => void
  /** 更新文件内容 */
  updateFileContent: (fileId: string, content: string) => void
  /** 保存文件 */
  saveFile: (fileId: string) => Promise<void>
}

export const useFileStore = create<FileState>((set, get) => ({
  fileTree: [],
  expandedDirs: new Set<string>(),
  openFiles: [],
  activeFileId: null,

  loadDirectory: async (dirPath) => {
    const nodes = await window.api.fs.readDir(dirPath)
    set({ fileTree: nodes })
  },

  toggleDirectory: async (nodeId) => {
    const { expandedDirs } = get()
    const newExpanded = new Set(expandedDirs)

    if (newExpanded.has(nodeId)) {
      // 折叠目录
      newExpanded.delete(nodeId)
      set({ expandedDirs: newExpanded })
    } else {
      // 展开目录，加载子目录内容
      const children = await window.api.fs.readDir(nodeId)
      newExpanded.add(nodeId)

      // 递归更新文件树中对应节点的 children
      const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, children }
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) }
          }
          return node
        })

      set((state) => ({
        fileTree: updateTree(state.fileTree),
        expandedDirs: newExpanded
      }))
    }
  },

  openFile: async (node) => {
    const { openFiles } = get()

    // 如果已打开，直接切换到该文件
    const existing = openFiles.find((f) => f.id === node.id)
    if (existing) {
      set({ activeFileId: node.id })
      return
    }

    // 读取文件内容并添加到打开列表
    const content = await window.api.fs.readFile(node.id)
    const newFile: OpenFile = {
      id: node.id,
      name: node.name,
      content,
      isDirty: false,
      language: detectLanguage(node.name)
    }

    set((state) => ({
      openFiles: [...state.openFiles, newFile],
      activeFileId: node.id
    }))
  },

  closeFile: (fileId) => {
    set((state) => {
      const newFiles = state.openFiles.filter((f) => f.id !== fileId)
      let newActiveId = state.activeFileId

      // 如果关闭的是当前激活文件，切换到最后一个打开的文件
      if (state.activeFileId === fileId) {
        newActiveId = newFiles.length > 0 ? newFiles[newFiles.length - 1].id : null
      }

      return { openFiles: newFiles, activeFileId: newActiveId }
    })
  },

  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  updateFileContent: (fileId, content) => {
    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.id === fileId ? { ...f, content, isDirty: true } : f
      )
    }))
  },

  saveFile: async (fileId) => {
    const file = get().openFiles.find((f) => f.id === fileId)
    if (!file) return

    await window.api.fs.writeFile(fileId, file.content)

    set((state) => ({
      openFiles: state.openFiles.map((f) =>
        f.id === fileId ? { ...f, isDirty: false } : f
      )
    }))
  }
}))
