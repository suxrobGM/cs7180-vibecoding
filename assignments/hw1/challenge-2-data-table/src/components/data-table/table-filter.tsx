import type { ReactElement } from "react";

/** Props for the TableFilter component */
interface TableFilterProps {
  /** Current filter text value */
  filter: string;
  /** Callback when filter text changes */
  onFilterChange: (value: string) => void;
  /** Current page size */
  pageSize: number;
  /** Available page size options */
  pageSizeOptions: number[];
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
}

/**
 * Renders the filter input and page size selector.
 * @param props - Component props
 */
export function TableFilter(props: TableFilterProps): ReactElement {
  const { filter, onFilterChange, pageSize, pageSizeOptions, onPageSizeChange } = props;

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 p-4">
      <input
        type="text"
        placeholder="Filter all columns..."
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        className="min-w-50 rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        aria-label="Filter table"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        Rows per page:
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
