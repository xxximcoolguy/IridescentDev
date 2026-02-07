# Claude Code UI (Windows)

Windows 桌面端的 Claude Code 可视化助手，替代命令行终端使用 Claude Code CLI。

## 功能特性

- **文件夹选择器** — 启动时选择工作目录，支持最近目录快速切换
- **终端视图** — 基于 xterm.js + node-pty (ConPTY) 的全功能终端模拟器，自动启动 Claude CLI
- **聊天视图** — iMessage 风格的对话 UI，通过 Claude CLI 的 `stream-json` 模式与 Claude 对话
- **打字机效果** — 回复内容逐字输出，等待时显示三点跳动动画
- **Markdown 渲染** — 代码块、表格、列表、链接等完整支持
- **会话管理** — 聊天记录持久化，支持切换历史会话、重命名、删除
- **文件浏览器** — 树状目录结构浏览工作目录文件
- **代码编辑器** — 基于 Monaco Editor，支持多 Tab、语法高亮
- **视图切换** — Ctrl+1 终端 / Ctrl+2 聊天，快捷键一键切换
- **iOS Dark 主题** — 简洁��代的深色 UI 风格

## 技术栈

| 模块 | 技术 |
|------|------|
| 框架 | Electron + React 19 + TypeScript |
| 构建 | electron-vite |
| 终端 | node-pty (ConPTY) + xterm.js |
| 状态管理 | Zustand |
| 编辑器 | Monaco Editor |
| 存储 | electron-store |

## 前提条件

- **Node.js** >= 18
- **Claude Code CLI** 已安装并配置 (`claude` 命令可用)
- **Visual Studio Build Tools** (编译 node-pty 需要)
  - 勾选「使用 C++ 的桌面开发」
  - Python 3.12 需额外安装 `setuptools`

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/xxximcoolguy/claudeUI_win.git
cd claudeUI_win

# 安装依赖
npm install

# 启动开发模式
npm run dev

# 构建 Windows 安装包
npm run build:win
```

## 项目结构

```
src/
├── main/                  # Electron 主进程
│   ├── index.ts           # BrowserWindow 创建
│   ├── pty-manager.ts     # node-pty 终端管理
│   ├── claude-process.ts  # Claude CLI 非交互模式进程
│   ├── ipc-handlers.ts    # IPC 通信处理
│   ├── session-manager.ts # 会话持久化
│   └── file-system.ts     # 文件系统操作
├── preload/               # 安全桥接层
│   ├── index.ts           # contextBridge API
│   └── index.d.ts         # 类型声明
├── renderer/              # React 渲染进程
│   └── src/
│       ├── App.tsx
│       ├── components/
│       │   ├── chat/      # 聊天视图 (ChatView, MessageBubble, ChatInput, ChatSidebar)
│       │   ├── terminal/  # 终端���图 (TerminalView)
│       │   ├── editor/    # 代码编辑器 (CodeEditor, EditorTabs)
│       │   ├── file-browser/ # 文件浏览器
│       │   ├── folder-picker/ # 文件夹选择器
│       │   ├── layout/    # 布局组件 (AppLayout, TitleBar, StatusBar)
│       │   └── common/    # 通用组件 (ViewToggle)
│       └── stores/        # Zustand 状态管理
└── shared/                # 共享常量和类型
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+1 | 切换到终端视图 |
| Ctrl+2 | 切换到聊天视图 |
| Ctrl+Enter | 发送聊天消息 |

## 已知限制

- 仅支持 Windows 平台
- 需要本地安装 Claude Code CLI
- node-pty 编译依赖 VS Build Tools

## License

MIT
