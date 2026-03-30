import { NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  MdDashboard, MdPeople, MdReceiptLong, MdAddBox,
  MdChevronLeft, MdChevronRight, MdLogout,
} from 'react-icons/md'

const navItems = [
  { to: '/',             label: 'Dashboard',   icon: MdDashboard,   end: true },
  { to: '/clients',      label: 'Clients',     icon: MdPeople },
  { to: '/invoices',     label: 'Invoices',    icon: MdReceiptLong },
  { to: '/invoices/new', label: 'New Invoice', icon: MdAddBox },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, logout } = useApp()

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col
                  text-white transition-all duration-300 overflow-hidden
                  ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16'}
                  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      style={{ background: 'linear-gradient(180deg, #14532d 0%, #052e16 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center
                          shrink-0 font-bold text-sm shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            TT
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate leading-none text-white">Thulirinfo Tech</p>
              <p className="text-green-400 text-xs mt-0.5 truncate">Invoice Manager</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {sidebarOpen && (
          <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-green-600 mb-2">
            Main Menu
          </p>
        )}
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <div key={to} className="relative group/item">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium
                 transition-all duration-150
                 ${isActive
                   ? 'bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                   : 'text-green-200 hover:bg-white/8 hover:text-white'
                 }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-green-300'}`}>
                    <Icon size={20} />
                  </span>
                  {sidebarOpen && <span className="truncate">{label}</span>}
                  {isActive && sidebarOpen && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                  )}
                </>
              )}
            </NavLink>

            {/* Collapsed tooltip */}
            {!sidebarOpen && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-1
                              px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                              opacity-0 group-hover/item:opacity-100 pointer-events-none
                              whitespace-nowrap z-50 transition-opacity shadow-lg border border-gray-700">
                {label}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2 shrink-0 space-y-1">
        <div className="relative group/logout">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm
                       text-green-300 hover:bg-red-500/15 hover:text-red-300 transition-colors"
          >
            <MdLogout size={20} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {!sidebarOpen && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-1
                            px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg
                            opacity-0 group-hover/logout:opacity-100 pointer-events-none
                            whitespace-nowrap z-50 transition-opacity shadow-lg border border-gray-700">
              Logout
            </div>
          )}
        </div>

        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-2 rounded-xl
                     text-green-400 hover:text-white hover:bg-white/8 transition-colors"
          title={sidebarOpen ? 'Collapse' : 'Expand'}
        >
          {sidebarOpen ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
        </button>
      </div>
    </aside>
  )
}
