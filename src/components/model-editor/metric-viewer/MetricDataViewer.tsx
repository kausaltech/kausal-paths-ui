import { useCallback, useMemo, useState } from 'react';

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import {
  DataEditor,
  type DataEditorProps,
  type GridCell,
  GridCellKind,
  type GridColumn,
  type Item,
} from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';
import { useTranslations } from 'next-intl';

import {
  type DimensionalMetric,
  type MetricCategory,
  type MetricDimension,
} from '../dimensional-metric';

type ViewMode = 'pivot' | 'flat';

type MetricDataViewerProps = {
  metric: DimensionalMetric;
  compact?: boolean;
  fillHeight?: boolean;
};

type SortState = { colId: string; dir: 'asc' | 'desc' } | null;

type ColumnSpec = {
  col: GridColumn & { id: string };
  sortable?: boolean;
  getCell: (rowIndex: number) => GridCell;
  getSortValue?: (rowIndex: number) => number | string | null;
};

const FORECAST_OVERRIDE = { bgCell: '#f1f8fe' } as const;

function formatNumber(value: number | null | undefined, maxDigits: number): string {
  if (value == null) return '';
  return value.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
}

export default function MetricDataViewer({
  metric,
  compact = false,
  fillHeight = false,
}: MetricDataViewerProps) {
  const t = useTranslations('model-editor');
  const hasDimensions = metric.dimensions.length > 0;
  const [viewMode, setViewMode] = useState<ViewMode>(hasDimensions ? 'pivot' : 'flat');
  const [pivotDimId, setPivotDimId] = useState<string>(() => metric.dimensions[0]?.id ?? '');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [sort, setSort] = useState<SortState>(null);
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  const handleFilterChange = useCallback((dimId: string, catIds: string[]) => {
    setFilters((prev) => ({ ...prev, [dimId]: catIds }));
  }, []);

  const forecastFrom = metric.forecastFrom;

  const pivotData = useMemo(() => {
    if (viewMode !== 'pivot' || !pivotDimId) return null;
    return metric.toPivotRows(pivotDimId);
  }, [metric, viewMode, pivotDimId]);

  const pivotSpecs = useMemo<ColumnSpec[]>(() => {
    if (!pivotData) return [];
    const rows = pivotData.rows as Array<Record<string, unknown>>;
    const isForecastRow = (rowIndex: number): boolean => {
      if (forecastFrom == null) return false;
      const year = rows[rowIndex]?.year as number | undefined;
      return year != null && year >= forecastFrom;
    };
    const yearSpec: ColumnSpec = {
      col: { id: 'year', title: t('metric-col-year'), width: colWidths.year ?? 80 },
      sortable: true,
      getCell: (rowIndex) => {
        const value = rows[rowIndex]?.year as number | undefined;
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: value != null ? String(value) : '',
          allowOverlay: false,
          readonly: true,
          contentAlign: 'right',
          themeOverride: isForecastRow(rowIndex) ? FORECAST_OVERRIDE : undefined,
        };
      },
      getSortValue: (rowIndex) => (rows[rowIndex]?.year as number | undefined) ?? null,
    };
    const catSpecs: ColumnSpec[] = pivotData.columns.map((cat: MetricCategory) => ({
      col: { id: cat.id, title: cat.label, width: colWidths[cat.id] ?? 120 },
      getCell: (rowIndex) => {
        const value = rows[rowIndex]?.[cat.id] as number | null | undefined;
        return {
          kind: GridCellKind.Number,
          data: value ?? undefined,
          displayData: formatNumber(value, 2),
          allowOverlay: false,
          readonly: true,
          contentAlign: 'right',
          themeOverride: isForecastRow(rowIndex) ? FORECAST_OVERRIDE : undefined,
        };
      },
      getSortValue: (rowIndex) => (rows[rowIndex]?.[cat.id] as number | null | undefined) ?? null,
    }));
    return [yearSpec, ...catSpecs];
  }, [pivotData, forecastFrom, colWidths, t]);

  const filteredMetric = useMemo(() => {
    if (viewMode !== 'flat') return metric;
    let m = metric;
    for (const [dimId, catIds] of Object.entries(filters)) {
      if (catIds.length > 0) {
        m = m.filter(dimId, catIds);
      }
    }
    return m;
  }, [metric, viewMode, filters]);

  const flatRows = useMemo(() => {
    if (viewMode !== 'flat') return [];
    return filteredMetric.toRows() satisfies Array<Record<string, unknown>>;
  }, [filteredMetric, viewMode]);

  const flatSpecs = useMemo<ColumnSpec[]>(() => {
    if (viewMode !== 'flat') return [];
    const isForecastRow = (rowIndex: number): boolean => {
      if (forecastFrom == null) return false;
      const year = flatRows[rowIndex]?.year as number | undefined;
      return year != null && year >= forecastFrom;
    };
    const dimSpecs: ColumnSpec[] = filteredMetric.dimensions.map((dim: MetricDimension) => {
      const catLabelMap = new Map(dim.categories.map((c) => [c.id, c.label]));
      return {
        col: { id: dim.id, title: dim.label, width: colWidths[dim.id] ?? 140 },
        sortable: true,
        getCell: (rowIndex) => {
          const raw = flatRows[rowIndex]?.[dim.id] as string | undefined;
          const label = (raw && catLabelMap.get(raw)) ?? raw ?? '';
          return {
            kind: GridCellKind.Text,
            data: label,
            displayData: label,
            allowOverlay: false,
            readonly: true,
            themeOverride: isForecastRow(rowIndex) ? FORECAST_OVERRIDE : undefined,
          };
        },
        getSortValue: (rowIndex) => {
          const raw = flatRows[rowIndex]?.[dim.id] as string | undefined;
          return (raw && catLabelMap.get(raw)) ?? raw ?? null;
        },
      };
    });
    const yearSpec: ColumnSpec = {
      col: { id: 'year', title: t('metric-col-year'), width: colWidths.year ?? 80 },
      sortable: true,
      getCell: (rowIndex) => {
        const value = flatRows[rowIndex]?.year as number | undefined;
        return {
          kind: GridCellKind.Number,
          data: value,
          displayData: value != null ? String(value) : '',
          allowOverlay: false,
          readonly: true,
          contentAlign: 'right',
          themeOverride: isForecastRow(rowIndex) ? FORECAST_OVERRIDE : undefined,
        };
      },
      getSortValue: (rowIndex) => flatRows[rowIndex]?.year ?? null,
    };
    const valSpec: ColumnSpec = {
      col: {
        id: 'value',
        title: t('metric-col-value', { unit: metric.unit.short }),
        width: colWidths.value ?? 130,
      },
      sortable: true,
      getCell: (rowIndex) => {
        const value = flatRows[rowIndex]?.value as number | null | undefined;
        return {
          kind: GridCellKind.Number,
          data: value ?? undefined,
          displayData: formatNumber(value, 4),
          allowOverlay: false,
          readonly: true,
          contentAlign: 'right',
          themeOverride: isForecastRow(rowIndex) ? FORECAST_OVERRIDE : undefined,
        };
      },
      getSortValue: (rowIndex) => flatRows[rowIndex]?.value ?? null,
    };
    return [...dimSpecs, yearSpec, valSpec];
  }, [filteredMetric, viewMode, flatRows, metric.unit.short, forecastFrom, colWidths, t]);

  const isPivot = viewMode === 'pivot' && !!pivotData;
  const specs = isPivot ? pivotSpecs : flatSpecs;
  const rawRowCount = isPivot ? (pivotData?.rows.length ?? 0) : flatRows.length;

  const sortedIndex = useMemo<number[] | null>(() => {
    if (!sort) return null;
    const spec = specs.find((s) => s.col.id === sort.colId);
    if (!spec?.getSortValue) return null;
    const indices = Array.from({ length: rawRowCount }, (_, i) => i);
    const factor = sort.dir === 'asc' ? 1 : -1;
    indices.sort((a, b) => {
      const va = spec.getSortValue!(a);
      const vb = spec.getSortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * factor;
      return String(va).localeCompare(String(vb)) * factor;
    });
    return indices;
  }, [sort, specs, rawRowCount]);

  const getCellContent = useCallback<DataEditorProps['getCellContent']>(
    (cell: Item) => {
      const [col, row] = cell;
      const realRow = sortedIndex ? (sortedIndex[row] ?? row) : row;
      const spec = specs[col];
      if (!spec) {
        return { kind: GridCellKind.Loading, allowOverlay: false } satisfies GridCell;
      }
      return spec.getCell(realRow);
    },
    [specs, sortedIndex]
  );

  const onHeaderClicked = useCallback<NonNullable<DataEditorProps['onHeaderClicked']>>(
    (colIndex) => {
      const spec = specs[colIndex];
      if (!spec?.sortable) return;
      const id = spec.col.id;
      setSort((prev) => {
        if (!prev || prev.colId !== id) return { colId: id, dir: 'asc' };
        if (prev.dir === 'asc') return { colId: id, dir: 'desc' };
        return null;
      });
    },
    [specs]
  );

  const onColumnResize = useCallback<NonNullable<DataEditorProps['onColumnResize']>>(
    (column, newSize) => {
      if (!column.id) return;
      setColWidths((prev) => ({ ...prev, [column.id as string]: newSize }));
    },
    []
  );

  const columns = useMemo<GridColumn[]>(() => specs.map((s) => s.col), [specs]);

  const gridHeight = compact ? 300 : 500;
  const freezeColumns = isPivot ? 1 : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        ...(fillHeight && { height: '100%', minHeight: 0 }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {!compact && (
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            {metric.name}
          </Typography>
        )}
        <Chip label={metric.unit.short} size="small" variant="outlined" />
        {metric.forecastFrom != null && (
          <Chip
            label={t('metric-forecast-from', { year: metric.forecastFrom })}
            size="small"
            color="info"
            variant="outlined"
          />
        )}
        <Box sx={{ flex: 1 }} />
        {hasDimensions && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v: ViewMode | null) => {
              if (v) setViewMode(v);
            }}
            size="small"
          >
            <ToggleButton value="pivot">{t('metric-view-pivot')}</ToggleButton>
            <ToggleButton value="flat">{t('metric-view-flat')}</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {viewMode === 'pivot' && metric.dimensions.length > 1 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="pivot-dim-label">{t('metric-pivot-dimension')}</InputLabel>
          <Select
            labelId="pivot-dim-label"
            label={t('metric-pivot-dimension')}
            value={pivotDimId}
            onChange={(e) => setPivotDimId(e.target.value)}
          >
            {metric.dimensions.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {viewMode === 'flat' && metric.dimensions.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {metric.dimensions.map((dim) => (
            <FormControl key={dim.id} size="small" sx={{ minWidth: 150 }}>
              <InputLabel id={`filter-${dim.id}`}>{dim.label}</InputLabel>
              <Select
                labelId={`filter-${dim.id}`}
                label={dim.label}
                multiple
                value={filters[dim.id] ?? []}
                onChange={(e) => handleFilterChange(dim.id, e.target.value as string[])}
                renderValue={(selected) =>
                  t('metric-selected-of', {
                    selected: selected.length,
                    total: dim.categories.length,
                  })
                }
              >
                {dim.categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      )}

      <Box
        sx={{
          ...(fillHeight ? { flex: 1, minHeight: 0 } : { height: gridHeight }),
          width: '100%',
        }}
      >
        <DataEditor
          columns={columns}
          rows={rawRowCount}
          getCellContent={getCellContent}
          onHeaderClicked={onHeaderClicked}
          onColumnResize={onColumnResize}
          freezeColumns={freezeColumns}
          smoothScrollX
          smoothScrollY
          width="100%"
          height="100%"
          rowHeight={32}
          headerHeight={36}
        />
      </Box>
    </Box>
  );
}
