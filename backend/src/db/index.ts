import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the database file location.
 * - In tests we use an in-memory database so runs are isolated and fast.
 * - Otherwise a file next to the source (or DB_PATH from the environment).
 */
function resolveDbPath(): string {
  if (process.env.NODE_ENV === 'test') return ':memory:';
  return process.env.DB_PATH ?? path.join(__dirname, '../../data.sqlite');
}

const db = new Database(resolveDbPath());
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Create tables if they don't exist. Kept idempotent so it can safely run on
 * every boot — this doubles as our lightweight migration step.
 */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName  TEXT    NOT NULL,
      title         TEXT    NOT NULL,
      description   TEXT    NOT NULL,
      priority      TEXT    NOT NULL CHECK (priority IN ('Low','Medium','High')),
      status        TEXT    NOT NULL CHECK (status IN ('Open','In Progress','Resolved','Closed')),
      createdAt     TEXT    NOT NULL,
      updatedAt     TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticketId   INTEGER NOT NULL,
      author     TEXT    NOT NULL,
      body       TEXT    NOT NULL,
      createdAt  TEXT    NOT NULL,
      FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_comments_ticket  ON comments(ticketId);
  `);
}

migrate();

export default db;
