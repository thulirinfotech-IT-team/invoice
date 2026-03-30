import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdAdd, MdDelete, MdDownload, MdArrowBack } from 'react-icons/md'
import { clientsAPI, invoicesAPI } from '../services/api'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'

const PREDEFINED_SERVICES = [
  'Web Development',
  'Web Application',
  'Landing Page',
  'Dynamic Website',
  'Software Development',
  'Mobile App Development',
  'Billing Software',
  'CRM System',
  'Custom IT Solution',
  'UI/UX Design',
  'API Integration',
  'Database Design',
  'Cloud Deployment',
  'Maintenance & Support',
  'Domain Registration',
  'Web Hosting',
  'Web Service',
  'Web Design',
  'Other',
]

const emptyItem = () => ({ service_name: '', description: '', quantity: 1, price: '' })

function InvoiceItemRow({ item, index, onChange, onRemove, canRemove }) {
  const handleChange = (field, value) => onChange(index, { ...item, [field]: value })

  return (
    <tr className="group">
      <td className="px-3 py-2">
        <input
          list="services-list"
          className="input text-sm"
          placeholder="Service name"
          value={item.service_name}
          onChange={(e) => handleChange('service_name', e.target.value)}
          required
        />
      </td>
      <td className="px-3 py-2">
        <input
          className="input text-sm"
          placeholder="Description (optional)"
          value={item.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </td>
      <td className="px-3 py-2 w-24">
        <input
          className="input text-sm text-center"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="1"
          value={item.quantity}
          onChange={(e) => handleChange('quantity', e.target.value)}
          required
        />
      </td>
      <td className="px-3 py-2 w-32">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
          <input
            className="input text-sm pl-7"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={item.price}
            onChange={(e) => handleChange('price', e.target.value)}
            required
          />
        </div>
      </td>
      <td className="px-3 py-2 w-32 text-right">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          ₹{(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </td>
      <td className="px-3 py-2 w-10">
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <MdDelete size={16} />
          </button>
        )}
      </td>
    </tr>
  )
}

export default function CreateInvoice() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [items, setItems] = useState([emptyItem()])
  const [form, setForm] = useState({
    client: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tax_percentage: 18,
    discount: 0,
    notes: '',
    status: 'unpaid',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    clientsAPI.list().then((res) => setClients(res.data.results || res.data))
  }, [])

  const updateItem = useCallback((idx, updated) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? updated : it)))
  }, [])

  const removeItem = useCallback((idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }, [])

  const addItem = () => setItems((prev) => [...prev, emptyItem()])

  // Calculated totals
  const subtotal = items.reduce(
    (sum, it) => sum + parseFloat(it.quantity || 0) * parseFloat(it.price || 0),
    0
  )
  const taxAmt = (subtotal * parseFloat(form.tax_percentage || 0)) / 100
  const discount = parseFloat(form.discount || 0)
  const grandTotal = Math.max(subtotal + taxAmt - discount, 0)

  const fmt = (n) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.client) { toast.error('Please select a client.'); return }
    if (form.due_date < form.issue_date) { toast.error('Due date must be on or after issue date.'); return }
    const hasEmpty = items.some((it) => !it.service_name.trim() || !it.price)
    if (hasEmpty) { toast.error('Please fill all item rows.'); return }

    setLoading(true)
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
      const res = await invoicesAPI.create(payload)
      toast.success(`Invoice ${res.data.invoice_number} created!`)

      // Open PDF directly — endpoint is public so no auth needed
      window.open(invoicesAPI.downloadPdfUrl(res.data.id), '_blank')

      navigate(`/invoices/${res.data.id}`)
    } catch (err) {
      const data = err.response?.data
      const msg = typeof data === 'string' ? data
        : data?.detail || data?.non_field_errors?.[0] || 'Failed to create invoice.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-secondary px-2 py-2">
          <MdArrowBack size={18} />
        </button>
        <div>
          <h2 className="page-title">Create Invoice</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details below to generate a professional invoice.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client & dates */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-1">
              <label className="label">Client *</label>
              <select
                className="input"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                required
              >
                <option value="">— Select Client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.company_name ? ` (${c.company_name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Issue Date *</label>
              <input
                className="input"
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Due Date *</label>
              <input
                className="input"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">GST (%)</label>
              <input
                className="input"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.tax_percentage}
                onChange={(e) => setForm({ ...form, tax_percentage: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Discount (₹)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">Services / Items</h3>
            <button type="button" onClick={addItem} className="btn-outline text-xs py-1.5">
              <MdAdd size={16} /> Add Row
            </button>
          </div>

          <datalist id="services-list">
            {PREDEFINED_SERVICES.map((s) => <option key={s} value={s} />)}
          </datalist>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Service</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-24">Qty</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-32">Price</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase w-32">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((item, idx) => (
                  <InvoiceItemRow
                    key={idx}
                    item={item}
                    index={idx}
                    onChange={updateItem}
                    onRemove={removeItem}
                    canRemove={items.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end border-t border-gray-100 dark:border-gray-700 p-6">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>GST ({form.tax_percentage}%)</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{fmt(taxAmt)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Discount</span>
                <span className="font-medium text-red-500">- {fmt(discount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-bold text-gray-900 dark:text-white text-base">Grand Total</span>
                <span className="font-bold text-brand-600 text-base">{fmt(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <label className="label">Notes (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Payment instructions, bank details, terms & conditions..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary px-8 py-2.5" disabled={loading}>
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <MdDownload size={18} /> Generate Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
