import { useApp } from '../context/AppContext'
import { MdMenu, MdLightMode, MdDarkMode } from 'react-icons/md'
import { useLocation } from 'react-router-dom'

const titleMap = {
  '/invoices/new':  'Create Invoice',
  '/invoices':      'Invoices',
  '/clients':       'Clients',
  '/':              'Dashboard',
}

export default function Navbar() {
  const { darkMode, toggleDarkMode, toggleSidebar, user } = useApp()
  const { pathname } = useLocation()

  const title = Object.entries(titleMap).find(([path]) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  })?.[1] || 'Thulirinfo Tech'

  const initial = user?.username?.[0]?.toUpperCase() || 'A'

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800
                       flex items-center px-4 md:px-6 gap-3 shrink-0 sticky top-0 z-20
                       shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

      <button
        onClick={toggleSidebar}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100
                   dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800
                   transition-colors"
        title="Toggle sidebar"
      >
        <MdMenu size={22} />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-gray-800 dark:text-white truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400
                     dark:hover:bg-gray-800 transition-colors"
          title="Toggle theme"
        >
          {darkMode ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </button>

        <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center
                        text-white text-xs font-bold ml-1 select-none
                        ring-2 ring-brand-200 dark:ring-brand-800">
          {initial}
        </div>
      </div>
    </header>
  )
}
