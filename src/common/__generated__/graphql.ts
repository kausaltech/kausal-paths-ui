export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: string; output: string; }
  JSONString: { input: string; output: string; }
  PointScalar: { input: any; output: any; }
  PositiveInt: { input: number; output: number; }
  RichText: { input: string; output: string; }
  UUID: { input: string; output: string; }
  _Any: { input: any; output: any; }
};

/** An enumeration. */
export enum ActionSortOrder {
  /** Cumulative impact */
  CumImpact = 'CUM_IMPACT',
  /** Impact */
  Impact = 'IMPACT',
  /** Standard */
  Standard = 'STANDARD'
}

export type CreateOrganizationMutationInput = {
  /** A simplified short version of name for the general public */
  abbreviation: InputMaybe<Scalars['String']['input']>;
  classification: InputMaybe<Scalars['ID']['input']>;
  clientMutationId: InputMaybe<Scalars['String']['input']>;
  /** A date of dissolution */
  dissolutionDate: InputMaybe<Scalars['Date']['input']>;
  /** A date of founding */
  foundingDate: InputMaybe<Scalars['Date']['input']>;
  /** A primary name, e.g. a legally recognized name */
  name: Scalars['String']['input'];
  parent: InputMaybe<Scalars['ID']['input']>;
};

/** An enumeration. */
export enum DecisionLevel {
  Eu = 'EU',
  Municipality = 'MUNICIPALITY',
  Nation = 'NATION'
}

/** Desired (benificial) direction for the values of the output of a node */
export enum DesiredOutcome {
  Decreasing = 'decreasing',
  Increasing = 'increasing'
}

export enum DimensionKind {
  Common = 'COMMON',
  Node = 'NODE',
  Scenario = 'SCENARIO'
}

export type FrameworkConfigInput = {
  baselineYear: Scalars['Int']['input'];
  frameworkId: Scalars['ID']['input'];
  /** Identifier for the model instance. Needs to be unique. */
  instanceIdentifier: Scalars['ID']['input'];
  /** Name for the framework configuration instance. Typically the name of the organization. */
  name: Scalars['String']['input'];
  /** Name of the organization. If not set, it will be determined through the user's credentials, if possible. */
  organizationName: InputMaybe<Scalars['String']['input']>;
  /** Target year for model. */
  targetYear: InputMaybe<Scalars['Int']['input']>;
  /** UUID for the new framework config. If not set, will be generated automatically. */
  uuid: InputMaybe<Scalars['UUID']['input']>;
};

/** An enumeration. */
export enum FrameworksMeasureTemplatePriorityChoices {
  /** High */
  High = 'HIGH',
  /** Low */
  Low = 'LOW',
  /** Medium */
  Medium = 'MEDIUM'
}

export type InstanceContext = {
  hostname: InputMaybe<Scalars['String']['input']>;
  identifier: InputMaybe<Scalars['ID']['input']>;
  locale: InputMaybe<Scalars['String']['input']>;
};

export enum LowHigh {
  High = 'HIGH',
  Low = 'LOW'
}

export type MeasureDataPointInput = {
  /** Value for the data point (set to null to remove) */
  value: InputMaybe<Scalars['Float']['input']>;
  /** Year of the data point. If not given, defaults to the baseline year for the framework instance. */
  year: InputMaybe<Scalars['Int']['input']>;
};

export type MeasureInput = {
  dataPoints: InputMaybe<Array<MeasureDataPointInput>>;
  /** Internal notes for the measure instance */
  internalNotes: InputMaybe<Scalars['String']['input']>;
  /** ID (or UUID) of the measure template within a framework */
  measureTemplateId: Scalars['ID']['input'];
};

/** An enumeration. */
export enum ModelAction {
  Add = 'ADD',
  Change = 'CHANGE',
  Delete = 'DELETE',
  View = 'VIEW'
}

export type NzcCityEssentialData = {
  /** Population of the city */
  population: Scalars['Int']['input'];
  /** Share of renewables in energy production (low or high) */
  renewableMix: LowHigh;
  /** Average yearly temperature (low or high) */
  temperature: LowHigh;
};

/** An enumeration. */
export enum ScenarioKind {
  Baseline = 'BASELINE',
  Custom = 'CUSTOM',
  Default = 'DEFAULT',
  ProgressTracking = 'PROGRESS_TRACKING'
}

/** Enum for search operator. */
export enum SearchOperatorEnum {
  And = 'AND',
  Or = 'OR'
}

export type UpdateOrganizationMutationInput = {
  /** A simplified short version of name for the general public */
  abbreviation: InputMaybe<Scalars['String']['input']>;
  classification: InputMaybe<Scalars['ID']['input']>;
  clientMutationId: InputMaybe<Scalars['String']['input']>;
  /** A date of dissolution */
  dissolutionDate: InputMaybe<Scalars['Date']['input']>;
  /** A date of founding */
  foundingDate: InputMaybe<Scalars['Date']['input']>;
  id: InputMaybe<Scalars['ID']['input']>;
  /** A primary name, e.g. a legally recognized name */
  name: Scalars['String']['input'];
  parent: InputMaybe<Scalars['ID']['input']>;
};

export enum VisualizationKind {
  Group = 'group',
  Node = 'node'
}

export type AllMetricFieldsFragment = (
  { name: string | null, id: string | null, unit: (
    { htmlShort: string, htmlLong: string }
    & { __typename: 'UnitType' }
  ) | null, historicalValues: Array<(
    { year: number, value: number }
    & { __typename: 'YearlyValue' }
  )>, forecastValues: Array<(
    { value: number, year: number }
    & { __typename: 'YearlyValue' }
  )>, baselineForecastValues: Array<(
    { year: number, value: number }
    & { __typename: 'YearlyValue' }
  )> | null }
  & { __typename: 'ForecastMetricType' }
);

