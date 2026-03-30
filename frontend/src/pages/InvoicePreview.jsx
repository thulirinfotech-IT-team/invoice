import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MdArrowBack, MdDownload, MdEdit, MdCheckCircle,
  MdCancel, MdRefresh, MdDelete,
} from 'react-icons/md'
import { invoicesAPI } from '../services/api'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import Spinner from '../components/Spinner'
import toast from 'react-hot-toast'

export default function InvoicePreview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const fetchInvoice = () => {
    setLoading(true)
    invoicesAPI.get(id)
      .then((res) => setInvoice(res.data))
      .catch(() => toast.error('Failed to load invoice.'))
      .finally(() => setLoading(false))
  }

  useEffect(fetchInvoice, [id])

  const toggleStatus = async () => {
    try {
      if (invoice.status === 'paid') {
        await invoicesAPI.markUnpaid(id)
        toast.success('Marked as unpaid.')
      } else {
        await invoicesAPI.markPaid(id)
        toast.success('Marked as paid!')
      }
      fetchInvoice()
    } catch {
      toast.error('Failed to update status.')
    }
  }

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const response = await invoicesAPI.downloadPdfUrl(id)
      window.open(response.config.url.replace('/api', ''), '_blank')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const regeneratePdf = async () => {
    try {
      await invoicesAPI.regeneratePdf(id)
      toast.success('PDF regenerated.')
      window.open(invoicesAPI.downloadPdfUrl(id), '_blank')
      fetchInvoice()
    } catch {
      toast.error('Failed to regenerate PDF.')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await invoicesAPI.delete(id)
      toast.success('Invoice deleted.')
      navigate('/invoices')
    } catch {
      toast.error('Failed to delete invoice.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <Spinner center />
  if (!invoice) return null

  const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

  return (
    <div className="max-w-4xl space-y-5">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-secondary px-2 py-2">
          <MdArrowBack size={18} />
        </button>
        <h2 className="page-title flex-1">{invoice.invoice_number}</h2>
        <StatusBadge status={invoice.status} />

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleStatus} className={invoice.status === 'paid' ? 'btn-secondary' : 'btn-success'}>
            {invoice.status === 'paid'
              ? <><MdCancel size={17} />Mark Unpaid</>
              : <><MdCheckCircle size={17} />Mark Paid</>
            }
          </button>
          <button onClick={downloadPdf} className="btn-primary" disabled={downloading}>
            {downloading ? (
              <span className="flex items-center gap-1">Downloading...</span>
            ) : (
              <><MdDownload size={17} /> Download PDF</>
            )}
          </button>
          <button onClick={regeneratePdf} className="btn-secondary" title="Regenerate PDF">
            <MdRefresh size={17} />
          </button>
          <Link to={`/invoices/${id}/edit`} className="btn-secondary">
            <MdEdit size={17} /> Edit
          </Link>
          <button onClick={() => setConfirmDelete(true)} className="btn-danger">
            <MdDelete size={17} />
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-8 pb-4">
          <div className="flex justify-between items-start">
            {/* Left: Logo + Company */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-600 flex items-center justify-center font-bold text-white text-lg shrink-0">
                TIT
              </div>
              <div>
                <p className="font-bold text-xl text-green-700">Thulirinfo Tech</p>
                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                  Odasalpatti X Road, Dharmapuri,<br />
                  TamilNadu – 635303<br />
                  techthulirinfo@gmail.com<br />
                  +91 7904730223 | thulirinfo.in
                </p>
              </div>
            </div>
            {/* Right: INVOICE title + meta */}
            <div className="text-right">
              <p className="text-5xl font-extrabold text-green-600 tracking-tight">INVOICE</p>
              <p className="text-gray-700 font-mono font-semibold mt-1">{invoice.invoice_number}</p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-end gap-6">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Issue Date</span>
                  <span className="text-gray-700 font-medium">{invoice.issue_date}</span>
                </div>
                <div className="flex justify-end gap-6">
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Due Date</span>
                  <span className="text-gray-700 font-medium">{invoice.due_date}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Green divider */}
          <div className="mt-5 h-0.5 bg-green-600 rounded" />
        </div>

        {/* Bill to */}
        <div className="px-4 md:px-8 pb-5">
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2">Bill To</p>
            <p className="font-bold text-gray-900 dark:text-white text-base">{invoice.client_name}</p>
            {invoice.client_company && <p className="text-gray-600 text-sm">{invoice.client_company}</p>}
            <p className="text-gray-500 text-sm">{invoice.client_email}</p>
          </div>
        </div>

        {/* Items */}
        <div className="px-4 md:px-8 pb-2 overflow-x-auto">
          <table className="w-full text-sm rounded-xl overflow-hidden border border-gray-200 min-w-[520px]">
            <thead>
              <tr className="bg-green-600 text-white">
                {['#', 'Service / Description', 'Qty', 'Unit Price', 'Total'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, i) => (
                <tr key={item.id} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                  <td className="px-4 py-3 text-gray-400 text-center">{i + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{item.service_name}</p>
                    {item.description && <p className="text-gray-400 text-xs mt-0.5">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmt(item.price)}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end px-4 md:px-8 py-6">
          <div className="w-80 border border-gray-200 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-100">
              {[
                ['Subtotal', fmt(invoice.subtotal)],
                [`GST (${invoice.tax_percentage}%)`, fmt(invoice.tax_amount)],
                ['Discount', `- ${fmt(invoice.discount)}`],
              ].map(([l, v], i) => (
                <div key={l} className={`flex justify-between px-5 py-3 text-sm ${i % 2 === 1 ? 'bg-green-50' : 'bg-white'}`}>
                  <span className="text-gray-500">{l}</span>
                  <span className="text-gray-700 font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-5 py-4 bg-green-600">
              <span className="font-bold text-white text-base">Grand Total</span>
              <span className="font-bold text-white text-xl">{fmt(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-4 md:px-8 pb-6">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 px-8 py-5 text-center bg-gray-50 rounded-b-2xl">
          <p className="text-sm font-bold text-green-700">
            Thank you for choosing Thulirinfo Tech
          </p>
          <p className="text-xs text-gray-400 mt-1">
            techthulirinfo@gmail.com &nbsp;|&nbsp; +91 7904730223 &nbsp;|&nbsp; thulirinfo.in
          </p>
          <p className="text-xs text-gray-300 mt-1">
            This is a computer-generated invoice and does not require a physical signature.
          </p>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete Invoice"
          message={`Delete invoice "${invoice.invoice_number}"? This action is permanent.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}
    </div>
  )
}
