import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AppLayout() {
  useDocumentTitle()
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#1e1e1e]">
      <Header />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
