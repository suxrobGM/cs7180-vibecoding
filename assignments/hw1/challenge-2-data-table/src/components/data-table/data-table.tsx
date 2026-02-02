import { useState, type ReactElement } from "react";
import { TableBody } from "./table-body";
import { TableFilter } from "./table-filter";
import { TableHeader } from "./table-header";
import { TablePagination } from "./table-pagination";
import type { ColumnDef, SortState } from "./types";

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
}

export function DataTable<T>(props: DataTableProps<T>): ReactElement {
  const { data, columns, pageSize: initialPageSize = 10, pageSizeOptions = [10, 25, 50] } = props;

  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState<SortState<T>>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data across all string columns
  const filterData = () => {
    if (!filter.trim()) return data;

    const lowerFilter = filter.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = row[col.key as keyof T];
        if (typeof value === "string") {
          return value.toLowerCase().includes(lowerFilter);
        }
        if (typeof value === "number") {
          return value.toString().includes(lowerFilter);
        }
        return false;
      }),
    );
  };

  // Sort data
  const sortData = (filtered: T[]) => {
    if (!sort.column || !sort.direction) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sort.column as keyof T];
      const bVal = b[sort.column as keyof T];

      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sort.direction === "asc" ? comparison : -comparison;
    });
  };

  const filteredData = filterData();
  const sortedData = sortData(filteredData);

  // Paginate data
  const start = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(start, start + pageSize);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1);
  };

  // Handle sort click
  const handleSort = (column: keyof T & string) => {
    setSort((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <TableFilter
        filter={filter}
        onFilterChange={handleFilterChange}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={handlePageSizeChange}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <TableHeader columns={columns} sort={sort} onSort={handleSort} />
          <TableBody data={paginatedData} columns={columns} />
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={sortedData.length}
        displayedResults={paginatedData.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
