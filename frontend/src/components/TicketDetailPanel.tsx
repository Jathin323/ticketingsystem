import { useEffect, useState } from 'react';
import { STATUSES, type Status, type TicketWithComments } from '../types';
import { api, ApiError } from '../api/client';
import { PriorityBadge } from './Badges';
import { formatDateTime } from '../utils';

interface Props {
  ticketId: number;
  onClose: () => void;
  /** Called after any change so the list can refresh. */
  onChanged: () => void;
  onDeleted: () => void;
}

export default function TicketDetailPanel({ ticketId, onClose, onChanged, onDeleted }: Props) {
  const [ticket, setTicket] = useState<TicketWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Status | null>(null);

  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Load full ticket (with comments) when the panel opens.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getTicket(ticketId)
      .then((t) => active && setTicket(t))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : 'Failed to load ticket'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ticketId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function changeStatus(next: Status) {
    if (!ticket || ticket.status === next) return;
    const previous = ticket.status;
    // Optimistic update: reflect the change immediately, roll back on failure.
    setTicket({ ...ticket, status: next });
    setSavingStatus(next);
    try {
      const updated = await api.updateTicket(ticket.id, { status: next });
      setTicket((t) => (t ? { ...t, status: updated.status, updatedAt: updated.updatedAt } : t));
      onChanged();
    } catch {
      setTicket((t) => (t ? { ...t, status: previous } : t));
      setError('Could not update status. Please try again.');
    } finally {
      setSavingStatus(null);
    }
  }

  async function addComment() {
    if (!ticket || !commentAuthor.trim() || !commentBody.trim()) return;
    setPostingComment(true);
    try {
      const created = await api.addComment(ticket.id, {
        author: commentAuthor.trim(),
        body: commentBody.trim(),
      });
      setTicket((t) => (t ? { ...t, comments: [...t.comments, created] } : t));
      setCommentBody('');
    } catch {
      setError('Could not add comment.');
    } finally {
      setPostingComment(false);
    }
  }

  async function remove() {
    if (!ticket) return;
    if (!window.confirm(`Delete ticket #${ticket.id}? This cannot be undone.`)) return;
    try {
      await api.deleteTicket(ticket.id);
      onDeleted();
    } catch {
      setError('Could not delete ticket.');
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="panel" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="panel__head">
          <div>
            {loading ? (
              <div className="skeleton" style={{ width: 180, height: 18 }} />
            ) : (
              <>
                <h2>{ticket?.title}</h2>
                <span className="panel__id">Ticket #{ticket?.id}</span>
              </>
            )}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close panel">
            ×
          </button>
        </div>

        <div className="panel__body">
          {error && (
            <div className="banner">
              {error}
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {ticket && !loading && (
            <>
              <label className="field-label">Status</label>
              <div className="status-picker">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    aria-pressed={ticket.status === s}
                    disabled={savingStatus !== null}
                    onClick={() => changeStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="meta-grid">
                <div>
                  <div className="label">Customer</div>
                  <div>{ticket.customerName}</div>
                </div>
                <div>
                  <div className="label">Priority</div>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div>
                  <div className="label">Created</div>
                  <div>{formatDateTime(ticket.createdAt)}</div>
                </div>
                <div>
                  <div className="label">Last updated</div>
                  <div>{formatDateTime(ticket.updatedAt)}</div>
                </div>
              </div>

              <label className="field-label">Description</label>
              <div className="description-box">{ticket.description}</div>

              <hr className="section-divider" />

              <label className="field-label">
                Comments {ticket.comments.length > 0 && `(${ticket.comments.length})`}
              </label>
              {ticket.comments.length === 0 ? (
                <p style={{ color: 'var(--ink-faint)', margin: '4px 0 16px' }}>No comments yet.</p>
              ) : (
                <div style={{ margin: '4px 0 16px' }}>
                  {ticket.comments.map((c) => (
                    <div className="comment" key={c.id}>
                      <div className="comment__head">
                        <span className="comment__author">{c.author}</span>
                        <span className="comment__time">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <div className="comment__body">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="inline-2">
                <input
                  placeholder="Your name"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  aria-label="Comment author"
                />
              </div>
              <div className="form-row" style={{ marginTop: 10 }}>
                <textarea
                  placeholder="Add a comment…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  aria-label="Comment body"
                  style={{ minHeight: 70 }}
                />
              </div>
              <div className="form-actions" style={{ marginTop: 0, justifyContent: 'space-between' }}>
                <button className="btn btn--danger" onClick={remove}>
                  Delete ticket
                </button>
                <button
                  className="btn btn--primary"
                  onClick={addComment}
                  disabled={postingComment || !commentAuthor.trim() || !commentBody.trim()}
                >
                  {postingComment ? 'Posting…' : 'Add comment'}
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
