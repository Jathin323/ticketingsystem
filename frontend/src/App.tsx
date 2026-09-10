import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from './api/client';
import type { ListParams, TicketListResponse } from './types';
import Toolbar from './components/Toolbar';
import TicketTable from './components/TicketTable';
import Pagination from './components/Pagination';
import CreateTicketModal from './components/CreateTicketModal';
import TicketDetailPanel from './components/TicketDetailPanel';

const DEFAULT_FILTERS: ListParams = {
  sortBy: 'createdAt',
  order: 'desc',
  page: 1,
  pageSize: 10,
};

export default function App() {
  const [filters, setFilters] = useState<ListParams>(DEFAULT_FILTERS);
  const [result, setResult] = useState<TicketListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  // Debounce filter changes (keeps typing in search from flooding the API).
  const [debounced, setDebounced] = useState(filters);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      setDebounced(filters);
      return;
    }
    const t = setTimeout(() => setDebounced(filters), 250);
    return () => clearTimeout(t);
  }, [filters]);

  const load = useCallback(async (params: ListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTickets(params);
      setResult(res);
      // Accumulate customer names for the filter dropdown.
      setCustomers((prev) => {
        const set = new Set(prev);
        res.data.forEach((t) => set.add(t.customerName));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(debounced);
  }, [debounced, load]);

  /** Apply a filter change; anything other than paging resets to page 1. */
  function patchFilters(patch: Partial<ListParams>) {
    setFilters((f) => ({ ...f, ...patch, page: 'page' in patch ? patch.page! : 1 }));
  }

  function toggleSort(key: NonNullable<ListParams['sortBy']>) {
    setFilters((f) => ({
      ...f,
      sortBy: key,
      order: f.sortBy === key && f.order === 'desc' ? 'asc' : 'desc',
      page: 1,
    }));
  }

  function refresh() {
    load(filters);
  }

  const total = result?.pagination.total ?? 0;
  const isEmpty = !loading && !error && (result?.data.length ?? 0) === 0;

  return (
    <div className="app">
      <header className="appbar">
        <div className="appbar__brand">
          <span className="appbar__mark">SD</span>
          <h1>Service Desk</h1>
          <span className="appbar__count">
            {loading ? '…' : `${total} ticket${total === 1 ? '' : 's'}`}
          </span>
        </div>
        <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
          + New ticket
        </button>
      </header>

      <Toolbar filters={filters} customers={customers} onChange={patchFilters} />

      {error && (
        <div className="banner">
          {error}
          <button onClick={refresh}>Retry</button>
        </div>
      )}

      {isEmpty ? (
        <div className="table-wrap">
          <div className="state">
            <h3>No tickets found</h3>
            <p>Try clearing filters, or create the first ticket.</p>
            <button className="btn btn--primary" onClick={() => setShowCreate(true)}>
              + New ticket
            </button>
          </div>
        </div>
      ) : (
        <TicketTable
          tickets={result?.data ?? []}
          sortBy={filters.sortBy ?? 'createdAt'}
          order={filters.order ?? 'desc'}
          loading={loading}
          onSort={toggleSort}
          onOpen={setOpenId}
        />
      )}

      {result && result.data.length > 0 && (
        <Pagination meta={result.pagination} onPage={(page) => patchFilters({ page })} />
      )}

      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            // Show the newest ticket first.
            setFilters((f) => ({ ...f, sortBy: 'createdAt', order: 'desc', page: 1 }));
          }}
        />
      )}

      {openId !== null && (
        <TicketDetailPanel
          ticketId={openId}
          onClose={() => setOpenId(null)}
          onChanged={refresh}
          onDeleted={() => {
            setOpenId(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
