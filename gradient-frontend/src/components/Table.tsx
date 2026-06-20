import React, { useState } from 'react';

export interface ColumnFilter {
  readonly type: 'text' | 'select' | 'status' | 'none';
  readonly options?: readonly string[];
  readonly placeholder?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}


export type TableCell = React.ReactNode | {
  readonly content: React.ReactNode;
  readonly className?: string;
};

function isTableCellObject(cell: unknown): cell is { readonly content: React.ReactNode; readonly className?: string } {
  return (
    cell !== null &&
    typeof cell === 'object' &&
    'content' in cell &&
    !React.isValidElement(cell)
  );
}

interface TableProps {
  readonly headers: readonly React.ReactNode[];
  readonly rows: readonly (readonly TableCell[])[];
  readonly rowKeys?: readonly string[];
  readonly className?: string;
  readonly columnAlignments?: readonly ('left' | 'center' | 'right')[];
  readonly columnClasses?: readonly string[];
  readonly columnFilters?: readonly (ColumnFilter | null)[];
  readonly rowClasses?: readonly string[];
}

export function Table({
  headers,
  rows,
  rowKeys,
  className = '',
  columnAlignments = [],
  columnClasses = [],
  columnFilters = [],
  rowClasses = [],
}: TableProps): JSX.Element {
  const [openFilters, setOpenFilters] = useState<Record<number, boolean>>({});

  return (
    <table className={`problems-table ${className}`}>
      <thead>
        <tr>
          {headers.map((header, idx) => {
            const align = columnAlignments[idx] || 'left';
            const alignClass = align !== 'left' ? `text-${align}` : '';
            const colClass = columnClasses[idx] || '';
            const filter = columnFilters[idx];

            const hasFilter = filter && filter.type !== 'none';
            const isActive = hasFilter && filter.value !== '' && filter.value !== 'All';
            const isOpen = !!openFilters[idx];

            return (
              <th 
                key={`th-${idx}`} 
                className={`${alignClass} ${colClass}`}
              >
                <div className="header-cell-content" style={{ textAlign: align, position: 'relative' }}>
                  <div 
                    className="header-label-row" 
                    style={{ 
                      justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' 
                    }}
                  >
                    <div className="header-label">{header}</div>
                    {hasFilter && (
                      <button
                        type="button"
                        className={`header-filter-toggle-btn ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                        onClick={() => setOpenFilters(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        title={filter.type === 'text' ? 'Toggle Search' : 'Toggle Filter'}
                      >
                        {filter.type === 'text' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  {hasFilter && isOpen && (
                    <>
                      <div 
                        className="filter-popover-backdrop" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilters(prev => ({ ...prev, [idx]: false }));
                        }}
                      />
                      <div 
                        className="filter-popover-modal" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                          left: align === 'right' ? 'auto' : 0, 
                          right: align === 'right' ? 0 : 'auto',
                          textAlign: 'left'
                        }}
                      >
                        {filter.type === 'text' ? (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => filter.onChange(e.target.value)}
                            placeholder={filter.placeholder || 'Filter...'}
                            className="form-control table-header-filter-input"
                            autoFocus
                          />
                        ) : (
                          <select
                            value={filter.value}
                            onChange={(e) => filter.onChange(e.target.value)}
                            className="form-control table-header-filter-select"
                            autoFocus
                          >
                            <option value="All">All</option>
                            {filter.options?.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                        {isActive && (
                          <button
                            type="button"
                            className="btn-filter-clear"
                            onClick={() => {
                              filter.onChange(filter.type === 'text' ? '' : 'All');
                            }}
                          >
                            Clear Filter
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={headers.length} className="text-center text-muted table-empty-padding">
              No data matching filters.
            </td>
          </tr>
        ) : (
          rows.map((row, rIdx) => {
            const key = rowKeys?.[rIdx] || `tr-${rIdx}`;
            const rowClass = rowClasses?.[rIdx] || '';
            return (
              <tr key={key} className={rowClass}>
                {row.map((cell, cIdx) => {
                  const align = columnAlignments[cIdx] || 'left';
                  const alignClass = align !== 'left' ? `text-${align}` : '';
                  const colClass = columnClasses[cIdx] || '';
                  
                  // Support both plain ReactNode and custom cell object with styling overrides
                  const isCellObj = isTableCellObject(cell);
                  const cellContent = isCellObj ? cell.content : cell;
                  const cellClass = isCellObj ? cell.className || '' : '';

                  return (
                    <td 
                      key={`td-${rIdx}-${cIdx}`} 
                      className={`${alignClass} ${colClass} ${cellClass}`}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
