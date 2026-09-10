import type {
  CreateTicketPayload,
  ListParams,
  Comment,
  Ticket,
  TicketListResponse,
  TicketWithComments,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Error type that carries the HTTP status and any field-level validation details. */
export class ApiError extends Error {
  status: number;
  details?: { field: string; message: string }[];
  constructor(status: number, message: string, details?: { field: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(0, 'Network error — is the API running?');
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body?.details);
  }
  return body as T;
}

function toQuery(params: ListParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  listTickets: (params: ListParams = {}) =>
    request<TicketListResponse>(`/tickets${toQuery(params)}`),

  getTicket: (id: number) => request<TicketWithComments>(`/tickets/${id}`),

  createTicket: (payload: CreateTicketPayload) =>
    request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(payload) }),

  updateTicket: (id: number, payload: Partial<CreateTicketPayload>) =>
    request<Ticket>(`/tickets/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteTicket: (id: number) => request<void>(`/tickets/${id}`, { method: 'DELETE' }),

  addComment: (id: number, payload: { author: string; body: string }) =>
    request<Comment>(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