type StreamFieldFragment_ZdQ8UWlP6f5e6Md3cdGwbo2c4Hrqm4yhimg5aq7Pma_Fragment = (
  { id: string | null, blockType: string, field: string }
  & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
);

type StreamFieldFragment_KCyuF1ERfSDjEhFkBiZv2Jg0yNyFm47M1qS2aebiI_Fragment = (
  { id: string | null, blockType: string, field: string }
  & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
);

type StreamFieldFragment_CardListBlock_Fragment = (
  { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
    { title: string | null, shortDescription: string | null }
    & { __typename: 'CardListCardBlock' }
  ) | null> | null }
  & { __typename: 'CardListBlock' }
);

type StreamFieldFragment_RichTextBlock_Fragment = (
  { value: string, rawValue: string, id: string | null, blockType: string, field: string }
  & { __typename: 'RichTextBlock' }
);

type StreamFieldFragment_TextBlock_Fragment = (
  { value: string, id: string | null, blockType: string, field: string }
  & { __typename: 'TextBlock' }
);

export type StreamFieldFragmentFragment = StreamFieldFragment_ZdQ8UWlP6f5e6Md3cdGwbo2c4Hrqm4yhimg5aq7Pma_Fragment | StreamFieldFragment_KCyuF1ERfSDjEhFkBiZv2Jg0yNyFm47M1qS2aebiI_Fragment | StreamFieldFragment_CardListBlock_Fragment | StreamFieldFragment_RichTextBlock_Fragment | StreamFieldFragment_TextBlock_Fragment;

type ActionParameter_BoolParameterType_Fragment = (
  { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'BoolParameterType' }
);

type ActionParameter_NumberParameterType_Fragment = (
  { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
    { htmlShort: string }
    & { __typename: 'UnitType' }
  ) | null, node: (
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'NumberParameterType' }
);

type ActionParameter_StringParameterType_Fragment = (
  { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'StringParameterType' }
);

type ActionParameter_UnknownParameterType_Fragment = (
  { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'UnknownParameterType' }
);

export type ActionParameterFragment = ActionParameter_BoolParameterType_Fragment | ActionParameter_NumberParameterType_Fragment | ActionParameter_StringParameterType_Fragment | ActionParameter_UnknownParameterType_Fragment;

export type SetGlobalParameterFromActionSummaryMutationVariables = Exact<{
  parameterId: Scalars['ID']['input'];
  boolValue: InputMaybe<Scalars['Boolean']['input']>;
  numberValue: InputMaybe<Scalars['Float']['input']>;
  stringValue: InputMaybe<Scalars['String']['input']>;
}>;


