import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useTranslation } from '@/common/i18n';
import { useFeatures } from '@/common/instance';
import { formatNumber } from '@/common/preprocess';

type DataTableProps = {
  node: OutcomeNodeFieldsFragment;
  subNodes: OutcomeNodeFieldsFragment[];
  startYear: number;
  endYear: number;
};

const DataTable = (props: DataTableProps) => {
  const { node, subNodes, startYear, endYear } = props;
  const { t, i18n } = useTranslation();

  const metric = node.metric!;

  const totalHistoricalValues = metric.historicalValues.filter(
    (value) => value.year >= startYear && value.year <= endYear
  );
  const totalForecastValues = metric.forecastValues.filter(
    (value) => value.year >= startYear && value.year <= endYear
  );
  const maximumFractionDigits = useFeatures().maximumFractionDigits ?? undefined;

  const hasTotalValues =
    totalHistoricalValues.some((val) => val.value !== null) ||
    totalForecastValues.some((val) => val.value !== null);

  const titleId = `${node.id}-datatable-title`;  

  return (
    <TableContainer 
      component={Paper}
      role="region"
      aria-labelledby={titleId}
      tabIndex={0}
    >
      <Typography id={titleId} variant="h5" component="h3" sx={{ px: 2, pt: 2 }}>
        {node.name} ({startYear} - {endYear})
      </Typography>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>{t('table-year')}</TableCell>
            <TableCell>{t('table-measure-type')}</TableCell>
            {subNodes?.map((subNode) => (
              <TableCell key={subNode.id}>{subNode.name}</TableCell>
            ))}
            {hasTotalValues && <TableCell>{metric.name}</TableCell>}
            <TableCell>{t('table-unit')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {totalHistoricalValues.map((metric) => (
            <TableRow key={`h-${metric.year}`}>
              <TableCell>{metric.year}</TableCell>
              <TableCell>{t('table-historical')}</TableCell>
              {subNodes?.map((subNode) => (
                <TableCell key={`${subNode.id}-${metric.year}`}>
                  {subNode?.metric?.historicalValues.find((value) => value.year === metric.year)
                    ? formatNumber(
                        subNode?.metric?.historicalValues.find(
                          (value) => value.year === metric.year
                        )?.value ?? 0,
                        i18n.language,
                        maximumFractionDigits
                      )
                    : '-'}
                </TableCell>
              ))}
              {hasTotalValues && (
                <TableCell>
                  {formatNumber(metric.value, i18n.language, maximumFractionDigits)}
                </TableCell>
              )}
              <TableCell
                dangerouslySetInnerHTML={{
                  __html: node?.metricDim?.unit?.htmlShort ?? '',
                }}
              />
            </TableRow>
          ))}
          {totalForecastValues.map((metric) => (
            <TableRow key={`f-${metric.year}`}>
              <TableCell>{metric.year}</TableCell>
              <TableCell>{t('table-scenario-forecast')}</TableCell>
              {subNodes?.map((subNode) => (
                <TableCell key={`${subNode.id}-${metric.year}`}>
                  {subNode?.metric?.forecastValues.find((value) => value.year === metric.year)
                    ? formatNumber(
                        subNode?.metric?.forecastValues.find((value) => value.year === metric.year)
                          ?.value ?? 0,
                        i18n.language,
                        maximumFractionDigits
                      )
                    : '-'}
                </TableCell>
              ))}
              {hasTotalValues && (
                <TableCell>
                  {formatNumber(metric.value, i18n.language, maximumFractionDigits)}
                </TableCell>
              )}
              <TableCell
                dangerouslySetInnerHTML={{
                  __html: node?.metricDim?.unit?.htmlShort ?? '',
                }}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DataTable;
