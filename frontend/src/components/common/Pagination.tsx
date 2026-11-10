import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 15],
  itemLabel = 'registros',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const fromIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const toIndex = Math.min(safeCurrentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-parkia-line-dark text-xs text-slate-500 dark:text-slate-400">
      {/* Page Size Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-600 dark:text-slate-300">Mostrar:</span>
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-parkia-navy/60 p-0.5 border border-slate-200/80 dark:border-parkia-line-dark">
          {pageSizeOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onPageSizeChange(opt);
                onPageChange(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pageSize === opt
                  ? 'bg-white dark:bg-parkia-card-dark text-navy-900 dark:text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-400">
          (de {totalItems} {itemLabel})
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-3">
        <span className="text-xs font-medium">
          <strong className="text-slate-900 dark:text-white font-bold">{fromIndex}-{toIndex}</strong> de <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong>
        </span>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-parkia-line-dark bg-white dark:bg-parkia-card-dark text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-semibold text-slate-700 dark:text-slate-200">
            {safeCurrentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-parkia-line-dark bg-white dark:bg-parkia-card-dark text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
