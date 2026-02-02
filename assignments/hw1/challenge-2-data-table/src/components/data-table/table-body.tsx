import type { ReactElement } from "react";
import type { ColumnDef } from "./types";

/**
 * Props for the TableBody component.
 * @template T - The type of data row
 */
interface TableBodyProps<T> {
  /** Array of data rows to display */
  data: T[];
  /** Column definitions for rendering cells */
  columns: ColumnDef<T>[];
}

/**
 * Renders the table body with data rows.
 * Displays an empty state message when no data matches the filter.
 * @template T - The type of data row
 * @param props - Component props
 */
export function TableBody<T>(props: TableBodyProps<T>): ReactElement {
  const { data, columns } = props;

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
            No data matches your filter.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody>
      {data.map((row, rowIndex) => (
        <tr key={rowIndex} className="border-b border-gray-200 transition-colors hover:bg-gray-50">
          {columns.map((col) => (
            <td key={String(col.key)} className="px-4 py-3 text-sm text-gray-700">
              {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
