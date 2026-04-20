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
  /** Date (isoformat) */
  Date: { input: any; output: any; }
  /** Date with time (isoformat) */
  DateTime: { input: string; output: string; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](https://ecma-international.org/wp-content/uploads/ECMA-404_2nd_edition_december_2017.pdf). */
  JSON: { input: any; output: any; }
  /**
   * Allows use of a JSON String for input / output from the GraphQL schema.
   *
   * Use of this type is *not recommended* as you lose the benefits of having a defined, static
   * schema (one of the key benefits of GraphQL).
   */
  JSONString: { input: string; output: string; }
  /** GraphQL type for an integer that must be equal or greater than zero. */
  PositiveInt: { input: number; output: number; }
  RichText: { input: string; output: string; }
  UUID: { input: string; output: string; }
  _Any: { input: any; output: any; }
};

export type ActionConfigInput = {
  decisionLevel: InputMaybe<DecisionLevel>;
  group: InputMaybe<Scalars['String']['input']>;
  noEffectValue: InputMaybe<Scalars['Float']['input']>;
  nodeClass: Scalars['String']['input'];
  parent: InputMaybe<Scalars['String']['input']>;
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

export enum ChangeTargetKind {
  DatasetPort = 'DATASET_PORT',
  DataPoint = 'DATA_POINT',
  Dimension = 'DIMENSION',
  DimensionCategory = 'DIMENSION_CATEGORY',
  Edge = 'EDGE',
  Instance = 'INSTANCE',
  Node = 'NODE',
  Unknown = 'UNKNOWN'
}

export type CreateDataPointInput = {
  date: Scalars['Date']['input'];
  dimensionCategoryIds: InputMaybe<Array<Scalars['UUID']['input']>>;
  metricId: Scalars['UUID']['input'];
  value: InputMaybe<Scalars['Float']['input']>;
};

export type CreateDimensionCategoryInput = {
  dimensionId: Scalars['UUID']['input'];
  id: InputMaybe<Scalars['UUID']['input']>;
  identifier: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  nextSibling: InputMaybe<Scalars['ID']['input']>;
  previousSibling: InputMaybe<Scalars['ID']['input']>;
};

export type CreateInstanceInput = {
  frameworkId: Scalars['String']['input'];
  identifier: Scalars['String']['input'];
  name: Scalars['String']['input'];
  organizationName: Scalars['String']['input'];
};

export type CreateNodeInput = {
  allowNulls: Scalars['Boolean']['input'];
  color: InputMaybe<Scalars['String']['input']>;
  config: NodeConfigInput;
  description: InputMaybe<Scalars['String']['input']>;
  i18n: InputMaybe<Scalars['JSON']['input']>;
  identifier: Scalars['ID']['input'];
  inputDatasets: InputMaybe<Scalars['JSON']['input']>;
  inputDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  inputPorts: InputMaybe<Array<InputPortInput>>;
  isOutcome: Scalars['Boolean']['input'];
  isVisible: Scalars['Boolean']['input'];
  kind: NodeKind;
  minimumYear: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  nodeGroup: InputMaybe<Scalars['ID']['input']>;
  order: InputMaybe<Scalars['Int']['input']>;
  outputDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  outputMetrics: InputMaybe<Array<OutputMetricInput>>;
  outputPorts: InputMaybe<Array<OutputPortInput>>;
  params: InputMaybe<Scalars['JSON']['input']>;
  shortName: InputMaybe<Scalars['String']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Which governance level is applicable for an action */
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

export type FormulaConfigInput = {
  formula: Scalars['String']['input'];
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

export type InputPortInput = {
  id: InputMaybe<Scalars['UUID']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  multi: Scalars['Boolean']['input'];
  quantity: InputMaybe<Scalars['String']['input']>;
  requiredDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  supportedDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  unit: InputMaybe<Scalars['String']['input']>;
};

/** An enumeration. */
export enum ModelAction {
  Add = 'ADD',
  Change = 'CHANGE',
  Delete = 'DELETE',
  View = 'VIEW'
}

export type NodeConfigInput = {
  action: InputMaybe<ActionConfigInput>;
  formula: InputMaybe<FormulaConfigInput>;
  pipeline: InputMaybe<PipelineConfigInput>;
  simple: InputMaybe<SimpleConfigInput>;
};

export enum NodeKind {
  Action = 'ACTION',
  Formula = 'FORMULA',
  Pipeline = 'PIPELINE',
  Simple = 'SIMPLE'
}

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

export type OutputMetricInput = {
  columnId: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  label: InputMaybe<Scalars['String']['input']>;
  portId: InputMaybe<Scalars['UUID']['input']>;
  quantity: InputMaybe<Scalars['String']['input']>;
  unit: Scalars['String']['input'];
};

export type OutputPortInput = {
  columnId: InputMaybe<Scalars['String']['input']>;
  dimensions: InputMaybe<Array<Scalars['String']['input']>>;
  id: InputMaybe<Scalars['UUID']['input']>;
  isEditable: Scalars['Boolean']['input'];
  label: InputMaybe<Scalars['String']['input']>;
  quantity: InputMaybe<Scalars['String']['input']>;
  unit: Scalars['String']['input'];
};

export type PipelineConfigInput = {
  operations: Array<PipelineOperationInput>;
};

export type PipelineOperationInput = {
  operation: Scalars['String']['input'];
};

export enum PrimaryLayoutClass {
  Action = 'ACTION',
  ContextSource = 'CONTEXT_SOURCE',
  Core = 'CORE',
  GhostableContextSource = 'GHOSTABLE_CONTEXT_SOURCE',
  Outcome = 'OUTCOME'
}

export type RegisterUserInput = {
  email: Scalars['String']['input'];
  firstName: InputMaybe<Scalars['String']['input']>;
  frameworkId: Scalars['String']['input'];
  lastName: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};

export enum ScenarioKind {
  Baseline = 'BASELINE',
  Custom = 'CUSTOM',
  Default = 'DEFAULT',
  ProgressTracking = 'PROGRESS_TRACKING'
}

export type SimpleConfigInput = {
  nodeClass: Scalars['String']['input'];
};

export type UpdateDataPointInput = {
  date: InputMaybe<Scalars['Date']['input']>;
  dimensionCategoryIds: InputMaybe<Array<Scalars['UUID']['input']>>;
  metricId: InputMaybe<Scalars['UUID']['input']>;
  value: InputMaybe<Scalars['Float']['input']>;
};

export type UpdateDimensionCategoryInput = {
  categoryId: Scalars['UUID']['input'];
  identifier: InputMaybe<Scalars['String']['input']>;
  label: InputMaybe<Scalars['String']['input']>;
  nextSibling: InputMaybe<Scalars['ID']['input']>;
  previousSibling: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateDimensionInput = {
  dimensionId: Scalars['UUID']['input'];
  name: InputMaybe<Scalars['String']['input']>;
};

export type UpdateNodeInput = {
  allowNulls: InputMaybe<Scalars['Boolean']['input']>;
  color: InputMaybe<Scalars['String']['input']>;
  config: InputMaybe<NodeConfigInput>;
  description: InputMaybe<Scalars['String']['input']>;
  i18n: InputMaybe<Scalars['JSON']['input']>;
  inputDatasets: InputMaybe<Scalars['JSON']['input']>;
  inputDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  inputPorts: InputMaybe<Array<InputPortInput>>;
  isOutcome: InputMaybe<Scalars['Boolean']['input']>;
  isVisible: InputMaybe<Scalars['Boolean']['input']>;
  kind: InputMaybe<NodeKind>;
  minimumYear: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  nodeGroup: InputMaybe<Scalars['ID']['input']>;
  order: InputMaybe<Scalars['Int']['input']>;
  outputDimensions: InputMaybe<Array<Scalars['String']['input']>>;
  outputMetrics: InputMaybe<Array<OutputMetricInput>>;
  outputPorts: InputMaybe<Array<OutputPortInput>>;
  params: InputMaybe<Scalars['JSON']['input']>;
  shortName: InputMaybe<Scalars['String']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
};

export enum VisualizationKind {
  Group = 'group',
  Node = 'node'
}

export type CytoscapeNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type CytoscapeNodesQuery = (
  { nodes: Array<
    | (
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
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, metric: (
        { id: string | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'ActionNode' }
    )
    | (
      { id: string, name: string, color: string | null, quantity: string | null, isVisible: boolean, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, metric: (
        { id: string | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'Node' }
    )
  > }
  & { __typename: 'Query' }
);

export type NodePageQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  scenarios: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type NodePageQuery = (
  { node: (
    { id: string, name: string, shortDescription: string | null, description: string | null, color: string | null, quantity: string | null, unit: (
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: (
        { id: string, htmlShort: string }
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
        { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
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

export type CreateInstanceMutationVariables = Exact<{
  input: CreateInstanceInput;
}>;


export type CreateInstanceMutation = (
  { createInstance:
    | (
      { instanceId: string, instanceName: string }
      & { __typename: 'CreateInstanceResult' }
    )
    | (
      { messages: Array<(
        { kind: OperationMessageKind, message: string, field: string | null }
        & { __typename: 'OperationMessage' }
      )> }
      & { __typename: 'OperationInfo' }
    )
   }
  & { __typename: 'Mutation' }
);

export type RegisterUserMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterUserMutation = (
  { registerUser:
    | (
      { messages: Array<(
        { kind: OperationMessageKind, message: string, field: string | null }
        & { __typename: 'OperationMessage' }
      )> }
      & { __typename: 'OperationInfo' }
    )
    | (
      { userId: string, email: string }
      & { __typename: 'RegisterUserResult' }
    )
   }
  & { __typename: 'Mutation' }
);

export type ModelEditorLandingDataQueryVariables = Exact<{ [key: string]: never; }>;


export type ModelEditorLandingDataQuery = (
  { instance: (
    { id: string, nodes: Array<(
      { id: string, name: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, editor: (
      { live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type ModelNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type ModelNodesQuery = (
  { nodes: Array<
    | (
      { id: string, name: string, shortName: string | null, color: string | null, quantity: string | null, isVisible: boolean, parentAction: (
        { id: string }
        & { __typename: 'ActionNode' }
      ) | null, subactions: Array<(
        { id: string }
        & { __typename: 'ActionNode' }
      )>, group: (
        { id: string, color: string | null, name: string }
        & { __typename: 'ActionGroupType' }
      ) | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, metric: (
        { id: string | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'ActionNode' }
    )
    | (
      { id: string, name: string, shortName: string | null, color: string | null, quantity: string | null, isVisible: boolean, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, metric: (
        { id: string | null, historicalValues: Array<(
          { year: number, value: number }
          & { __typename: 'YearlyValue' }
        )> }
        & { __typename: 'ForecastMetricType' }
      ) | null }
      & { __typename: 'Node' }
    )
  > }
  & { __typename: 'Query' }
);

type StreamField_ZdQ8UWlP6f5e6Md3cdGwbo2c4Hrqm4yhimg5aq7Pma_Fragment = (
  { id: string | null, blockType: string, field: string }
  & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
);

type StreamField_KCyuF1ERfSDjEhFkBiZv2Jg0yNyFm47M1qS2aebiI_Fragment = (
  { id: string | null, blockType: string, field: string }
  & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
);

type StreamField_CardListBlock_Fragment = (
  { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
    { title: string | null, shortDescription: string | null }
    & { __typename: 'CardListCardBlock' }
  ) | null> | null }
  & { __typename: 'CardListBlock' }
);

type StreamField_FrameworkLandingBlock_Fragment = (
  { heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: (
    { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean, configs: Array<(
      { id: string, organizationName: string | null, viewUrl: string | null, instance: (
        { id: string, name: string }
        & { __typename: 'InstanceType' }
      ) | null }
      & { __typename: 'FrameworkConfig' }
    )> }
    & { __typename: 'Framework' }
  ) | null }
  & { __typename: 'FrameworkLandingBlock' }
);

type StreamField_RichTextBlock_Fragment = (
  { value: string, rawValue: string, id: string | null, blockType: string, field: string }
  & { __typename: 'RichTextBlock' }
);

type StreamField_TextBlock_Fragment = (
  { value: string, id: string | null, blockType: string, field: string }
  & { __typename: 'TextBlock' }
);

export type StreamFieldFragment =
  | StreamField_ZdQ8UWlP6f5e6Md3cdGwbo2c4Hrqm4yhimg5aq7Pma_Fragment
  | StreamField_KCyuF1ERfSDjEhFkBiZv2Jg0yNyFm47M1qS2aebiI_Fragment
  | StreamField_CardListBlock_Fragment
  | StreamField_FrameworkLandingBlock_Fragment
  | StreamField_RichTextBlock_Fragment
  | StreamField_TextBlock_Fragment
;

export type NodeDetailsQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  scenarios: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type NodeDetailsQuery = (
  { node: (
    { id: string, name: string, shortDescription: string | null, description: string | null, explanation: string | null, color: string | null, quantity: string | null, editor: (
      { nodeType: string, tags: Array<string> | null }
      & { __typename: 'NodeEditor' }
    ) | null, unit: (
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: (
        { id: string, htmlShort: string }
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
        { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
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

export type SetParameterMutationVariables = Exact<{
  parameterId: Scalars['ID']['input'];
  boolValue: InputMaybe<Scalars['Boolean']['input']>;
  numberValue: InputMaybe<Scalars['Float']['input']>;
  stringValue: InputMaybe<Scalars['String']['input']>;
}>;


export type SetParameterMutation = (
  { setParameter: (
    { ok: boolean, parameter:
      | (
        { id: string, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null }
        & { __typename: 'BoolParameterType' }
      )
      | (
        { id: string, isCustomized: boolean }
        & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
      )
     | null }
    & { __typename: 'SetParameterResult' }
  ) }
  & { __typename: 'Mutation' }
);

export type DimensionalPlotFragment = (
  { id: string, sources: Array<string>, unit: (
    { id: string, htmlLong: string }
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

export type EditorNodeSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorNodeSearchListQuery = (
  { instance: (
    { id: string, nodes: Array<
      | (
        { id: string, identifier: string, name: string }
        & { __typename: 'ActionNode' }
      )
      | (
        { isOutcome: boolean, id: string, identifier: string, name: string }
        & { __typename: 'Node' }
      )
    > }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type EditorDatasetSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorDatasetSearchListQuery = (
  { instance: (
    { id: string, editor: (
      { datasets: Array<(
        { id: string, identifier: string | null, name: string }
        & { __typename: 'Dataset' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type EditorDimensionSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorDimensionSearchListQuery = (
  { instance: (
    { id: string, editor: (
      { dimensions: Array<(
        { id: string, identifier: string, name: string }
        & { __typename: 'InstanceDimension' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type NodeExplanationQueryVariables = Exact<{
  node: Scalars['ID']['input'];
}>;


export type NodeExplanationQuery = (
  { node: (
    { id: string, explanation: string | null, parameters: Array<
      | (
        { id: string, nodeRelativeId: string | null }
        & { __typename: 'BoolParameterType' | 'NumberParameterType' | 'UnknownParameterType' }
      )
      | (
        { id: string, nodeRelativeId: string | null, stringValue: string | null }
        & { __typename: 'StringParameterType' }
      )
    > }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type NodeGraphQueryVariables = Exact<{ [key: string]: never; }>;


export type NodeGraphQuery = (
  { instance: (
    { id: string, identifier: string, actionGroups: Array<(
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    )>, editor: (
      { graphLayout: (
        { coreNodeIds: Array<string>, ghostableContextSourceIds: Array<string>, hubIds: Array<string>, actionIds: Array<string>, outcomeIds: Array<string>, mainGraphNodeIds: Array<string>, thresholds: (
          { hubDegree: number, ghostableOutDegree: number, ghostableTotalDegree: number, ghostableAvgOutgoingSpan: number }
          & { __typename: 'GraphLayoutThresholds' }
        ) }
        & { __typename: 'GraphLayout' }
      ), edges: Array<(
        { id: string, tags: Array<string>, fromRef: (
          { nodeId: string, portId: string }
          & { __typename: 'NodePortRef' }
        ), toRef: (
          { nodeId: string, portId: string }
          & { __typename: 'NodePortRef' }
        ) }
        & { __typename: 'NodeEdgeType' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null, nodes: Array<
      | (
        { id: string, identifier: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null, quantityKind: (
          { icon: string | null, id: string, label: string }
          & { __typename: 'QuantityKindType' }
        ) | null, editor: (
          { nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, layoutMeta: (
            { primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }
            & { __typename: 'NodeGraphLayoutMeta' }
          ), spec: (
            { inputPorts: Array<(
              { id: string, label: string | null, multi: boolean, quantity: string | null, requiredDimensions: Array<string>, supportedDimensions: Array<string>, unit: (
                { id: string, short: string, standard: string }
                & { __typename: 'UnitType' }
              ) | null, bindings: Array<
                | (
                  { id: string, dataset: (
                    { id: string, identifier: string | null, name: string }
                    & { __typename: 'Dataset' }
                  ) | null, metric: (
                    { id: string, label: string }
                    & { __typename: 'DatasetMetricRefType' }
                  ) | null }
                  & { __typename: 'DatasetPortType' }
                )
                | (
                  { id: string }
                  & { __typename: 'NodeEdgeType' }
                )
              > }
              & { __typename: 'InputPortType' }
            )>, outputPorts: Array<(
              { id: string, label: string | null, quantity: string | null, columnId: string | null, dimensions: Array<string>, unit: (
                { id: string, short: string, standard: string }
                & { __typename: 'UnitType' }
              ) }
              & { __typename: 'OutputPortType' }
            )>, typeConfig:
              | (
                { nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
                & { __typename: 'ActionConfigType' }
              )
              | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
              | (
                { nodeClass: string }
                & { __typename: 'SimpleConfigType' }
              )
             }
            & { __typename: 'NodeSpecType' }
          ) | null }
          & { __typename: 'NodeEditor' }
        ) | null }
        & { __typename: 'ActionNode' }
      )
      | (
        { id: string, isOutcome: boolean, identifier: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, quantityKind: (
          { icon: string | null, id: string, label: string }
          & { __typename: 'QuantityKindType' }
        ) | null, editor: (
          { nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, layoutMeta: (
            { primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }
            & { __typename: 'NodeGraphLayoutMeta' }
          ), spec: (
            { inputPorts: Array<(
              { id: string, label: string | null, multi: boolean, quantity: string | null, requiredDimensions: Array<string>, supportedDimensions: Array<string>, unit: (
                { id: string, short: string, standard: string }
                & { __typename: 'UnitType' }
              ) | null, bindings: Array<
                | (
                  { id: string, dataset: (
                    { id: string, identifier: string | null, name: string }
                    & { __typename: 'Dataset' }
                  ) | null, metric: (
                    { id: string, label: string }
                    & { __typename: 'DatasetMetricRefType' }
                  ) | null }
                  & { __typename: 'DatasetPortType' }
                )
                | (
                  { id: string }
                  & { __typename: 'NodeEdgeType' }
                )
              > }
              & { __typename: 'InputPortType' }
            )>, outputPorts: Array<(
              { id: string, label: string | null, quantity: string | null, columnId: string | null, dimensions: Array<string>, unit: (
                { id: string, short: string, standard: string }
                & { __typename: 'UnitType' }
              ) }
              & { __typename: 'OutputPortType' }
            )>, typeConfig:
              | (
                { nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
                & { __typename: 'ActionConfigType' }
              )
              | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
              | (
                { nodeClass: string }
                & { __typename: 'SimpleConfigType' }
              )
             }
            & { __typename: 'NodeSpecType' }
          ) | null }
          & { __typename: 'NodeEditor' }
        ) | null }
        & { __typename: 'Node' }
      )
    > }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

type EditorNodeFields_ActionNode_Fragment = (
  { id: string, identifier: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: (
    { id: string, name: string, color: string | null }
    & { __typename: 'ActionGroupType' }
  ) | null, quantityKind: (
    { icon: string | null, id: string, label: string }
    & { __typename: 'QuantityKindType' }
  ) | null, editor: (
    { nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, layoutMeta: (
      { primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }
      & { __typename: 'NodeGraphLayoutMeta' }
    ), spec: (
      { inputPorts: Array<(
        { id: string, label: string | null, multi: boolean, quantity: string | null, requiredDimensions: Array<string>, supportedDimensions: Array<string>, unit: (
          { id: string, short: string, standard: string }
          & { __typename: 'UnitType' }
        ) | null, bindings: Array<
          | (
            { id: string, dataset: (
              { id: string, identifier: string | null, name: string }
              & { __typename: 'Dataset' }
            ) | null, metric: (
              { id: string, label: string }
              & { __typename: 'DatasetMetricRefType' }
            ) | null }
            & { __typename: 'DatasetPortType' }
          )
          | (
            { id: string }
            & { __typename: 'NodeEdgeType' }
          )
        > }
        & { __typename: 'InputPortType' }
      )>, outputPorts: Array<(
        { id: string, label: string | null, quantity: string | null, columnId: string | null, dimensions: Array<string>, unit: (
          { id: string, short: string, standard: string }
          & { __typename: 'UnitType' }
        ) }
        & { __typename: 'OutputPortType' }
      )>, typeConfig:
        | (
          { nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
          & { __typename: 'ActionConfigType' }
        )
        | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
        | (
          { nodeClass: string }
          & { __typename: 'SimpleConfigType' }
        )
       }
      & { __typename: 'NodeSpecType' }
    ) | null }
    & { __typename: 'NodeEditor' }
  ) | null }
  & { __typename: 'ActionNode' }
);

type EditorNodeFields_Node_Fragment = (
  { isOutcome: boolean, id: string, identifier: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, quantityKind: (
    { icon: string | null, id: string, label: string }
    & { __typename: 'QuantityKindType' }
  ) | null, editor: (
    { nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, layoutMeta: (
      { primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }
      & { __typename: 'NodeGraphLayoutMeta' }
    ), spec: (
      { inputPorts: Array<(
        { id: string, label: string | null, multi: boolean, quantity: string | null, requiredDimensions: Array<string>, supportedDimensions: Array<string>, unit: (
          { id: string, short: string, standard: string }
          & { __typename: 'UnitType' }
        ) | null, bindings: Array<
          | (
            { id: string, dataset: (
              { id: string, identifier: string | null, name: string }
              & { __typename: 'Dataset' }
            ) | null, metric: (
              { id: string, label: string }
              & { __typename: 'DatasetMetricRefType' }
            ) | null }
            & { __typename: 'DatasetPortType' }
          )
          | (
            { id: string }
            & { __typename: 'NodeEdgeType' }
          )
        > }
        & { __typename: 'InputPortType' }
      )>, outputPorts: Array<(
        { id: string, label: string | null, quantity: string | null, columnId: string | null, dimensions: Array<string>, unit: (
          { id: string, short: string, standard: string }
          & { __typename: 'UnitType' }
        ) }
        & { __typename: 'OutputPortType' }
      )>, typeConfig:
        | (
          { nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
          & { __typename: 'ActionConfigType' }
        )
        | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
        | (
          { nodeClass: string }
          & { __typename: 'SimpleConfigType' }
        )
       }
      & { __typename: 'NodeSpecType' }
    ) | null }
    & { __typename: 'NodeEditor' }
  ) | null }
  & { __typename: 'Node' }
);

export type EditorNodeFieldsFragment =
  | EditorNodeFields_ActionNode_Fragment
  | EditorNodeFields_Node_Fragment
;

export type EditorNodeEdgeFragment = (
  { id: string, tags: Array<string>, fromRef: (
    { nodeId: string, portId: string }
    & { __typename: 'NodePortRef' }
  ), toRef: (
    { nodeId: string, portId: string }
    & { __typename: 'NodePortRef' }
  ) }
  & { __typename: 'NodeEdgeType' }
);

export type DatasetPortDataQueryVariables = Exact<{
  nodeId: Scalars['ID']['input'];
}>;


export type DatasetPortDataQuery = (
  { node: (
    { id: string, editor: (
      { spec: (
        { inputPorts: Array<(
          { id: string, bindings: Array<
            | (
              { id: string, dataset: (
                { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: (
                  { repoUrl: string, commit: string | null, datasetId: string }
                  & { __typename: 'DatasetExternalRefType' }
                ) | null, dimensions: Array<(
                  { id: string, name: string, categories: Array<(
                    { uuid: string, identifier: string | null, label: string }
                    & { __typename: 'DatasetDimensionCategory' }
                  )> }
                  & { __typename: 'DatasetDimension' }
                )>, metrics: Array<(
                  { id: string, name: string | null, label: string, unit: string }
                  & { __typename: 'DatasetMetric' }
                )> }
                & { __typename: 'Dataset' }
              ) | null, metric: (
                { id: string, name: string | null, label: string }
                & { __typename: 'DatasetMetricRefType' }
              ) | null, data: Array<(
                { id: string, name: string, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
                  { id: string, short: string, long: string, htmlShort: string, htmlLong: string }
                  & { __typename: 'UnitType' }
                ), dimensions: Array<(
                  { id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<(
                    { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
                    & { __typename: 'MetricDimensionCategoryType' }
                  )>, groups: Array<(
                    { id: string, originalId: string, label: string, color: string | null, order: number | null }
                    & { __typename: 'MetricDimensionCategoryGroupType' }
                  )> }
                  & { __typename: 'MetricDimensionType' }
                )>, goals: Array<(
                  { categories: Array<string>, values: Array<(
                    { year: number, value: number }
                    & { __typename: 'MetricYearlyGoalType' }
                  )> }
                  & { __typename: 'DimensionalMetricGoalEntry' }
                )> }
                & { __typename: 'DimensionalMetricType' }
              )> }
              & { __typename: 'DatasetPortType' }
            )
            | { __typename: 'NodeEdgeType' }
          > }
          & { __typename: 'InputPortType' }
        )> }
        & { __typename: 'NodeSpecType' }
      ) | null }
      & { __typename: 'NodeEditor' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type DatasetSummaryFieldsFragment = (
  { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: (
    { repoUrl: string, commit: string | null, datasetId: string }
    & { __typename: 'DatasetExternalRefType' }
  ) | null, dimensions: Array<(
    { id: string, name: string }
    & { __typename: 'DatasetDimension' }
  )>, metrics: Array<(
    { id: string, label: string }
    & { __typename: 'DatasetMetric' }
  )> }
  & { __typename: 'Dataset' }
);

export type DatasetDetailFieldsFragment = (
  { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: (
    { repoUrl: string, commit: string | null, datasetId: string }
    & { __typename: 'DatasetExternalRefType' }
  ) | null, dimensions: Array<(
    { id: string, name: string, categories: Array<(
      { uuid: string, identifier: string | null, label: string }
      & { __typename: 'DatasetDimensionCategory' }
    )> }
    & { __typename: 'DatasetDimension' }
  )>, metrics: Array<(
    { id: string, name: string | null, label: string, unit: string, previousSibling: string | null, nextSibling: string | null }
    & { __typename: 'DatasetMetric' }
  )>, dataPoints: Array<(
    { id: string, date: any, value: number | null, metric: (
      { id: string }
      & { __typename: 'DatasetMetric' }
    ), dimensionCategories: Array<(
      { uuid: string }
      & { __typename: 'DatasetDimensionCategory' }
    )> }
    & { __typename: 'DataPoint' }
  )> }
  & { __typename: 'Dataset' }
);

export type InstanceDatasetsQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDatasetsQuery = (
  { instance: (
    { id: string, editor: (
      { datasets: Array<(
        { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, dataPoints: Array<(
          { id: string }
          & { __typename: 'DataPoint' }
        )>, externalRef: (
          { repoUrl: string, commit: string | null, datasetId: string }
          & { __typename: 'DatasetExternalRefType' }
        ) | null, dimensions: Array<(
          { id: string, name: string }
          & { __typename: 'DatasetDimension' }
        )>, metrics: Array<(
          { id: string, label: string }
          & { __typename: 'DatasetMetric' }
        )> }
        & { __typename: 'Dataset' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type InstanceDatasetQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDatasetQuery = (
  { instance: (
    { id: string, editor: (
      { datasets: Array<(
        { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: (
          { repoUrl: string, commit: string | null, datasetId: string }
          & { __typename: 'DatasetExternalRefType' }
        ) | null, dimensions: Array<(
          { id: string, name: string, categories: Array<(
            { uuid: string, identifier: string | null, label: string }
            & { __typename: 'DatasetDimensionCategory' }
          )> }
          & { __typename: 'DatasetDimension' }
        )>, metrics: Array<(
          { id: string, name: string | null, label: string, unit: string, previousSibling: string | null, nextSibling: string | null }
          & { __typename: 'DatasetMetric' }
        )>, dataPoints: Array<(
          { id: string, date: any, value: number | null, metric: (
            { id: string }
            & { __typename: 'DatasetMetric' }
          ), dimensionCategories: Array<(
            { uuid: string }
            & { __typename: 'DatasetDimensionCategory' }
          )> }
          & { __typename: 'DataPoint' }
        )> }
        & { __typename: 'Dataset' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type DataPointFieldsFragment = (
  { id: string, date: any, value: number | null, metric: (
    { id: string }
    & { __typename: 'DatasetMetric' }
  ), dimensionCategories: Array<(
    { uuid: string }
    & { __typename: 'DatasetDimensionCategory' }
  )> }
  & { __typename: 'DataPoint' }
);

export type CreateDataPointMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  datasetId: Scalars['ID']['input'];
  input: CreateDataPointInput;
}>;


export type CreateDataPointMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { createDataPoint:
        | (
          { id: string, date: any, value: number | null, metric: (
            { id: string }
            & { __typename: 'DatasetMetric' }
          ), dimensionCategories: Array<(
            { uuid: string }
            & { __typename: 'DatasetDimensionCategory' }
          )> }
          & { __typename: 'DataPoint' }
        )
        | (
          { messages: Array<(
            { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
            & { __typename: 'OperationMessage' }
          )> }
          & { __typename: 'OperationInfo' }
        )
       }
      & { __typename: 'DatasetEditorMutation' }
    ) }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type UpdateDataPointMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  datasetId: Scalars['ID']['input'];
  dataPointId: Scalars['ID']['input'];
  input: UpdateDataPointInput;
}>;


export type UpdateDataPointMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { updateDataPoint:
        | (
          { id: string, date: any, value: number | null, metric: (
            { id: string }
            & { __typename: 'DatasetMetric' }
          ), dimensionCategories: Array<(
            { uuid: string }
            & { __typename: 'DatasetDimensionCategory' }
          )> }
          & { __typename: 'DataPoint' }
        )
        | (
          { messages: Array<(
            { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
            & { __typename: 'OperationMessage' }
          )> }
          & { __typename: 'OperationInfo' }
        )
       }
      & { __typename: 'DatasetEditorMutation' }
    ) }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type DeleteDataPointMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  datasetId: Scalars['ID']['input'];
  dataPointId: Scalars['ID']['input'];
}>;


export type DeleteDataPointMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { deleteDataPoint: (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      ) | null }
      & { __typename: 'DatasetEditorMutation' }
    ) }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type InstanceDimensionFieldsFragment = (
  { id: string, identifier: string, name: string, categories: Array<(
    { id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }
    & { __typename: 'InstanceDimensionCategory' }
  )> }
  & { __typename: 'InstanceDimension' }
);

export type OperationInfoFieldsFragment = (
  { messages: Array<(
    { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
    & { __typename: 'OperationMessage' }
  )> }
  & { __typename: 'OperationInfo' }
);

export type InstanceDimensionsQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDimensionsQuery = (
  { instance: (
    { id: string, identifier: string, editor: (
      { dimensions: Array<(
        { id: string, identifier: string, name: string, categories: Array<(
          { id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }
          & { __typename: 'InstanceDimensionCategory' }
        )> }
        & { __typename: 'InstanceDimension' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type UpdateDimensionMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  input: UpdateDimensionInput;
}>;


export type UpdateDimensionMutation = (
  { instanceEditor: (
    { updateDimension:
      | (
        { id: string, identifier: string, name: string, categories: Array<(
          { id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }
          & { __typename: 'InstanceDimensionCategory' }
        )> }
        & { __typename: 'InstanceDimension' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type CreateDimensionCategoriesMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  input: Array<CreateDimensionCategoryInput>;
}>;


export type CreateDimensionCategoriesMutation = (
  { instanceEditor: (
    { createDimensionCategories:
      | (
        { id: string, identifier: string, name: string, categories: Array<(
          { id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }
          & { __typename: 'InstanceDimensionCategory' }
        )> }
        & { __typename: 'InstanceDimension' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type UpdateDimensionCategoriesMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  input: Array<UpdateDimensionCategoryInput>;
}>;


export type UpdateDimensionCategoriesMutation = (
  { instanceEditor: (
    { updateDimensionCategories:
      | (
        { id: string, identifier: string, name: string, categories: Array<(
          { id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }
          & { __typename: 'InstanceDimensionCategory' }
        )> }
        & { __typename: 'InstanceDimension' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type DeleteDimensionCategoryMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  categoryId: Scalars['UUID']['input'];
}>;


export type DeleteDimensionCategoryMutation = (
  { instanceEditor: (
    { deleteDimensionCategory: (
      { messages: Array<(
        { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
        & { __typename: 'OperationMessage' }
      )> }
      & { __typename: 'OperationInfo' }
    ) | null }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type NodeOutputDataQueryVariables = Exact<{
  nodeId: Scalars['ID']['input'];
}>;


export type NodeOutputDataQuery = (
  { node: (
    { id: string, name: string, editor: (
      { spec: (
        { outputPorts: Array<(
          { id: string, label: string | null, quantity: string | null, unit: (
            { id: string, short: string, long: string, htmlShort: string, htmlLong: string }
            & { __typename: 'UnitType' }
          ), output: (
            { id: string, name: string, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
              { id: string, short: string, long: string, htmlShort: string, htmlLong: string }
              & { __typename: 'UnitType' }
            ), dimensions: Array<(
              { id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<(
                { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
                & { __typename: 'MetricDimensionCategoryType' }
              )>, groups: Array<(
                { id: string, originalId: string, label: string, color: string | null, order: number | null }
                & { __typename: 'MetricDimensionCategoryGroupType' }
              )> }
              & { __typename: 'MetricDimensionType' }
            )>, goals: Array<(
              { categories: Array<string>, values: Array<(
                { year: number, value: number }
                & { __typename: 'MetricYearlyGoalType' }
              )> }
              & { __typename: 'DimensionalMetricGoalEntry' }
            )> }
            & { __typename: 'DimensionalMetricType' }
          ) | null }
          & { __typename: 'OutputPortType' }
        )> }
        & { __typename: 'NodeSpecType' }
      ) | null }
      & { __typename: 'NodeEditor' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type EditorOperationInfoFieldsFragment = (
  { messages: Array<(
    { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
    & { __typename: 'OperationMessage' }
  )> }
  & { __typename: 'OperationInfo' }
);

export type InstanceEditorPublishStateFragment = (
  { live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null }
  & { __typename: 'InstanceEditor' }
);

export type EditorPublishStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorPublishStateQuery = (
  { instance: (
    { id: string, editor: (
      { live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type PublishModelInstanceMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  version: InputMaybe<Scalars['UUID']['input']>;
}>;


export type PublishModelInstanceMutation = (
  { instanceEditor: (
    { publishModelInstance:
      | (
        { id: string, editor: (
          { live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null }
          & { __typename: 'InstanceEditor' }
        ) | null }
        & { __typename: 'InstanceType' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type CreateNodeMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  input: CreateNodeInput;
  version: InputMaybe<Scalars['UUID']['input']>;
}>;


export type CreateNodeMutation = (
  { instanceEditor: (
    { createNode:
      | (
        { id: string, identifier: string, name: string, uuid: string }
        & { __typename: 'ActionNode' | 'Node' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type UpdateNodeMutationVariables = Exact<{
  instanceId: Scalars['ID']['input'];
  nodeId: Scalars['ID']['input'];
  input: UpdateNodeInput;
  version: InputMaybe<Scalars['UUID']['input']>;
}>;


export type UpdateNodeMutation = (
  { instanceEditor: (
    { updateNode:
      | (
        { id: string, name: string, color: string | null, isVisible: boolean }
        & { __typename: 'ActionNode' }
      )
      | (
        { id: string, name: string, color: string | null, isVisible: boolean, isOutcome: boolean }
        & { __typename: 'Node' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, field: string | null, message: string, code: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceEditorMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type AvailableDatasetsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableDatasetsQuery = (
  { instance: (
    { id: string, editor: (
      { datasets: Array<(
        { id: string, identifier: string | null, name: string, metrics: Array<(
          { id: string, label: string, unit: string }
          & { __typename: 'DatasetMetric' }
        )> }
        & { __typename: 'Dataset' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type NodeHistoryEntryFragment = (
  { uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: any | null, after: any | null }
  & { __typename: 'InstanceModelLogEntryType' }
);

export type NodeChangeHistoryQueryVariables = Exact<{
  nodeId: Scalars['ID']['input'];
  limit?: Scalars['Int']['input'];
}>;


export type NodeChangeHistoryQuery = (
  { node: (
    { uuid: string, id: string, changeHistory: Array<(
      { uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: any | null, after: any | null }
      & { __typename: 'InstanceModelLogEntryType' }
    )> }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type ModelEditorMetricCategoryFieldsFragment = (
  { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
  & { __typename: 'MetricDimensionCategoryType' }
);

export type ModelEditorMetricDimensionFieldsFragment = (
  { id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<(
    { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
    & { __typename: 'MetricDimensionCategoryType' }
  )>, groups: Array<(
    { id: string, originalId: string, label: string, color: string | null, order: number | null }
    & { __typename: 'MetricDimensionCategoryGroupType' }
  )> }
  & { __typename: 'MetricDimensionType' }
);

export type ModelEditorDimensionalMetricFieldsFragment = (
  { id: string, name: string, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
    { id: string, short: string, long: string, htmlShort: string, htmlLong: string }
    & { __typename: 'UnitType' }
  ), dimensions: Array<(
    { id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<(
      { id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }
      & { __typename: 'MetricDimensionCategoryType' }
    )>, groups: Array<(
      { id: string, originalId: string, label: string, color: string | null, order: number | null }
      & { __typename: 'MetricDimensionCategoryGroupType' }
    )> }
    & { __typename: 'MetricDimensionType' }
  )>, goals: Array<(
    { categories: Array<string>, values: Array<(
      { year: number, value: number }
      & { __typename: 'MetricYearlyGoalType' }
    )> }
    & { __typename: 'DimensionalMetricGoalEntry' }
  )> }
  & { __typename: 'DimensionalMetricType' }
);

export type InstanceGoalOutcomeQueryVariables = Exact<{
  goal: Scalars['ID']['input'];
}>;


export type InstanceGoalOutcomeQuery = (
  { instance: (
    { id: string, goals: Array<(
      { id: string, values: Array<(
        { year: number, goal: number | null, actual: number | null, isForecast: boolean, isInterpolated: boolean | null }
        & { __typename: 'InstanceYearlyGoalType' }
      )>, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) }
      & { __typename: 'InstanceGoalEntry' }
    )> }
    & { __typename: 'InstanceType' }
  ), activeScenario: (
    { id: string }
    & { __typename: 'ScenarioType' }
  ) }
  & { __typename: 'Query' }
);

export type ActivateScenarioMutationVariables = Exact<{
  scenarioId: Scalars['ID']['input'];
}>;


export type ActivateScenarioMutation = (
  { activateScenario: (
    { ok: boolean, activeScenario: (
      { id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean }
      & { __typename: 'ScenarioType' }
    ) }
    & { __typename: 'ActivateScenarioResult' }
  ) }
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
    { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
    & { __typename: 'UnitType' }
  ), normalizedBy: (
    { id: string, name: string }
    & { __typename: 'NormalizerNodeType' }
  ) | null }
  & { __typename: 'DimensionalMetricType' }
);

export type AvailableInstancesQueryVariables = Exact<{
  hostname: Scalars['String']['input'];
}>;


export type AvailableInstancesQuery = (
  { availableInstances: Array<(
    { identifier: string, isProtected: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: (
      { basePath: string }
      & { __typename: 'InstanceHostname' }
    ) }
    & { __typename: 'InstanceBasicConfiguration' }
  )> }
  & { __typename: 'Query' }
);

export type AvailableInstanceFragment = (
  { identifier: string, isProtected: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: (
    { basePath: string }
    & { __typename: 'InstanceHostname' }
  ) }
  & { __typename: 'InstanceBasicConfiguration' }
);

type ActionParameter_BoolParameterType_Fragment = (
  { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'BoolParameterType' }
);

type ActionParameter_NumberParameterType_Fragment = (
  { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
    { id: string, htmlShort: string }
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

export type ActionParameterFragment =
  | ActionParameter_BoolParameterType_Fragment
  | ActionParameter_NumberParameterType_Fragment
  | ActionParameter_StringParameterType_Fragment
  | ActionParameter_UnknownParameterType_Fragment
;

export type DimensionalNodeMetricFragment = (
  { id: string, metricDim: (
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
      { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'ActionNode' | 'Node' }
);

export type UnitFieldsFragment = (
  { id: string, short: string, htmlShort: string, htmlLong: string }
  & { __typename: 'UnitType' }
);

type CausalGridNode_ActionNode_Fragment = (
  { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: (
    { id: string, name: string, color: string | null }
    & { __typename: 'ActionGroupType' }
  ) | null, unit: (
    { id: string, htmlShort: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, impactMetric: (
    { name: string | null, id: string | null, unit: (
      { id: string, htmlShort: string }
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
      { id: string, htmlShort: string }
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
      { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null, parameters: Array<
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    )
    | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )
  >, goals: Array<(
    { year: number, value: number }
    & { __typename: 'NodeGoal' }
  )>, metric: (
    { name: string | null, id: string | null, unit: (
      { id: string, htmlShort: string }
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
  { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: (
    { id: string, htmlShort: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, impactMetric: (
    { name: string | null, id: string | null, unit: (
      { id: string, htmlShort: string }
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
      { id: string, htmlShort: string }
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
      { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null, parameters: Array<
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    )
    | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )
  >, goals: Array<(
    { year: number, value: number }
    & { __typename: 'NodeGoal' }
  )>, metric: (
    { name: string | null, id: string | null, unit: (
      { id: string, htmlShort: string }
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

export type CausalGridNodeFragment =
  | CausalGridNode_ActionNode_Fragment
  | CausalGridNode_Node_Fragment
;

export type CausalChainQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  untilNode: InputMaybe<Scalars['ID']['input']>;
}>;


export type CausalChainQuery = (
  { action: (
    { id: string, downstreamNodes: Array<
      | (
        { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, impactMetric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null, parameters: Array<
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          )
          | (
            { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
              { id: string, htmlShort: string }
              & { __typename: 'UnitType' }
            ) | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'StringParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'UnknownParameterType' }
          )
        >, goals: Array<(
          { year: number, value: number }
          & { __typename: 'NodeGoal' }
        )>, metric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
      )
      | (
        { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, impactMetric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null, parameters: Array<
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          )
          | (
            { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
              { id: string, htmlShort: string }
              & { __typename: 'UnitType' }
            ) | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'StringParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'UnknownParameterType' }
          )
        >, goals: Array<(
          { year: number, value: number }
          & { __typename: 'NodeGoal' }
        )>, metric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
      )
    > }
    & { __typename: 'ActionNode' }
  ) | null }
  & { __typename: 'Query' }
);

export type ActionContentQueryVariables = Exact<{
  node: Scalars['ID']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  downstreamDepth: InputMaybe<Scalars['Int']['input']>;
}>;


export type ActionContentQuery = (
  { action: (
    { goal: string | null, description: string | null, decisionLevel: DecisionLevel | null, id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, dimensionalFlow: (
      { id: string, sources: Array<string>, unit: (
        { id: string, htmlLong: string }
        & { __typename: 'UnitType' }
      ), nodes: Array<(
        { id: string, label: string, color: string | null }
        & { __typename: 'FlowNodeType' }
      )>, links: Array<(
        { year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }
        & { __typename: 'FlowLinksType' }
      )> }
      & { __typename: 'DimensionalFlowType' }
    ) | null, downstreamNodes: Array<
      | (
        { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, impactMetric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null, parameters: Array<
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          )
          | (
            { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
              { id: string, htmlShort: string }
              & { __typename: 'UnitType' }
            ) | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'StringParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'UnknownParameterType' }
          )
        >, goals: Array<(
          { year: number, value: number }
          & { __typename: 'NodeGoal' }
        )>, metric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
      )
      | (
        { id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        )>, impactMetric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string }
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
            { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
            & { __typename: 'UnitType' }
          ), normalizedBy: (
            { id: string, name: string }
            & { __typename: 'NormalizerNodeType' }
          ) | null }
          & { __typename: 'DimensionalMetricType' }
        ) | null, parameters: Array<
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          )
          | (
            { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
              { id: string, htmlShort: string }
              & { __typename: 'UnitType' }
            ) | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'StringParameterType' }
          )
          | (
            { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'UnknownParameterType' }
          )
        >, goals: Array<(
          { year: number, value: number }
          & { __typename: 'NodeGoal' }
        )>, metric: (
          { name: string | null, id: string | null, unit: (
            { id: string, htmlShort: string }
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
      )
    >, body: Array<
      | (
        { id: string | null, blockType: string, field: string }
        & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
      )
      | (
        { id: string | null, blockType: string, field: string }
        & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
      )
      | (
        { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
          { title: string | null, shortDescription: string | null }
          & { __typename: 'CardListCardBlock' }
        ) | null> | null }
        & { __typename: 'CardListBlock' }
      )
      | (
        { heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: (
          { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean, configs: Array<(
            { id: string, organizationName: string | null, viewUrl: string | null, instance: (
              { id: string, name: string }
              & { __typename: 'InstanceType' }
            ) | null }
            & { __typename: 'FrameworkConfig' }
          )> }
          & { __typename: 'Framework' }
        ) | null }
        & { __typename: 'FrameworkLandingBlock' }
      )
      | (
        { value: string, rawValue: string, id: string | null, blockType: string, field: string }
        & { __typename: 'RichTextBlock' }
      )
      | (
        { value: string, id: string | null, blockType: string, field: string }
        & { __typename: 'TextBlock' }
      )
    > | null, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null, unit: (
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, impactMetric: (
      { name: string | null, id: string | null, unit: (
        { id: string, htmlShort: string }
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
        { id: string, htmlShort: string }
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
        { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
        & { __typename: 'UnitType' }
      ), normalizedBy: (
        { id: string, name: string }
        & { __typename: 'NormalizerNodeType' }
      ) | null }
      & { __typename: 'DimensionalMetricType' }
    ) | null, parameters: Array<
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      )
      | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      )
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      )
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )
    >, goals: Array<(
      { year: number, value: number }
      & { __typename: 'NodeGoal' }
    )>, metric: (
      { name: string | null, id: string | null, unit: (
        { id: string, htmlShort: string }
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

export type ActionImpactsQueryVariables = Exact<{
  impact1: Scalars['ID']['input'];
  impact2: Scalars['ID']['input'];
}>;


export type ActionImpactsQuery = (
  { energyNode: (
    { id: string, metric: (
      { id: string | null, unit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null, costNode: (
    { id: string, metric: (
      { id: string | null, unit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null, actions: Array<(
    { name: string, id: string, energy: (
      { id: string | null, cumulativeForecastValue: number | null }
      & { __typename: 'ForecastMetricType' }
    ) | null, cost: (
      { id: string | null, cumulativeForecastValue: number | null }
      & { __typename: 'ForecastMetricType' }
    ) | null }
    & { __typename: 'ActionNode' }
  )> }
  & { __typename: 'Query' }
);

export type ActionListQueryVariables = Exact<{
  goal: InputMaybe<Scalars['ID']['input']>;
}>;


export type ActionListQuery = (
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
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, parameters: Array<
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      )
      | (
        { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
          { id: string, htmlShort: string }
          & { __typename: 'UnitType' }
        ) | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      )
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'StringParameterType' }
      )
      | (
        { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'UnknownParameterType' }
      )
    >, inputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )>, impactMetric: (
      { id: string | null, name: string | null, cumulativeForecastValue: number | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, yearlyCumulativeUnit: (
        { id: string, htmlShort: string }
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
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ), costUnit: (
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, effectUnit: (
      { id: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, costNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'Node' }
    ) | null, effectNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { id: string, short: string }
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
      )> | null, impactValues: Array<(
        { value: number, year: number }
        & { __typename: 'YearlyValue' }
      ) | null> | null }
      & { __typename: 'ActionImpact' }
    )> }
    & { __typename: 'ImpactOverviewType' }
  )> }
  & { __typename: 'Query' }
);

export type ImpactOverviewsQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpactOverviewsQuery = (
  { impactOverviews: Array<(
    { id: string, graphType: string | null, label: string, costLabel: string | null, effectLabel: string | null, indicatorLabel: string | null, costCategoryLabel: string | null, effectCategoryLabel: string | null, description: string | null, stakeholderDimension: string | null, outcomeDimension: string | null, effectNode: (
      { id: string }
      & { __typename: 'Node' }
    ), effectUnit: (
      { id: string, short: string, long: string }
      & { __typename: 'UnitType' }
    ) | null, indicatorUnit: (
      { id: string, short: string, long: string }
      & { __typename: 'UnitType' }
    ), costUnit: (
      { id: string, short: string, long: string }
      & { __typename: 'UnitType' }
    ) | null, actions: Array<(
      { unitAdjustmentMultiplier: number | null, action: (
        { id: string, name: string }
        & { __typename: 'ActionNode' }
      ), effectDim: (
        { id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<(
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
          { id: string, htmlShort: string, short: string }
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

export type NodeVisualizationsQueryVariables = Exact<{
  nodeId: Scalars['ID']['input'];
}>;


export type NodeVisualizationsQuery = (
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
        { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
        & { __typename: 'UnitType' }
      ), normalizedBy: (
        { id: string, name: string }
        & { __typename: 'NormalizerNodeType' }
      ) | null }
      & { __typename: 'DimensionalMetricType' }
    ) | null, visualizations: Array<
      | (
        { id: string, label: string | null, children: Array<
          | (
            { id: string, label: string | null }
            & { __typename: 'VisualizationGroup' }
          )
          | (
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
                { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
                & { __typename: 'UnitType' }
              ), normalizedBy: (
                { id: string, name: string }
                & { __typename: 'NormalizerNodeType' }
              ) | null }
              & { __typename: 'DimensionalMetricType' }
            ) | null }
            & { __typename: 'VisualizationNodeOutput' }
          )
        > }
        & { __typename: 'VisualizationGroup' }
      )
      | (
        { id: string, label: string | null }
        & { __typename: 'VisualizationNodeOutput' }
      )
    > | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type OutcomeNodeFieldsFragment = (
  { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: (
    { id: string | null, name: string | null, unit: (
      { id: string, short: string, htmlShort: string, htmlLong: string }
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
    { id: string, short: string, htmlShort: string, htmlLong: string }
    & { __typename: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string, name: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename: 'ActionNode' | 'Node' }
  )>, upstreamActions: Array<(
    { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
      | (
        { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      )
      | (
        { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
          { id: string }
          & { __typename: 'ActionNode' | 'Node' }
        ) | null }
        & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
      )
    >, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null }
    & { __typename: 'ActionNode' }
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
      { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'Node' }
);

export type OutcomeNodeQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  goal: InputMaybe<Scalars['ID']['input']>;
  scenarios: InputMaybe<Array<Scalars['String']['input']>>;
}>;


export type OutcomeNodeQuery = (
  { node:
    | (
      { upstreamNodes: Array<
        | { __typename: 'ActionNode' }
        | (
          { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: (
            { id: string | null, name: string | null, unit: (
              { id: string, short: string, htmlShort: string, htmlLong: string }
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
            { id: string, short: string, htmlShort: string, htmlLong: string }
            & { __typename: 'UnitType' }
          ) | null, inputNodes: Array<(
            { id: string, name: string }
            & { __typename: 'ActionNode' | 'Node' }
          )>, outputNodes: Array<(
            { id: string }
            & { __typename: 'ActionNode' | 'Node' }
          )>, upstreamActions: Array<(
            { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
              | (
                { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
                  { id: string }
                  & { __typename: 'ActionNode' | 'Node' }
                ) | null }
                & { __typename: 'BoolParameterType' }
              )
              | (
                { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
                  { id: string }
                  & { __typename: 'ActionNode' | 'Node' }
                ) | null }
                & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
              )
            >, group: (
              { id: string, name: string, color: string | null }
              & { __typename: 'ActionGroupType' }
            ) | null }
            & { __typename: 'ActionNode' }
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
              { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
              & { __typename: 'UnitType' }
            ), normalizedBy: (
              { id: string, name: string }
              & { __typename: 'NormalizerNodeType' }
            ) | null }
            & { __typename: 'DimensionalMetricType' }
          ) | null }
          & { __typename: 'Node' }
        )
      > }
      & { __typename: 'ActionNode' }
    )
    | (
      { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, upstreamNodes: Array<
        | { __typename: 'ActionNode' }
        | (
          { id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: (
            { id: string | null, name: string | null, unit: (
              { id: string, short: string, htmlShort: string, htmlLong: string }
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
            { id: string, short: string, htmlShort: string, htmlLong: string }
            & { __typename: 'UnitType' }
          ) | null, inputNodes: Array<(
            { id: string, name: string }
            & { __typename: 'ActionNode' | 'Node' }
          )>, outputNodes: Array<(
            { id: string }
            & { __typename: 'ActionNode' | 'Node' }
          )>, upstreamActions: Array<(
            { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
              | (
                { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
                  { id: string }
                  & { __typename: 'ActionNode' | 'Node' }
                ) | null }
                & { __typename: 'BoolParameterType' }
              )
              | (
                { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
                  { id: string }
                  & { __typename: 'ActionNode' | 'Node' }
                ) | null }
                & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
              )
            >, group: (
              { id: string, name: string, color: string | null }
              & { __typename: 'ActionGroupType' }
            ) | null }
            & { __typename: 'ActionNode' }
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
              { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
              & { __typename: 'UnitType' }
            ), normalizedBy: (
              { id: string, name: string }
              & { __typename: 'NormalizerNodeType' }
            ) | null }
            & { __typename: 'DimensionalMetricType' }
          ) | null }
          & { __typename: 'Node' }
        )
      >, metric: (
        { id: string | null, name: string | null, unit: (
          { id: string, short: string, htmlShort: string, htmlLong: string }
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
        { id: string, short: string, htmlShort: string, htmlLong: string }
        & { __typename: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string, name: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      )>, upstreamActions: Array<(
        { id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
          | (
            { id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'BoolParameterType' }
          )
          | (
            { id: string, nodeRelativeId: string | null, isCustomized: boolean, node: (
              { id: string }
              & { __typename: 'ActionNode' | 'Node' }
            ) | null }
            & { __typename: 'NumberParameterType' | 'StringParameterType' | 'UnknownParameterType' }
          )
        >, group: (
          { id: string, name: string, color: string | null }
          & { __typename: 'ActionGroupType' }
        ) | null }
        & { __typename: 'ActionNode' }
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
          { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
          & { __typename: 'UnitType' }
        ), normalizedBy: (
          { id: string, name: string }
          & { __typename: 'NormalizerNodeType' }
        ) | null }
        & { __typename: 'DimensionalMetricType' }
      ) | null }
      & { __typename: 'Node' }
    )
   | null, activeScenario: (
    { id: string }
    & { __typename: 'ScenarioType' }
  ) }
  & { __typename: 'Query' }
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
  { id: string | null, visualizations: Array<
    | (
      { title: string, scenarioId: string, id: string | null }
      & { __typename: 'ActionImpactBlock' }
    )
    | (
      { id: string | null }
      & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' }
    )
    | (
      { id: string | null }
      & { __typename: 'RawHTMLBlock' | 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
    )
    | (
      { title: string, dimensionId: string, id: string | null }
      & { __typename: 'CategoryBreakdownBlock' }
    )
    | (
      { title: string, description: string, chartLabel: string, color: string, id: string | null }
      & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
    )
    | (
      { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
      & { __typename: 'ScenarioProgressBarBlock' }
    )
   | null> | null }
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

export type ScenarioValueFieldsFragment = (
  { value: number | null, year: number, scenario: (
    { id: string, name: string }
    & { __typename: 'ScenarioType' }
  ) }
  & { __typename: 'ScenarioValue' }
);

export type DashboardPageFieldsFragment = (
  { id: string | null, backgroundColor: string | null, introTitle: string | null, introParagraph: string | null, dashboardCards: Array<
    | (
      { id: string | null }
      & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' }
    )
    | (
      { id: string | null }
      & { __typename: 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'RichTextBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
    )
    | (
      { title: string, description: string, referenceYearValue: number | null, lastHistoricalYearValue: number | null, id: string | null, image: (
        { id: string, url: string }
        & { __typename: 'ImageObjectType' }
      ) | null, node: (
        { id: string, name: string }
        & { __typename: 'Node' }
      ), unit: (
        { id: string, short: string, htmlShort: string, htmlLong: string }
        & { __typename: 'UnitType' }
      ), goalValues: Array<(
        { year: number, value: number }
        & { __typename: 'MetricYearlyGoalType' }
      ) | null> | null, scenarioValues: Array<(
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
      ), visualizations: Array<
        | (
          { title: string, scenarioId: string, id: string | null }
          & { __typename: 'ActionImpactBlock' }
        )
        | (
          { id: string | null }
          & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' }
        )
        | (
          { id: string | null }
          & { __typename: 'RawHTMLBlock' | 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
        )
        | (
          { title: string, dimensionId: string, id: string | null }
          & { __typename: 'CategoryBreakdownBlock' }
        )
        | (
          { title: string, description: string, chartLabel: string, color: string, id: string | null }
          & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
        )
        | (
          { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
          & { __typename: 'ScenarioProgressBarBlock' }
        )
       | null> | null }
      & { __typename: 'DashboardCardBlock' }
    )
   | null> | null }
  & { __typename: 'DashboardPage' }
);

export type PageQueryVariables = Exact<{
  path: Scalars['String']['input'];
}>;


export type PageQuery = (
  { activeScenario: (
    { id: string }
    & { __typename: 'ScenarioType' }
  ), page:
    | (
      { showOnlyMunicipalActions: boolean | null, defaultSortOrder: ActionSortOrder, id: string | null, title: string, actionListLeadTitle: string | null, actionListLeadParagraph: string | null }
      & { __typename: 'ActionListPage' }
    )
    | (
      { id: string | null, title: string, backgroundColor: string | null, introTitle: string | null, introParagraph: string | null, dashboardCards: Array<
        | (
          { id: string | null }
          & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' }
        )
        | (
          { id: string | null }
          & { __typename: 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'RichTextBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
        )
        | (
          { title: string, description: string, referenceYearValue: number | null, lastHistoricalYearValue: number | null, id: string | null, image: (
            { id: string, url: string }
            & { __typename: 'ImageObjectType' }
          ) | null, node: (
            { id: string, name: string }
            & { __typename: 'Node' }
          ), unit: (
            { id: string, short: string, htmlShort: string, htmlLong: string }
            & { __typename: 'UnitType' }
          ), goalValues: Array<(
            { year: number, value: number }
            & { __typename: 'MetricYearlyGoalType' }
          ) | null> | null, scenarioValues: Array<(
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
          ), visualizations: Array<
            | (
              { title: string, scenarioId: string, id: string | null }
              & { __typename: 'ActionImpactBlock' }
            )
            | (
              { id: string | null }
              & { __typename: 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CharBlock' | 'ChoiceBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' }
            )
            | (
              { id: string | null }
              & { __typename: 'RawHTMLBlock' | 'RegexBlock' | 'RichTextBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
            )
            | (
              { title: string, dimensionId: string, id: string | null }
              & { __typename: 'CategoryBreakdownBlock' }
            )
            | (
              { title: string, description: string, chartLabel: string, color: string, id: string | null }
              & { __typename: 'CurrentProgressBarBlock' | 'GoalProgressBarBlock' | 'ReferenceProgressBarBlock' }
            )
            | (
              { title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
              & { __typename: 'ScenarioProgressBarBlock' }
            )
           | null> | null }
          & { __typename: 'DashboardCardBlock' }
        )
       | null> | null }
      & { __typename: 'DashboardPage' }
    )
    | (
      { id: string | null, title: string, body: Array<
        | (
          { id: string | null, blockType: string, field: string }
          & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'GoalProgressBarBlock' | 'ImageBlock' | 'ImageChooserBlock' | 'IntegerBlock' }
        )
        | (
          { id: string | null, blockType: string, field: string }
          & { __typename: 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TimeBlock' | 'URLBlock' }
        )
        | (
          { blockType: string, title: string | null, id: string | null, field: string, cards: Array<(
            { title: string | null, shortDescription: string | null }
            & { __typename: 'CardListCardBlock' }
          ) | null> | null }
          & { __typename: 'CardListBlock' }
        )
        | (
          { heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: (
            { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean, configs: Array<(
              { id: string, organizationName: string | null, viewUrl: string | null, instance: (
                { id: string, name: string }
                & { __typename: 'InstanceType' }
              ) | null }
              & { __typename: 'FrameworkConfig' }
            )> }
            & { __typename: 'Framework' }
          ) | null }
          & { __typename: 'FrameworkLandingBlock' }
        )
        | (
          { value: string, rawValue: string, id: string | null, blockType: string, field: string }
          & { __typename: 'RichTextBlock' }
        )
        | (
          { value: string, id: string | null, blockType: string, field: string }
          & { __typename: 'TextBlock' }
        )
       | null> | null }
      & { __typename: 'InstanceRootPage' | 'StaticPage' }
    )
    | (
      { leadTitle: string, leadParagraph: string, id: string | null, title: string, outcomeNode: (
        { id: string }
        & { __typename: 'Node' }
      ) }
      & { __typename: 'OutcomePage' }
    )
    | (
      { id: string | null, title: string }
      & { __typename: 'Page' }
    )
   | null }
  & { __typename: 'Query' }
);

export type ParametersQueryVariables = Exact<{ [key: string]: never; }>;


export type ParametersQuery = (
  { availableNormalizations: Array<(
    { id: string, label: string, isActive: boolean }
    & { __typename: 'NormalizationType' }
  )>, parameters: Array<
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    )
    | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )
  > }
  & { __typename: 'Query' }
);

export type ScenariosQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenariosQuery = (
  { scenarios: Array<(
    { id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean }
    & { __typename: 'ScenarioType' }
  )> }
  & { __typename: 'Query' }
);

export type ScenarioFragment = (
  { id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }
  & { __typename: 'ScenarioType' }
);

export type InstanceContextQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceContextQuery = (
  { instance: (
    { id: string, name: string, themeIdentifier: string | null, owner: string | null, defaultLanguage: string, supportedLanguages: Array<string>, targetYear: number | null, modelEndYear: number, referenceYear: number | null, minimumHistoricalYear: number, maximumHistoricalYear: number | null, leadTitle: string, leadParagraph: string | null, features: (
      { hideNodeDetails: boolean, maximumFractionDigits: number | null, baselineVisibleInGraphs: boolean, showAccumulatedEffects: boolean, showSignificantDigits: number | null, showRefreshPrompt: boolean }
      & { __typename: 'InstanceFeaturesType' }
    ), introContent: Array<
      | (
        { id: string | null }
        & { __typename: 'ActionImpactBlock' | 'BlockQuoteBlock' | 'BooleanBlock' | 'CallToActionBlock' | 'CardListBlock' | 'CategoryBreakdownBlock' | 'CharBlock' | 'ChoiceBlock' | 'CurrentProgressBarBlock' | 'DashboardCardBlock' | 'DateBlock' | 'DateTimeBlock' | 'DecimalBlock' | 'DocumentChooserBlock' | 'EmailBlock' | 'EmbedBlock' | 'FloatBlock' | 'FrameworkLandingBlock' | 'GoalProgressBarBlock' | 'ImageBlock' }
      )
      | (
        { id: string | null }
        & { __typename: 'ImageChooserBlock' | 'IntegerBlock' | 'ListBlock' | 'PageChooserBlock' | 'RawHTMLBlock' | 'ReferenceProgressBarBlock' | 'RegexBlock' | 'ScenarioProgressBarBlock' | 'SnippetChooserBlock' | 'StaticBlock' | 'StreamBlock' | 'StreamFieldBlock' | 'StructBlock' | 'TextBlock' | 'TimeBlock' | 'URLBlock' }
      )
      | (
        { field: string, value: string, id: string | null }
        & { __typename: 'RichTextBlock' }
      )
    > | null, goals: Array<(
      { id: string, label: string | null, default: boolean, disabled: boolean, outcomeNode: (
        { id: string }
        & { __typename: 'Node' }
      ), dimensions: Array<(
        { dimension: string, categories: Array<string>, groups: Array<string> }
        & { __typename: 'InstanceGoalDimension' }
      )> }
      & { __typename: 'InstanceGoalEntry' }
    )>, actionListPage: (
      { id: string | null, showInMenus: boolean }
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
  )>, footerPages: Array<(
    { id: string | null, title: string, urlPath: string, parent: (
      { id: string | null }
      & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
    ) | null }
    & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
  )>, additionalLinkPages: Array<(
    { id: string | null, title: string, urlPath: string, parent: (
      { id: string | null }
      & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
    ) | null }
    & { __typename: 'ActionListPage' | 'DashboardPage' | 'InstanceRootPage' | 'OutcomePage' | 'Page' | 'StaticPage' }
  )>, parameters: Array<
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    )
    | (
      { minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: (
        { id: string, htmlShort: string }
        & { __typename: 'UnitType' }
      ) | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'StringParameterType' }
    )
    | (
      { id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node: (
        { id: string }
        & { __typename: 'ActionNode' | 'Node' }
      ) | null }
      & { __typename: 'UnknownParameterType' }
    )
  > }
  & { __typename: 'Query' }
);

type VisualizationEntry_VisualizationGroup_Fragment = (
  { id: string, label: string | null }
  & { __typename: 'VisualizationGroup' }
);

type VisualizationEntry_VisualizationNodeOutput_Fragment = (
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
      { id: string, htmlShort: string, short: string, htmlLong: string, long: string }
      & { __typename: 'UnitType' }
    ), normalizedBy: (
      { id: string, name: string }
      & { __typename: 'NormalizerNodeType' }
    ) | null }
    & { __typename: 'DimensionalMetricType' }
  ) | null }
  & { __typename: 'VisualizationNodeOutput' }
);

export type VisualizationEntryFragment =
  | VisualizationEntry_VisualizationGroup_Fragment
  | VisualizationEntry_VisualizationNodeOutput_Fragment
;
