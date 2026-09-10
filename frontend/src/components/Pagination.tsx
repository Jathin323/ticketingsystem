import type { Pagination as PaginationMeta } from '../types';

interface Props {
  meta: PaginationMeta;
  onPage: (page: number) => void;
}

export default function Pagination({ meta, onPage }: Props) {
  const { page, pageSize, total, totalPages } = meta;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="pagination">
      <span>
        {from}–{to} of {total} ticket{total === 1 ? '' : 's'}
      </span>
      <div className="pagination__controls">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          ‹ Prev
        </button>
        <span style={{ padding: '0 6px' }}>
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
