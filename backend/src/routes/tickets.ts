import { Router, type Request, type Response } from 'express';
import db from '../db/index.js';
import { HttpError } from '../middleware/errorHandler.js';
import {
  createTicketSchema,
  updateTicketSchema,
  listQuerySchema,
  createCommentSchema,
} from '../validation.js';
import type { Ticket, Comment } from '../types.js';

const router = Router();

/* ------------------------------------------------------------------ helpers */

/** Parse & validate the :id param, throwing a 400 for anything non-numeric. */
function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid ticket id: must be a positive integer');
  }
  return id;
}

/** Fetch a ticket or throw 404. */
function getTicketOr404(id: number): Ticket {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Ticket | undefined;
  if (!ticket) throw new HttpError(404, `Ticket ${id} not found`);
  return ticket;
}

// Map a priority string to a sortable rank so "High" sorts above "Low".
const PRIORITY_CASE = `CASE priority WHEN 'High' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END`;

/* -------------------------------------------------------------------- routes */

// GET /api/tickets — list with filtering, search, sorting, pagination.
router.get('/', (req: Request, res: Response) => {
  const q = listQuerySchema.parse(req.query);

  const where: string[] = [];
  const params: Record<string, unknown> = {};

  if (q.status) {
    where.push('status = @status');
    params.status = q.status;
  }
  if (q.priority) {
    where.push('priority = @priority');
    params.priority = q.priority;
  }
  if (q.customerName) {
    where.push('customerName LIKE @customerName');
    params.customerName = `%${q.customerName}%`;
  }
  if (q.search) {
    // Search across both title and customer name.
    where.push('(title LIKE @search OR customerName LIKE @search)');
    params.search = `%${q.search}%`;
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderColumn = q.sortBy === 'priority' ? PRIORITY_CASE : q.sortBy;
  const orderClause = `ORDER BY ${orderColumn} ${q.order.toUpperCase()}, id DESC`;

  const total = (
    db.prepare(`SELECT COUNT(*) AS c FROM tickets ${whereClause}`).get(params) as { c: number }
  ).c;

  const offset = (q.page - 1) * q.pageSize;
  const rows = db
    .prepare(`SELECT * FROM tickets ${whereClause} ${orderClause} LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit: q.pageSize, offset }) as Ticket[];

  res.json({
    data: rows,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    },
  });
});

// GET /api/tickets/:id — single ticket with its comments.
router.get('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const ticket = getTicketOr404(id);
  const comments = db
    .prepare('SELECT * FROM comments WHERE ticketId = ? ORDER BY createdAt ASC')
    .all(id) as Comment[];
  res.json({ ...ticket, comments });
});

// POST /api/tickets — create.
router.post('/', (req: Request, res: Response) => {
  const input = createTicketSchema.parse(req.body);
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO tickets (customerName, title, description, priority, status, createdAt, updatedAt)
       VALUES (@customerName, @title, @description, @priority, @status, @createdAt, @updatedAt)`,
    )
    .run({ ...input, createdAt: now, updatedAt: now });

  const created = getTicketOr404(Number(result.lastInsertRowid));
  res.status(201).json(created);
});

// PUT /api/tickets/:id — partial update.
router.put('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  getTicketOr404(id); // 404 before we attempt a write
  const input = updateTicketSchema.parse(req.body);

  const fields = Object.keys(input);
  const setClause = fields.map((f) => `${f} = @${f}`).join(', ');

  db.prepare(`UPDATE tickets SET ${setClause}, updatedAt = @updatedAt WHERE id = @id`).run({
    ...input,
    updatedAt: new Date().toISOString(),
    id,
  });

  res.json(getTicketOr404(id));
});

// DELETE /api/tickets/:id — remove (comments cascade).
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  getTicketOr404(id);
  db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
  res.status(204).send();
});

/* ----------------------------------------------------------- comments (bonus) */

// GET /api/tickets/:id/comments
router.get('/:id/comments', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  getTicketOr404(id);
  const comments = db
    .prepare('SELECT * FROM comments WHERE ticketId = ? ORDER BY createdAt ASC')
    .all(id) as Comment[];
  res.json(comments);
});

// POST /api/tickets/:id/comments
router.post('/:id/comments', (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  getTicketOr404(id);
  const input = createCommentSchema.parse(req.body);
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO comments (ticketId, author, body, createdAt)
       VALUES (@ticketId, @author, @body, @createdAt)`,
    )
    .run({ ticketId: id, ...input, createdAt: now });

  const created = db
    .prepare('SELECT * FROM comments WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as Comment;
  res.status(201).json(created);
});

export default router;
