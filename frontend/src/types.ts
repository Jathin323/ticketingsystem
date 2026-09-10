export const PRIORITIES = ['Low', 'Medium', 'High'] as const;
export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];

export interface Ticket {
  id: number;
  customerName: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  ticketId: number;
  author: string;
  body: string;
  createdAt: string;
}

export interface TicketWithComments extends Ticket {
  comments: Comment[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: Pagination;
}

export interface ListParams {
  status?: Status;
  priority?: Priority;
  customerName?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreateTicketPayload {
  customerName: string;
  title: string;
  description: string;
  priority: Priority;
  status?: Status;
}
