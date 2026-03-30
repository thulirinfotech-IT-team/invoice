import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  MdAdd, MdSearch, MdDelete, MdEdit, MdDownload,
  MdCheckCircle, MdCancel, MdReceiptLong, MdFilterList,
} from 'react-icons/md'
import { invoicesAPI, clientsAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

export default function InvoiceList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    client: searchParams.get('client') || '',
    start_date: '',
    end_date: '',
  })

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v)
      )
      const res = await invoicesAPI.list(params)
      setInvoices(res.data.results || res.data)
    } catch {
      toast.error('Failed to load invoices.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    clientsAPI.list().then((r) => setClients(r.data.results || r.data))
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchInvoices, 300)
    return () => clearTimeout(t)
  }, [fetchInvoices])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await invoicesAPI.delete(deleteTarget.id)
      toast.success('Invoice deleted.')
      setDeleteTarget(null)
      fetchInvoices()
    } catch {
      toast.error('Failed to delete invoice.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleStatus = async (inv) => {
    try {
      if (inv.status === 'paid') {
        await invoicesAPI.markUnpaid(inv.id)
        toast.success('Marked as unpaid.')
      } else {
        await invoicesAPI.markPaid(inv.id)
        toast.success('Marked as paid.')
      }
      fetchInvoices()
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const downloadPdf = async (inv) => {
    if (inv.pdf_url) {
      window.open(inv.pdf_url, '_blank')
    } else {
      try {
        const res = await invoicesAPI.regeneratePdf(inv.id)
        window.open(res.data.pdf_url, '_blank')
      } catch {
        toast.error('PDF not available.')
      }
    }
  }

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }))
  const clearFilters = () => setFilters({ search: '', status: '', client: '', start_date: '', end_date: '' })
  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoices</h2>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">
          <MdAdd size={18} /> New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input pl-9 text-sm"
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
          </div>

          <select className="input text-sm" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select className="input text-sm" value={filters.client} onChange={(e) => setFilter('client', e.target.value)}>
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <input
            className="input text-sm"
            type="date"
            title="From date"
            value={filters.start_date}
            onChange={(e) => setFilter('start_date', e.target.value)}
          />
          <input
            className="input text-sm"
            type="date"
            title="To date"
            value={filters.end_date}
            onChange={(e) => setFilter('end_date', e.target.value)}
          />
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="mt-3 text-xs text-brand-600 hover:underline flex items-center gap-1">
            <MdFilterList size={14} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <Spinner center />
      ) : invoices.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <MdReceiptLong size={48} className="text-gray-300" />
          <p className="text-gray-500">No invoices found.</p>
          <Link to="/invoices/new" className="btn-primary">Create your first invoice</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`} className="font-semibold text-brand-600 hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td>
                    <p className="font-medium text-gray-800 dark:text-white">{inv.client_name}</p>
                    {inv.client_company && <p className="text-xs text-gray-400">{inv.client_company}</p>}
                  </td>
                  <td className="text-gray-500">{inv.issue_date}</td>
                  <td className="text-gray-500">{inv.due_date}</td>
                  <td className="text-center text-gray-500">{inv.item_count}</td>
                  <td className="font-semibold text-gray-800 dark:text-white">
                    ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleStatus(inv)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          inv.status === 'paid'
                            ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600'
                            : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={inv.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      >
                        {inv.status === 'paid' ? <MdCancel size={17} /> : <MdCheckCircle size={17} />}
                      </button>
                      <button
                        onClick={() => downloadPdf(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-brand-600 transition-colors"
                        title="Download PDF"
                      >
                        <MdDownload size={17} />
                      </button>
                      <Link
                        to={`/invoices/${inv.id}/edit`}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600 transition-colors"
                        title="Edit"
                      >
                        <MdEdit size={17} />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <MdDelete size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Invoice"
          message={`Delete invoice "${deleteTarget.invoice_number}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
