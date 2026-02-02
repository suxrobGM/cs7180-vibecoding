import type { ReactNode } from "react";

export interface ColumnDef<T> {
  key: keyof T & string;
  header: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState<T> {
  column: (keyof T & string) | null;
  direction: SortDirection;
}
