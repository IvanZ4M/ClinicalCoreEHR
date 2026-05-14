import React from 'react'
import { I } from './icons'

// Wraps label + input/select/textarea + inline error message.
// Pass the input as children; FormField clones it adding input-error class when needed.
// error: string|null, touched: bool, required: bool
export function FormField({ label, error, touched, required, children }) {
  const showError = !!(touched && error)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {label && (
        <label className="field-label">
          {label}
          {required && <span style={{ color: 'var(--danger)', marginLeft: '0.125rem' }}>*</span>}
        </label>
      )}
      {React.cloneElement(children, {
        className: [children.props.className, showError ? 'input-error' : ''].filter(Boolean).join(' '),
        'aria-invalid': showError ? 'true' : undefined,
      })}
      {showError && (
        <p role="alert" style={{ fontSize: '0.6875rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.125rem' }}>
          <I.Alert width={10} height={10} style={{ flexShrink: 0 }} />
          {error}
        </p>
      )}
    </div>
  )
}
