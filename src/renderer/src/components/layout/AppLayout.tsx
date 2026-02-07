import type { ReactNode } from 'react'
import { TitleBar } from './TitleBar'
import { StatusBar } from './StatusBar'
import { ViewToggle } from '../common/ViewToggle'
import './AppLayout.css'

interface AppLayoutProps {
  children: ReactNode
}

/** 主布局容器：TitleBar + ViewToggle + 内容区域 + StatusBar */
export function AppLayout({ children }: AppLayoutProps): JSX.Element {
  return (
    <div className="app-layout">
      <TitleBar />
      <div className="app-layout-toolbar">
        <ViewToggle />
      </div>
      <div className="app-layout-content">
        {children}
      </div>
      <StatusBar />
    </div>
  )
}
