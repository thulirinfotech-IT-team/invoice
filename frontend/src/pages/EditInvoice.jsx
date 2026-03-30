import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MdAdd, MdDelete, MdDownload, MdArrowBack } from 'react-icons/md'
import { clientsAPI, invoicesAPI } from '../services/api'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

const PREDEFINED_SERVICES = [
  'Web Development', 'Web Application', 'Landing Page', 'Dynamic Website',
  'Software Development', 'Mobile App Development', 'Billing Software',
  'CRM System', 'Custom IT Solution', 'UI/UX Design', 'API Integration',
  'Database Design', 'Cloud Deployment', 'Maintenance & Support',
]

const emptyItem = () => ({ service_name: '', description: '', quantity: 1, price: '' })

function ItemRow({ item, index, onChange, onRemove, canRemove }) {
  const set = (field, value) => onChange(index, { ...item, [field]: value })
  return (
    <tr className="group">
      <td className="px-3 py-2">
        <input list="svc-list" className="input text-sm" placeholder="Service"
          value={item.service_name} onChange={(e) => set('service_name', e.target.value)} required />
      </td>
      <td className="px-3 py-2">
        <input className="input text-sm" placeholder="Description"
          value={item.description} onChange={(e) => set('description', e.target.value)} />
      </td>
      <td className="px-3 py-2 w-24">
        <input className="input text-sm text-center" type="number" min="0.01" step="0.01"
          value={item.quantity} onChange={(e) => set('quantity', e.target.value)} required />
      </td>
      <td className="px-3 py-2 w-32">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input className="input text-sm pl-7" type="number" min="0" step="0.01"
            value={item.price} onChange={(e) => set('price', e.target.value)} required />
        </div>
      </td>
      <td className="px-3 py-2 w-32 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
        ₹{(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td className="px-3 py-2 w-10">
        {canRemove && (
          <button type="button" onClick={() => onRemove(index)}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <MdDelete size={16} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function EditInvoice() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([invoicesAPI.get(id), clientsAPI.list()])
      .then(([invRes, cliRes]) => {
        const inv = invRes.data
        setForm({
          client: inv.client,
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          tax_percentage: inv.tax_percentage,
          discount: inv.discount,
          notes: inv.notes,
          status: inv.status,
        })
        setItems(inv.items.map((it) => ({
          service_name: it.service_name,
          description: it.description,
          quantity: it.quantity,
          price: it.price,
        })))
        setClients(cliRes.data.results || cliRes.data)
      })
      .catch(() => toast.error('Failed to load invoice.'))
      .finally(() => setLoading(false))
  }, [id])

  const updateItem = useCallback((idx, updated) => setItems((p) => p.map((it, i) => i === idx ? updated : it)), [])
  const removeItem = useCallback((idx) => setItems((p) => p.filter((_, i) => i !== idx)), [])

  const subtotal = items.reduce((s, it) => s + parseFloat(it.quantity || 0) * parseFloat(it.price || 0), 0)
  const taxAmt = (subtotal * parseFloat(form?.tax_percentage || 0)) / 100
  const discount = parseFloat(form?.discount || 0)
  const grandTotal = Math.max(subtotal + taxAmt - discount, 0)
  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.due_date < form.issue_date) { toast.error('Due date must be on or after issue date.'); return }
    const hasEmpty = items.some((it) => !it.service_name.trim() || !it.price)
    if (hasEmpty) { toast.error('Please fill all item rows.'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        items: items.map((it) => ({
          service_name: it.service_name,
          description: it.description,
          quantity: parseFloat(it.quantity),
          price: parseFloat(it.price),
        })),
      }
      const res = await invoicesAPI.update(id, payload)
      toast.success('Invoice updated!')
      if (res.data.pdf_url) window.open(res.data.pdf_url, '_blank')
      navigate(`/invoices/${id}`)
    } catch {
      toast.error('Failed to update invoice.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) return <Spinner center />

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary px-2 py-2"><MdArrowBack size={18} /></button>
        <h2 className="page-title">Edit Invoice</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Client *</label>
              <select className="input" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required>
                <option value="">— Select —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input className="input" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div>
              <label className="label">GST (%)</label>
              <input className="input" type="number" min="0" max="100" step="0.01" value={form.tax_percentage} onChange={(e) => setForm({ ...form, tax_percentage: e.target.value })} />
            </div>
            <div>
              <label className="label">Discount (₹)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Items</h3>
            <button type="button" onClick={() => setItems((p) => [...p, emptyItem()])} className="btn-outline text-xs py-1.5">
              <MdAdd size={16} /> Add Row
            </button>
          </div>
          <datalist id="svc-list">
            {PREDEFINED_SERVICES.map((s) => <option key={s} value={s} />)}
          </datalist>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {['Service', 'Description', 'Qty', 'Price', 'Total', ''].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, idx) => (
                  <ItemRow key={idx} item={item} index={idx} onChange={updateItem} onRemove={removeItem} canRemove={items.length > 1} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 p-6">
            <div className="w-72 space-y-2">
              {[['Subtotal', fmt(subtotal)], [`GST (${form.tax_percentage}%)`, fmt(taxAmt)], ['Discount', `- ${fmt(discount)}`]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>{l}</span><span className="font-medium text-gray-800 dark:text-gray-200">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-bold text-gray-900 dark:text-white">Grand Total</span>
                <span className="font-bold text-brand-600">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <label className="label">Notes</label>
          <textarea className="input resize-none" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" className="btn-primary px-8" disabled={saving}>
            {saving ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><MdDownload size={18} />Update Invoice</>}
          </button>
        </div>
      </form>
    </div>
  )
}
