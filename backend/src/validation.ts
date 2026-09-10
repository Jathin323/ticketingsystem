import { z } from 'zod';
import { PRIORITIES, STATUSES } from './types.js';

const trimmed = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be a string` })
    .trim()
    .min(min, `${label} must be at least ${min} character(s)`)
    .max(max, `${label} must be at most ${max} characters`);

/** Body for creating a ticket. Status defaults to "Open" if not supplied. */
export const createTicketSchema = z.object({
  customerName: trimmed(1, 120, 'customerName'),
  title: trimmed(1, 160, 'title'),
  description: trimmed(1, 5000, 'description'),
  priority: z.enum(PRIORITIES, {
    errorMap: () => ({ message: `priority must be one of: ${PRIORITIES.join(', ')}` }),
  }),
  status: z
    .enum(STATUSES, { errorMap: () => ({ message: `status must be one of: ${STATUSES.join(', ')}` }) })
    .default('Open'),
});

/** Body for updating a ticket. Every field is optional, but at least one is required. */
export const updateTicketSchema = z
  .object({
    customerName: trimmed(1, 120, 'customerName').optional(),
    title: trimmed(1, 160, 'title').optional(),
    description: trimmed(1, 5000, 'description').optional(),
    priority: z
      .enum(PRIORITIES, { errorMap: () => ({ message: `priority must be one of: ${PRIORITIES.join(', ')}` }) })
      .optional(),
    status: z
      .enum(STATUSES, { errorMap: () => ({ message: `status must be one of: ${STATUSES.join(', ')}` }) })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const createCommentSchema = z.object({
  author: trimmed(1, 120, 'author'),
  body: trimmed(1, 2000, 'body'),
});

const SORTABLE = ['createdAt', 'updatedAt', 'priority', 'status'] as const;

/** Query params for listing tickets: filtering, search, sort, pagination. */
export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  customerName: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(SORTABLE).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
