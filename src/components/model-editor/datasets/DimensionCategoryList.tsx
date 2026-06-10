import { Box, Chip, Divider, Stack, Typography } from '@mui/material';

import { useTranslations } from 'next-intl';

import type { DatasetDetailFieldsFragment } from '@/common/__generated__/graphql';

export const NOT_APPLICABLE = 'NOT_APPLICABLE';
export type NotApplicable = typeof NOT_APPLICABLE;

type Metric = DatasetDetailFieldsFragment['metrics'][number];
type Dimension = DatasetDetailFieldsFragment['dimensions'][number];
type DimensionCategory = Dimension['categories'][number];

// Metric ids and dimension category uuids live in different fields on the
// GraphQL types — this normalizes both into one identifier.
export function identifierOf(item: Metric | DimensionCategory): string {
  return 'uuid' in item ? item.uuid : item.id;
}

type BaseProps = {
  onSelect: (category: Metric | DimensionCategory | NotApplicable) => void;
  selectedCategories: string[];
  withNotApplicable?: boolean;
};

type DimensionProps = BaseProps & {
  dimension: Dimension;
  metrics?: never;
};

type MetricProps = BaseProps & {
  metrics: Metric[];
  dimension?: never;
};

type Props = DimensionProps | MetricProps;

const HORIZONTAL_CHIP_SPACING = 5;

// Column-local scroll: header (title + N/A + divider) stays fixed, the chip
// list grows to fill the remaining capped column height and scrolls within it.
// `flex-shrink: 0` on each chip prevents Stack's flex children from being
// compressed below their natural height before overflow scroll kicks in.
const CHIP_CONTAINER_SX = {
  pr: HORIZONTAL_CHIP_SPACING,
  pb: 1,
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  alignItems: 'flex-start',
  '& > *': { flexShrink: 0 },
};

export function DimensionCategoryList({
  metrics,
  dimension,
  onSelect,
  selectedCategories,
  withNotApplicable = false,
}: Props) {
  const t = useTranslations('model-editor');
  const isMetric = metrics !== undefined;
  const name = isMetric ? t('datasets-metric') : dimension.name;
  const items: Array<Metric | DimensionCategory> = isMetric ? metrics : dimension.categories;
  const isNASelected = selectedCategories.includes(NOT_APPLICABLE);

  // Selected chips bubble to the top; unselected ones keep their source order.
  // Stable sort means a chip returns to its original spot among unselected
  // peers when it's deselected.
  const selectedSet = new Set(selectedCategories);
  const sortedItems = [...items].sort((a, b) => {
    const aSel = selectedSet.has(identifierOf(a)) ? 0 : 1;
    const bSel = selectedSet.has(identifierOf(b)) ? 0 : 1;
    return aSel - bSel;
  });

  return (
    <Stack
      direction="column"
      spacing={1}
      sx={{ '&:last-of-type': { flex: '1' }, minHeight: 0, height: '100%' }}
    >
      <Typography
        component="h5"
        fontWeight="fontWeightBold"
        variant="body1"
        color="text.primary"
        sx={{ pr: 2, whiteSpace: 'nowrap' }}
      >
        {name}{' '}
        <Typography
          component="span"
          fontWeight="fontWeightNormal"
          sx={{
            display: 'inline-block',
            // Stable width so the count flipping between digits doesn't shift layout.
            minWidth: '40px',
            fontSize: isNASelected ? 'body2.fontSize' : 'inherit',
          }}
        >
          ({isNASelected ? 'N/A' : selectedCategories.length})
        </Typography>
      </Typography>

      {/* Hidden placeholder so column heights line up across metric and dim columns. */}
      <Box
        sx={{
          visibility: 'hidden',
          display: withNotApplicable ? 'none' : 'block',
        }}
      >
        <Chip aria-hidden="true" disabled label={t('datasets-not-applicable')} />
      </Box>

      {withNotApplicable && (
        <Box sx={{ pr: HORIZONTAL_CHIP_SPACING }}>
          <Chip
            label={t('datasets-not-applicable')}
            onClick={() => onSelect(NOT_APPLICABLE)}
            color={isNASelected ? 'warning' : 'default'}
          />
        </Box>
      )}

      <Divider />

      <Stack direction="column" spacing={1} sx={CHIP_CONTAINER_SX}>
        {sortedItems.map((item) => {
          const id = identifierOf(item);
          return (
            <Chip
              key={id}
              label={item.label}
              onClick={() => onSelect(item)}
              color={selectedSet.has(id) ? 'primary' : 'default'}
              variant="filled"
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
