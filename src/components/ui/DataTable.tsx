"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  width?: string;
};

export function DataTable<T>({
  columns,
  rows,
  empty = "No records",
  onRowClick,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-auto">
      <table className="lims-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={rowKey(r)}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cn(onRowClick && "cursor-pointer")}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.className}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
