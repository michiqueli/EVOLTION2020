import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataTable = ({ columns, data, filterableColumns = [], searchableColumns = [] }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() => {
    return sortedData.filter(item => {
      // Search term filter
      const searchMatch = searchableColumns.length > 0 ? searchableColumns.some(col =>
        item[col.accessor] && item[col.accessor].toString().toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;

      // Column-specific filters
      const filterMatch = Object.entries(filters).every(([key, value]) =>
        value === '' || (item[key] && item[key].toString().toLowerCase() === value.toLowerCase())
      );
      return searchMatch && filterMatch;
    });
  }, [sortedData, searchTerm, filters, searchableColumns]);

  const pageCount = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const handleFilterChange = (columnAccessor, value) => {
    setFilters(prev => ({ ...prev, [columnAccessor]: value }));
    setPageIndex(0);
  };
  
  const getColumnHeader = (column) => {
    const isSortable = column.sortable !== false;
    return (
      <TableHead key={column.accessor} onClick={isSortable ? () => handleSort(column.accessor) : undefined} className={isSortable ? "cursor-pointer hover:bg-muted/50" : ""}>
        <div className="flex items-center">
          {column.header}
          {isSortable && sortConfig.key === column.accessor && (
            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === 'ascending' ? 'rotate-0' : 'rotate-180'}`} />
          )}
          {isSortable && sortConfig.key !== column.accessor && (
             <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />
          )}
        </div>
      </TableHead>
    );
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {searchableColumns.length > 0 && (
          <Input
            placeholder={`Buscar en ${searchableColumns.map(c => c.header).join(', ')}...`}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPageIndex(0); }}
            className="max-w-sm bg-card border-input"
          />
        )}
        {filterableColumns.map(col => (
          <Select
            key={col.accessor}
            onValueChange={(value) => handleFilterChange(col.accessor, value === 'all' ? '' : value)}
            defaultValue="all"
          >
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-input">
              <SelectValue placeholder={`Filtrar ${col.header}...`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({col.header})</SelectItem>
              {[...new Set(data.map(item => item[col.accessor]))].map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      <div className="rounded-md border bg-card shadow">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => getColumnHeader(column))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
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
                    {columns.map(column => (
                      <TableCell key={column.accessor}>
                        {column.cell ? column.cell({ row }) : row[column.accessor]}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {filteredData.length} fila(s) en total.
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Filas por página:</span>
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
              {[5, 10, 20, 30, 50].map(size => (
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
            onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
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
            onClick={() => setPageIndex(prev => Math.min(pageCount - 1, prev + 1))}
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