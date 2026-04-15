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
import type { ColDef, CellClassParams } from 'ag-grid-community';
import AgGridReact from '../GridEditor';

import {
  type DimensionalMetric,
  type MetricCategory,
  type MetricDimension,
} from '../dimensional-metric';

type ViewMode = 'pivot' | 'flat';

type MetricDataViewerProps = {
  metric: DimensionalMetric;
  compact?: boolean;
};

const FORECAST_CELL_CLASS = 'metric-forecast-cell';

export default function MetricDataViewer({ metric, compact = false }: MetricDataViewerProps) {
  const hasDimensions = metric.dimensions.length > 0;
  const [viewMode, setViewMode] = useState<ViewMode>(hasDimensions ? 'pivot' : 'flat');
  const [pivotDimId, setPivotDimId] = useState<string>(
    () => metric.dimensions[0]?.id ?? '',
  );

  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = useCallback((dimId: string, catIds: string[]) => {
    setFilters((prev) => ({ ...prev, [dimId]: catIds }));
  }, []);

  const forecastFrom = metric.forecastFrom;

  const pivotData = useMemo(() => {
    if (viewMode !== 'pivot' || !pivotDimId) return null;
    return metric.toPivotRows(pivotDimId);
  }, [metric, viewMode, pivotDimId]);

  const pivotColumnDefs = useMemo<ColDef[]>(() => {
    if (!pivotData) return [];
    const yearCol: ColDef = {
      field: 'year',
      headerName: 'Year',
      pinned: 'left',
      width: 80,
      sortable: true,
    };
    const catCols: ColDef[] = pivotData.columns.map((cat: MetricCategory) => ({
      field: cat.id,
      headerName: cat.label,
      type: 'numericColumn',
      width: 120,
      valueFormatter: (params: { value: number | null }) =>
        params.value != null ? params.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '',
      cellClass: (params: CellClassParams) =>
        forecastFrom != null && params.data?.year >= forecastFrom ? FORECAST_CELL_CLASS : '',
    }));
    return [yearCol, ...catCols];
  }, [pivotData, forecastFrom]);

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
    return filteredMetric.toRows();
  }, [filteredMetric, viewMode]);

  const flatColumnDefs = useMemo<ColDef[]>(() => {
    if (viewMode !== 'flat') return [];
    const dimCols: ColDef[] = filteredMetric.dimensions.map((dim: MetricDimension) => {
      const catLabelMap = new Map(dim.categories.map((c) => [c.id, c.label]));
      return {
        field: dim.id,
        headerName: dim.label,
        width: 140,
        sortable: true,
        valueFormatter: (params: { value: string }) => catLabelMap.get(params.value) ?? params.value,
      };
    });
    const yearCol: ColDef = { field: 'year', headerName: 'Year', width: 80, sortable: true };
    const valCol: ColDef = {
      field: 'value',
      headerName: `Value (${metric.unit.short})`,
      type: 'numericColumn',
      width: 130,
      sortable: true,
      valueFormatter: (params: { value: number | null }) =>
        params.value != null ? params.value.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '',
      cellClass: (params: CellClassParams) =>
        forecastFrom != null && params.data?.year >= forecastFrom ? FORECAST_CELL_CLASS : '',
    };
    return [...dimCols, yearCol, valCol];
  }, [filteredMetric, viewMode, metric.unit.short, forecastFrom]);

  const gridHeight = compact ? 300 : 500;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        {!compact && (
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            {metric.name}
          </Typography>
        )}
        <Chip label={metric.unit.short} size="small" variant="outlined" />
        {metric.forecastFrom != null && (
          <Chip label={`Forecast from ${metric.forecastFrom}`} size="small" color="info" variant="outlined" />
        )}
        <Box sx={{ flex: 1 }} />
        {hasDimensions && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => { if (v) setViewMode(v); }}
            size="small"
          >
            <ToggleButton value="pivot">Pivot</ToggleButton>
            <ToggleButton value="flat">Flat</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      {viewMode === 'pivot' && metric.dimensions.length > 1 && (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="pivot-dim-label">Pivot dimension</InputLabel>
          <Select
            labelId="pivot-dim-label"
            label="Pivot dimension"
            value={pivotDimId}
            onChange={(e) => setPivotDimId(e.target.value)}
          >
            {metric.dimensions.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>
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
                  `${selected.length} of ${dim.categories.length}`
                }
              >
                {dim.categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}
        </Box>
      )}

      <Box
        className="ag-theme-alpine"
        sx={{
          height: gridHeight,
          width: '100%',
          [`& .${FORECAST_CELL_CLASS}`]: {
            backgroundColor: 'rgba(33, 150, 243, 0.06)',
          },
        }}
      >
        {viewMode === 'pivot' && pivotData && (
          <AgGridReact
            columnDefs={pivotColumnDefs}
            rowData={pivotData.rows}
            defaultColDef={{ resizable: true, suppressMovable: true }}
            suppressColumnVirtualisation={compact}
            domLayout={compact ? 'autoHeight' : undefined}
          />
        )}
        {viewMode === 'flat' && (
          <AgGridReact
            columnDefs={flatColumnDefs}
            rowData={flatRows}
            defaultColDef={{ resizable: true, suppressMovable: true }}
            domLayout={compact ? 'autoHeight' : undefined}
          />
        )}
      </Box>
    </Box>
  );
}
