import { useAppStore } from './stores/app-store'
import { FolderPicker } from './components/folder-picker/FolderPicker'
import { AppLayout } from './components/layout/AppLayout'
import { TerminalView } from './components/terminal/TerminalView'
import { ChatView } from './components/chat/ChatView'
import { ChatSidebar } from './components/chat/ChatSidebar'

export function App(): JSX.Element {
  const workingDirectory = useAppStore((state) => state.workingDirectory)
  const viewMode = useAppStore((state) => state.viewMode)

  // 未选择工作目录时显示文件夹选择器
  if (!workingDirectory) {
    return <FolderPicker />
  }

  // Chat 视图：左侧聊天记录 + 右侧聊天框
  if (viewMode === 'chat') {
    return (
      <AppLayout>
        <div className="chat-layout">
          <ChatSidebar />
          <ChatView />
        </div>
      </AppLayout>
    )
  }

  // Terminal 视图：只保留终端全屏
  return (
    <AppLayout>
      <TerminalView workingDirectory={workingDirectory} />
    </AppLayout>
  )
}
