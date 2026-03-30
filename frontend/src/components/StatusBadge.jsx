const map = {
  paid:      { label: 'Paid',      cls: 'badge-paid' },
  unpaid:    { label: 'Unpaid',    cls: 'badge-unpaid' },
  overdue:   { label: 'Overdue',   cls: 'badge-overdue' },
  cancelled: { label: 'Cancelled', cls: 'badge-cancelled' },
}

export default function StatusBadge({ status }) {
  const { label, cls } = map[status] || { label: status, cls: 'badge-cancelled' }
  return <span className={cls}>{label}</span>
}
