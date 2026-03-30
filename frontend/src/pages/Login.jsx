import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { MdLock, MdPerson, MdVisibility, MdVisibilityOff, MdReceiptLong } from 'react-icons/md'
import toast from 'react-hot-toast'

const features = [
  'Multi-client invoice management',
  'Auto GST-compliant PDF generation',
  'Real-time dashboard & analytics',
  'Paid / Unpaid / Overdue tracking',
]

export default function Login() {
  const { login } = useApp()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Please enter username and password.'); return }
    setLoading(true)
    try {
      await login(form.username, form.password)
    } catch (err) {
      if (err.response) {
        toast.error(err.response.data?.detail || 'Invalid credentials.')
      } else if (err.request) {
        toast.error('Cannot reach server. Make sure the backend is running.')
      } else {
        toast.error('Login failed: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>

        {/* Background circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-12 w-48 h-48 rounded-full bg-white/5" />

        <div className="relative">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-white text-base border border-white/20">
              TT
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-none">Thulirinfo Tech</p>
              <p className="text-green-300 text-sm mt-0.5">IT Services & Solutions</p>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
            Professional<br />
            Invoice<br />
            Management
          </h1>
          <p className="text-green-200 text-lg leading-relaxed max-w-sm">
            Create, manage, and send beautiful invoices to your clients in seconds.
          </p>

          {/* Features */}
          <ul className="mt-10 space-y-3.5">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-green-100">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-green-300" />
                </span>
                <span className="text-sm font-medium">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-green-400 text-xs">© 2026 Thulirinfo Tech. All rights reserved.</p>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fadeIn">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white text-sm">TT</div>
            <span className="font-bold text-gray-800 dark:text-white text-lg">Thulirinfo Tech</span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-card-lg p-8">

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center shadow-[0_8px_24px_rgb(22_163_74/0.35)]">
                <MdReceiptLong size={30} className="text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm text-center mt-1 mb-8">
              Sign in to manage your invoices
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input pl-10"
                    type="text"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    autoFocus
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    className="input pl-10 pr-11"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full justify-center py-3 text-base mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
