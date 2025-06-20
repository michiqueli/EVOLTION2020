// RUTA: src/components/ui/data-table.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";

const getNestedValue = (obj, path) => {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
};

const DataTable = ({
  columns,
  data,
  filterableColumns = [],
  searchableColumns = [],
  onFilteredDataChange,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const valA = getNestedValue(a, sortConfig.key);
        const valB = getNestedValue(b, sortConfig.key);
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      const searchMatch =
        searchableColumns.length > 0
          ? searchableColumns.some((col) => {
              const val = getNestedValue(item, col.accessor);
              return (
                val != null &&
                val.toString().toLowerCase().includes(searchTerm.toLowerCase())
              );
            })
          : true;

      const filterMatch = Object.entries(filters).every(([key, value]) => {
        if (value === "") return true;
        const val = getNestedValue(item, key);
        return (
          val != null && val.toString().toLowerCase() === value.toLowerCase()
        );
      });

      return searchMatch && filterMatch;
    });
  }, [sortedData, searchTerm, filters, searchableColumns]);

  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [JSON.stringify(filteredData), onFilteredDataChange]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (columnAccessor, value) => {
    setFilters((prev) => ({ ...prev, [columnAccessor]: value }));
    setPageIndex(0);
  };

  const getColumnHeader = (column) => {
    const isSortable = column.sortable !== false;
    return (
      <TableHead
        key={column.accessor}
        onClick={isSortable ? () => handleSort(column.accessor) : undefined}
        className={isSortable ? "cursor-pointer hover:bg-muted/50" : ""}
      >
        <div className="flex items-center gap-2">
          {column.header}
          {isSortable && (
            <ArrowUpDown
              className={`h-4 w-4 shrink-0 transition-transform ${
                sortConfig.key === column.accessor
                  ? "opacity-100"
                  : "opacity-30"
              } ${
                sortConfig.key === column.accessor &&
                sortConfig.direction === "descending"
                  ? "rotate-180"
                  : ""
              }`}
            />
          )}
        </div>
      </TableHead>
    );
  };

  const getCellValue = (row, column) => {
    if (column.cell) return column.cell({ row });
    return getNestedValue(row, column.accessor);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {searchableColumns.length > 0 && (
          <Input
            placeholder={`Buscar en ${searchableColumns
              .map((c) => c.header)
              .join(", ")}...`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPageIndex(0);
            }}
            className="max-w-sm bg-card border-input"
          />
        )}
        {filterableColumns.map((col) => (
          <Select
            key={col.accessor}
            onValueChange={(value) =>
              handleFilterChange(col.accessor, value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-input">
              <SelectValue placeholder={`Filtrar ${col.header}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({col.header})</SelectItem>
              {[
                ...new Set(
                  data
                    .map((item) => getNestedValue(item, col.accessor))
                    .filter(Boolean)
                ),
              ]
                .sort()
                .map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ))}
      </div>
      <div className="rounded-md border bg-card shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => getColumnHeader(column))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <motion.tr
                  key={row.id || rowIndex}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b data-[state=selected]:bg-muted"
                >
                  {columns.map((column) => (
                    <TableCell key={column.accessor}>
                      {getCellValue(row, column)}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredData.length} fila(s) encontrada(s).
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Filas por página:
          </span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="h-8 w-[70px] bg-card border-input">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={pageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pageIndex + 1} de {pageCount > 0 ? pageCount : 1}
          </span>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() =>
              setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))
            }
            disabled={pageIndex >= pageCount - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPageIndex(pageCount - 1)}
            disabled={pageIndex >= pageCount - 1 || pageCount === 0}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
