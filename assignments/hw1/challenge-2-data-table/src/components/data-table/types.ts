import type { ReactNode } from "react";

/**
 * Defines a column configuration for the DataTable.
 * @template T - The type of data row
 */
export interface ColumnDef<T> {
  /** The property key of the data object to display */
  key: keyof T & string;
  /** The header text displayed in the column header */
  header: string;
  /** Whether this column is sortable (default: false) */
  sortable?: boolean;
  /** Custom render function for cell content */
  render?: (value: T[keyof T], row: T) => ReactNode;
}

/** Sort direction for table columns */
export type SortDirection = "asc" | "desc" | null;

/**
 * Represents the current sort state of the table.
 * @template T - The type of data row
 */
export interface SortState<T> {
  /** The column currently being sorted, or null if no sort */
  column: (keyof T & string) | null;
  /** The sort direction */
  direction: SortDirection;
}
