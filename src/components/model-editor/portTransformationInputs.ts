import type {
  DatasetTransformationInput,
  EdgeTransformationInput,
  EditorPortTransformationFragment,
} from '@/common/__generated__/graphql';

export function toDatasetTransformationInputs(
  transformations: readonly EditorPortTransformationFragment[]
): DatasetTransformationInput[] {
  return transformations.map((transformation): DatasetTransformationInput => {
    switch (transformation.__typename) {
      case 'FilterDimensionType':
        return {
          filterDimension: {
            dimension: transformation.dimension,
            groups: transformation.groups,
            categories: transformation.categories,
            exclude: transformation.exclude,
            flatten: transformation.flatten,
          },
        };
      case 'AssignDimensionType':
        return {
          assignDimension: {
            dimension: transformation.dimension,
            category: transformation.category,
          },
        };
      case 'DropNullsType':
        return { dropNulls: true };
      case 'FilterTemporalType':
        return {
          filterTemporal: {
            minYear: transformation.minYear,
            maxYear: transformation.maxYear,
          },
        };
      case 'FilterColumnType':
        return {
          filterColumn: {
            column: transformation.column,
            value: transformation.value,
            values: transformation.values,
            ref: transformation.ref,
            dropCol: transformation.dropCol,
            exclude: transformation.exclude,
            flatten: transformation.flatten,
          },
        };
      case 'RenameColumnType':
        return {
          renameColumn: {
            column: transformation.column,
            newName: transformation.newName,
          },
        };
      case 'RenameItemType':
        return {
          renameItem: {
            column: transformation.column,
            oldItem: transformation.oldItem,
            newItem: transformation.newItem,
          },
        };
      case 'SetForecastFromType':
        return { setForecastFrom: { year: transformation.year } };
      case 'EnsureUnitType':
        return { ensureUnit: { unit: transformation.unit.short } };
      case 'SelectMetricType':
        return { selectMetric: true };
      case 'IndexTemporalType':
        return { indexTemporal: true };
      case 'RemapLegacyYearsType':
        return { remapLegacyYears: true };
      case 'TagOperationType':
        return { tagOperation: { tag: transformation.tag } };
      default:
        throw new Error(`Dataset transformation "${transformation.kind}" cannot be written`);
    }
  });
}

export function toEdgeTransformationInputs(
  transformations: readonly EditorPortTransformationFragment[]
): EdgeTransformationInput[] {
  return transformations.map((transformation): EdgeTransformationInput => {
    switch (transformation.__typename) {
      case 'FilterDimensionType':
        return {
          filterDimension: {
            dimension: transformation.dimension,
            groups: transformation.groups,
            categories: transformation.categories,
            exclude: transformation.exclude,
            flatten: transformation.flatten,
          },
        };
      case 'AssignDimensionType':
        return {
          assignDimension: {
            dimension: transformation.dimension,
            category: transformation.category,
          },
        };
      case 'SelectCategoriesType':
        return {
          selectCategories: {
            dimension: transformation.dimension,
            categories: transformation.categories,
            exclude: transformation.exclude,
            flatten: transformation.flatten,
          },
        };
      case 'AssignCategoryType':
        return {
          assignCategory: {
            dimension: transformation.dimension,
            category: transformation.category,
          },
        };
      case 'FlattenType':
        return { flatten: { dimension: transformation.dimension } };
      default:
        throw new Error(`Edge transformation "${transformation.kind}" cannot be written`);
    }
  });
}
