import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdReceiptLong, MdCheckCircle, MdPendingActions,
  MdWarning, MdTrendingUp, MdAdd, MdArrowUpward,
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { invoicesAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor = 'text-white' }) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={22} className={iconColor} />
        </div>
        <MdArrowUpward size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors mt-1" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-card-lg px-4 py-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    invoicesAPI.dashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard stats.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner center />

  if (!stats) {
    return (
      <div className="card flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
          <MdWarning size={28} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-700 dark:text-gray-200">Dashboard unavailable</p>
          <p className="text-sm text-gray-400 mt-1">Make sure the backend is running.</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`

  const chartData = stats?.recent_invoices?.map((inv) => ({
    name: inv.invoice_number.replace(/TIT-\d{4}-/, '#'),
    amount: parseFloat(inv.total_amount),
  })) || []

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-0.5">Thulirinfo Tech — Invoice Overview</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <MdAdd size={18} /> New Invoice
        </Link>
      </div>

      {/* Row 1 — Invoice counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MdReceiptLong}
          label="Total Invoices"
          value={stats.total_invoices}
          iconBg="bg-brand-600"
        />
        <StatCard
          icon={MdCheckCircle}
          label="Paid"
          value={stats.paid_invoices}
          iconBg="bg-emerald-500"
        />
        <StatCard
          icon={MdPendingActions}
          label="Unpaid"
          value={stats.unpaid_invoices}
          iconBg="bg-amber-500"
        />
        <StatCard
          icon={MdWarning}
          label="Overdue"
          value={stats.overdue_invoices}
          iconBg="bg-red-500"
        />
      </div>

      {/* Row 2 — Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={MdTrendingUp}
          label="Total Revenue"
          value={fmt(stats.total_revenue)}
          sub="All time"
          iconBg="bg-brand-600"
        />
        <StatCard
          icon={MdTrendingUp}
          label="This Month"
          value={fmt(stats.monthly_revenue)}
          iconBg="bg-purple-500"
        />
        <StatCard
          icon={MdPendingActions}
          label="Pending Amount"
          value={fmt(stats.pending_amount)}
          iconBg="bg-orange-500"
        />
      </div>

      {/* Row 3 — Chart + Recent list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Bar chart */}
        <div className="card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">Recent Invoice Amounts</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last {chartData.length} invoices</p>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-44 text-gray-300 text-sm">
              No invoice data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={36} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                       tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(22,163,74,0.05)', radius: 6 }} />
                <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]}
                     style={{ filter: 'drop-shadow(0 2px 4px rgba(22,163,74,0.3))' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent invoices list */}
        <div className="card lg:col-span-2 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Recent Invoices</h3>
            <Link to="/invoices" className="text-brand-600 text-xs font-medium hover:underline">
              View all
            </Link>
          </div>

          {stats.recent_invoices?.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <p className="text-sm text-gray-400">No invoices yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {stats.recent_invoices?.map((inv) => (
                <li key={inv.id}>
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between px-5 py-3.5
                               hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{inv.client_name}</p>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={inv.status} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
