import { PRIORITIES, STATUSES, type ListParams } from '../types';

interface Props {
  filters: ListParams;
  customers: string[];
  onChange: (patch: Partial<ListParams>) => void;
}

/** Search + filter controls. Every change resets to page 1 (handled by parent). */
export default function Toolbar({ filters, customers, onChange }: Props) {
  return (
    <div className="toolbar">
      <div className="search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Search by title or customer…"
          value={filters.search ?? ''}
          onChange={(e) => onChange({ search: e.target.value || undefined })}
          aria-label="Search tickets"
        />
      </div>

      <div className="select">
        <select
          value={filters.status ?? ''}
          onChange={(e) => onChange({ status: (e.target.value || undefined) as ListParams['status'] })}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="select">
        <select
          value={filters.priority ?? ''}
          onChange={(e) =>
            onChange({ priority: (e.target.value || undefined) as ListParams['priority'] })
          }
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="select">
        <select
          value={filters.customerName ?? ''}
          onChange={(e) => onChange({ customerName: e.target.value || undefined })}
          aria-label="Filter by customer"
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
