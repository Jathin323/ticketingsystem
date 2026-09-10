import db, { migrate } from './index.js';
import type { Priority, Status } from '../types.js';

migrate();

interface SeedTicket {
  customerName: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  daysAgo: number;
}

const sample: SeedTicket[] = [
  {
    customerName: 'Acme Corp',
    title: 'Cannot log in to admin portal',
    description: 'Users report a 500 error after entering valid credentials on the admin portal.',
    priority: 'High',
    status: 'Open',
    daysAgo: 1,
  },
  {
    customerName: 'Globex',
    title: 'Invoice PDF shows wrong currency',
    description: 'Generated invoices display USD instead of the account currency (EUR).',
    priority: 'Medium',
    status: 'In Progress',
    daysAgo: 3,
  },
  {
    customerName: 'Initech',
    title: 'Feature request: dark mode',
    description: 'Customer would like a dark theme option in the dashboard settings.',
    priority: 'Low',
    status: 'Open',
    daysAgo: 5,
  },
  {
    customerName: 'Umbrella Health',
    title: 'Data export times out for large accounts',
    description: 'CSV export fails with a gateway timeout for accounts over ~50k records.',
    priority: 'High',
    status: 'In Progress',
    daysAgo: 2,
  },
  {
    customerName: 'Wonka Industries',
    title: 'Password reset email not received',
    description: 'A subset of customers do not receive the password reset email within 10 minutes.',
    priority: 'Medium',
    status: 'Resolved',
    daysAgo: 8,
  },
  {
    customerName: 'Stark Solutions',
    title: 'Typo on billing settings page',
    description: '"Recieve invoices by email" should read "Receive".',
    priority: 'Low',
    status: 'Closed',
    daysAgo: 12,
  },
  {
    customerName: 'Acme Corp',
    title: 'API rate limit unclear in docs',
    description: 'Documentation does not state the per-minute request limit for the tickets endpoint.',
    priority: 'Low',
    status: 'Open',
    daysAgo: 4,
  },
  {
    customerName: 'Hooli',
    title: 'Webhook deliveries duplicated',
    description: 'Some webhook events are delivered twice within a few seconds of each other.',
    priority: 'High',
    status: 'Open',
    daysAgo: 1,
  },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const reset = db.transaction(() => {
  db.exec('DELETE FROM comments; DELETE FROM tickets;');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('tickets','comments');");

  const insert = db.prepare(
    `INSERT INTO tickets (customerName, title, description, priority, status, createdAt, updatedAt)
     VALUES (@customerName, @title, @description, @priority, @status, @createdAt, @updatedAt)`,
  );

  for (const t of sample) {
    const createdAt = isoDaysAgo(t.daysAgo);
    insert.run({
      customerName: t.customerName,
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: t.status,
      createdAt,
      updatedAt: createdAt,
    });
  }

  db.prepare(
    `INSERT INTO comments (ticketId, author, body, createdAt) VALUES (?, ?, ?, ?)`,
  ).run(1, 'Support Agent', 'Reproduced on staging — escalating to engineering.', isoDaysAgo(1));
});

reset();

const count = (db.prepare('SELECT COUNT(*) AS c FROM tickets').get() as { c: number }).c;
console.log(`Seeded ${count} tickets.`);
