"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  /** Label for the counted items, e.g. "businesses", "offers". Defaults to "items". */
  itemLabel?: string;
}

/**
 * Shared Prev/Next pagination bar. Extracted from the pattern already used
 * on the payments/subscriptions/template-images pages so every list page
 * looks and behaves the same way instead of re-implementing this per page.
 */
export default function Pagination({
  page,
  totalPages,
  total,
  loading = false,
  onPageChange,
  itemLabel = "items",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-slate-500">
        Page {page} of {safeTotalPages} • Total {total} {itemLabel}
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={loading || page <= 1}
          className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(safeTotalPages, page + 1))}
          disabled={loading || page >= safeTotalPages}
          className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
