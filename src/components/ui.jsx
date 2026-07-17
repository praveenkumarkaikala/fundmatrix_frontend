import { humanize, statusColor } from '../lib/format'
import './ui.css'

export function PageLoader() {
  return (
    <div className="loader">
      <div className="spinner" />
    </div>
  )
}

export function StatusBadge({ status }) {
  return <span className={`badge ${statusColor(status)}`}>{humanize(status)}</span>
}

export function Badge({ children, color = 'gray' }) {
  return <span className={`badge ${color}`}>{children}</span>
}

export function StatCard({ label, value, icon, delta }) {
  return (
    <div className="stat">
      {icon && <div className="ic">{icon}</div>}
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {delta && <div className={`delta ${delta.up ? 'up' : 'down'}`}>{delta.text}</div>}
    </div>
  )
}

export function Card({ title, hint, action, children }) {
  return (
    <div className="card">
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {hint && <div className="hint">{hint}</div>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function EmptyRow({ colSpan, text = 'No records found' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty">{text}</td>
    </tr>
  )
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
