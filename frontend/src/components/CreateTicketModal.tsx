import { useState } from 'react';
import { PRIORITIES, type CreateTicketPayload, type Priority } from '../types';
import { api, ApiError } from '../api/client';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type Errors = Partial<Record<'customerName' | 'title' | 'description' | 'form', string>>;

export default function CreateTicketModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateTicketPayload>({
    customerName: '',
    title: '',
    description: '',
    priority: 'Medium',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof CreateTicketPayload>(key: K, value: CreateTicketPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!form.customerName.trim()) next.customerName = 'Customer name is required';
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.description.trim()) next.description = 'Description is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await api.createTicket({
        customerName: form.customerName.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      onCreated();
    } catch (err) {
      // Surface server-side validation next to the form.
      const message =
        err instanceof ApiError ? err.details?.[0]?.message ?? err.message : 'Failed to create ticket';
      setErrors({ form: message });
      setSubmitting(false);
    }
  }

  return (
    <div className="overlay overlay--center" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__head">
          <h2>New ticket</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal__body">
          {errors.form && <div className="banner" style={{ marginBottom: 16 }}>{errors.form}</div>}

          <div className="form-row">
            <label className="field-label" htmlFor="customerName">
              Customer name
            </label>
            <input
              id="customerName"
              value={form.customerName}
              onChange={(e) => set('customerName', e.target.value)}
              placeholder="e.g. Acme Corp"
              autoFocus
            />
            {errors.customerName && <div className="field-error">{errors.customerName}</div>}
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Short summary of the issue"
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What is happening? Steps to reproduce, expected vs actual…"
            />
            {errors.description && <div className="field-error">{errors.description}</div>}
          </div>

          <div className="form-row">
            <label className="field-label" htmlFor="priority">
              Priority
            </label>
            <select
              id="priority"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="btn btn--primary" onClick={submit} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
