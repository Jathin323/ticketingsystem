import type { ListParams, Ticket } from '../types';
import { PriorityBadge, StatusBadge } from './Badges';
import { formatDate } from '../utils';

type SortKey = NonNullable<ListParams['sortBy']>;

interface Props {
  tickets: Ticket[];
  sortBy: SortKey;
  order: 'asc' | 'desc';
  loading: boolean;
  onSort: (key: SortKey) => void;
  onOpen: (id: number) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: null, label: 'ID' },
  { key: null, label: 'Customer' },
  { key: null, label: 'Title' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated' },
];

export default function TicketTable({ tickets, sortBy, order, loading, onSort, onOpen }: Props) {
  const arrow = (key: SortKey) => (sortBy === key ? (order === 'asc' ? '↑' : '↓') : '');

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="table-wrap">
        <table className="tickets">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  className={col.key ? 'sortable' : undefined}
                  onClick={col.key ? () => onSort(col.key!) : undefined}
                  aria-sort={
                    col.key && sortBy === col.key
                      ? order === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  {col.label}
                  {col.key && <span className="arrow">{arrow(col.key)}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((c) => (
                      <td key={c.label}>
                        <div className="skeleton" style={{ width: c.label === 'Title' ? '70%' : '60%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              : tickets.map((t) => (
                  <tr key={t.id} onClick={() => onOpen(t.id)}>
                    <td className="cell-id">#{t.id}</td>
                    <td className="cell-customer">{t.customerName}</td>
                    <td>
                      <div className="cell-title">{t.title}</div>
                      <div className="desc">{t.description}</div>
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="cell-date">{formatDate(t.updatedAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="cards">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div className="card" key={i}>
                <div className="skeleton" style={{ width: '50%', marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '80%' }} />
              </div>
            ))
          : tickets.map((t) => (
              <div className="card" key={t.id} onClick={() => onOpen(t.id)}>
                <div className="card__top">
                  <span className="cell-id">#{t.id}</span>
                  <StatusBadge status={t.status} />
                </div>
                <div className="card__title">{t.title}</div>
                <div className="card__meta">
                  <span>{t.customerName}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
            ))}
      </div>
    </>
  );
}