export type SetGlobalParameterFromActionSummaryMutation = (
  { setParameter: (
    { ok: boolean | null, parameter: (
      { isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean, isCustomizable: boolean }
      & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename: 'SetParameterMutation' }
  ) | null }
  & { __typename: 'Mutation' }
);

export type SetNormalizationFromWidgetMutationVariables = Exact<{
  id: InputMaybe<Scalars['ID']['input']>;
}>;


export type SetNormalizationFromWidgetMutation = (
  { setNormalizer: (
    { ok: boolean }
    & { __typename: 'SetNormalizerMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type SetGlobalParameterMutationVariables = Exact<{
  parameterId: Scalars['ID']['input'];
  boolValue: InputMaybe<Scalars['Boolean']['input']>;
  numberValue: InputMaybe<Scalars['Float']['input']>;
  stringValue: InputMaybe<Scalars['String']['input']>;
}>;


export type SetGlobalParameterMutation = (
  { setParameter: (
    { ok: boolean | null, parameter: (
      { isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean, isCustomizable: boolean }
      & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename: 'SetParameterMutation' }
  ) | null }
  & { __typename: 'Mutation' }
);

export type SetNormalizationMutationVariables = Exact<{
  id: InputMaybe<Scalars['ID']['input']>;
}>;


export type SetNormalizationMutation = (
  { setNormalizer: (
    { ok: boolean }
    & { __typename: 'SetNormalizerMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type GetInstanceGoalOutcomeQueryVariables = Exact<{
  goal: Scalars['ID']['input'];
}>;


export type GetInstanceGoalOutcomeQuery = (
  { instance: (
    { id: string, goals: Array<(
      { values: Array<(
        { year: number, goal: number | null, actual: number | null, isForecast: boolean, isInterpolated: boolean | null }
        & { __typename: 'InstanceYearlyGoalType' }
      )>, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) }
      & { __typename: 'InstanceGoalEntry' }
    )> }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type SetParameterMutationVariables = Exact<{
  parameterId: Scalars['ID']['input'];
  boolValue: InputMaybe<Scalars['Boolean']['input']>;
  numberValue: InputMaybe<Scalars['Float']['input']>;
  stringValue: InputMaybe<Scalars['String']['input']>;
}>;


export type SetParameterMutation = (
  { setParameter: (
    { ok: boolean | null, parameter: (
      { isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { isCustomized: boolean }
      & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    ) | null }
    & { __typename: 'SetParameterMutation' }
  ) | null }
  & { __typename: 'Mutation' }
);

export type DimensionalPlotFragment = (
  { id: string, sources: Array<string>, unit: (
    { htmlLong: string }
    & { __typename: 'UnitType' }
  ), nodes: Array<(
    { id: string, label: string, color: string | null }
    & { __typename: 'FlowNodeType' }
  )>, links: Array<(
    { year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }
    & { __typename: 'FlowLinksType' }
  )> }
  & { __typename: 'DimensionalFlowType' }
);

export type ActivateScenarioMutationVariables = Exact<{
  scenarioId: Scalars['ID']['input'];
}>;


export type ActivateScenarioMutation = (
  { activateScenario: (
    { ok: boolean | null, activeScenario: (
      { id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean }
      & { __typename: 'ScenarioType' }
    ) | null }
    & { __typename: 'ActivateScenarioMutation' }
  ) | null }
  & { __typename: 'Mutation' }
);

export type DimensionalMetricFragment = (
  { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
    { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
      { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
      & { __typename: 'MetricDimensionCategoryType' }
    )>, groups: Array<(
      { id: string, originalId: string, label: string, color: string | null, order: number | null }
      & { __typename: 'MetricDimensionCategoryGroupType' }
    )> }
    & { __typename: 'MetricDimensionType' }
  )>, goals: Array<(
    { categories: Array<string>, groups: Array<string>, values: Array<(
      { year: number, value: number, isInterpolated: boolean }
      & { __typename: 'MetricYearlyGoalType' }
    )> }
    & { __typename: 'DimensionalMetricGoalEntry' }
  )>, unit: (
    { htmlShort: string, short: string, htmlLong: string, long: string }
    & { __typename: 'UnitType' }
  ), normalizedBy: (
    { id: string, name: string }
    & { __typename: 'NormalizerNodeType' }
  ) | null }
  & { __typename: 'DimensionalMetricType' }
);

export type GetAvailableInstancesQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type GetAvailableInstancesQuery = (
  { availableInstances: Array<(
    { identifier: string, isProtected: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: (
      { basePath: string | null }
      & { __typename: 'InstanceHostname' }
    ) }
    & { __typename: 'InstanceBasicConfiguration' }
  )> }
  & { __typename: 'Query' }
);

export type AvailableInstanceFragment = (
  { identifier: string, isProtected: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: (
    { basePath: string | null }
    & { __typename: 'InstanceHostname' }
  ) }
  & { __typename: 'InstanceBasicConfiguration' }
);

export type GetCytoscapeNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCytoscapeNodesQuery = (
  { nodes: Array<(
    { id: string, name: string, color: string | null, quantity: string | null, isVisible: boolean, parentAction: (
      { id: string }
      & { __typename: 'ActionNode' }
    ) | null, subactions: Array<(
      { id: string }
      & { __typename: 'ActionNode' }
    )>, group: (
      { id: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, metric: (
      { historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )> }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' }
  ) | (
    { id: string, name: string, color: string | null, quantity: string | null, isVisible: boolean, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, metric: (
      { historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )> }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'Node' }
  )> }
  & { __typename: 'Query' }
);

export type GetNodePageQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  scenarios: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type GetNodePageQuery = (
  { node: (
    { id: string, name: string, shortDescription: string | null, description: string | null, color: string | null, targetYearGoal: number | null, quantity: string | null, isAction: boolean, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, metric: (
      { name: string | null, id: string | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      )>, baselineForecastValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )> | null }
      & { __typename: 'ForecastMetricType' }
    ) | null, inputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, isAction: boolean, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, isAction: boolean, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ActionNode' | 'Node' }
    )>, metricDim: (
      { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
        { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
          { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
          & { __typename: 'MetricDimensionCategoryType' }
        )>, groups: Array<(
          { id: string, originalId: string, label: string, color: string | null, order: number | null }
          & { __typename: 'MetricDimensionCategoryGroupType' }
        )> }
        & { __typename: 'MetricDimensionType' }
      )>, goals: Array<(
        { categories: Array<string>, groups: Array<string>, values: Array<(
          { year: number, value: number, isInterpolated: boolean }
          & { __typename: 'MetricYearlyGoalType' }
        )> }
        & { __typename: 'DimensionalMetricGoalEntry' }
      )>, unit: (
        { htmlShort: string, short: string, htmlLong: string, long: string }
        & { __typename: 'UnitType' }
      ), normalizedBy: (
        { id: string, name: string }
        & { __typename: 'NormalizerNodeType' }
      ) | null }
      & { __typename: 'DimensionalMetricType' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type DimensionalNodeMetricFragment = (
  { metricDim: (
    { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
      { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
        { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color: string | null, order: number | null }
        & { __typename: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, groups: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename: 'MetricYearlyGoalType' }
      )> }
      & { __typename: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'ActionNode' | 'Node' }
);

type CausalGridNode_ActionNode_Fragment = (
  { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, group: (
    { id: string, name: string, color: string | null }
    & { __typename: 'ActionGroupType' }
  ) | null, unit: (
    { htmlShort: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, impactMetric: (
    { name: string | null, id: string | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename: 'YearlyValue' }
    )>, baselineForecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> | null, yearlyCumulativeUnit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null }
    & { __typename: 'ForecastMetricType' }
  ) | null, metricDim: (
    { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
      { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
        { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color: string | null, order: number | null }
        & { __typename: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, groups: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename: 'MetricYearlyGoalType' }
      )> }
      & { __typename: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null, parameters: Array<(
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )>, metric: (
    { name: string | null, id: string | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename: 'YearlyValue' }
    )>, baselineForecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> | null }
    & { __typename: 'ForecastMetricType' }
  ) | null }
  & { __typename: 'ActionNode' }
);

type CausalGridNode_Node_Fragment = (
  { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, unit: (
    { htmlShort: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, impactMetric: (
    { name: string | null, id: string | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename: 'YearlyValue' }
    )>, baselineForecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> | null, yearlyCumulativeUnit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null }
    & { __typename: 'ForecastMetricType' }
  ) | null, metricDim: (
    { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
      { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
        { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color: string | null, order: number | null }
        & { __typename: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, groups: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename: 'MetricYearlyGoalType' }
      )> }
      & { __typename: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null, parameters: Array<(
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )>, metric: (
    { name: string | null, id: string | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )>, forecastValues: Array<(
      { value: number, year: number }
      & { __typename: 'YearlyValue' }
    )>, baselineForecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> | null }
    & { __typename: 'ForecastMetricType' }
  ) | null }
  & { __typename: 'Node' }
);

export type CausalGridNodeFragment = CausalGridNode_ActionNode_Fragment | CausalGridNode_Node_Fragment;

export type GetCausalChainQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  untilNode: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetCausalChainQuery = (
  { action: (
    { id: string, downstreamNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, group: (
        { id: string, name: string, color: string | null }
        & { __typename: 'ActionGroupType' }
      ) | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, impactMetric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null }
        & { __typename: 'ForecastMetricType' }
      ) | null, metricDim: (
        { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'ActionNode' }
    ) | (
      { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, impactMetric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null }
        & { __typename: 'ForecastMetricType' }
      ) | null, metricDim: (
        { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'Node' }
    )> }
    & { __typename: 'ActionNode' }
  ) | null }
  & { __typename: 'Query' }
);

export type GetActionContentQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  downstreamDepth: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetActionContentQuery = (
  { action: (
    { goal: string | null, description: string | null, decisionLevel: DecisionLevel | null, id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, dimensionalFlow: (
      { id: string, sources: Array<string>, unit: (
        { htmlLong: string }
        & { __typename: 'UnitType' }
      ), nodes: Array<(
        { id: string, label: string, color: string | null }
        & { __typename: 'FlowNodeType' }
      )>, links: Array<(
        { year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }
        & { __typename: 'FlowLinksType' }
      )> }
      & { __typename: 'DimensionalFlowType' }
    ) | null, downstreamNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, group: (
        { id: string, name: string, color: string | null }
        & { __typename: 'ActionGroupType' }
      ) | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, impactMetric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null }
        & { __typename: 'ForecastMetricType' }
      ) | null, metricDim: (
        { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'ActionNode' }
    ) | (
      { id: string, name: string, shortDescription: string | null, color: string | null, targetYearGoal: number | null, order: number | null, quantity: string | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, impactMetric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null, yearlyCumulativeUnit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null }
        & { __typename: 'ForecastMetricType' }
      ) | null, metricDim: (
        { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null, parameters: Array<(
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )>, metric: (
        { name: string | null, id: string | null, unit: (
          { htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, forecastValues: Array<(
          { value: number, year: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'Node' }
    )>, body: Array<(
      { id: string | null, blockType: string, field: string }
      & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
    ) | (
      { id: string | null, blockType: string, field: string }
      & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
    ) | (
      { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
        { title: string | null, shortDescription: string | null }
        & { __typename: 'CardListCardBlock' }
      ) | null> | null }
      & { __typename: 'CardListBlock' }
    ) | (
      { value: string, rawValue: string, id: string | null, blockType: string, field: string }
      & { __typename: 'RichTextBlock' }
    ) | (
      { value: string, id: string | null, blockType: string, field: string }
      & { __typename: 'TextBlock' }
    )> | null, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, impactMetric: (
      { name: string | null, id: string | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      )>, baselineForecastValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )> | null, yearlyCumulativeUnit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ForecastMetricType' }
    ) | null, metricDim: (
      { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
        { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
          { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
          & { __typename: 'MetricDimensionCategoryType' }
        )>, groups: Array<(
          { id: string, originalId: string, label: string, color: string | null, order: number | null }
          & { __typename: 'MetricDimensionCategoryGroupType' }
        )> }
        & { __typename: 'MetricDimensionType' }
      )>, goals: Array<(
        { categories: Array<string>, groups: Array<string>, values: Array<(
          { year: number, value: number, isInterpolated: boolean }
          & { __typename: 'MetricYearlyGoalType' }
        )> }
        & { __typename: 'DimensionalMetricGoalEntry' }
      )>, unit: (
        { htmlShort: string, short: string, htmlLong: string, long: string }
        & { __typename: 'UnitType' }
      ), normalizedBy: (
        { id: string, name: string }
        & { __typename: 'NormalizerNodeType' }
      ) | null }
      & { __typename: 'DimensionalMetricType' }
    ) | null, parameters: Array<(
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )>, metric: (
      { name: string | null, id: string | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      )>, baselineForecastValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )> | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' }
  ) | null }
  & { __typename: 'Query' }
);

export type GetActionImpactsQueryVariables = Exact<{
  impact1: Scalars['ID']['input'];
  impact2: Scalars['ID']['input'];
}>;


export type GetActionImpactsQuery = (
  { energyNode: (
    { metric: (
      { id: string | null, unit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null, costNode: (
    { metric: (
      { id: string | null, unit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null, actions: Array<(
    { name: string, id: string, energy: (
      { cumulativeForecastValue: number | null }
      & { __typename: 'ForecastMetricType' }
    ) | null, cost: (
      { cumulativeForecastValue: number | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' }
  )> }
  & { __typename: 'Query' }
);

export type GetActionListQueryVariables = Exact<{
  goal: InputMaybe<Scalars['ID']['input']>;
}>;


export type GetActionListQuery = (
  { instance: (
    { id: string, actionGroups: Array<(
      { id: string, name: string, color: string | null, actions: Array<(
        { id: string }
        & { __typename: 'ActionNode' }
      )> }
      & { __typename: 'ActionGroupType' }
    )> }
    & { __typename: 'InstanceType' }
  ), actions: Array<(
    { id: string, name: string, goal: string | null, shortDescription: string | null, color: string | null, decisionLevel: DecisionLevel | null, quantity: string | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, parameters: Array<(
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )>, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, impactMetric: (
      { id: string | null, name: string | null, cumulativeForecastValue: number | null, unit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, historicalValues: Array<(
        { year: number, value: number }
        & { __typename: 'YearlyValue' }
      )>, forecastValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      )> }
      & { __typename: 'ForecastMetricType' }
    ) | null, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null }
    & { __typename: 'ActionNode' }
  )>, impactOverviews: Array<(
    { id: string, label: string, plotLimitForIndicator: number | null, indicatorUnit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ), costUnit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, effectUnit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, costNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'Node' }
    ) | null, effectNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'Node' }
    ), actions: Array<(
      { unitAdjustmentMultiplier: number | null, action: (
        { id: string, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null }
        & { __typename: 'ActionNode' }
      ), costValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      ) | null> | null, impactValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      ) | null> | null }
      & { __typename: 'ActionImpact' }
    )> }
    & { __typename: 'ImpactOverviewType' }
  )> }
  & { __typename: 'Query' }
);

export type GetImpactOverviewsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetImpactOverviewsQuery = (
  { impactOverviews: Array<(
    { id: string, graphType: string | null, label: string, costLabel: string | null, effectLabel: string | null, indicatorLabel: string | null, costCategoryLabel: string | null, effectCategoryLabel: string | null, description: string | null, effectNode: (
      { id: string }
      & { __typename: 'Node' }
    ), effectUnit: (
      { short: string, long: string }
      & { __typename: 'UnitType' }
    ) | null, indicatorUnit: (
      { short: string, long: string }
      & { __typename: 'UnitType' }
    ), costUnit: (
      { short: string, long: string }
      & { __typename: 'UnitType' }
    ) | null, actions: Array<(
      { unitAdjustmentMultiplier: number | null, action: (
        { id: string, name: string }
        & { __typename: 'ActionNode' }
      ), effectDim: (
        { name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ), costDim: (
        { years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string }
          & { __typename: 'MetricDimensionType' }
        )> }
        & { __typename: 'DimensionalMetricType' }
      ) | null }
      & { __typename: 'ActionImpact' }
    )> }
    & { __typename: 'ImpactOverviewType' }
  )> }
  & { __typename: 'Query' }
);

export type GetNodeVisualizationsQueryVariables = Exact<{
  nodeId: Scalars['ID']['input'];
}>;


export type GetNodeVisualizationsQuery = (
  { scenarios: Array<(
    { id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }
    & { __typename: 'ScenarioType' }
  )>, node: (
    { id: string, metricDim: (
      { measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
        { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
          { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
          & { __typename: 'MetricDimensionCategoryType' }
        )>, groups: Array<(
          { id: string, originalId: string, label: string, color: string | null, order: number | null }
          & { __typename: 'MetricDimensionCategoryGroupType' }
        )> }
        & { __typename: 'MetricDimensionType' }
      )>, goals: Array<(
        { categories: Array<string>, groups: Array<string>, values: Array<(
          { year: number, value: number, isInterpolated: boolean }
          & { __typename: 'MetricYearlyGoalType' }
        )> }
        & { __typename: 'DimensionalMetricGoalEntry' }
      )>, unit: (
        { htmlShort: string, short: string, htmlLong: string, long: string }
        & { __typename: 'UnitType' }
      ), normalizedBy: (
        { id: string, name: string }
        & { __typename: 'NormalizerNodeType' }
      ) | null }
      & { __typename: 'DimensionalMetricType' }
    ) | null, visualizations: Array<(
      { label: string | null, children: Array<(
        { id: string, label: string | null }
        & { __typename: 'VisualizationGroup' }
      ) | (
        { label: string | null, nodeId: string, scenarios: Array<string> | null, desiredOutcome: DesiredOutcome, id: string, dimensions: Array<(
          { id: string, categories: Array<string> | null, flatten: boolean | null }
          & { __typename: 'VisualizationNodeDimension' }
        )>, metricDim: (
          { measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
            { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
              { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
              & { __typename: 'MetricDimensionCategoryType' }
            )>, groups: Array<(
              { id: string, originalId: string, label: string, color: string | null, order: number | null }
              & { __typename: 'MetricDimensionCategoryGroupType' }
            )> }
            & { __typename: 'MetricDimensionType' }
          )>, goals: Array<(
            { categories: Array<string>, groups: Array<string>, values: Array<(
              { year: number, value: number, isInterpolated: boolean }
              & { __typename: 'MetricYearlyGoalType' }
            )> }
            & { __typename: 'DimensionalMetricGoalEntry' }
          )>, unit: (
            { htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null }
        & { __typename: 'VisualizationNodeOutput' }
      )> }
      & { __typename: 'VisualizationGroup' }
    ) | (
      { label: string | null }
      & { __typename: 'VisualizationNodeOutput' }
    )> | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type UnitFieldsFragment = (
  { short: string, htmlShort: string, htmlLong: string }
  & { __typename: 'UnitType' }
);

export type ScenarioActionImpactsFieldsFragment = (
  { scenario: (
    { id: string }
    & { __typename: 'ScenarioType' }
  ), impacts: Array<(
    { value: number, year: number, action: (
      { id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: (
        { id: string, name: string, color: string | null }
        & { __typename: 'ActionGroupType' }
      ) | null }
      & { __typename: 'ActionNode' }
    ) }
    & { __typename: 'ActionImpactType' }
  )> }
  & { __typename: 'ScenarioActionImpacts' }
);

export type DashboardCardVisualizationsFragment = (
  { visualizations: Array<(
    { title: string, scenarioId: string, id: string | null }
    & { __typename: 'ActionImpactBlock' }
  ) | (
    { id: string | null }
    & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' }
  ) | (
    { id: string | null }
    & { __typename: 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
  ) | (
    { title: string, dimensionId: string, id: string | null }
    & { __typename: 'CategoryBreakdownBlock' }
  ) | (
    { title: string, description: string, chartLabel: string, color: string, id: string | null }
    & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
  ) | (
    { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
    & { __typename: 'ScenarioProgressBarBlock' }
  ) | null> | null }
  & { __typename: 'DashboardCardBlock' }
);

export type MetricDimensionCategoryValueFieldsFragment = (
  { value: number | null, year: number, dimension: (
    { kind: DimensionKind, label: string, id: string, originalId: string | null }
    & { __typename: 'MetricDimensionType' }
  ), category: (
    { id: string, originalId: string | null, label: string, color: string | null }
    & { __typename: 'MetricDimensionCategoryType' }
  ) }
  & { __typename: 'MetricDimensionCategoryValue' }
);

export type DashboardPageFieldsFragment = (
  { backgroundColor: string | null, dashboardCards: Array<{ __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' } | { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'RichTextBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' } | (
    { title: string, description: string, goalValue: number | null, referenceYearValue: number | null, lastHistoricalYearValue: number | null, image: (
      { url: string }
      & { __typename: 'ImageObjectType' }
    ) | null, node: (
      { id: string, name: string }
      & { __typename: 'Node' }
    ), unit: (
      { short: string, htmlShort: string, htmlLong: string }
      & { __typename: 'UnitType' }
    ), scenarioValues: Array<(
      { value: number | null, year: number, scenario: (
        { id: string, name: string }
        & { __typename: 'ScenarioType' }
      ) }
      & { __typename: 'ScenarioValue' }
    ) | null> | null, metricDimensionCategoryValues: Array<(
      { value: number | null, year: number, dimension: (
        { kind: DimensionKind, label: string, id: string, originalId: string | null }
        & { __typename: 'MetricDimensionType' }
      ), category: (
        { id: string, originalId: string | null, label: string, color: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      ) }
      & { __typename: 'MetricDimensionCategoryValue' }
    ) | null> | null, scenarioActionImpacts: Array<(
      { scenario: (
        { id: string }
        & { __typename: 'ScenarioType' }
      ), impacts: Array<(
        { value: number, year: number, action: (
          { id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: (
            { id: string, name: string, color: string | null }
            & { __typename: 'ActionGroupType' }
          ) | null }
          & { __typename: 'ActionNode' }
        ) }
        & { __typename: 'ActionImpactType' }
      )> }
      & { __typename: 'ScenarioActionImpacts' }
    ) | null> | null, callToAction: (
      { title: string, content: string, linkUrl: string }
      & { __typename: 'CallToActionBlock' }
    ), visualizations: Array<(
      { title: string, scenarioId: string, id: string | null }
      & { __typename: 'ActionImpactBlock' }
    ) | (
      { id: string | null }
      & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' }
    ) | (
      { id: string | null }
      & { __typename: 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
    ) | (
      { title: string, dimensionId: string, id: string | null }
      & { __typename: 'CategoryBreakdownBlock' }
    ) | (
      { title: string, description: string, chartLabel: string, color: string, id: string | null }
      & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
    ) | (
      { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
      & { __typename: 'ScenarioProgressBarBlock' }
    ) | null> | null }
    & { __typename: 'DashboardCardBlock' }
  ) | null> | null }
  & { __typename: 'DashboardPage' }
);

export type OutcomeNodeFieldsFragment = (
  { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, targetYearGoal: number | null, quantity: string | null, metric: (
    { id: string | null, name: string | null, unit: (
      { short: string, htmlShort: string, htmlLong: string }
      & { __typename: 'UnitType' }
    ) | null, forecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )>, baselineForecastValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> | null, historicalValues: Array<(
      { year: number, value: number }
      & { __typename: 'YearlyValue' }
    )> }
    & { __typename: 'ForecastMetricType' }
  ) | null, goals: Array<(
    { year: number, value: number }
    & { __typename: 'NodeGoal' }
  )>, unit: (
    { short: string, htmlShort: string, htmlLong: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string, name: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, upstreamActions: Array<(
    { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<(
      { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
    )>, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null }
    & { __typename: 'ActionNode' }
  )> | null, metricDim: (
    { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
      { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
        { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color: string | null, order: number | null }
        & { __typename: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, groups: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename: 'MetricYearlyGoalType' }
      )> }
      & { __typename: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'Node' }
);

export type GetPageQueryVariables = Exact<{
  path: Scalars['String']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  scenarios: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type GetPageQuery = (
  { activeScenario: (
    { id: string }
    & { __typename: 'ScenarioType' }
  ), page: (
    { showOnlyMunicipalActions: boolean | null, defaultSortOrder: ActionSortOrder, id: string | null, title: string, actionListLeadTitle: string | null, actionListLeadParagraph: string | null }
    & { __typename: 'ActionListPage' }
  ) | (
    { id: string | null, title: string, backgroundColor: string | null, dashboardCards: Array<{ __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' } | { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'RichTextBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' } | (
      { title: string, description: string, goalValue: number | null, referenceYearValue: number | null, lastHistoricalYearValue: number | null, image: (
        { url: string }
        & { __typename: 'ImageObjectType' }
      ) | null, node: (
        { id: string, name: string }
        & { __typename: 'Node' }
      ), unit: (
        { short: string, htmlShort: string, htmlLong: string }
        & { __typename: 'UnitType' }
      ), scenarioValues: Array<(
        { value: number | null, year: number, scenario: (
          { id: string, name: string }
          & { __typename: 'ScenarioType' }
        ) }
        & { __typename: 'ScenarioValue' }
      ) | null> | null, metricDimensionCategoryValues: Array<(
        { value: number | null, year: number, dimension: (
          { kind: DimensionKind, label: string, id: string, originalId: string | null }
          & { __typename: 'MetricDimensionType' }
        ), category: (
          { id: string, originalId: string | null, label: string, color: string | null }
          & { __typename: 'MetricDimensionCategoryType' }
        ) }
        & { __typename: 'MetricDimensionCategoryValue' }
      ) | null> | null, scenarioActionImpacts: Array<(
        { scenario: (
          { id: string }
          & { __typename: 'ScenarioType' }
        ), impacts: Array<(
          { value: number, year: number, action: (
            { id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: (
              { id: string, name: string, color: string | null }
              & { __typename: 'ActionGroupType' }
            ) | null }
            & { __typename: 'ActionNode' }
          ) }
          & { __typename: 'ActionImpactType' }
        )> }
        & { __typename: 'ScenarioActionImpacts' }
      ) | null> | null, callToAction: (
        { title: string, content: string, linkUrl: string }
        & { __typename: 'CallToActionBlock' }
      ), visualizations: Array<(
        { title: string, scenarioId: string, id: string | null }
        & { __typename: 'ActionImpactBlock' }
      ) | (
        { id: string | null }
        & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' }
      ) | (
        { id: string | null }
        & { __typename: 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
      ) | (
        { title: string, dimensionId: string, id: string | null }
        & { __typename: 'CategoryBreakdownBlock' }
      ) | (
        { title: string, description: string, chartLabel: string, color: string, id: string | null }
        & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
      ) | (
        { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
        & { __typename: 'ScenarioProgressBarBlock' }
      ) | null> | null }
      & { __typename: 'DashboardCardBlock' }
    ) | null> | null }
    & { __typename: 'DashboardPage' }
  ) | (
    { id: string | null, title: string }
    & { __typename: 'DashboardPage' | 'InstanceRootPage' | 'Page' }
  ) | (
    { leadTitle: string, leadParagraph: string, id: string | null, title: string, outcomeNode: (
      { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, targetYearGoal: number | null, quantity: string | null, upstreamNodes: Array<{ __typename: 'ActionNode' } | (
        { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, targetYearGoal: number | null, quantity: string | null, metric: (
          { id: string | null, name: string | null, unit: (
            { short: string, htmlShort: string, htmlLong: string }
            & { __typename: 'UnitType' }
          ) | null, forecastValues: Array<(
            { year: number, value: number }
            & { __typename: 'YearlyValue' }
          )>, baselineForecastValues: Array<(
            { year: number, value: number }
            & { __typename: 'YearlyValue' }
          )> | null, historicalValues: Array<(
            { year: number, value: number }
            & { __typename: 'YearlyValue' }
          )> }
          & { __typename: 'ForecastMetricType' }
        ) | null, goals: Array<(
          { year: number, value: number }
          & { __typename: 'NodeGoal' }
        )>, unit: (
          { short: string, htmlShort: string, htmlLong: string }
          & { __typename: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string, name: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, upstreamActions: Array<(
          { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<(
            { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          ) | (
            { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
          )>, group: (
            { id: string, name: string, color: string | null }
            & { __typename: 'ActionGroupType' }
          ) | null }
          & { __typename: 'ActionNode' }
        )> | null, metricDim: (
          { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
            { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
              { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
              & { __typename: 'MetricDimensionCategoryType' }
            )>, groups: Array<(
              { id: string, originalId: string, label: string, color: string | null, order: number | null }
              & { __typename: 'MetricDimensionCategoryGroupType' }
            )> }
            & { __typename: 'MetricDimensionType' }
          )>, goals: Array<(
            { categories: Array<string>, groups: Array<string>, values: Array<(
              { year: number, value: number, isInterpolated: boolean }
              & { __typename: 'MetricYearlyGoalType' }
            )> }
            & { __typename: 'DimensionalMetricGoalEntry' }
          )>, unit: (
            { htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null }
        & { __typename: 'Node' }
      )>, metric: (
        { id: string | null, name: string | null, unit: (
          { short: string, htmlShort: string, htmlLong: string }
          & { __typename: 'UnitType' }
        ) | null, forecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )>, baselineForecastValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> }
        & { __typename: 'ForecastMetricType' }
      ) | null, goals: Array<(
        { year: number, value: number }
        & { __typename: 'NodeGoal' }
      )>, unit: (
        { short: string, htmlShort: string, htmlLong: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string, name: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, upstreamActions: Array<(
        { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<(
          { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
            { id: string }
            & { __typename: 'ActionNode' | 'Node' }
          ) | null }
          & { __typename: 'BoolParameterType' }
        ) | (
          { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
            { id: string }
            & { __typename: 'ActionNode' | 'Node' }
          ) | null }
          & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
        )>, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null }
        & { __typename: 'ActionNode' }
      )> | null, metricDim: (
        { id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
          { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
            { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
            & { __typename: 'MetricDimensionCategoryType' }
          )>, groups: Array<(
            { id: string, originalId: string, label: string, color: string | null, order: number | null }
            & { __typename: 'MetricDimensionCategoryGroupType' }
          )> }
          & { __typename: 'MetricDimensionType' }
        )>, goals: Array<(
          { categories: Array<string>, groups: Array<string>, values: Array<(
            { year: number, value: number, isInterpolated: boolean }
            & { __typename: 'MetricYearlyGoalType' }
          )> }
          & { __typename: 'DimensionalMetricGoalEntry' }
        )>, unit: (
          { htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null }
      & { __typename: 'Node' }
    ) }
    & { __typename: 'OutcomePage' }
  ) | (
    { id: string | null, title: string, body: Array<(
      { id: string | null, blockType: string, field: string }
      & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
    ) | (
      { id: string | null, blockType: string, field: string }
      & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
    ) | (
      { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
        { title: string | null, shortDescription: string | null }
        & { __typename: 'CardListCardBlock' }
      ) | null> | null }
      & { __typename: 'CardListBlock' }
    ) | (
      { value: string, rawValue: string, id: string | null, blockType: string, field: string }
      & { __typename: 'RichTextBlock' }
    ) | (
      { value: string, id: string | null, blockType: string, field: string }
      & { __typename: 'TextBlock' }
    ) | null> | null }
    & { __typename: 'StaticPage' }
  ) | null }
  & { __typename: 'Query' }
);

export type GetParametersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetParametersQuery = (
  { availableNormalizations: Array<(
    { id: string, label: string, isActive: boolean }
    & { __typename: 'NormalizationType' }
  )>, parameters: Array<(
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )> }
  & { __typename: 'Query' }
);

export type GetScenariosQueryVariables = Exact<{ [key: string]: never; }>;


export type GetScenariosQuery = (
  { scenarios: Array<(
    { id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean }
    & { __typename: 'ScenarioType' }
  )> }
  & { __typename: 'Query' }
);

export type ScenarioFragmentFragment = (
  { id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }
  & { __typename: 'ScenarioType' }
);

export type GetInstanceContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInstanceContextQuery = (
  { instance: (
    { id: string, name: string, themeIdentifier: string | null, owner: string | null, defaultLanguage: string, supportedLanguages: Array<string>, targetYear: number | null, modelEndYear: number, referenceYear: number | null, minimumHistoricalYear: number, maximumHistoricalYear: number | null, leadTitle: string | null, leadParagraph: string | null, features: (
      { hideNodeDetails: boolean, maximumFractionDigits: number | null, baselineVisibleInGraphs: boolean, showAccumulatedEffects: boolean, showSignificantDigits: number | null, showRefreshPrompt: boolean }
      & { __typename: 'InstanceFeaturesType' }
    ), introContent: Array<{ __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' } | { __typename: 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' } | (
      { field: string, value: string }
      & { __typename: 'RichTextBlock' }
    )> | null, goals: Array<(
      { id: string, label: string | null, default: boolean, disabled: boolean, outcomeNode: (
        { id: string }
        & { __typename: 'Node' }
      ), dimensions: Array<(
        { dimension: string, categories: Array<string>, groups: Array<string> }
        & { __typename: 'InstanceGoalDimension' }
      )> }
      & { __typename: 'InstanceGoalEntry' }
    )>, actionListPage: (
      { showInMenus: boolean }
      & { __typename: 'ActionListPage' }
    ) | null }
    & { __typename: 'InstanceType' }
  ), scenarios: Array<(
    { id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }
    & { __typename: 'ScenarioType' }
  )>, availableNormalizations: Array<(
    { id: string, label: string, isActive: boolean }
    & { __typename: 'NormalizationType' }
  )>, menuPages: Array<(
    { id: string | null, title: string, urlPath: string, parent: (
      { id: string | null }
      & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
    ) | null }
    & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
  )>, parameters: Array<(
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
      { htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | (
    { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    ) | null }
    & { __typename: 'UnknownParameterType' }
  )> }
  & { __typename: 'Query' }
);

type VisualizationEntryFragment_VisualizationGroup_Fragment = (
  { id: string, label: string | null }
  & { __typename: 'VisualizationGroup' }
);

type VisualizationEntryFragment_VisualizationNodeOutput_Fragment = (
  { label: string | null, nodeId: string, scenarios: Array<string> | null, desiredOutcome: DesiredOutcome, id: string, dimensions: Array<(
    { id: string, categories: Array<string> | null, flatten: boolean | null }
    & { __typename: 'VisualizationNodeDimension' }
  )>, metricDim: (
    { measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
      { id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<(
        { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
        & { __typename: 'MetricDimensionCategoryType' }
      )>, groups: Array<(
        { id: string, originalId: string, label: string, color: string | null, order: number | null }
        & { __typename: 'MetricDimensionCategoryGroupType' }
      )> }
      & { __typename: 'MetricDimensionType' }
    )>, goals: Array<(
      { categories: Array<string>, groups: Array<string>, values: Array<(
        { year: number, value: number, isInterpolated: boolean }
        & { __typename: 'MetricYearlyGoalType' }
      )> }
      & { __typename: 'DimensionalMetricGoalEntry' }
    )>, unit: (
      { htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'VisualizationNodeOutput' }
);

export type VisualizationEntryFragmentFragment = VisualizationEntryFragment_VisualizationGroup_Fragment | VisualizationEntryFragment_VisualizationNodeOutput_Fragment;
