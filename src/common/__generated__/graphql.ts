export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  JSONString: any;
  PositiveInt: any;
  UUID: any;
};

/** An enumeration. */
export enum DecisionLevel {
  Eu = 'EU',
  Municipality = 'MUNICIPALITY',
  Nation = 'NATION'
}

export type AllMetricFieldsFragment = (
  { name?: string | null, id?: string | null, unit?: (
    { htmlShort: string, htmlLong: string }
    & { __typename?: 'UnitType' }
  ) | null, historicalValues: Array<(
    { year: number, value: number }
    & { __typename?: 'YearlyValue' }
  )>, forecastValues: Array<(
    { value: number, year: number }
    & { __typename?: 'YearlyValue' }
  )>, baselineForecastValues?: Array<(
    { year: number, value: number }
    & { __typename?: 'YearlyValue' }
  )> | null }
  & { __typename?: 'ForecastMetricType' }
);

export type GetActionContentQueryVariables = Exact<{
  node: Scalars['ID'];
  goal?: InputMaybe<Scalars['ID']>;
}>;


export type GetActionContentQuery = (
  { action?: (
    { description?: string | null, decisionLevel?: DecisionLevel | null, id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, dimensionalFlow?: (
      { id: string, sources: Array<string>, unit: (
        { htmlLong: string }
        & { __typename?: 'UnitType' }
      ), nodes: Array<(
        { id: string, label: string, color?: string | null }
        & { __typename?: 'FlowNodeType' }
      )>, links: Array<(
        { year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }
        & { __typename?: 'FlowLinksType' }
      )> }
      & { __typename?: 'DimensionalFlowType' }
    ) | null, downstreamNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, group?: (
        { id: string, name: string, color?: string | null }
        & { __typename?: 'ActionGroupType' }
      ) | null, subactions: Array<(
        { id: string, name: string, description?: string | null, shortDescription?: string | null, isEnabled: boolean, parameters: Array<(
          { id?: string | null }
          & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
        )> }
        & { __typename?: 'ActionNode' }
      )>, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, impactMetric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null, metricDim?: (
        { stackable: boolean, dimensions: Array<(
          { id: string, categories: Array<(
            { id: string }
            & { __typename?: 'MetricDimensionCategoryType' }
          )> }
          & { __typename?: 'MetricDimensionType' }
        )> }
        & { __typename?: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue?: number | null, maxValue?: number | null, step?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null }
      & { __typename?: 'ActionNode' }
    ) | (
      { id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, impactMetric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null, metricDim?: (
        { stackable: boolean, dimensions: Array<(
          { id: string, categories: Array<(
            { id: string }
            & { __typename?: 'MetricDimensionCategoryType' }
          )> }
          & { __typename?: 'MetricDimensionType' }
        )> }
        & { __typename?: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue?: number | null, maxValue?: number | null, step?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort: string }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null }
      & { __typename?: 'Node' }
    )>, group?: (
      { id: string, name: string, color?: string | null }
      & { __typename?: 'ActionGroupType' }
    ) | null, subactions: Array<(
      { id: string, name: string, description?: string | null, shortDescription?: string | null, isEnabled: boolean, parameters: Array<(
        { id?: string | null }
        & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
      )> }
      & { __typename?: 'ActionNode' }
    )>, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, impactMetric?: (
      { name?: string | null, id?: string | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )> | null, yearlyCumulativeUnit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, metricDim?: (
      { stackable: boolean, dimensions: Array<(
        { id: string, categories: Array<(
          { id: string }
          & { __typename?: 'MetricDimensionCategoryType' }
        )> }
        & { __typename?: 'MetricDimensionType' }
      )> }
      & { __typename?: 'DimensionalMetricType' }
    ) | null, parameters: Array<(
      { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue?: number | null, maxValue?: number | null, step?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | (
      { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )>, metric?: (
      { name?: string | null, id?: string | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' }
  ) | null }
  & { __typename?: 'Query' }
);

type CausalGridNode_ActionNode_Fragment = (
  { id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, group?: (
    { id: string, name: string, color?: string | null }
    & { __typename?: 'ActionGroupType' }
  ) | null, subactions: Array<(
    { id: string, name: string, description?: string | null, shortDescription?: string | null, isEnabled: boolean, parameters: Array<(
      { id?: string | null }
      & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    )> }
    & { __typename?: 'ActionNode' }
  )>, unit?: (
    { htmlShort: string }
    & { __typename?: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, impactMetric?: (
    { name?: string | null, id?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> | null, yearlyCumulativeUnit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null }
    & { __typename?: 'ForecastMetricType' }
  ) | null, metricDim?: (
    { stackable: boolean, dimensions: Array<(
      { id: string, categories: Array<(
        { id: string }
        & { __typename?: 'MetricDimensionCategoryType' }
      )> }
      & { __typename?: 'MetricDimensionType' }
    )> }
    & { __typename?: 'DimensionalMetricType' }
  ) | null, parameters: Array<(
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue?: number | null, maxValue?: number | null, step?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )>, metric?: (
    { name?: string | null, id?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> | null }
    & { __typename?: 'ForecastMetricType' }
  ) | null }
  & { __typename?: 'ActionNode' }
);

type CausalGridNode_Node_Fragment = (
  { id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, unit?: (
    { htmlShort: string }
    & { __typename?: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, impactMetric?: (
    { name?: string | null, id?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> | null, yearlyCumulativeUnit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null }
    & { __typename?: 'ForecastMetricType' }
  ) | null, metricDim?: (
    { stackable: boolean, dimensions: Array<(
      { id: string, categories: Array<(
        { id: string }
        & { __typename?: 'MetricDimensionCategoryType' }
      )> }
      & { __typename?: 'MetricDimensionType' }
    )> }
    & { __typename?: 'DimensionalMetricType' }
  ) | null, parameters: Array<(
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue?: number | null, maxValue?: number | null, step?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )>, metric?: (
    { name?: string | null, id?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> | null }
    & { __typename?: 'ForecastMetricType' }
  ) | null }
  & { __typename?: 'Node' }
);

export type CausalGridNodeFragment = CausalGridNode_ActionNode_Fragment | CausalGridNode_Node_Fragment;

export type GetActionImpactsQueryVariables = Exact<{
  impact1: Scalars['ID'];
  impact2: Scalars['ID'];
}>;


export type GetActionImpactsQuery = (
  { energyNode?: (
    { metric?: (
      { id?: string | null, unit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' | 'Node' }
  ) | null, costNode?: (
    { metric?: (
      { id?: string | null, unit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' | 'Node' }
  ) | null, actions: Array<(
    { name: string, id: string, energy?: (
      { cumulativeForecastValue?: number | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, cost?: (
      { cumulativeForecastValue?: number | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' }
  )> }
  & { __typename?: 'Query' }
);

export type GetActionListQueryVariables = Exact<{
  goal?: InputMaybe<Scalars['ID']>;
}>;


export type GetActionListQuery = (
  { instance: (
    { id: string, actionGroups: Array<(
      { id: string, name: string, color?: string | null, actions: Array<(
        { id: string }
        & { __typename?: 'ActionNode' }
      )> }
      & { __typename?: 'ActionGroupType' }
    )> }
    & { __typename?: 'InstanceType' }
  ), actions: Array<(
    { id: string, name: string, shortDescription?: string | null, color?: string | null, decisionLevel?: DecisionLevel | null, quantity?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, parameters: Array<(
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue?: number | null, maxValue?: number | null, id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | (
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )>, inputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, impactMetric?: (
      { id?: string | null, name?: string | null, cumulativeForecastValue?: number | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      )> }
      & { __typename?: 'ForecastMetricType' }
    ) | null, group?: (
      { id: string, name: string, color?: string | null }
      & { __typename?: 'ActionGroupType' }
    ) | null }
    & { __typename?: 'ActionNode' }
  )>, actionEfficiencyPairs: Array<(
    { id: string, label: string, plotLimitEfficiency?: number | null, invertCost: boolean, invertImpact: boolean, efficiencyUnit: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ), costUnit: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ), impactUnit: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ), costNode: (
      { id: string, name: string, shortDescription?: string | null, unit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'Node' }
    ), impactNode: (
      { id: string, name: string, shortDescription?: string | null, unit?: (
        { short: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'Node' }
    ), actions: Array<(
      { efficiencyDivisor?: number | null, action: (
        { id: string, group?: (
          { id: string, name: string, color?: string | null }
          & { __typename?: 'ActionGroupType' }
        ) | null }
        & { __typename?: 'ActionNode' }
      ), costValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      ) | null>, impactValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      ) | null> }
      & { __typename?: 'ActionEfficiency' }
    )> }
    & { __typename?: 'ActionEfficiencyPairType' }
  )> }
  & { __typename?: 'Query' }
);

export type OutcomeNodeFieldsFragment = (
  { id: string, name: string, color?: string | null, order?: number | null, shortName?: string | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, metric?: (
    { id?: string | null, name?: string | null, unit?: (
      { short: string, htmlShort: string, htmlLong: string }
      & { __typename?: 'UnitType' }
    ) | null, forecastValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename?: 'YearlyValue' }
    )> }
    & { __typename?: 'ForecastMetricType' }
  ) | null, goals: Array<(
    { year: number, value: number }
    & { __typename?: 'NodeGoal' }
  )>, unit?: (
    { short: string, htmlShort: string, htmlLong: string }
    & { __typename?: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string, name: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename?: 'ActionNode' | 'Node' }
  )>, upstreamActions?: Array<(
    { id: string, name: string, shortName?: string | null, shortDescription?: string | null, parameters: Array<(
      { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    )>, group?: (
      { id: string, name: string, color?: string | null }
      & { __typename?: 'ActionGroupType' }
    ) | null }
    & { __typename?: 'ActionNode' }
  )> | null, metricDim?: (
    { id: string, name: string, stackable: boolean, forecastFrom?: number | null, years: Array<number>, values: Array<number | null>, dimensions: Array<(
      { id: string, label: string, originalId?: string | null, categories: Array<(
        { id: string, originalId?: string | null, label: string, color?: string | null, order?: number | null, group?: string | null }
        & { __typename?: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color?: string | null, order?: number | null }
        & { __typename?: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename?: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename?: 'MetricYearlyGoalType' }
      )> }
      & { __typename?: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string }
      & { __typename?: 'UnitType' }
    ), normalizedBy?: (
      { id: string, name: string }
      & { __typename?: 'Node' }
    ) | null }
    & { __typename?: 'DimensionalMetricType' }
  ) | null }
  & { __typename?: 'Node' }
);

export type GetPageQueryVariables = Exact<{
  path: Scalars['String'];
  goal?: InputMaybe<Scalars['ID']>;
}>;


export type GetPageQuery = (
  { activeScenario?: (
    { id?: string | null }
    & { __typename?: 'ScenarioType' }
  ) | null, page?: (
    { id?: string | null, title: string, actionListLeadTitle?: string | null, actionListLeadParagraph?: string | null }
    & { __typename: 'ActionListPage' }
  ) | (
    { id?: string | null, title: string }
    & { __typename: 'NodePage' | 'Page' }
  ) | (
    { leadTitle: string, leadParagraph: string, id?: string | null, title: string, outcomeNode: (
      { id: string, name: string, color?: string | null, order?: number | null, shortName?: string | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, upstreamNodes: Array<{ __typename?: 'ActionNode' } | (
        { id: string, name: string, color?: string | null, order?: number | null, shortName?: string | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, metric?: (
          { id?: string | null, name?: string | null, unit?: (
            { short: string, htmlShort: string, htmlLong: string }
            & { __typename?: 'UnitType' }
          ) | null, forecastValues: Array<(
            { year: number, value: number }
            & { __typename?: 'YearlyValue' }
          )>, baselineForecastValues?: Array<(
            { year: number, value: number }
            & { __typename?: 'YearlyValue' }
          )> | null, historicalValues: Array<(
            { year: number, value: number }
            & { __typename?: 'YearlyValue' }
          )> }
          & { __typename?: 'ForecastMetricType' }
        ) | null, goals: Array<(
          { year: number, value: number }
          & { __typename?: 'NodeGoal' }
        )>, unit?: (
          { short: string, htmlShort: string, htmlLong: string }
          & { __typename?: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string, name: string }
          & { __typename?: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename?: 'ActionNode' | 'Node' }
        )>, upstreamActions?: Array<(
          { id: string, name: string, shortName?: string | null, shortDescription?: string | null, parameters: Array<(
            { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
              { id: string }
              & { __typename?: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          ) | (
            { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
              { id: string }
              & { __typename?: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
          )>, group?: (
            { id: string, name: string, color?: string | null }
            & { __typename?: 'ActionGroupType' }
          ) | null }
          & { __typename?: 'ActionNode' }
        )> | null, metricDim?: (
          { id: string, name: string, stackable: boolean, forecastFrom?: number | null, years: Array<number>, values: Array<number | null>, dimensions: Array<(
            { id: string, label: string, originalId?: string | null, categories: Array<(
              { id: string, originalId?: string | null, label: string, color?: string | null, order?: number | null, group?: string | null }
              & { __typename?: 'MetricDimensionCategoryType' }
            )>, groups: Array<(
              { id: string, originalId: string, label: string, color?: string | null, order?: number | null }
              & { __typename?: 'MetricDimensionCategoryGroupType' }
            )> }
            & { __typename?: 'MetricDimensionType' }
          )>, goals: Array<(
            { categories: Array<string>, values: Array<(
              { year: number, value: number, isInterpolated: boolean }
              & { __typename?: 'MetricYearlyGoalType' }
            )> }
            & { __typename?: 'DimensionalMetricGoalEntry' }
          )>, unit: (
            { htmlShort: string, short: string }
            & { __typename?: 'UnitType' }
          ), normalizedBy?: (
            { id: string, name: string }
            & { __typename?: 'Node' }
          ) | null }
          & { __typename?: 'DimensionalMetricType' }
        ) | null }
        & { __typename?: 'Node' }
      )>, metric?: (
        { id?: string | null, name?: string | null, unit?: (
          { short: string, htmlShort: string, htmlLong: string }
          & { __typename?: 'UnitType' }
        ) | null, forecastValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename?: 'YearlyValue' }
        )> }
        & { __typename?: 'ForecastMetricType' }
      ) | null, goals: Array<(
        { year: number, value: number }
        & { __typename?: 'NodeGoal' }
      )>, unit?: (
        { short: string, htmlShort: string, htmlLong: string }
        & { __typename?: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string, name: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename?: 'ActionNode' | 'Node' }
      )>, upstreamActions?: Array<(
        { id: string, name: string, shortName?: string | null, shortDescription?: string | null, parameters: Array<(
          { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
            { id: string }
            & { __typename?: 'ActionNode' | 'Node' }
          ) | null }
          & { __typename: 'BoolParameterType' }
        ) | (
          { id?: string | null, nodeRelativeId?: string | null, isCustomized: boolean, node?: (
            { id: string }
            & { __typename?: 'ActionNode' | 'Node' }
          ) | null }
          & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
        )>, group?: (
          { id: string, name: string, color?: string | null }
          & { __typename?: 'ActionGroupType' }
        ) | null }
        & { __typename?: 'ActionNode' }
      )> | null, metricDim?: (
        { id: string, name: string, stackable: boolean, forecastFrom?: number | null, years: Array<number>, values: Array<number | null>, dimensions: Array<(
          { id: string, label: string, originalId?: string | null, categories: Array<(
            { id: string, originalId?: string | null, label: string, color?: string | null, order?: number | null, group?: string | null }
            & { __typename?: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color?: string | null, order?: number | null }
            & { __typename?: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename?: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename?: 'MetricYearlyGoalType' }
          )> }
          & { __typename?: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string }
          & { __typename?: 'UnitType' }
        ), normalizedBy?: (
          { id: string, name: string }
          & { __typename?: 'Node' }
        ) | null }
        & { __typename?: 'DimensionalMetricType' }
      ) | null }
      & { __typename?: 'Node' }
    ) }
    & { __typename: 'OutcomePage' }
  ) | null }
  & { __typename?: 'Query' }
);

export type GetParametersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetParametersQuery = (
  { availableNormalizations: Array<(
    { id: string, label: string, isActive: boolean }
    & { __typename?: 'NormalizationType' }
  )>, parameters: Array<(
    { id?: string | null, label?: string | null, description?: string | null, isCustomized: boolean, isCustomizable: boolean, boolDefault?: boolean | null, boolValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue?: number | null, maxValue?: number | null, id?: string | null, label?: string | null, description?: string | null, isCustomized: boolean, isCustomizable: boolean, numberDefault?: number | null, numberValue?: number | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id?: string | null, label?: string | null, description?: string | null, isCustomized: boolean, isCustomizable: boolean, stringDefault?: string | null, stringValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id?: string | null, label?: string | null, description?: string | null, isCustomized: boolean, isCustomizable: boolean }
    & { __typename: 'UnknownParameterType' }
  )> }
  & { __typename?: 'Query' }
);

export type GetScenariosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetScenariosQuery = (
  { scenarios: Array<(
    { id?: string | null, name?: string | null, isActive?: boolean | null, isDefault?: boolean | null }
    & { __typename?: 'ScenarioType' }
  )> }
  & { __typename?: 'Query' }
);

export type ScenarioFragmentFragment = (
  { id?: string | null, isActive?: boolean | null, isDefault?: boolean | null, name?: string | null }
  & { __typename?: 'ScenarioType' }
);

export type GetInstanceContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInstanceContextQuery = (
  { instance: (
    { id: string, name: string, themeIdentifier?: string | null, owner?: string | null, defaultLanguage: string, supportedLanguages: Array<string>, targetYear?: number | null, modelEndYear: number, referenceYear?: number | null, minimumHistoricalYear: number, maximumHistoricalYear?: number | null, leadTitle?: string | null, leadParagraph?: string | null, features: (
      { baselineVisibleInGraphs: boolean, showAccumulatedEffects: boolean, showSignificantDigits: number }
      & { __typename?: 'InstanceFeaturesType' }
    ), goals: Array<(
      { id: string, label?: string | null, default: boolean, outcomeNode: (
        { id: string }
        & { __typename?: 'Node' }
      ), dimensions: Array<(
        { dimension: string, categories: Array<string>, groups: Array<string> }
        & { __typename?: 'InstanceGoalDimension' }
      )> }
      & { __typename?: 'InstanceGoalEntry' }
    )> }
    & { __typename?: 'InstanceType' }
  ), scenarios: Array<(
    { id?: string | null, isActive?: boolean | null, isDefault?: boolean | null, name?: string | null }
    & { __typename?: 'ScenarioType' }
  )>, availableNormalizations: Array<(
    { id: string, label: string, isActive: boolean }
    & { __typename?: 'NormalizationType' }
  )>, menuPages: Array<(
    { id?: string | null, title: string, urlPath: string, parent?: (
      { id?: string | null }
      & { __typename?: 'ActionListPage' | 'NodePage' | 'OutcomePage' | 'Page' }
    ) | null }
    & { __typename?: 'ActionListPage' | 'NodePage' | 'OutcomePage' | 'Page' }
  )>, parameters: Array<(
    { label?: string | null, description?: string | null, id?: string | null, isCustomizable: boolean, isCustomized: boolean, boolDefault?: boolean | null, boolValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { label?: string | null, description?: string | null, minValue?: number | null, maxValue?: number | null, id?: string | null, isCustomizable: boolean, isCustomized: boolean, numberDefault?: number | null, numberValue?: number | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { label?: string | null, description?: string | null, id?: string | null, isCustomizable: boolean, isCustomized: boolean, stringDefault?: string | null, stringValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id?: string | null, isCustomizable: boolean, isCustomized: boolean }
    & { __typename: 'UnknownParameterType' }
  )> }
  & { __typename?: 'Query' }
);

export type SetGlobalParameterFromActionSummaryMutationVariables = Exact<{
  parameterId: Scalars['ID'];
  boolValue?: InputMaybe<Scalars['Boolean']>;
  numberValue?: InputMaybe<Scalars['Float']>;
  stringValue?: InputMaybe<Scalars['String']>;
}>;


export type SetGlobalParameterFromActionSummaryMutation = (
  { setParameter?: (
    { ok?: boolean | null, parameter?: (
      { isCustomized: boolean, isCustomizable: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null }
      & { __typename?: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean, isCustomizable: boolean }
      & { __typename?: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename?: 'SetParameterMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type DimensionalNodeMetricFragment = (
  { metricDim?: (
    { id: string, name: string, stackable: boolean, forecastFrom?: number | null, years: Array<number>, values: Array<number | null>, dimensions: Array<(
      { id: string, label: string, originalId?: string | null, categories: Array<(
        { id: string, originalId?: string | null, label: string, color?: string | null, order?: number | null, group?: string | null }
        & { __typename?: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color?: string | null, order?: number | null }
        & { __typename?: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename?: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename?: 'MetricYearlyGoalType' }
      )> }
      & { __typename?: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string }
      & { __typename?: 'UnitType' }
    ), normalizedBy?: (
      { id: string, name: string }
      & { __typename?: 'Node' }
    ) | null }
    & { __typename?: 'DimensionalMetricType' }
  ) | null }
  & { __typename?: 'ActionNode' | 'Node' }
);

export type SetGlobalParameterMutationVariables = Exact<{
  parameterId: Scalars['ID'];
  boolValue?: InputMaybe<Scalars['Boolean']>;
  numberValue?: InputMaybe<Scalars['Float']>;
  stringValue?: InputMaybe<Scalars['String']>;
}>;


export type SetGlobalParameterMutation = (
  { setParameter?: (
    { ok?: boolean | null, parameter?: (
      { isCustomized: boolean, isCustomizable: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null }
      & { __typename?: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean, isCustomizable: boolean }
      & { __typename?: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename?: 'SetParameterMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type SetNormalizationMutationVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
}>;


export type SetNormalizationMutation = (
  { setNormalizer?: (
    { ok: boolean }
    & { __typename?: 'SetNormalizerMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type GetInstanceGoalOutcomeQueryVariables = Exact<{
  goal: Scalars['ID'];
}>;


export type GetInstanceGoalOutcomeQuery = (
  { instance: (
    { id: string, goals: Array<(
      { values: Array<(
        { year: number, goal?: number | null, actual?: number | null, isForecast: boolean, isInterpolated?: boolean | null }
        & { __typename?: 'InstanceYearlyGoalType' }
      )>, unit: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) }
      & { __typename?: 'InstanceGoalEntry' }
    )> }
    & { __typename?: 'InstanceType' }
  ) }
  & { __typename?: 'Query' }
);

export type SetNormalizationFromWidgetMutationVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
}>;


export type SetNormalizationFromWidgetMutation = (
  { setNormalizer?: (
    { ok: boolean }
    & { __typename?: 'SetNormalizerMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type SetParameterMutationVariables = Exact<{
  parameterId: Scalars['ID'];
  boolValue?: InputMaybe<Scalars['Boolean']>;
  numberValue?: InputMaybe<Scalars['Float']>;
  stringValue?: InputMaybe<Scalars['String']>;
}>;


export type SetParameterMutation = (
  { setParameter?: (
    { ok?: boolean | null, parameter?: (
      { isCustomized: boolean, boolValue?: boolean | null, boolDefaultValue?: boolean | null }
      & { __typename?: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean }
      & { __typename?: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename?: 'SetParameterMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type ActivateScenarioMutationVariables = Exact<{
  scenarioId: Scalars['ID'];
}>;


export type ActivateScenarioMutation = (
  { activateScenario?: (
    { ok?: boolean | null, activeScenario?: (
      { id?: string | null, name?: string | null }
      & { __typename?: 'ScenarioType' }
    ) | null }
    & { __typename?: 'ActivateScenarioMutation' }
  ) | null }
  & { __typename?: 'Mutations' }
);

export type SubActionCardFragment = (
  { id: string, name: string, description?: string | null, shortDescription?: string | null, isEnabled: boolean, parameters: Array<(
    { id?: string | null }
    & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
  )> }
  & { __typename?: 'ActionNode' }
);

export type DimensionalPlotFragment = (
  { id: string, sources: Array<string>, unit: (
    { htmlLong: string }
    & { __typename?: 'UnitType' }
  ), nodes: Array<(
    { id: string, label: string, color?: string | null }
    & { __typename?: 'FlowNodeType' }
  )>, links: Array<(
    { year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }
    & { __typename?: 'FlowLinksType' }
  )> }
  & { __typename?: 'DimensionalFlowType' }
);

export type GetCytoscapeNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCytoscapeNodesQuery = (
  { nodes: Array<(
    { id: string, name: string, color?: string | null, quantity?: string | null, parentAction?: (
      { id: string }
      & { __typename?: 'ActionNode' }
    ) | null, subactions: Array<(
      { id: string }
      & { __typename?: 'ActionNode' }
    )>, group?: (
      { id: string, color?: string | null }
      & { __typename?: 'ActionGroupType' }
    ) | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, metric?: (
      { historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )> }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' }
  ) | (
    { id: string, name: string, color?: string | null, quantity?: string | null, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, metric?: (
      { historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )> }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'Node' }
  )> }
  & { __typename?: 'Query' }
);

export type GetNodePageQueryVariables = Exact<{
  node: Scalars['ID'];
}>;


export type GetNodePageQuery = (
  { node?: (
    { id: string, name: string, shortDescription?: string | null, description?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, isAction: boolean, unit?: (
      { htmlShort: string }
      & { __typename?: 'UnitType' }
    ) | null, metric?: (
      { name?: string | null, id?: string | null, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year: number, value: number }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, inputNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, quantity?: string | null, isAction: boolean, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, quantity?: string | null, isAction: boolean, unit?: (
        { htmlShort: string }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ActionNode' | 'Node' }
    )>, metricDim?: (
      { id: string, name: string, stackable: boolean, forecastFrom?: number | null, years: Array<number>, values: Array<number | null>, dimensions: Array<(
        { id: string, label: string, originalId?: string | null, categories: Array<(
          { id: string, originalId?: string | null, label: string, color?: string | null, order?: number | null, group?: string | null }
          & { __typename?: 'MetricDimensionCategoryType' }
        )>, groups: Array<(
          { id: string, originalId: string, label: string, color?: string | null, order?: number | null }
          & { __typename?: 'MetricDimensionCategoryGroupType' }
        )> }
        & { __typename?: 'MetricDimensionType' }
      )>, goals: Array<(
        { categories: Array<string>, values: Array<(
          { year: number, value: number, isInterpolated: boolean }
          & { __typename?: 'MetricYearlyGoalType' }
        )> }
        & { __typename?: 'DimensionalMetricGoalEntry' }
      )>, unit: (
        { htmlShort: string, short: string }
        & { __typename?: 'UnitType' }
      ), normalizedBy?: (
        { id: string, name: string }
        & { __typename?: 'Node' }
      ) | null }
      & { __typename?: 'DimensionalMetricType' }
    ) | null }
    & { __typename?: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename?: 'Query' }
);

export type GetAvailableInstancesQueryVariables = Exact<{
  hostname: Scalars['String'];
}>;


export type GetAvailableInstancesQuery = (
  { availableInstances: Array<(
    { identifier: string, isProtected: boolean, defaultLanguage: string, themeIdentifier: string, supportedLanguages: Array<string>, hostname: (
      { basePath?: string | null }
      & { __typename?: 'InstanceHostname' }
    ) }
    & { __typename?: 'InstanceBasicConfiguration' }
  )> }
  & { __typename?: 'Query' }
);

export type AvailableInstanceFragment = (
  { identifier: string, isProtected: boolean, defaultLanguage: string, themeIdentifier: string, supportedLanguages: Array<string>, hostname: (
    { basePath?: string | null }
    & { __typename?: 'InstanceHostname' }
  ) }
  & { __typename?: 'InstanceBasicConfiguration' }
);
