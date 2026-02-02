import type { ReactElement } from "react";
import type { ColumnDef, SortState } from "./types";

/**
 * Props for the TableHeader component.
 * @template T - The type of data row
 */
interface TableHeaderProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Current sort state */
  sort: SortState<T>;
  /** Callback when a column header is clicked for sorting */
  onSort: (column: keyof T & string) => void;
}

/**
 * Returns the appropriate sort indicator for a column.
 * @param column - The column definition
 * @param sort - Current sort state
 * @returns Sort indicator string or null
 */
function getSortIndicator<T>(column: ColumnDef<T>, sort: SortState<T>): string | null {
  if (!column.sortable) return null;
  if (sort.column !== column.key) return " ⇅";
  return sort.direction === "asc" ? " ▲" : " ▼";
}

/**
 * Renders the table header row with sortable column headers.
 * @template T - The type of data row
 * @param props - Component props
 */
export function TableHeader<T>(props: TableHeaderProps<T>): ReactElement {
  const { columns, sort, onSort } = props;

  return (
    <thead>
      <tr>
        {columns.map((col) => (
          <th
            key={String(col.key)}
            scope="col"
            className={`border-b-2 border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 ${
              col.sortable ? "cursor-pointer select-none hover:bg-gray-100" : ""
            }`}
            onClick={col.sortable ? () => onSort(col.key) : undefined}
            onKeyDown={
              col.sortable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSort(col.key);
                    }
                  }
                : undefined
            }
            tabIndex={col.sortable ? 0 : undefined}
            role={col.sortable ? "button" : undefined}
            aria-sort={
              sort.column === col.key
                ? sort.direction === "asc"
                  ? "ascending"
                  : "descending"
                : undefined
            }
          >
            {col.header}
            {getSortIndicator(col, sort)}
          </th>
        ))}
      </tr>
    </thead>
  );
}
