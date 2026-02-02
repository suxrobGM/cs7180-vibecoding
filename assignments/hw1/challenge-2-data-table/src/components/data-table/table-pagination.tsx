import type { ReactElement } from "react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  displayedResults: number;
  onPageChange: (page: number) => void;
}

export function TablePagination(props: TablePaginationProps): ReactElement {
  const { currentPage, totalPages, totalResults, displayedResults, onPageChange } = props;
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
      <span className="text-sm text-gray-600">
        Showing {displayedResults} of {totalResults} results
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          className={`rounded border border-gray-300 bg-white px-4 py-2 text-sm transition-colors ${
            isFirstPage ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100"
          }`}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLastPage}
          className={`rounded border border-gray-300 bg-white px-4 py-2 text-sm transition-colors ${
            isLastPage ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:bg-gray-100"
          }`}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
