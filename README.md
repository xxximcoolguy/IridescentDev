# Claude Code UI (Windows)

Windows 桌面端的 Claude Code 可视化助手，替代命令行终端使用 Claude Code CLI。

提供聊天对话、终端模拟、文件浏览、代码编辑等功能，让你通过图形界面与 Claude Code 交互。

## 下载安装

前往 [Releases](https://github.com/xxximcoolguy/claudeUI_win/releases) 页面下载最新版本：

| 文件 | 说明 |
|------|------|
| `claude-code-ui-x.x.x-setup.exe` | **安装版**（推荐）— 安装到电脑，创建桌面快捷方式，支持卸载 |
| `claude-code-ui-x.x.x-portable.exe` | **便携版** — 双击直接运行，无需安装 |

## 使用前提（重要）

本软件是 Claude Code CLI 的图形界面前端，**不包含 Claude Code 本身**，使用前必须满足以下条件：

### 1. 安装 Claude Code CLI

```bash
npm install -g @anthropic-ai/claude-code
```

安装完成后，确认 `claude` 命令可用：

```bash
claude --version
```

### 2. 完成 Claude Code 认证

首次使用需要登录认证：

```bash
claude
```

按照提示完成认证流程（需要 Anthropic API Key 或 Claude Pro/Max 订阅）。

### 3. 确认 claude.exe 路径

本软件默认从以下路径查找 `claude.exe`：

```
C:\Users\<你的用户名>\.local\bin\claude.exe
```

这是 Claude Code CLI 的默认安装路径。如果���的 `claude.exe` 不在此路径，请将其移动到该位置。

## 功能特性

- **聊天视图** — iMessage 风格的��话 UI，打字机效果逐字输出，等待时三点跳动动画
- **终端视图** — 基于 xterm.js + node-pty (ConPTY) 的��功能终端，自动启动 Claude CLI
- **视图切换** — Ctrl+1 终端 / Ctrl+2 聊天，快捷键一键切换
- **会话管理** — 聊天记录自动保存，支持切换历史会话、重命名、删除
- **文件浏览器** — 树状目录浏览工作目录文件
- **代码编辑器** — 基于 Monaco Editor，多 Tab、语法高亮
- **Markdown 渲染** — 代码块、表格、列表、链接等完整支持
- **iOS Dark 主题** — 简洁现代的深色 UI 风格

## 使用方法

1. 启动软件后，选择一个工作目录（你的项目文件夹）
2. 默认进入终端视图，Claude CLI 会自动启动
3. 按 **Ctrl+2** 切换到聊天视图，通过对话方式与 Claude 交互
4. 按 **Ctrl+1** 切回终端视图

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+1 | 切换到终端视图 |
| Ctrl+2 | 切换到聊天视图 |
| Ctrl+Enter | 发送聊天消息 |

## 从源码构建

如果你想自己编译，需要以下环境：

### 环境要求

- **Node.js** >= 18
- **Visual Studio Build Tools**（编译 node-pty 需要）
  - 安装时勾选「使用 C++ 的桌面开发」
  - 如果使用 Python 3.12+，需额外安装 `setuptools`：`pip install setuptools`
- **Windows 开发者模式**（打包时需要，用于创建符号链接）
  - 设置 → 系统 → 开发者选项 → 开启「开发人员模式」

### 构建步骤

```bash
# 克隆仓库
git clone https://github.com/xxximcoolguy/claudeUI_win.git
cd claudeUI_win

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建 Windows 安装包
npm run build:win
```

构建产物在 `dist/` 目录下。

## 技术栈

| 模块 | 技术 |
|------|------|
| 框架 | Electron + React 19 + TypeScript |
| 构建 | electron-vite |
| 终端 | node-pty (ConPTY) + xterm.js |
| 状态管理 | Zustand |
| 编辑器 | Monaco Editor |
| 存储 | electron-store |

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
│       │   ├── chat/      # 聊天 (ChatView, MessageBubble, ChatInput, ChatSidebar)
│       │   ├── terminal/  # 终端 (TerminalView)
│       │   ├── editor/    # 代码编辑器 (CodeEditor, EditorTabs)
│       │   ├── file-browser/ # 文件浏览器
│       │   ├── folder-picker/ # 文件夹选择器
│       │   ├── layout/    # 布局 (AppLayout, TitleBar, StatusBar)
│       │   └── common/    # 通用组件 (ViewToggle)
│       └── stores/        # Zustand 状态管理
└── shared/                # 共享常量和类型
```

## 常见问题

### Q: 打开软件后没有反应 / 聊天没有回复

确认 Claude Code CLI 已安装并完成认证。在命令行执行 `claude --version` 检查。

### Q: 安装包被杀毒软件拦截

因为安装包未进行代码签名，部分杀毒软件可能会拦截。请添加信任或临时关闭杀毒软件安装。软件是开源的，源码可审查。

### Q: 如何更新到新版本

安装版：下载新的 setup.exe 覆盖安装即可。便携版：直接替换 exe 文件。

### Q: 编译 node-pty 失败

确保已安装 Visual Studio Build Tools 并勾选了「使用 C++ 的桌面开发」。如果使用 Python 3.12+，执行 `pip install setuptools`。

## 注意事项

- 本软件仅支持 **Windows** 平台
- 需要本地已安装 **Claude Code CLI** 并完成认证
- 首次安装可能被 Windows Defender 拦截（未签名），选择「仍要运行」即可
- 聊天功能通过 Claude CLI 的 `--print` 模式工作，每次发送消息会启动一个新的 Claude 进程
- 会话记录保存在本地，不会上传到任何服务器

## License

MIT
