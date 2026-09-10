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
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface Comment {
  id: number;
  ticketId: number;
  author: string;
  body: string;
  createdAt: string;
}

/** Weight used when sorting by priority (High first). */
export const PRIORITY_RANK: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};
