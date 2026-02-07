import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '../../stores/app-store'
import './FolderPicker.css'

export function FolderPicker(): JSX.Element {
  const [recentFolders, setRecentFolders] = useState<string[]>([])
  const { setWorkingDirectory } = useAppStore()

  useEffect(() => {
    window.api.app.getRecentFolders().then(setRecentFolders)
  }, [])

  const handleSelectFolder = useCallback(async () => {
    const folder = await window.api.dialog.openFolder()
    if (folder) {
      await window.api.app.addRecentFolder(folder)
      setWorkingDirectory(folder)
    }
  }, [setWorkingDirectory])

  const handleSelectRecent = useCallback(
    async (folder: string) => {
      await window.api.app.addRecentFolder(folder)
      setWorkingDirectory(folder)
    },
    [setWorkingDirectory]
  )

  return (
    <div className="folder-picker">
      <div className="folder-picker-content">
        <div className="logo-section">
          <div className="logo-icon">IC</div>
          <h1 className="logo-title">Iridescent Code</h1>
          <p className="logo-subtitle">流光代码 - AI 编程可视化助手</p>
        </div>

        <button className="select-folder-btn" onClick={handleSelectFolder}>
          <span className="folder-icon">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 2.5h4.75l1.5 1.5h6.75v9h-13v-10.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
            </svg>
          </span>
          Select Folder
        </button>

        {recentFolders.length > 0 && (
          <div className="recent-section">
            <h3 className="recent-title">Recent</h3>
            <ul className="recent-list">
              {recentFolders.map((folder) => (
                <li key={folder}>
                  <button
                    className="recent-item"
                    onClick={() => handleSelectRecent(folder)}
                    title={folder}
                  >
                    <span className="recent-icon">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.5 2.5h4.75l1.5 1.5h6.75v9h-13v-10.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
                      </svg>
                    </span>
                    <span className="recent-path">{folder}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
