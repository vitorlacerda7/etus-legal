import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center' }}>
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
        <main className="main" style={{ paddingTop: 0 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
