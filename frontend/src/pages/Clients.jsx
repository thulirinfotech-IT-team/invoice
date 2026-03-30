import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPeople, MdClose } from 'react-icons/md'
import { clientsAPI } from '../services/api'
import Spinner from '../components/Spinner'
import ConfirmModal from '../components/ConfirmModal'
import toast from 'react-hot-toast'

const EMPTY = { name: '', company_name: '', email: '', phone: '', address: '' }

function ClientModal({ client, onSave, onClose }) {
  const [form, setForm] = useState(client || EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!client?.id

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email.'
    if (!form.phone.trim()) e.phone = 'Phone is required.'
    if (!form.address.trim()) e.address = 'Address is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      if (isEdit) {
        await clientsAPI.update(client.id, form)
        toast.success('Client updated successfully.')
      } else {
        await clientsAPI.create(form)
        toast.success('Client created successfully.')
      }
      onSave()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        toast.error('Please fix the form errors.')
      } else {
        toast.error('Failed to save client.')
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <MdClose size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input className={`input ${errors.name ? 'border-red-500' : ''}`} placeholder="Full Name" value={form.name} onChange={set('name')} />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Company Name</label>
              <input className="input" placeholder="Company Name" value={form.company_name} onChange={set('company_name')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input className={`input ${errors.email ? 'border-red-500' : ''}`} type="email" placeholder="Email" value={form.email} onChange={set('email')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="label">Phone *</label>
              <input className={`input ${errors.phone ? 'border-red-500' : ''}`} placeholder="Phone" value={form.phone} onChange={set('phone')} />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <label className="label">Address *</label>
            <textarea className={`input resize-none ${errors.address ? 'border-red-500' : ''}`} rows={3} placeholder="Address" value={form.address} onChange={set('address')} />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'add' | client obj
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await clientsAPI.list({ search })
      setClients(res.data.results || res.data)
    } catch {
      toast.error('Failed to load clients.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchClients, 300)
    return () => clearTimeout(t)
  }, [fetchClients])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await clientsAPI.delete(deleteTarget.id)
      toast.success(`${deleteTarget.name} deleted.`)
      setDeleteTarget(null)
      fetchClients()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete — client has invoices.'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clients</h2>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} total clients</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>
          <MdAdd size={18} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          className="input pl-10"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <Spinner center />
      ) : clients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 gap-3">
          <MdPeople size={48} className="text-gray-300" />
          <p className="text-gray-500">No clients found.</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Add your first client</button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Invoices</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-gray-900 dark:text-white">{c.name}</td>
                  <td className="text-gray-500">{c.company_name || '—'}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>
                    <Link
                      to={`/invoices?client=${c.id}`}
                      className="text-brand-600 hover:underline text-sm"
                    >
                      {c.invoice_count} invoices
                    </Link>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setModal(c)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand-600"
                        title="Edit"
                      >
                        <MdEdit size={17} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
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

      {/* Add/Edit Modal */}
      {modal && (
        <ClientModal
          client={modal === 'add' ? null : modal}
          onSave={() => { setModal(null); fetchClients() }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          title="Delete Client"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
