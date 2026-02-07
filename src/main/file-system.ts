import * as fs from 'fs'
import * as path from 'path'

/** 文件树节点 */
export interface FileTreeNode {
  id: string         // 完整路径
  name: string       // 文件名
  isDirectory: boolean
  children?: FileTreeNode[]
}

/** 忽略的目录 */
const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'out', '.next', '.nuxt',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode',
  'coverage', '.cache', 'build', '.DS_Store'
])

/** 读取目录（只读一层，不递归） */
export async function readDirectory(dirPath: string): Promise<FileTreeNode[]> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
  const nodes: FileTreeNode[] = []

  for (const entry of entries) {
    // 跳过隐藏文件（以.开头）和忽略目录
    if (entry.name.startsWith('.') && entry.name !== '.env') continue
    if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue

    nodes.push({
      id: path.join(dirPath, entry.name),
      name: entry.name,
      isDirectory: entry.isDirectory()
    })
  }

  // 排序：目录在前，文件在后，各自按名称排序
  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return nodes
}

/** 读取文件内容 */
export async function readFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8')
}

/** 写入文件 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.promises.writeFile(filePath, content, 'utf-8')
}

/** 获取文件信息 */
export async function getFileInfo(filePath: string): Promise<{ size: number; modified: number }> {
  const stat = await fs.promises.stat(filePath)
  return { size: stat.size, modified: stat.mtimeMs }
}
