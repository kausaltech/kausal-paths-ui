/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type ActionConfigInput = {
  decisionLevel?: DecisionLevel | null | undefined;
  group?: string | null | undefined;
  noEffectValue?: number | null | undefined;
  nodeClass: string;
  parent?: string | null | undefined;
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

export type AssignDimensionInput = {
  category: string;
  dimension: string;
};

/** Bind a dataset metric to an existing input port on a node. */
export type BindDatasetInput = {
  /** UUID or identifier of the dataset to bind. */
  datasetId: string | number;
  /** Dataset metric this binding carries. May be omitted only when the dataset exposes exactly one metric. */
  metricId?: string | number | null | undefined;
  /** Input port to bind to. The port must already exist. */
  portId: string | number;
  /** Atomically displace whatever occupies the port — an edge or a dataset binding — instead of rejecting the bind. Validation runs first, so a rejected bind leaves the old binding untouched. Not valid for `multi` ports; delete a specific binding there. */
  replace?: boolean;
  /** Transformations to apply. When omitted, a working default list is generated; an explicit empty list means none, which a metric-named binding rejects. */
  transformations?: Array<DatasetTransformationInput> | null | undefined;
};

export enum ChangeTargetKind {
  ActionGroup = 'ACTION_GROUP',
  DatasetPort = 'DATASET_PORT',
  DataPoint = 'DATA_POINT',
  Dimension = 'DIMENSION',
  DimensionCategory = 'DIMENSION_CATEGORY',
  Edge = 'EDGE',
  Instance = 'INSTANCE',
  Node = 'NODE',
  Unknown = 'UNKNOWN'
}

export type CreateDataPointCommentInput = {
  isReview?: boolean;
  isSticky?: boolean;
  reviewState?: DataPointCommentReviewState | null | undefined;
  text: string;
};

export type CreateDataPointInput = {
  date: string;
  dimensionCategoryIds?: Array<string> | null | undefined;
  metricId: string;
  value?: number | null | undefined;
};

export type CreateDataSourceInput = {
  authority?: string | null | undefined;
  description?: string | null | undefined;
  edition?: string | null | undefined;
  name: string;
  url?: string | null | undefined;
};

export type CreateDatasetInput = {
  /** UUIDs of instance dimensions the data points are categorized by, in column order. */
  dimensions?: Array<string>;
  /** Optional UUID for the new dataset. */
  id?: string | null | undefined;
  /** Optional identifier, unique within the instance. */
  identifier?: string | null | undefined;
  /** Metrics (value columns) of the dataset; at least one is required. */
  metrics: Array<CreateDatasetMetricInput>;
  name: string;
};

export type CreateDatasetMetricInput = {
  /** Optional UUID for the new metric. */
  id?: string | null | undefined;
  label: string;
  /** Quantity-kind identifier of what the metric measures. Null means any quantity. */
  quantity?: string | number | null | undefined;
  unit?: string;
};

export type CreateDatasetSourceReferenceInput = {
  dataPointId?: string | null | undefined;
  dataSourceId: string;
  toDataset?: boolean;
};

export type CreateDimensionCategoryInput = {
  dimensionId: string;
  id?: string | null | undefined;
  identifier?: string | null | undefined;
  label: string;
  nextSibling?: string | number | null | undefined;
  previousSibling?: string | number | null | undefined;
};

export type CreateDimensionInput = {
  categories?: Array<DimensionCategoryItemInput>;
  /** Optional UUID for the new dimension. */
  id?: string | null | undefined;
  identifier: string;
  name: string;
};

export type CreateEdgeInput = {
  fromRef: NodePortRefInput;
  instanceId: string | number;
  portRef: NodePortRefInput;
  /** Atomically displace whatever occupies the target port — an edge or a dataset binding — instead of rejecting the edge. Validation runs first, so a rejected edge leaves the old binding untouched. Requires an explicit `portRef.portId` (an auto-selected port is never occupied) and is not valid for `multi` ports. */
  replace?: boolean;
  transformations?: Array<EdgeTransformationInput> | null | undefined;
};

export type CreateInstanceInput = {
  frameworkId: string;
  identifier: string;
  name: string;
  organizationName: string;
};

export type CreateNodeInput = {
  allowNulls?: boolean;
  color?: string | null | undefined;
  config: NodeConfigInput;
  description?: string | null | undefined;
  i18n?: Record<string, unknown> | unknown[] | null | undefined;
  identifier: string | number;
  inputDimensions?: Array<string> | null | undefined;
  inputPorts?: Array<InputPortInput> | null | undefined;
  isOutcome?: boolean;
  isVisible?: boolean;
  kind?: NodeKind;
  minimumYear?: number | null | undefined;
  name?: string;
  nodeGroup?: string | number | null | undefined;
  order?: number | null | undefined;
  outputDimensions?: Array<string> | null | undefined;
  outputMetrics?: Array<OutputMetricInput> | null | undefined;
  outputPorts?: Array<OutputPortInput> | null | undefined;
  params?: Record<string, unknown> | unknown[] | null | undefined;
  shortDescription?: string | null | undefined;
  shortName?: string | null | undefined;
  tags?: Array<string> | null | undefined;
};

export enum DataPointCommentReviewState {
  Resolved = 'RESOLVED',
  Unresolved = 'UNRESOLVED'
}

/** BLOCK_EDIT rules reject mutations that introduce new violations; BLOCK_PUBLISH rules allow edits but block publication while violations remain. */
export enum DatasetRuleEnforcement {
  BlockEdit = 'BLOCK_EDIT',
  BlockPublish = 'BLOCK_PUBLISH'
}

/** Exactly one transformation of a dataset binding. Order in the containing list is execution order. */
export type DatasetTransformationInput =
  {   assignDimension: AssignDimensionInput; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never;   dropNulls: boolean; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never;   ensureUnit: EnsureUnitInput; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never;   filterColumn: FilterColumnInput; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never;   filterDimension: FilterDimensionInput; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never;   filterTemporal: FilterTemporalInput; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never;   indexTemporal: boolean; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never;   remapLegacyYears: boolean; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never;   renameColumn: RenameColumnInput; renameItem?: never; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never;   renameItem: RenameItemInput; selectMetric?: never; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never;   selectMetric: boolean; setForecastFrom?: never; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never;   setForecastFrom: SetForecastFromInput; tagOperation?: never; }
  |  { assignDimension?: never; dropNulls?: never; ensureUnit?: never; filterColumn?: never; filterDimension?: never; filterTemporal?: never; indexTemporal?: never; remapLegacyYears?: never; renameColumn?: never; renameItem?: never; selectMetric?: never; setForecastFrom?: never;   tagOperation: TagOperationInput; };

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

export type DimensionCategoryItemInput = {
  id?: string | null | undefined;
  identifier?: string | null | undefined;
  label: string;
};

export enum DimensionKind {
  Common = 'COMMON',
  Node = 'NODE',
  Scenario = 'SCENARIO'
}

/** Exactly one transformation of an edge binding. Order in the containing list is execution order. Only the dimension-reshaping transformations are accepted until edges execute the shared transform pipeline. */
export type EdgeTransformationInput =
  {   assignDimension: AssignDimensionInput; filterDimension?: never; }
  |  { assignDimension?: never;   filterDimension: FilterDimensionInput; };

export type EnsureUnitInput = {
  unit: string;
};

export type FilterColumnInput = {
  column: string;
  dropCol?: boolean;
  exclude?: boolean;
  flatten?: boolean;
  ref?: string | null | undefined;
  value?: string | null | undefined;
  values?: Array<string>;
};

export type FilterDimensionInput = {
  categories?: Array<string>;
  dimension: string;
  exclude?: boolean;
  flatten?: boolean;
  groups?: Array<string>;
};

export type FilterTemporalInput = {
  maxYear?: number | null | undefined;
  minYear?: number | null | undefined;
};

export type FormulaConfigInput = {
  formula: string;
};

export type InputPortInput = {
  id?: string | null | undefined;
  identifier?: string | null | undefined;
  /** Null keeps the existing value when `id` names an existing port; defaults to true for new ports. */
  isEditable?: boolean | null | undefined;
  /** Written into the active request locale; translations in other languages are preserved when `id` names an existing port. */
  label?: string | null | undefined;
  multi?: boolean;
  quantity?: string | null | undefined;
  requiredDimensions?: Array<string> | null | undefined;
  /** Semantic role from the node class's input port declarations. Null keeps the existing role when `id` names an existing port. */
  role?: string | null | undefined;
  unit?: string | null | undefined;
};

export enum InstanceMemberRole {
  Admin = 'ADMIN',
  Reviewer = 'REVIEWER',
  SuperAdmin = 'SUPER_ADMIN',
  Viewer = 'VIEWER'
}

export type NodeConfigInput =
  {   action: ActionConfigInput; formula?: never; pipeline?: never; simple?: never; }
  |  { action?: never;   formula: FormulaConfigInput; pipeline?: never; simple?: never; }
  |  { action?: never; formula?: never;   pipeline: PipelineConfigInput; simple?: never; }
  |  { action?: never; formula?: never; pipeline?: never;   simple: SimpleConfigInput; };

export enum NodeErrorPhase {
  Computation = 'COMPUTATION',
  Initialization = 'INITIALIZATION'
}

export enum NodeKind {
  Action = 'ACTION',
  Formula = 'FORMULA',
  Pipeline = 'PIPELINE',
  Simple = 'SIMPLE'
}

export enum NodeLayoutSource {
  Auto = 'AUTO',
  User = 'USER'
}

export type NodePortRefInput = {
  nodeUuid: string;
  /** Omit to let the server choose. On the source side that is the node's only output port; on the target side a free matching port is reused, or a new one is instantiated from the node class's port declarations. */
  portId?: string | null | undefined;
};

export enum NodeStatus {
  Degraded = 'DEGRADED',
  Failed = 'FAILED',
  Incomplete = 'INCOMPLETE',
  Ok = 'OK'
}

export enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
}

export type OutputMetricInput = {
  columnId?: string | null | undefined;
  id: string;
  label?: string | null | undefined;
  portId?: string | null | undefined;
  quantity?: string | null | undefined;
  unit: string;
};

export type OutputPortInput = {
  columnId?: string | null | undefined;
  dimensions?: Array<string> | null | undefined;
  id?: string | null | undefined;
  identifier?: string | null | undefined;
  /** Null keeps the existing value when `id` names an existing port; defaults to true for new ports. */
  isEditable?: boolean | null | undefined;
  /** Written into the active request locale; translations in other languages are preserved when `id` names an existing port. */
  label?: string | null | undefined;
  quantity?: string | null | undefined;
  /** Semantic role from the node class's output port declarations. Null keeps the existing role when `id` names an existing port. */
  role?: string | null | undefined;
  unit: string;
};

export type PipelineConfigInput = {
  operations?: Array<PipelineOperationInput>;
};

export type PipelineOperationInput = {
  operation: string;
};

export enum PrimaryLayoutClass {
  Action = 'ACTION',
  ContextSource = 'CONTEXT_SOURCE',
  Core = 'CORE',
  GhostableContextSource = 'GHOSTABLE_CONTEXT_SOURCE',
  Outcome = 'OUTCOME'
}

/** How a problem is presented; every problem blocks publication. */
export enum ProblemSeverity {
  Error = 'ERROR',
  Warning = 'WARNING'
}

export type RegisterUserInput = {
  email: string;
  firstName?: string | null | undefined;
  frameworkId?: string | number | null | undefined;
  invitationToken?: string | null | undefined;
  lastName?: string | null | undefined;
  password: string;
};

export type RenameColumnInput = {
  column: string;
  newName?: string | null | undefined;
};

export type RenameItemInput = {
  column: string;
  newItem: string;
  oldItem: string;
};

export enum ScenarioKind {
  Baseline = 'BASELINE',
  Custom = 'CUSTOM',
  Default = 'DEFAULT',
  ProgressTracking = 'PROGRESS_TRACKING'
}

export type SetForecastFromInput = {
  year: number;
};

export type SimpleConfigInput = {
  nodeClass: string;
};

export type TagOperationInput = {
  tag: string;
};

export type UpdateDataPointInput = {
  date?: string | null | undefined;
  dimensionCategoryIds?: Array<string> | null | undefined;
  metricId?: string | null | undefined;
  value?: number | null | undefined;
};

export type UpdateDataPointItemInput = {
  dataPointId: string | number;
  input: UpdateDataPointInput;
};

/** Change what a dataset binding carries or does. */
export type UpdateDatasetBindingInput = {
  metricId?: string | number | null | undefined;
  tags?: Array<string> | null | undefined;
  /** Replaces the whole list; order is execution order. */
  transformations?: Array<DatasetTransformationInput> | null | undefined;
};

export type UpdateDatasetInput = {
  datasetId: string;
  identifier?: string | null | undefined;
  name?: string | null | undefined;
};

export type UpdateDatasetMetricInput = {
  label?: string | null | undefined;
  /** Quantity-kind identifier of what the metric measures. Set to null to clear. */
  quantity?: string | number | null | undefined;
  unit?: string | null | undefined;
};

export type UpdateDimensionCategoryInput = {
  categoryId: string;
  identifier?: string | null | undefined;
  label?: string | null | undefined;
  nextSibling?: string | number | null | undefined;
  previousSibling?: string | number | null | undefined;
};

export type UpdateDimensionInput = {
  dimensionId: string;
  name?: string | null | undefined;
};

/** Change what an edge binding does. */
export type UpdateEdgeBindingInput = {
  tags?: Array<string> | null | undefined;
  /** Replaces the whole list; order is execution order. */
  transformations?: Array<EdgeTransformationInput> | null | undefined;
};

/** Partial update of one input port. Unset fields are left untouched. */
export type UpdateInputPortInput = {
  identifier?: string | null | undefined;
  isEditable?: boolean | null | undefined;
  /** Written into the active request locale; translations in other languages are preserved. */
  label?: string | null | undefined;
  multi?: boolean | null | undefined;
  quantity?: string | null | undefined;
  requiredDimensions?: Array<string> | null | undefined;
  role?: string | null | undefined;
  unit?: string | null | undefined;
};

export type UpdateNodeInput = {
  allowNulls?: boolean | null | undefined;
  color?: string | null | undefined;
  config?: NodeConfigInput | null | undefined;
  description?: string | null | undefined;
  i18n?: Record<string, unknown> | unknown[] | null | undefined;
  inputDimensions?: Array<string> | null | undefined;
  inputPorts?: Array<InputPortInput> | null | undefined;
  isOutcome?: boolean | null | undefined;
  isVisible?: boolean | null | undefined;
  kind?: NodeKind | null | undefined;
  minimumYear?: number | null | undefined;
  name?: string | null | undefined;
  nodeGroup?: string | number | null | undefined;
  order?: number | null | undefined;
  outputDimensions?: Array<string> | null | undefined;
  outputMetrics?: Array<OutputMetricInput> | null | undefined;
  outputPorts?: Array<OutputPortInput> | null | undefined;
  params?: Record<string, unknown> | unknown[] | null | undefined;
  shortDescription?: string | null | undefined;
  shortName?: string | null | undefined;
  tags?: Array<string> | null | undefined;
};

export type UpdateNodeLayoutInput = {
  nodeId: string | number;
  source?: NodeLayoutSource;
  x: number;
  y: number;
};

/** Partial update of one output port. Unset fields are left untouched. */
export type UpdateOutputPortInput = {
  columnId?: string | null | undefined;
  dimensions?: Array<string> | null | undefined;
  identifier?: string | null | undefined;
  isEditable?: boolean | null | undefined;
  /** Written into the active request locale; translations in other languages are preserved. */
  label?: string | null | undefined;
  quantity?: string | null | undefined;
  role?: string | null | undefined;
  unit?: string | null | undefined;
};

export type CytoscapeNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type CytoscapeNodesQuery = { __typename: 'Query', nodes: Array<
    | { __typename: 'ActionNode', id: string, name: string, color: string | null, quantity: string | null, isVisible: boolean, parentAction: { __typename: 'ActionNode', id: string } | null, subactions: Array<{ __typename: 'ActionNode', id: string }>, group: { __typename: 'ActionGroupType', id: string, color: string | null } | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      >, outputNodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      >, metric: { __typename: 'ForecastMetricType', id: string | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null }
    | { __typename: 'Node', id: string, name: string, color: string | null, quantity: string | null, isVisible: boolean, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      >, outputNodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      >, metric: { __typename: 'ForecastMetricType', id: string | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null }
  > };

export type NodePageQueryVariables = Exact<{
  node: string | number;
  scenarios?: Array<string> | null | undefined;
}>;


export type NodePageQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, description: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
        | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
        | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
      >, outputNodes: Array<
        | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
        | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
      >, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
    | { __typename: 'Node', id: string, name: string, shortDescription: string | null, description: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
        | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
        | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
      >, outputNodes: Array<
        | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
        | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null }
      >, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
   | null };

export type CreateInstanceFrameworkNameQueryVariables = Exact<{
  identifier: string | number;
}>;


export type CreateInstanceFrameworkNameQuery = { __typename: 'Query', framework: { __typename: 'Framework', id: string, name: string } | null };

export type CreateInstanceMutationVariables = Exact<{
  input: CreateInstanceInput;
}>;


export type CreateInstanceMutation = { __typename: 'Mutation', createInstance:
    | { __typename: 'CreateInstanceResult', instanceId: string, instanceName: string }
    | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, message: string, field: string | null }> }
   };

export type CreateInstanceEditUrlQueryVariables = Exact<{
  frameworkId: string | number;
}>;


export type CreateInstanceEditUrlQuery = { __typename: 'Query', me: { __typename: 'User', id: string, editableInstances: Array<{ __typename: 'InstanceType', id: string, identifier: string, frameworkConfig: { __typename: 'FrameworkConfig', id: string, viewUrl: string | null } | null }> } | null };

export type FrameworkNameQueryVariables = Exact<{
  identifier: string | number;
}>;


export type FrameworkNameQuery = { __typename: 'Query', framework: { __typename: 'Framework', id: string, name: string } | null };

export type RegisterUserMutationVariables = Exact<{
  input: RegisterUserInput;
}>;


export type RegisterUserMutation = { __typename: 'Mutation', registerUser:
    | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, message: string, field: string | null }> }
    | { __typename: 'RegisterUserResult', userId: string, email: string }
   };

export type ModelEditorLandingDataQueryVariables = Exact<{ [key: string]: never; }>;


export type ModelEditorLandingDataQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, siteTitle: string, users: Array<{ __typename: 'InstanceMember', user: { __typename: 'User', id: string } }>, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string, uuid: string, name: string }
        | { __typename: 'Node', id: string, uuid: string, name: string }
      > }, editor: { __typename: 'InstanceEditor', live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null, latestChange: Array<{ __typename: 'InstanceChangeOperationType', uuid: string, createdAt: string }>, constraintConflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', nodeUuid: string | null }>, value: { __typename: 'ConstraintValueRef', nodeUuid: string | null } | null }> } | null }, scenarios: Array<{ __typename: 'ScenarioType', id: string, identifier: string, name: string, isDefault: boolean, allActionsEnabled: boolean }>, parameters: Array<
    | { __typename: 'BoolParameterType', id: string, label: string | null, boolDefault: boolean | null }
    | { __typename: 'NumberParameterType', id: string, label: string | null, numberDefault: number | null, unit: { __typename: 'UnitType', id: string, short: string } | null }
    | { __typename: 'StringParameterType', id: string, label: string | null, stringDefault: string | null }
    | { __typename: 'UnknownParameterType', id: string, label: string | null }
  > };

export type MyEditableInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyEditableInstancesQuery = { __typename: 'Query', me: { __typename: 'User', id: string, email: string, editableInstances: Array<{ __typename: 'InstanceType', id: string, identifier: string, name: string, siteTitle: string, themeIdentifier: string | null, frameworkConfig: { __typename: 'FrameworkConfig', id: string, organizationName: string | null, viewUrl: string | null } | null }> } | null };

export type InstanceUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceUsersQuery = { __typename: 'Query', me: { __typename: 'User', id: string, email: string, firstName: string, lastName: string } | null, instance: { __typename: 'InstanceType', id: string, users: Array<{ __typename: 'InstanceMember', isOwner: boolean, role: InstanceMemberRole, user: { __typename: 'User', id: string, email: string, firstName: string, lastName: string } }>, invitations: Array<{ __typename: 'InstanceInvitation', id: string, email: string, expiresAt: string, createdAt: string }> } };

export type AddUserToInstanceMutationVariables = Exact<{
  instanceId: string | number;
  email: string;
}>;


export type AddUserToInstanceMutation = { __typename: 'Mutation', instanceAdmin: { __typename: 'InstanceAdminMutation', addUserToInstance:
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, message: string, field: string | null }> }
      | { __typename: 'User', id: string, email: string, firstName: string, lastName: string }
      | { __typename: 'UserNotFoundError', email: string }
     } };

export type RemoveInvitationMutationVariables = Exact<{
  instanceId: string | number;
  invitationId: string | number;
}>;


export type RemoveInvitationMutation = { __typename: 'Mutation', instanceAdmin: { __typename: 'InstanceAdminMutation', removeInvitation: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, message: string, field: string | null }> } | null } };

export type InviteUserToInstanceMutationVariables = Exact<{
  instanceId: string | number;
  email: string;
}>;


export type InviteUserToInstanceMutation = { __typename: 'Mutation', instanceAdmin: { __typename: 'InstanceAdminMutation', inviteUserToInstance:
      | { __typename: 'InstanceInvitation', id: string, email: string, expiresAt: string }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, message: string, field: string | null }> }
     } };

export type CanEditModelQueryVariables = Exact<{ [key: string]: never; }>;


export type CanEditModelQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      > } } };

type StreamField_ActionImpactBlock_Fragment = { __typename: 'ActionImpactBlock', id: string | null, blockType: string, field: string };

type StreamField_BlockQuoteBlock_Fragment = { __typename: 'BlockQuoteBlock', id: string | null, blockType: string, field: string };

type StreamField_BooleanBlock_Fragment = { __typename: 'BooleanBlock', id: string | null, blockType: string, field: string };

type StreamField_CallToActionBlock_Fragment = { __typename: 'CallToActionBlock', id: string | null, blockType: string, field: string };

type StreamField_CardListBlock_Fragment = { __typename: 'CardListBlock', blockType: string, title: string | null, id: string | null, field: string, cards: Array<{ __typename: 'CardListCardBlock', title: string | null, shortDescription: string | null } | null> | null };

type StreamField_CategoryBreakdownBlock_Fragment = { __typename: 'CategoryBreakdownBlock', id: string | null, blockType: string, field: string };

type StreamField_CharBlock_Fragment = { __typename: 'CharBlock', id: string | null, blockType: string, field: string };

type StreamField_ChoiceBlock_Fragment = { __typename: 'ChoiceBlock', id: string | null, blockType: string, field: string };

type StreamField_CurrentProgressBarBlock_Fragment = { __typename: 'CurrentProgressBarBlock', id: string | null, blockType: string, field: string };

type StreamField_DashboardCardBlock_Fragment = { __typename: 'DashboardCardBlock', id: string | null, blockType: string, field: string };

type StreamField_DateBlock_Fragment = { __typename: 'DateBlock', id: string | null, blockType: string, field: string };

type StreamField_DateTimeBlock_Fragment = { __typename: 'DateTimeBlock', id: string | null, blockType: string, field: string };

type StreamField_DecimalBlock_Fragment = { __typename: 'DecimalBlock', id: string | null, blockType: string, field: string };

type StreamField_DocumentChooserBlock_Fragment = { __typename: 'DocumentChooserBlock', id: string | null, blockType: string, field: string };

type StreamField_EmailBlock_Fragment = { __typename: 'EmailBlock', id: string | null, blockType: string, field: string };

type StreamField_EmbedBlock_Fragment = { __typename: 'EmbedBlock', id: string | null, blockType: string, field: string };

type StreamField_FloatBlock_Fragment = { __typename: 'FloatBlock', id: string | null, blockType: string, field: string };

type StreamField_FrameworkLandingBlock_Fragment = { __typename: 'FrameworkLandingBlock', heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: { __typename: 'Framework', id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean } | null };

type StreamField_GoalProgressBarBlock_Fragment = { __typename: 'GoalProgressBarBlock', id: string | null, blockType: string, field: string };

type StreamField_ImageBlock_Fragment = { __typename: 'ImageBlock', id: string | null, blockType: string, field: string };

type StreamField_ImageChooserBlock_Fragment = { __typename: 'ImageChooserBlock', id: string | null, blockType: string, field: string };

type StreamField_IntegerBlock_Fragment = { __typename: 'IntegerBlock', id: string | null, blockType: string, field: string };

type StreamField_ListBlock_Fragment = { __typename: 'ListBlock', id: string | null, blockType: string, field: string };

type StreamField_PageChooserBlock_Fragment = { __typename: 'PageChooserBlock', id: string | null, blockType: string, field: string };

type StreamField_RawHtmlBlock_Fragment = { __typename: 'RawHTMLBlock', id: string | null, blockType: string, field: string };

type StreamField_ReferenceProgressBarBlock_Fragment = { __typename: 'ReferenceProgressBarBlock', id: string | null, blockType: string, field: string };

type StreamField_RegexBlock_Fragment = { __typename: 'RegexBlock', id: string | null, blockType: string, field: string };

type StreamField_RichTextBlock_Fragment = { __typename: 'RichTextBlock', value: string, rawValue: string, id: string | null, blockType: string, field: string };

type StreamField_ScenarioProgressBarBlock_Fragment = { __typename: 'ScenarioProgressBarBlock', id: string | null, blockType: string, field: string };

type StreamField_SnippetChooserBlock_Fragment = { __typename: 'SnippetChooserBlock', id: string | null, blockType: string, field: string };

type StreamField_StaticBlock_Fragment = { __typename: 'StaticBlock', id: string | null, blockType: string, field: string };

type StreamField_StreamBlock_Fragment = { __typename: 'StreamBlock', id: string | null, blockType: string, field: string };

type StreamField_StreamFieldBlock_Fragment = { __typename: 'StreamFieldBlock', id: string | null, blockType: string, field: string };

type StreamField_StructBlock_Fragment = { __typename: 'StructBlock', id: string | null, blockType: string, field: string };

type StreamField_TextBlock_Fragment = { __typename: 'TextBlock', value: string, id: string | null, blockType: string, field: string };

type StreamField_TimeBlock_Fragment = { __typename: 'TimeBlock', id: string | null, blockType: string, field: string };

type StreamField_UrlBlock_Fragment = { __typename: 'URLBlock', id: string | null, blockType: string, field: string };

export type StreamFieldFragment =
  | StreamField_ActionImpactBlock_Fragment
  | StreamField_BlockQuoteBlock_Fragment
  | StreamField_BooleanBlock_Fragment
  | StreamField_CallToActionBlock_Fragment
  | StreamField_CardListBlock_Fragment
  | StreamField_CategoryBreakdownBlock_Fragment
  | StreamField_CharBlock_Fragment
  | StreamField_ChoiceBlock_Fragment
  | StreamField_CurrentProgressBarBlock_Fragment
  | StreamField_DashboardCardBlock_Fragment
  | StreamField_DateBlock_Fragment
  | StreamField_DateTimeBlock_Fragment
  | StreamField_DecimalBlock_Fragment
  | StreamField_DocumentChooserBlock_Fragment
  | StreamField_EmailBlock_Fragment
  | StreamField_EmbedBlock_Fragment
  | StreamField_FloatBlock_Fragment
  | StreamField_FrameworkLandingBlock_Fragment
  | StreamField_GoalProgressBarBlock_Fragment
  | StreamField_ImageBlock_Fragment
  | StreamField_ImageChooserBlock_Fragment
  | StreamField_IntegerBlock_Fragment
  | StreamField_ListBlock_Fragment
  | StreamField_PageChooserBlock_Fragment
  | StreamField_RawHtmlBlock_Fragment
  | StreamField_ReferenceProgressBarBlock_Fragment
  | StreamField_RegexBlock_Fragment
  | StreamField_RichTextBlock_Fragment
  | StreamField_ScenarioProgressBarBlock_Fragment
  | StreamField_SnippetChooserBlock_Fragment
  | StreamField_StaticBlock_Fragment
  | StreamField_StreamBlock_Fragment
  | StreamField_StreamFieldBlock_Fragment
  | StreamField_StructBlock_Fragment
  | StreamField_TextBlock_Fragment
  | StreamField_TimeBlock_Fragment
  | StreamField_UrlBlock_Fragment
;

export type FrameworkConfigsQueryVariables = Exact<{
  identifier: string | number;
  clientUrl?: string | null | undefined;
}>;


export type FrameworkConfigsQuery = { __typename: 'Query', framework: { __typename: 'Framework', id: string, configs: Array<{ __typename: 'FrameworkConfig', id: string, organizationName: string | null, viewUrl: string | null, instance: { __typename: 'InstanceType', id: string, identifier: string, name: string } | null }> } | null };

export type SetNormalizationFromWidgetMutationVariables = Exact<{
  id?: string | number | null | undefined;
}>;


export type SetNormalizationFromWidgetMutation = { __typename: 'Mutation', setNormalizer: { __typename: 'SetNormalizerMutation', ok: boolean } };

export type SetParameterMutationVariables = Exact<{
  parameterId: string | number;
  boolValue?: boolean | null | undefined;
  numberValue?: number | null | undefined;
  stringValue?: string | null | undefined;
}>;


export type SetParameterMutation = { __typename: 'Mutation', setParameter: { __typename: 'SetParameterResult', ok: boolean, parameter:
      | { __typename: 'BoolParameterType', id: string, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null }
      | { __typename: 'NumberParameterType', id: string, isCustomized: boolean }
      | { __typename: 'StringParameterType', id: string, isCustomized: boolean }
      | { __typename: 'UnknownParameterType', id: string, isCustomized: boolean }
     | null } };

export type DimensionalPlotFragment = { __typename: 'DimensionalFlowType', id: string, sources: Array<string>, unit: { __typename: 'UnitType', id: string, htmlLong: string }, nodes: Array<{ __typename: 'FlowNodeType', id: string, label: string, color: string | null }>, links: Array<{ __typename: 'FlowLinksType', year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }> };

export type ModelEditorAccessQueryVariables = Exact<{ [key: string]: never; }>;


export type ModelEditorAccessQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor' } | null } };

export type EditorNodeSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorNodeSearchListQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string, identifier: string, name: string }
        | { __typename: 'Node', isOutcome: boolean, id: string, identifier: string, name: string }
      > } } };

export type EditorDatasetSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorDatasetSearchListQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', datasets: Array<{ __typename: 'Dataset', id: string, identifier: string | null, name: string }> } | null } };

export type EditorActiveScenarioQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorActiveScenarioQuery = { __typename: 'Query', activeScenario: { __typename: 'ScenarioType', id: string, name: string } };

export type EditorDimensionSearchListQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorDimensionSearchListQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', dimensions: Array<{ __typename: 'InstanceDimension', id: string, identifier: string, name: string }> } | null } };

export type SetActionEnabledMutationVariables = Exact<{
  parameterId: string | number;
  enabled: boolean;
}>;


export type SetActionEnabledMutation = { __typename: 'Mutation', setParameter: { __typename: 'SetParameterResult', ok: boolean, parameter:
      | { __typename: 'BoolParameterType', id: string, boolValue: boolean | null }
      | { __typename: 'NumberParameterType', id: string }
      | { __typename: 'StringParameterType', id: string }
      | { __typename: 'UnknownParameterType', id: string }
     | null } };

export type DatasetPortDataQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type DatasetPortDataQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, editor: { __typename: 'NodeEditor', spec: { __typename: 'NodeSpecType', inputPorts: Array<{ __typename: 'InputPortType', id: string, bindings: Array<
              | { __typename: 'DatasetPortType', id: string, tags: Array<string>, transformations: Array<
                  | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                  | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                  | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                  | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                  | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                  | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                  | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                  | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                  | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                >, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string, categories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string, identifier: string | null, label: string }> }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, name: string | null, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, name: string | null, label: string } | null, data: Array<{ __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> }> }
              | { __typename: 'NodeEdgeType' }
            > }> } | null } | null }
    | { __typename: 'Node', id: string, editor: { __typename: 'NodeEditor', spec: { __typename: 'NodeSpecType', inputPorts: Array<{ __typename: 'InputPortType', id: string, bindings: Array<
              | { __typename: 'DatasetPortType', id: string, tags: Array<string>, transformations: Array<
                  | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                  | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                  | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                  | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                  | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                  | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                  | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                  | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                  | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                  | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                >, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string, categories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string, identifier: string | null, label: string }> }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, name: string | null, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, name: string | null, label: string } | null, data: Array<{ __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> }> }
              | { __typename: 'NodeEdgeType' }
            > }> } | null } | null }
   | null };

export type DataPointInstanceChangeHistoryQueryVariables = Exact<{
  limit?: number;
}>;


export type DataPointInstanceChangeHistoryQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', changeHistory: Array<{ __typename: 'InstanceChangeOperationType', uuid: string, createdAt: string, userEmail: string | null, entries: Array<{ __typename: 'InstanceModelLogEntryType', uuid: string, action: string, targetUuid: string | null, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null, createdAt: string }> }> } | null } };

export type DatasetSummaryFieldsFragment = { __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, isExternalPlaceholder: boolean, lastModifiedAt: string | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, quantity: { __typename: 'QuantityKindType', id: string } | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }>, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null };

export type DataPointCommentFieldsFragment = { __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null };

export type DataSourceFieldsFragment = { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null };

export type DatasetSourceReferenceFieldsFragment = { __typename: 'DatasetSourceReference', id: string, createdAt: string, lastModifiedAt: string, dataPoint: { __typename: 'DataPoint', id: string } | null, dataSource: { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null };

export type DatasetDetailFieldsFragment = { __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, isExternalPlaceholder: boolean, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string, categories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string, identifier: string | null, label: string }> }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, name: string | null, label: string, previousSibling: string | null, nextSibling: string | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null, quantity: { __typename: 'QuantityKindType', id: string, label: string } | null }>, dataPoints: Array<{ __typename: 'DataPoint', id: string, date: string, value: number | null, metric: { __typename: 'DatasetMetric', id: string }, dimensionCategories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string }>, comments: Array<{ __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }> }>, portBindings: Array<{ __typename: 'DatasetPortType', id: string, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string } }>, sourceReferences: Array<{ __typename: 'DatasetSourceReference', id: string, createdAt: string, lastModifiedAt: string, dataPoint: { __typename: 'DataPoint', id: string } | null, dataSource: { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }>, validationViolations: Array<{ __typename: 'DatasetValidationViolation', code: string, message: string, severity: ProblemSeverity, enforcement: DatasetRuleEnforcement, metric: string, years: Array<number>, requirementGroup: string | null, combinationIds: Array<string>, coordinates: Array<{ __typename: 'DatasetDimensionCoordinate', dimension: string, category: string }> }> };

export type InstanceDatasetsQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDatasetsQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', datasets: Array<{ __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, isExternalPlaceholder: boolean, lastModifiedAt: string | null, dataPointComments: Array<{ __typename: 'DataPointComment', id: string }>, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, quantity: { __typename: 'QuantityKindType', id: string } | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }>, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }> } | null } };

export type InstanceDatasetQueryVariables = Exact<{
  datasetId: string | number;
}>;


export type InstanceDatasetQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', dataset: { __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, isExternalPlaceholder: boolean, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string, categories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string, identifier: string | null, label: string }> }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, name: string | null, label: string, previousSibling: string | null, nextSibling: string | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null, quantity: { __typename: 'QuantityKindType', id: string, label: string } | null }>, dataPoints: Array<{ __typename: 'DataPoint', id: string, date: string, value: number | null, metric: { __typename: 'DatasetMetric', id: string }, dimensionCategories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string }>, comments: Array<{ __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }> }>, portBindings: Array<{ __typename: 'DatasetPortType', id: string, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string } }>, sourceReferences: Array<{ __typename: 'DatasetSourceReference', id: string, createdAt: string, lastModifiedAt: string, dataPoint: { __typename: 'DataPoint', id: string } | null, dataSource: { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }>, validationViolations: Array<{ __typename: 'DatasetValidationViolation', code: string, message: string, severity: ProblemSeverity, enforcement: DatasetRuleEnforcement, metric: string, years: Array<number>, requirementGroup: string | null, combinationIds: Array<string>, coordinates: Array<{ __typename: 'DatasetDimensionCoordinate', dimension: string, category: string }> }> } | null, dataSources: Array<{ __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }> } | null } };

export type CreateDatasetMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateDatasetInput;
}>;


export type CreateDatasetMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createDataset:
      | { __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, isExternalPlaceholder: boolean, lastModifiedAt: string | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, externalRef: { __typename: 'DatasetExternalRefType', repoUrl: string, commit: string | null, datasetId: string } | null, dimensions: Array<{ __typename: 'DatasetDimension', id: string, name: string }>, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, quantity: { __typename: 'QuantityKindType', id: string } | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }>, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type DeleteDatasetMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string;
  force: boolean;
}>;


export type DeleteDatasetMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', deleteDataset:
      | { __typename: 'ModelDeletePayload', ok: boolean }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type CreateDatasetMetricMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: CreateDatasetMetricInput;
}>;


export type CreateDatasetMetricMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', createMetric:
        | { __typename: 'DatasetMetric', id: string, name: string | null, label: string, previousSibling: string | null, nextSibling: string | null, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null, quantity: { __typename: 'QuantityKindType', id: string, label: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type DeleteDatasetMetricMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  metricId: string;
  force: boolean;
}>;


export type DeleteDatasetMetricMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', deleteMetric: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } } };

export type UpdateDatasetMetricMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  metricId: string;
  input: UpdateDatasetMetricInput;
}>;


export type UpdateDatasetMetricMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', updateMetric:
        | { __typename: 'DatasetMetric', id: string, name: string | null, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null, quantity: { __typename: 'QuantityKindType', id: string, label: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UpdateDatasetMutationVariables = Exact<{
  instanceId: string | number;
  input: UpdateDatasetInput;
}>;


export type UpdateDatasetMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', updateDataset:
      | { __typename: 'Dataset', id: string, name: string, identifier: string | null }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type DatasetConnectedNodesQueryVariables = Exact<{
  ids: Array<string | number>;
}>;


export type DatasetConnectedNodesQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string, name: string, kind: NodeKind | null, editor: { __typename: 'NodeEditor', nodeType: string, spec: { __typename: 'NodeSpecType', typeConfig:
                | { __typename: 'ActionConfigType', nodeClass: string }
                | { __typename: 'FormulaConfigType' }
                | { __typename: 'PipelineConfigType' }
                | { __typename: 'SimpleConfigType', nodeClass: string }
               } | null } | null }
        | { __typename: 'Node', isOutcome: boolean, id: string, name: string, kind: NodeKind | null, editor: { __typename: 'NodeEditor', nodeType: string, spec: { __typename: 'NodeSpecType', typeConfig:
                | { __typename: 'ActionConfigType', nodeClass: string }
                | { __typename: 'FormulaConfigType' }
                | { __typename: 'PipelineConfigType' }
                | { __typename: 'SimpleConfigType', nodeClass: string }
               } | null } | null }
      > } } };

export type DataPointFieldsFragment = { __typename: 'DataPoint', id: string, date: string, value: number | null, metric: { __typename: 'DatasetMetric', id: string }, dimensionCategories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string }> };

export type CreateDataPointsMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: Array<CreateDataPointInput>;
}>;


export type CreateDataPointsMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', createDataPoints:
        | { __typename: 'DataPointsMutationResult', dataPoints: Array<{ __typename: 'DataPoint', id: string, date: string, value: number | null, metric: { __typename: 'DatasetMetric', id: string }, dimensionCategories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string }> }> }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UpdateDataPointsMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: Array<UpdateDataPointItemInput>;
}>;


export type UpdateDataPointsMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', updateDataPoints:
        | { __typename: 'DataPointsMutationResult', dataPoints: Array<{ __typename: 'DataPoint', id: string, date: string, value: number | null, metric: { __typename: 'DatasetMetric', id: string }, dimensionCategories: Array<{ __typename: 'DatasetDimensionCategory', uuid: string }> }> }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type DeleteDataPointsMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  dataPointIds: Array<string | number>;
}>;


export type DeleteDataPointsMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', deleteDataPoints:
        | { __typename: 'DeleteDataPointsResult', deletedDataPointIds: Array<string> }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type CreateDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  dataPointId: string | number;
  input: CreateDataPointCommentInput;
}>;


export type CreateDataPointCommentMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', createDataPointComment:
        | { __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type ResolveDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  commentId: string | number;
}>;


export type ResolveDataPointCommentMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', resolveDataPointComment:
        | { __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UnresolveDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  commentId: string | number;
}>;


export type UnresolveDataPointCommentMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', unresolveDataPointComment:
        | { __typename: 'DataPointComment', id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type CreateSourceReferenceMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: CreateDatasetSourceReferenceInput;
}>;


export type CreateSourceReferenceMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', createSourceReference:
        | { __typename: 'DatasetSourceReference', id: string, createdAt: string, lastModifiedAt: string, dataPoint: { __typename: 'DataPoint', id: string } | null, dataSource: { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }, createdBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null, lastModifiedBy: { __typename: 'User', id: string, firstName: string, lastName: string, email: string } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type CreateDataSourceMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateDataSourceInput;
}>;


export type CreateDataSourceMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createDataSource:
      | { __typename: 'DataSource', id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type DeleteSourceReferenceMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  referenceId: string | number;
}>;


export type DeleteSourceReferenceMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', datasetEditor: { __typename: 'DatasetEditorMutation', deleteSourceReference: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } } };

export type InstanceDimensionFieldsFragment = { __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> };

export type OperationInfoFieldsFragment = { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> };

export type InstanceDimensionsQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDimensionsQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, identifier: string, editor: { __typename: 'InstanceEditor', dimensions: Array<{ __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> }> } | null } };

export type CreateDimensionMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateDimensionInput;
}>;


export type CreateDimensionMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createDimension:
      | { __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type DeleteDimensionMutationVariables = Exact<{
  instanceId: string | number;
  dimensionId: string;
}>;


export type DeleteDimensionMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', deleteDimension:
      | { __typename: 'ModelDeletePayload', ok: boolean }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type UpdateDimensionMutationVariables = Exact<{
  instanceId: string | number;
  input: UpdateDimensionInput;
}>;


export type UpdateDimensionMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', updateDimension:
      | { __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type CreateDimensionCategoriesMutationVariables = Exact<{
  instanceId: string | number;
  input: Array<CreateDimensionCategoryInput>;
}>;


export type CreateDimensionCategoriesMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createDimensionCategories:
      | { __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type UpdateDimensionCategoriesMutationVariables = Exact<{
  instanceId: string | number;
  input: Array<UpdateDimensionCategoryInput>;
}>;


export type UpdateDimensionCategoriesMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', updateDimensionCategories:
      | { __typename: 'InstanceDimension', id: string, identifier: string, name: string, categories: Array<{ __typename: 'InstanceDimensionCategory', id: string, identifier: string | null, label: string, order: number, previousSibling: string | null, nextSibling: string | null }> }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type DeleteDimensionCategoryMutationVariables = Exact<{
  instanceId: string | number;
  categoryId: string;
}>;


export type DeleteDimensionCategoryMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', deleteDimensionCategory: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } };

export type ActionNodeImpactQueryVariables = Exact<{
  nodeId: string | number;
  targetNodeId: string | number;
}>;


export type ActionNodeImpactQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, impactMetric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null }
    | { __typename: 'Node', id: string, impactMetric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null }
   | null };

export type NodeOutputDataQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeOutputDataQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', isEnabled: boolean, id: string, name: string, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> } | null, directDownstream: Array<
        | { __typename: 'ActionNode', id: string, name: string }
        | { __typename: 'Node', id: string, name: string }
      >, editor: { __typename: 'NodeEditor', spec: { __typename: 'NodeSpecType', outputPorts: Array<{ __typename: 'OutputPortType', id: string, label: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, output: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> } | null }> } | null } | null }
    | { __typename: 'Node', id: string, name: string, editor: { __typename: 'NodeEditor', spec: { __typename: 'NodeSpecType', outputPorts: Array<{ __typename: 'OutputPortType', id: string, label: string | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, output: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> } | null }> } | null } | null }
   | null };

export type EditorDimensionNamesQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorDimensionNamesQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', dimensions: Array<{ __typename: 'InstanceDimension', id: string, name: string }> } | null } };

type EditorPortTransformation_AssignDimensionType_Fragment = { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_DropNullsType_Fragment = { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean };

type EditorPortTransformation_EnsureUnitType_Fragment = { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } };

type EditorPortTransformation_FilterColumnType_Fragment = { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_FilterDimensionType_Fragment = { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_FilterTemporalType_Fragment = { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_IndexTemporalType_Fragment = { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean };

type EditorPortTransformation_RemapLegacyYearsType_Fragment = { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean };

type EditorPortTransformation_RenameColumnType_Fragment = { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_RenameItemType_Fragment = { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_SelectMetricType_Fragment = { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean };

type EditorPortTransformation_SetForecastFromType_Fragment = { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean };

type EditorPortTransformation_TagOperationType_Fragment = { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean };

export type EditorPortTransformationFragment =
  | EditorPortTransformation_AssignDimensionType_Fragment
  | EditorPortTransformation_DropNullsType_Fragment
  | EditorPortTransformation_EnsureUnitType_Fragment
  | EditorPortTransformation_FilterColumnType_Fragment
  | EditorPortTransformation_FilterDimensionType_Fragment
  | EditorPortTransformation_FilterTemporalType_Fragment
  | EditorPortTransformation_IndexTemporalType_Fragment
  | EditorPortTransformation_RemapLegacyYearsType_Fragment
  | EditorPortTransformation_RenameColumnType_Fragment
  | EditorPortTransformation_RenameItemType_Fragment
  | EditorPortTransformation_SelectMetricType_Fragment
  | EditorPortTransformation_SetForecastFromType_Fragment
  | EditorPortTransformation_TagOperationType_Fragment
;

export type NodeGraphQueryVariables = Exact<{ [key: string]: never; }>;


export type NodeGraphQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, identifier: string, actionGroups: Array<{ __typename: 'ActionGroupType', id: string, uuid: string, name: string, color: string | null }>, editor: { __typename: 'InstanceEditor', nodeLayouts: Array<{ __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource }>, graphLayout: { __typename: 'GraphLayout', coreNodeIds: Array<string>, ghostableContextSourceIds: Array<string>, hubIds: Array<string>, actionIds: Array<string>, outcomeIds: Array<string>, mainGraphNodeIds: Array<string>, thresholds: { __typename: 'GraphLayoutThresholds', hubDegree: number, ghostableOutDegree: number, ghostableTotalDegree: number, ghostableAvgOutgoingSpan: number } }, edges: Array<{ __typename: 'NodeEdgeType', id: string, tags: Array<string>, fromRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
          | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
          | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
          | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
          | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
          | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
          | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
          | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
          | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
          | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
          | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
          | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
          | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
          | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
        > }> } | null, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string, isEnabled: boolean, isEditable: boolean, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, quantityKind: { __typename: 'QuantityKindType', icon: string | null, id: string, label: string } | null, editor: { __typename: 'NodeEditor', nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, status: NodeStatus | null, layout: { __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource } | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }>, layoutMeta: { __typename: 'NodeGraphLayoutMeta', primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }, spec: { __typename: 'NodeSpecType', supportsAuthoredPorts: boolean, inputPortDeclarations: Array<{ __typename: 'InputPortDeclaration', role: string, label: string | null, multi: boolean, repeatable: boolean, minCount: number, defaultCount: number, instantiatedPortIds: Array<string> }>, inputPorts: Array<{ __typename: 'InputPortType', id: string, identifier: string | null, label: string | null, multi: boolean, quantity: string | null, role: string | null, requiredDimensions: Array<string>, effectiveShape: { __typename: 'EffectiveShape', quantity: string | null, dimensionUuids: Array<string> | null, requiredDimensionUuids: Array<string>, forbiddenDimensionUuids: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string } | null } | null, unit: { __typename: 'UnitType', id: string, short: string, standard: string, dimensionality: Array<{ __typename: 'UnitDimensionality', dimension: string, value: number }> } | null, bindings: Array<
                  | { __typename: 'DatasetPortType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, label: string } | null, transformations: Array<
                      | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                      | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                      | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                    > }
                  | { __typename: 'NodeEdgeType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
                      | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                      | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                      | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                    > }
                > }>, outputPorts: Array<{ __typename: 'OutputPortType', id: string, identifier: string | null, label: string | null, quantity: string | null, role: string | null, columnId: string | null, dimensions: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }>, typeConfig:
                | { __typename: 'ActionConfigType', nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
                | { __typename: 'FormulaConfigType', formula: string }
                | { __typename: 'PipelineConfigType', operations: Record<string, unknown> | unknown[] }
                | { __typename: 'SimpleConfigType', nodeClass: string }
               } | null } | null }
        | { __typename: 'Node', id: string, isOutcome: boolean, isEditable: boolean, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, quantityKind: { __typename: 'QuantityKindType', icon: string | null, id: string, label: string } | null, editor: { __typename: 'NodeEditor', nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, status: NodeStatus | null, layout: { __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource } | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }>, layoutMeta: { __typename: 'NodeGraphLayoutMeta', primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }, spec: { __typename: 'NodeSpecType', supportsAuthoredPorts: boolean, inputPortDeclarations: Array<{ __typename: 'InputPortDeclaration', role: string, label: string | null, multi: boolean, repeatable: boolean, minCount: number, defaultCount: number, instantiatedPortIds: Array<string> }>, inputPorts: Array<{ __typename: 'InputPortType', id: string, identifier: string | null, label: string | null, multi: boolean, quantity: string | null, role: string | null, requiredDimensions: Array<string>, effectiveShape: { __typename: 'EffectiveShape', quantity: string | null, dimensionUuids: Array<string> | null, requiredDimensionUuids: Array<string>, forbiddenDimensionUuids: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string } | null } | null, unit: { __typename: 'UnitType', id: string, short: string, standard: string, dimensionality: Array<{ __typename: 'UnitDimensionality', dimension: string, value: number }> } | null, bindings: Array<
                  | { __typename: 'DatasetPortType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, label: string } | null, transformations: Array<
                      | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                      | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                      | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                    > }
                  | { __typename: 'NodeEdgeType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
                      | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
                      | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
                      | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
                      | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
                      | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
                      | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
                      | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
                    > }
                > }>, outputPorts: Array<{ __typename: 'OutputPortType', id: string, identifier: string | null, label: string | null, quantity: string | null, role: string | null, columnId: string | null, dimensions: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }>, typeConfig:
                | { __typename: 'ActionConfigType', nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
                | { __typename: 'FormulaConfigType', formula: string }
                | { __typename: 'PipelineConfigType', operations: Record<string, unknown> | unknown[] }
                | { __typename: 'SimpleConfigType', nodeClass: string }
               } | null } | null }
      > } } };

type EditorNodeFields_ActionNode_Fragment = { __typename: 'ActionNode', isEnabled: boolean, id: string, isEditable: boolean, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, quantityKind: { __typename: 'QuantityKindType', icon: string | null, id: string, label: string } | null, editor: { __typename: 'NodeEditor', nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, status: NodeStatus | null, layout: { __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource } | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }>, layoutMeta: { __typename: 'NodeGraphLayoutMeta', primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }, spec: { __typename: 'NodeSpecType', supportsAuthoredPorts: boolean, inputPortDeclarations: Array<{ __typename: 'InputPortDeclaration', role: string, label: string | null, multi: boolean, repeatable: boolean, minCount: number, defaultCount: number, instantiatedPortIds: Array<string> }>, inputPorts: Array<{ __typename: 'InputPortType', id: string, identifier: string | null, label: string | null, multi: boolean, quantity: string | null, role: string | null, requiredDimensions: Array<string>, effectiveShape: { __typename: 'EffectiveShape', quantity: string | null, dimensionUuids: Array<string> | null, requiredDimensionUuids: Array<string>, forbiddenDimensionUuids: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string } | null } | null, unit: { __typename: 'UnitType', id: string, short: string, standard: string, dimensionality: Array<{ __typename: 'UnitDimensionality', dimension: string, value: number }> } | null, bindings: Array<
          | { __typename: 'DatasetPortType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, label: string } | null, transformations: Array<
              | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
              | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
              | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
              | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
            > }
          | { __typename: 'NodeEdgeType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
              | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
              | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
              | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
              | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
            > }
        > }>, outputPorts: Array<{ __typename: 'OutputPortType', id: string, identifier: string | null, label: string | null, quantity: string | null, role: string | null, columnId: string | null, dimensions: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }>, typeConfig:
        | { __typename: 'ActionConfigType', nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
        | { __typename: 'FormulaConfigType', formula: string }
        | { __typename: 'PipelineConfigType', operations: Record<string, unknown> | unknown[] }
        | { __typename: 'SimpleConfigType', nodeClass: string }
       } | null } | null };

type EditorNodeFields_Node_Fragment = { __typename: 'Node', isOutcome: boolean, id: string, isEditable: boolean, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, quantityKind: { __typename: 'QuantityKindType', icon: string | null, id: string, label: string } | null, editor: { __typename: 'NodeEditor', nodeGroup: string | null, nodeType: string, tags: Array<string> | null, inputDimensions: Array<string> | null, outputDimensions: Array<string> | null, status: NodeStatus | null, layout: { __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource } | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }>, layoutMeta: { __typename: 'NodeGraphLayoutMeta', primaryClass: PrimaryLayoutClass, isHub: boolean, ghostable: boolean, ghostTargets: Array<string>, canonicalRail: string | null, topologicalLayer: number, inDegree: number, outDegree: number, totalDegree: number, avgOutgoingSpan: number, maxOutgoingSpan: number, hasActionAncestor: boolean }, spec: { __typename: 'NodeSpecType', supportsAuthoredPorts: boolean, inputPortDeclarations: Array<{ __typename: 'InputPortDeclaration', role: string, label: string | null, multi: boolean, repeatable: boolean, minCount: number, defaultCount: number, instantiatedPortIds: Array<string> }>, inputPorts: Array<{ __typename: 'InputPortType', id: string, identifier: string | null, label: string | null, multi: boolean, quantity: string | null, role: string | null, requiredDimensions: Array<string>, effectiveShape: { __typename: 'EffectiveShape', quantity: string | null, dimensionUuids: Array<string> | null, requiredDimensionUuids: Array<string>, forbiddenDimensionUuids: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string } | null } | null, unit: { __typename: 'UnitType', id: string, short: string, standard: string, dimensionality: Array<{ __typename: 'UnitDimensionality', dimension: string, value: number }> } | null, bindings: Array<
          | { __typename: 'DatasetPortType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, dataset: { __typename: 'Dataset', id: string, identifier: string | null, name: string, metrics: Array<{ __typename: 'DatasetMetric', id: string, label: string, unitInfo: { __typename: 'UnitType', id: string, standard: string } | null }> } | null, metric: { __typename: 'DatasetMetricRefType', id: string, label: string } | null, transformations: Array<
              | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
              | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
              | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
              | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
            > }
          | { __typename: 'NodeEdgeType', id: string, tags: Array<string>, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
              | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
              | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
              | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
              | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
              | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
              | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
              | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
            > }
        > }>, outputPorts: Array<{ __typename: 'OutputPortType', id: string, identifier: string | null, label: string | null, quantity: string | null, role: string | null, columnId: string | null, dimensions: Array<string>, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }>, typeConfig:
        | { __typename: 'ActionConfigType', nodeClass: string, decisionLevel: DecisionLevel | null, group: string | null, parent: string | null, noEffectValue: number | null }
        | { __typename: 'FormulaConfigType', formula: string }
        | { __typename: 'PipelineConfigType', operations: Record<string, unknown> | unknown[] }
        | { __typename: 'SimpleConfigType', nodeClass: string }
       } | null } | null };

export type EditorNodeFieldsFragment =
  | EditorNodeFields_ActionNode_Fragment
  | EditorNodeFields_Node_Fragment
;

export type EditorNodeEdgeFragment = { __typename: 'NodeEdgeType', id: string, tags: Array<string>, fromRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, transformations: Array<
    | { __typename: 'AssignDimensionType', dimension: string, category: string, kind: string, isSystemManaged: boolean }
    | { __typename: 'DropNullsType', kind: string, isSystemManaged: boolean }
    | { __typename: 'EnsureUnitType', kind: string, isSystemManaged: boolean, unit: { __typename: 'UnitType', id: string, short: string, standard: string } }
    | { __typename: 'FilterColumnType', column: string, value: string | null, values: Array<string>, ref: string | null, dropCol: boolean, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
    | { __typename: 'FilterDimensionType', dimension: string, groups: Array<string>, categories: Array<string>, exclude: boolean, flatten: boolean, kind: string, isSystemManaged: boolean }
    | { __typename: 'FilterTemporalType', minYear: number | null, maxYear: number | null, kind: string, isSystemManaged: boolean }
    | { __typename: 'IndexTemporalType', kind: string, isSystemManaged: boolean }
    | { __typename: 'RemapLegacyYearsType', kind: string, isSystemManaged: boolean }
    | { __typename: 'RenameColumnType', column: string, newName: string | null, kind: string, isSystemManaged: boolean }
    | { __typename: 'RenameItemType', column: string, oldItem: string, newItem: string, kind: string, isSystemManaged: boolean }
    | { __typename: 'SelectMetricType', kind: string, isSystemManaged: boolean }
    | { __typename: 'SetForecastFromType', year: number, kind: string, isSystemManaged: boolean }
    | { __typename: 'TagOperationType', tag: string, kind: string, isSystemManaged: boolean }
  > };

export type EditorOperationInfoFieldsFragment = { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> };

export type ConstraintViolationsFieldsFragment = { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> };

export type PortUpdateConflictFieldsFragment = { __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null };

export type InstanceEditorPublishStateFragment = { __typename: 'InstanceEditor', live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null };

export type EditorPublishStateQueryVariables = Exact<{ [key: string]: never; }>;


export type EditorPublishStateQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, siteTitle: string, editor: { __typename: 'InstanceEditor', live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null } | null } };

export type PublishModelInstanceMutationVariables = Exact<{
  instanceId: string | number;
  version?: string | null | undefined;
}>;


export type PublishModelInstanceMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', publishModelInstance:
      | { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
      | { __typename: 'DatasetValidationViolations' }
      | { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', live: boolean, hasUnpublishedChanges: boolean, firstPublishedAt: string | null, lastPublishedAt: string | null, draftHeadToken: string | null } | null }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type CreateNodeMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateNodeInput;
  version?: string | null | undefined;
}>;


export type CreateNodeMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createNode:
      | { __typename: 'ActionNode', id: string, identifier: string, name: string, uuid: string }
      | { __typename: 'Node', id: string, identifier: string, name: string, uuid: string }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type NodeParametersQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeParametersQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, parameters: Array<
        | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, boolValue: boolean | null }
        | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, numberValue: number | null }
        | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, stringValue: string | null }
        | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean }
      > }
    | { __typename: 'Node', id: string, parameters: Array<
        | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, boolValue: boolean | null }
        | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, numberValue: number | null }
        | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean, stringValue: string | null }
        | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomizable: boolean }
      > }
   | null };

export type CreateEdgeMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateEdgeInput;
  version?: string | null | undefined;
}>;


export type CreateEdgeMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', createEdge:
      | { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
      | { __typename: 'NodeEdgeType', id: string, fromRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string }, portRef: { __typename: 'NodePortRef', nodeUuid: string, portId: string } }
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
     } };

export type BindDatasetMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  input: BindDatasetInput;
  version?: string | null | undefined;
}>;


export type BindDatasetMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', bindDataset:
        | { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
        | { __typename: 'DatasetPortType', id: string }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UpdateDatasetBindingMutationVariables = Exact<{
  instanceId: string | number;
  bindingId: string | number;
  input: UpdateDatasetBindingInput;
  version?: string | null | undefined;
}>;


export type UpdateDatasetBindingMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', bindingEditor: { __typename: 'PortBindingEditorMutation', updateDatasetBinding:
        | { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
        | { __typename: 'DatasetPortType', id: string }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UpdateEdgeBindingMutationVariables = Exact<{
  instanceId: string | number;
  bindingId: string | number;
  input: UpdateEdgeBindingInput;
  version?: string | null | undefined;
}>;


export type UpdateEdgeBindingMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', bindingEditor: { __typename: 'PortBindingEditorMutation', updateEdgeBinding:
        | { __typename: 'ConstraintViolations', conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null, transformationIndex: number | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
        | { __typename: 'NodeEdgeType', id: string }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type AddInputPortMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  input: InputPortInput;
  version?: string | null | undefined;
}>;


export type AddInputPortMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', addInputPort:
        | { __typename: 'InputPortType', id: string }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type DeleteBindingMutationVariables = Exact<{
  instanceId: string | number;
  bindingId: string | number;
  version?: string | null | undefined;
}>;


export type DeleteBindingMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', bindingEditor: { __typename: 'PortBindingEditorMutation', deleteBinding: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } } };

export type DeleteEdgeMutationVariables = Exact<{
  instanceId: string | number;
  edgeId: string | number;
  version?: string | null | undefined;
}>;


export type DeleteEdgeMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', deleteEdge: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } };

export type DeleteNodeMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  version?: string | null | undefined;
}>;


export type DeleteNodeMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', delete: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } } };

export type UpdateNodeLayoutsMutationVariables = Exact<{
  instanceId: string | number;
  input: Array<UpdateNodeLayoutInput>;
}>;


export type UpdateNodeLayoutsMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', updateNodeLayouts:
      | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
      | { __typename: 'UpdateNodeLayoutsResult', layouts: Array<{ __typename: 'NodeLayout', nodeId: string, x: number, y: number, source: NodeLayoutSource }> }
     } };

export type ClearNodeLayoutsMutationVariables = Exact<{
  instanceId: string | number;
}>;


export type ClearNodeLayoutsMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', clearNodeLayouts: { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> } | null } };

export type UpdateNodeMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  input: UpdateNodeInput;
  version?: string | null | undefined;
}>;


export type UpdateNodeMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', update:
        | { __typename: 'ActionNode', id: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, group: { __typename: 'ActionGroupType', id: string, uuid: string, name: string, color: string | null } | null, editor: { __typename: 'NodeEditor', nodeGroup: string | null } | null }
        | { __typename: 'Node', id: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, isOutcome: boolean, editor: { __typename: 'NodeEditor', nodeGroup: string | null } | null }
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
       } } };

export type UpdateInputPortMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  portId: string | number;
  input: UpdateInputPortInput;
  version?: string | null | undefined;
}>;


export type UpdateInputPortMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', updateInputPort:
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
        | { __typename: 'UpdateInputPortResult', port: { __typename: 'InputPortType', id: string, identifier: string | null, label: string | null, role: string | null, quantity: string | null, multi: boolean, isEditable: boolean, unit: { __typename: 'UnitType', id: string, short: string } | null }, conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
       } } };

export type UpdateOutputPortMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  portId: string | number;
  input: UpdateOutputPortInput;
  version?: string | null | undefined;
}>;


export type UpdateOutputPortMutation = { __typename: 'Mutation', instanceEditor: { __typename: 'InstanceEditorMutation', nodeEditor: { __typename: 'NodeEditorMutation', updateOutputPort:
        | { __typename: 'OperationInfo', messages: Array<{ __typename: 'OperationMessage', kind: OperationMessageKind, field: string | null, message: string, code: string | null }> }
        | { __typename: 'UpdateOutputPortResult', port: { __typename: 'OutputPortType', id: string, identifier: string | null, label: string | null, role: string | null, quantity: string | null, columnId: string | null, isEditable: boolean, unit: { __typename: 'UnitType', id: string, short: string } }, conflicts: Array<{ __typename: 'ConstraintConflict', code: string, message: string, origins: Array<{ __typename: 'ConstraintOrigin', kind: string, nodeUuid: string | null, portId: string | null, bindingId: string | null }>, value: { __typename: 'ConstraintValueRef', kind: string, direction: string | null, nodeUuid: string | null, portId: string | null, bindingId: string | null } | null }> }
       } } };

export type NodeTranslationQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeTranslationQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, name: string, description: string | null, shortDescription: string | null }
    | { __typename: 'Node', id: string, name: string, description: string | null, shortDescription: string | null }
   | null };

export type AvailableDatasetsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableDatasetsQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, editor: { __typename: 'InstanceEditor', datasets: Array<{ __typename: 'Dataset', id: string, isEditable: boolean, identifier: string | null, name: string, userPermissions: { __typename: 'UserPermissions', change: boolean, delete: boolean } | null, metrics: Array<{ __typename: 'DatasetMetric', id: string, name: string | null, label: string, unitInfo: { __typename: 'UnitType', id: string, dimensionality: Array<{ __typename: 'UnitDimensionality', dimension: string, value: number }> } | null }> }> } | null } };

export type NodeStatusesQueryVariables = Exact<{ [key: string]: never; }>;


export type NodeStatusesQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, model: { __typename: 'InstanceModel', nodes: Array<
        | { __typename: 'ActionNode', id: string, editor: { __typename: 'NodeEditor', status: NodeStatus | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }> } | null }
        | { __typename: 'Node', id: string, editor: { __typename: 'NodeEditor', status: NodeStatus | null, errors: Array<{ __typename: 'NodeError', phase: NodeErrorPhase, message: string }> } | null }
      > } } };

export type NodeHistoryEntryFragment = { __typename: 'InstanceModelLogEntryType', uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null };

export type NodeChangeHistoryQueryVariables = Exact<{
  nodeId: string | number;
  limit?: number;
}>;


export type NodeChangeHistoryQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', id: string, editor: { __typename: 'NodeEditor', changeHistory: Array<{ __typename: 'InstanceModelLogEntryType', uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null }> } | null }
    | { __typename: 'Node', id: string, editor: { __typename: 'NodeEditor', changeHistory: Array<{ __typename: 'InstanceModelLogEntryType', uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null }> } | null }
   | null };

export type ModelEditorMetricCategoryFieldsFragment = { __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null };

export type ModelEditorMetricDimensionFieldsFragment = { __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> };

export type ModelEditorDimensionalMetricFieldsFragment = { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string, htmlLong: string }, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, originalId: string | null, label: string, helpText: string | null, kind: DimensionKind, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> };

export type InstanceGoalOutcomeQueryVariables = Exact<{
  goal: string | number;
}>;


export type InstanceGoalOutcomeQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, model: { __typename: 'InstanceModel', goals: Array<{ __typename: 'InstanceGoalEntry', id: string, values: Array<{ __typename: 'InstanceYearlyGoalType', year: number, goal: number | null, actual: number | null, isForecast: boolean, isInterpolated: boolean | null }>, unit: { __typename: 'UnitType', id: string, htmlShort: string } }> } }, activeScenario: { __typename: 'ScenarioType', id: string } };

export type ActivateScenarioMutationVariables = Exact<{
  scenarioId: string | number;
}>;


export type ActivateScenarioMutation = { __typename: 'Mutation', activateScenario: { __typename: 'ActivateScenarioResult', ok: boolean, activeScenario: { __typename: 'ScenarioType', id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean } } };

export type DimensionalMetricFragment = { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null };

export type AvailableInstancesQueryVariables = Exact<{
  hostname: string;
}>;


export type AvailableInstancesQuery = { __typename: 'Query', availableInstances: Array<{ __typename: 'InstanceBasicConfiguration', identifier: string, isProtected: boolean, requiresAuthentication: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: { __typename: 'InstanceHostname', basePath: string } }> };

export type AvailableInstanceFragment = { __typename: 'InstanceBasicConfiguration', identifier: string, isProtected: boolean, requiresAuthentication: boolean, defaultLanguage: string, supportedLanguages: Array<string>, themeIdentifier: string, hostname: { __typename: 'InstanceHostname', basePath: string } };

type ActionParameter_BoolParameterType_Fragment = { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
   | null };

type ActionParameter_NumberParameterType_Fragment = { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
   | null };

type ActionParameter_StringParameterType_Fragment = { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
   | null };

type ActionParameter_UnknownParameterType_Fragment = { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
   | null };

export type ActionParameterFragment =
  | ActionParameter_BoolParameterType_Fragment
  | ActionParameter_NumberParameterType_Fragment
  | ActionParameter_StringParameterType_Fragment
  | ActionParameter_UnknownParameterType_Fragment
;

type DimensionalNodeMetric_ActionNode_Fragment = { __typename: 'ActionNode', id: string, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null };

type DimensionalNodeMetric_Node_Fragment = { __typename: 'Node', id: string, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null };

export type DimensionalNodeMetricFragment =
  | DimensionalNodeMetric_ActionNode_Fragment
  | DimensionalNodeMetric_Node_Fragment
;

export type UnitFieldsFragment = { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string };

type CausalGridNode_ActionNode_Fragment = { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
  >, outputNodes: Array<
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
  >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
    | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
  >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null };

type CausalGridNode_Node_Fragment = { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
  >, outputNodes: Array<
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
  >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
    | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
  >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null };

export type CausalGridNodeFragment =
  | CausalGridNode_ActionNode_Fragment
  | CausalGridNode_Node_Fragment
;

export type CausalChainQueryVariables = Exact<{
  node: string | number;
  goal?: string | number | null | undefined;
  untilNode?: string | number | null | undefined;
}>;


export type CausalChainQuery = { __typename: 'Query', action: { __typename: 'ActionNode', id: string, downstreamNodes: Array<
      | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, outputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
          | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
        >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null }
      | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, outputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
          | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
        >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null }
    > } | null };

export type ActionContentQueryVariables = Exact<{
  node: string | number;
  goal?: string | number | null | undefined;
  downstreamDepth?: number | null | undefined;
}>;


export type ActionContentQuery = { __typename: 'Query', action: { __typename: 'ActionNode', goal: string | null, description: string | null, decisionLevel: DecisionLevel | null, id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, dimensionalFlow: { __typename: 'DimensionalFlowType', id: string, sources: Array<string>, unit: { __typename: 'UnitType', id: string, htmlLong: string }, nodes: Array<{ __typename: 'FlowNodeType', id: string, label: string, color: string | null }>, links: Array<{ __typename: 'FlowLinksType', year: number, sources: Array<string>, targets: Array<string>, values: Array<number | null>, absoluteSourceValues: Array<number> }> } | null, downstreamNodes: Array<
      | { __typename: 'ActionNode', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, outputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
          | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
        >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null }
      | { __typename: 'Node', id: string, name: string, shortDescription: string | null, color: string | null, order: number | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, outputNodes: Array<
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
        >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
          | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
        >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null }
    >, body: Array<
      | { __typename: 'ActionImpactBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'BlockQuoteBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'BooleanBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'CallToActionBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'CardListBlock', blockType: string, title: string | null, id: string | null, field: string, cards: Array<{ __typename: 'CardListCardBlock', title: string | null, shortDescription: string | null } | null> | null }
      | { __typename: 'CategoryBreakdownBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'CharBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'ChoiceBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'CurrentProgressBarBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'DashboardCardBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'DateBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'DateTimeBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'DecimalBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'DocumentChooserBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'EmailBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'EmbedBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'FloatBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'FrameworkLandingBlock', heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: { __typename: 'Framework', id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean } | null }
      | { __typename: 'GoalProgressBarBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'ImageBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'ImageChooserBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'IntegerBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'ListBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'PageChooserBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'RawHTMLBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'ReferenceProgressBarBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'RegexBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'RichTextBlock', value: string, rawValue: string, id: string | null, blockType: string, field: string }
      | { __typename: 'ScenarioProgressBarBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'SnippetChooserBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'StaticBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'StreamBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'StreamFieldBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'StructBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'TextBlock', value: string, id: string | null, blockType: string, field: string }
      | { __typename: 'TimeBlock', id: string | null, blockType: string, field: string }
      | { __typename: 'URLBlock', id: string | null, blockType: string, field: string }
    > | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, inputNodes: Array<
      | { __typename: 'ActionNode', id: string }
      | { __typename: 'Node', id: string }
    >, outputNodes: Array<
      | { __typename: 'ActionNode', id: string }
      | { __typename: 'Node', id: string }
    >, impactMetric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null } | null, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, parameters: Array<
      | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
    >, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, metric: { __typename: 'ForecastMetricType', name: string | null, id: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null } | null } | null };

export type ActionListQueryVariables = Exact<{
  goal?: string | number | null | undefined;
}>;


export type ActionListQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, actionGroups: Array<{ __typename: 'ActionGroupType', id: string, name: string, color: string | null, actions: Array<{ __typename: 'ActionNode', id: string }> }> }, actions: Array<{ __typename: 'ActionNode', id: string, name: string, goal: string | null, shortDescription: string | null, color: string | null, decisionLevel: DecisionLevel | null, quantity: string | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, parameters: Array<
      | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
    >, inputNodes: Array<
      | { __typename: 'ActionNode', id: string }
      | { __typename: 'Node', id: string }
    >, outputNodes: Array<
      | { __typename: 'ActionNode', id: string }
      | { __typename: 'Node', id: string }
    >, impactMetric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, cumulativeForecastValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, yearlyCumulativeUnit: { __typename: 'UnitType', id: string, htmlShort: string } | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, forecastValues: Array<{ __typename: 'YearlyValue', value: number, year: number }> } | null, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }> };

export type ActionsForChooserQueryVariables = Exact<{ [key: string]: never; }>;


export type ActionsForChooserQuery = { __typename: 'Query', actions: Array<{ __typename: 'ActionNode', id: string, name: string, parameters: Array<
      | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
    >, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }> };

export type ImpactOverviewDetailFragment = { __typename: 'ImpactOverviewType', id: string, graphType: string | null, label: string, costLabel: string | null, effectLabel: string | null, indicatorLabel: string | null, costCategoryLabel: string | null, effectCategoryLabel: string | null, description: string | null, stakeholderDimension: string | null, outcomeDimension: string | null, plotLimitForIndicator: number | null, goal: Array<{ __typename: 'NodeGoal', year: number, value: number }>, effectNode: { __typename: 'Node', id: string, name: string, shortDescription: string | null, unit: { __typename: 'UnitType', id: string, short: string } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }> }, costNode: { __typename: 'Node', id: string, name: string, shortDescription: string | null, unit: { __typename: 'UnitType', id: string, short: string } | null } | null, effectUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string } | null, indicatorUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string }, costUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string } | null, actions: Array<{ __typename: 'ActionImpact', unitAdjustmentMultiplier: number | null, action: { __typename: 'ActionNode', id: string, name: string, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }, costValues: Array<{ __typename: 'YearlyValue', value: number, year: number }> | null, impactValues: Array<{ __typename: 'YearlyValue', value: number, year: number } | null> | null, effectDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, htmlLong: string, short: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null }, costDim: { __typename: 'DimensionalMetricType', years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string }> } | null }>, wedge: Array<{ __typename: 'WedgeEntryType', id: string, label: string, isScenario: boolean, metric: { __typename: 'DimensionalMetricType', years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string }, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> } }> | null };

export type ImpactOverviewQueryVariables = Exact<{
  id: string | number;
}>;


export type ImpactOverviewQuery = { __typename: 'Query', impactOverview: { __typename: 'ImpactOverviewType', id: string, graphType: string | null, label: string, costLabel: string | null, effectLabel: string | null, indicatorLabel: string | null, costCategoryLabel: string | null, effectCategoryLabel: string | null, description: string | null, stakeholderDimension: string | null, outcomeDimension: string | null, plotLimitForIndicator: number | null, goal: Array<{ __typename: 'NodeGoal', year: number, value: number }>, effectNode: { __typename: 'Node', id: string, name: string, shortDescription: string | null, unit: { __typename: 'UnitType', id: string, short: string } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }> }, costNode: { __typename: 'Node', id: string, name: string, shortDescription: string | null, unit: { __typename: 'UnitType', id: string, short: string } | null } | null, effectUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string } | null, indicatorUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string }, costUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string } | null, actions: Array<{ __typename: 'ActionImpact', unitAdjustmentMultiplier: number | null, action: { __typename: 'ActionNode', id: string, name: string, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }, costValues: Array<{ __typename: 'YearlyValue', value: number, year: number }> | null, impactValues: Array<{ __typename: 'YearlyValue', value: number, year: number } | null> | null, effectDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, htmlLong: string, short: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null }, costDim: { __typename: 'DimensionalMetricType', years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string }> } | null }>, wedge: Array<{ __typename: 'WedgeEntryType', id: string, label: string, isScenario: boolean, metric: { __typename: 'DimensionalMetricType', years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: { __typename: 'UnitType', id: string, short: string }, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }> } }> | null } | null };

export type ImpactOverviewsQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpactOverviewsQuery = { __typename: 'Query', impactOverviews: Array<{ __typename: 'ImpactOverviewType', id: string, graphType: string | null, label: string, indicatorUnit: { __typename: 'UnitType', id: string, short: string, long: string, htmlShort: string } }> };

export type NodeVisualizationsQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeVisualizationsQuery = { __typename: 'Query', scenarios: Array<{ __typename: 'ScenarioType', id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }>, node:
    | { __typename: 'ActionNode', id: string, metricDim: { __typename: 'DimensionalMetricType', measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, visualizations: Array<
        | { __typename: 'VisualizationGroup', id: string, label: string | null, children: Array<
            | { __typename: 'VisualizationGroup', id: string, label: string | null }
            | { __typename: 'VisualizationNodeOutput', label: string | null, nodeId: string, scenarios: Array<string> | null, desiredOutcome: DesiredOutcome, id: string, dimensions: Array<{ __typename: 'VisualizationNodeDimension', id: string, categories: Array<string> | null, flatten: boolean | null }>, metricDim: { __typename: 'DimensionalMetricType', measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
          > }
        | { __typename: 'VisualizationNodeOutput', id: string, label: string | null }
      > | null }
    | { __typename: 'Node', id: string, metricDim: { __typename: 'DimensionalMetricType', measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null, visualizations: Array<
        | { __typename: 'VisualizationGroup', id: string, label: string | null, children: Array<
            | { __typename: 'VisualizationGroup', id: string, label: string | null }
            | { __typename: 'VisualizationNodeOutput', label: string | null, nodeId: string, scenarios: Array<string> | null, desiredOutcome: DesiredOutcome, id: string, dimensions: Array<{ __typename: 'VisualizationNodeDimension', id: string, categories: Array<string> | null, flatten: boolean | null }>, metricDim: { __typename: 'DimensionalMetricType', measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
          > }
        | { __typename: 'VisualizationNodeOutput', id: string, label: string | null }
      > | null }
   | null };

export type OutcomeNodeFieldsFragment = { __typename: 'Node', id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, inputNodes: Array<
    | { __typename: 'ActionNode', id: string, name: string }
    | { __typename: 'Node', id: string, name: string }
  >, outputNodes: Array<
    | { __typename: 'ActionNode', id: string }
    | { __typename: 'Node', id: string }
  >, upstreamActions: Array<{ __typename: 'ActionNode', id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
      | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
      | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
          | { __typename: 'ActionNode', id: string }
          | { __typename: 'Node', id: string }
         | null }
    >, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }>, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null };

export type OutcomeNodeQueryVariables = Exact<{
  id: string | number;
  goal?: string | number | null | undefined;
  scenarios?: Array<string> | null | undefined;
}>;


export type OutcomeNodeQuery = { __typename: 'Query', node:
    | { __typename: 'ActionNode', upstreamNodes: Array<
        | { __typename: 'ActionNode' }
        | { __typename: 'Node', id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, inputNodes: Array<
            | { __typename: 'ActionNode', id: string, name: string }
            | { __typename: 'Node', id: string, name: string }
          >, outputNodes: Array<
            | { __typename: 'ActionNode', id: string }
            | { __typename: 'Node', id: string }
          >, upstreamActions: Array<{ __typename: 'ActionNode', id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
              | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
            >, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }>, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
      > }
    | { __typename: 'Node', id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, upstreamNodes: Array<
        | { __typename: 'ActionNode' }
        | { __typename: 'Node', id: string, name: string, color: string | null, order: number | null, shortName: string | null, shortDescription: string | null, quantity: string | null, metric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, inputNodes: Array<
            | { __typename: 'ActionNode', id: string, name: string }
            | { __typename: 'Node', id: string, name: string }
          >, outputNodes: Array<
            | { __typename: 'ActionNode', id: string }
            | { __typename: 'Node', id: string }
          >, upstreamActions: Array<{ __typename: 'ActionNode', id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
              | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
              | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
                  | { __typename: 'ActionNode', id: string }
                  | { __typename: 'Node', id: string }
                 | null }
            >, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }>, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
      >, metric: { __typename: 'ForecastMetricType', id: string | null, name: string | null, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, forecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }>, baselineForecastValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> | null, historicalValues: Array<{ __typename: 'YearlyValue', year: number, value: number }> } | null, goals: Array<{ __typename: 'NodeGoal', year: number, value: number }>, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string } | null, inputNodes: Array<
        | { __typename: 'ActionNode', id: string, name: string }
        | { __typename: 'Node', id: string, name: string }
      >, outputNodes: Array<
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
      >, upstreamActions: Array<{ __typename: 'ActionNode', id: string, name: string, goal: string | null, shortName: string | null, shortDescription: string | null, parameters: Array<
          | { __typename: 'BoolParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'NumberParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'StringParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
          | { __typename: 'UnknownParameterType', id: string, nodeRelativeId: string | null, isCustomized: boolean, node:
              | { __typename: 'ActionNode', id: string }
              | { __typename: 'Node', id: string }
             | null }
        >, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null }>, metricDim: { __typename: 'DimensionalMetricType', id: string, name: string, measureDatapointYears: Array<number>, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null }
   | null, activeScenario: { __typename: 'ScenarioType', id: string } };

export type ScenarioActionImpactsFieldsFragment = { __typename: 'ScenarioActionImpacts', scenario: { __typename: 'ScenarioType', id: string }, impacts: Array<{ __typename: 'ActionImpactType', value: number, year: number, action: { __typename: 'ActionNode', id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null } }> };

export type DashboardCardVisualizationsFragment = { __typename: 'DashboardCardBlock', id: string | null, visualizations: Array<
    | { __typename: 'ActionImpactBlock', title: string, scenarioId: string, id: string | null }
    | { __typename: 'BlockQuoteBlock', id: string | null }
    | { __typename: 'BooleanBlock', id: string | null }
    | { __typename: 'CallToActionBlock', id: string | null }
    | { __typename: 'CardListBlock', id: string | null }
    | { __typename: 'CategoryBreakdownBlock', title: string, dimensionId: string, id: string | null }
    | { __typename: 'CharBlock', id: string | null }
    | { __typename: 'ChoiceBlock', id: string | null }
    | { __typename: 'CurrentProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
    | { __typename: 'DashboardCardBlock', id: string | null }
    | { __typename: 'DateBlock', id: string | null }
    | { __typename: 'DateTimeBlock', id: string | null }
    | { __typename: 'DecimalBlock', id: string | null }
    | { __typename: 'DocumentChooserBlock', id: string | null }
    | { __typename: 'EmailBlock', id: string | null }
    | { __typename: 'EmbedBlock', id: string | null }
    | { __typename: 'FloatBlock', id: string | null }
    | { __typename: 'FrameworkLandingBlock', id: string | null }
    | { __typename: 'GoalProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
    | { __typename: 'ImageBlock', id: string | null }
    | { __typename: 'ImageChooserBlock', id: string | null }
    | { __typename: 'IntegerBlock', id: string | null }
    | { __typename: 'ListBlock', id: string | null }
    | { __typename: 'PageChooserBlock', id: string | null }
    | { __typename: 'RawHTMLBlock', id: string | null }
    | { __typename: 'ReferenceProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
    | { __typename: 'RegexBlock', id: string | null }
    | { __typename: 'RichTextBlock', id: string | null }
    | { __typename: 'ScenarioProgressBarBlock', title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
    | { __typename: 'SnippetChooserBlock', id: string | null }
    | { __typename: 'StaticBlock', id: string | null }
    | { __typename: 'StreamBlock', id: string | null }
    | { __typename: 'StreamFieldBlock', id: string | null }
    | { __typename: 'StructBlock', id: string | null }
    | { __typename: 'TextBlock', id: string | null }
    | { __typename: 'TimeBlock', id: string | null }
    | { __typename: 'URLBlock', id: string | null }
   | null> | null };

export type MetricDimensionCategoryValueFieldsFragment = { __typename: 'MetricDimensionCategoryValue', value: number | null, year: number, dimension: { __typename: 'MetricDimensionType', kind: DimensionKind, label: string, id: string, originalId: string | null }, category: { __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null } };

export type ScenarioValueFieldsFragment = { __typename: 'ScenarioValue', value: number | null, year: number, scenario: { __typename: 'ScenarioType', id: string, name: string } };

export type DashboardPageFieldsFragment = { __typename: 'DashboardPage', id: string | null, backgroundColor: string | null, introTitle: string | null, introParagraph: string | null, dashboardCards: Array<
    | { __typename: 'ActionImpactBlock', id: string | null }
    | { __typename: 'BlockQuoteBlock', id: string | null }
    | { __typename: 'BooleanBlock', id: string | null }
    | { __typename: 'CallToActionBlock', id: string | null }
    | { __typename: 'CardListBlock', id: string | null }
    | { __typename: 'CategoryBreakdownBlock', id: string | null }
    | { __typename: 'CharBlock', id: string | null }
    | { __typename: 'ChoiceBlock', id: string | null }
    | { __typename: 'CurrentProgressBarBlock', id: string | null }
    | { __typename: 'DashboardCardBlock', title: string, description: string, referenceYearValue: number | null, lastHistoricalYearValue: number | null, id: string | null, image: { __typename: 'ImageObjectType', id: string, url: string } | null, node: { __typename: 'Node', id: string, name: string }, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string }, goalValues: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number } | null> | null, scenarioValues: Array<{ __typename: 'ScenarioValue', value: number | null, year: number, scenario: { __typename: 'ScenarioType', id: string, name: string } } | null> | null, metricDimensionCategoryValues: Array<{ __typename: 'MetricDimensionCategoryValue', value: number | null, year: number, dimension: { __typename: 'MetricDimensionType', kind: DimensionKind, label: string, id: string, originalId: string | null }, category: { __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null } } | null> | null, scenarioActionImpacts: Array<{ __typename: 'ScenarioActionImpacts', scenario: { __typename: 'ScenarioType', id: string }, impacts: Array<{ __typename: 'ActionImpactType', value: number, year: number, action: { __typename: 'ActionNode', id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null } }> } | null> | null, callToAction: { __typename: 'CallToActionBlock', title: string, content: string, linkUrl: string }, visualizations: Array<
        | { __typename: 'ActionImpactBlock', title: string, scenarioId: string, id: string | null }
        | { __typename: 'BlockQuoteBlock', id: string | null }
        | { __typename: 'BooleanBlock', id: string | null }
        | { __typename: 'CallToActionBlock', id: string | null }
        | { __typename: 'CardListBlock', id: string | null }
        | { __typename: 'CategoryBreakdownBlock', title: string, dimensionId: string, id: string | null }
        | { __typename: 'CharBlock', id: string | null }
        | { __typename: 'ChoiceBlock', id: string | null }
        | { __typename: 'CurrentProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
        | { __typename: 'DashboardCardBlock', id: string | null }
        | { __typename: 'DateBlock', id: string | null }
        | { __typename: 'DateTimeBlock', id: string | null }
        | { __typename: 'DecimalBlock', id: string | null }
        | { __typename: 'DocumentChooserBlock', id: string | null }
        | { __typename: 'EmailBlock', id: string | null }
        | { __typename: 'EmbedBlock', id: string | null }
        | { __typename: 'FloatBlock', id: string | null }
        | { __typename: 'FrameworkLandingBlock', id: string | null }
        | { __typename: 'GoalProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
        | { __typename: 'ImageBlock', id: string | null }
        | { __typename: 'ImageChooserBlock', id: string | null }
        | { __typename: 'IntegerBlock', id: string | null }
        | { __typename: 'ListBlock', id: string | null }
        | { __typename: 'PageChooserBlock', id: string | null }
        | { __typename: 'RawHTMLBlock', id: string | null }
        | { __typename: 'ReferenceProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
        | { __typename: 'RegexBlock', id: string | null }
        | { __typename: 'RichTextBlock', id: string | null }
        | { __typename: 'ScenarioProgressBarBlock', title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
        | { __typename: 'SnippetChooserBlock', id: string | null }
        | { __typename: 'StaticBlock', id: string | null }
        | { __typename: 'StreamBlock', id: string | null }
        | { __typename: 'StreamFieldBlock', id: string | null }
        | { __typename: 'StructBlock', id: string | null }
        | { __typename: 'TextBlock', id: string | null }
        | { __typename: 'TimeBlock', id: string | null }
        | { __typename: 'URLBlock', id: string | null }
       | null> | null }
    | { __typename: 'DateBlock', id: string | null }
    | { __typename: 'DateTimeBlock', id: string | null }
    | { __typename: 'DecimalBlock', id: string | null }
    | { __typename: 'DocumentChooserBlock', id: string | null }
    | { __typename: 'EmailBlock', id: string | null }
    | { __typename: 'EmbedBlock', id: string | null }
    | { __typename: 'FloatBlock', id: string | null }
    | { __typename: 'FrameworkLandingBlock', id: string | null }
    | { __typename: 'GoalProgressBarBlock', id: string | null }
    | { __typename: 'ImageBlock', id: string | null }
    | { __typename: 'ImageChooserBlock', id: string | null }
    | { __typename: 'IntegerBlock', id: string | null }
    | { __typename: 'ListBlock', id: string | null }
    | { __typename: 'PageChooserBlock', id: string | null }
    | { __typename: 'RawHTMLBlock', id: string | null }
    | { __typename: 'ReferenceProgressBarBlock', id: string | null }
    | { __typename: 'RegexBlock', id: string | null }
    | { __typename: 'RichTextBlock', id: string | null }
    | { __typename: 'ScenarioProgressBarBlock', id: string | null }
    | { __typename: 'SnippetChooserBlock', id: string | null }
    | { __typename: 'StaticBlock', id: string | null }
    | { __typename: 'StreamBlock', id: string | null }
    | { __typename: 'StreamFieldBlock', id: string | null }
    | { __typename: 'StructBlock', id: string | null }
    | { __typename: 'TextBlock', id: string | null }
    | { __typename: 'TimeBlock', id: string | null }
    | { __typename: 'URLBlock', id: string | null }
   | null> | null };

export type PageQueryVariables = Exact<{
  path: string;
}>;


export type PageQuery = { __typename: 'Query', activeScenario: { __typename: 'ScenarioType', id: string }, page:
    | { __typename: 'ActionListPage', showOnlyMunicipalActions: boolean | null, defaultSortOrder: ActionSortOrder, id: string | null, title: string, actionListLeadTitle: string | null, actionListLeadParagraph: string | null }
    | { __typename: 'DashboardPage', id: string | null, title: string, backgroundColor: string | null, introTitle: string | null, introParagraph: string | null, dashboardCards: Array<
        | { __typename: 'ActionImpactBlock', id: string | null }
        | { __typename: 'BlockQuoteBlock', id: string | null }
        | { __typename: 'BooleanBlock', id: string | null }
        | { __typename: 'CallToActionBlock', id: string | null }
        | { __typename: 'CardListBlock', id: string | null }
        | { __typename: 'CategoryBreakdownBlock', id: string | null }
        | { __typename: 'CharBlock', id: string | null }
        | { __typename: 'ChoiceBlock', id: string | null }
        | { __typename: 'CurrentProgressBarBlock', id: string | null }
        | { __typename: 'DashboardCardBlock', title: string, description: string, referenceYearValue: number | null, lastHistoricalYearValue: number | null, id: string | null, image: { __typename: 'ImageObjectType', id: string, url: string } | null, node: { __typename: 'Node', id: string, name: string }, unit: { __typename: 'UnitType', id: string, short: string, htmlShort: string, htmlLong: string }, goalValues: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number } | null> | null, scenarioValues: Array<{ __typename: 'ScenarioValue', value: number | null, year: number, scenario: { __typename: 'ScenarioType', id: string, name: string } } | null> | null, metricDimensionCategoryValues: Array<{ __typename: 'MetricDimensionCategoryValue', value: number | null, year: number, dimension: { __typename: 'MetricDimensionType', kind: DimensionKind, label: string, id: string, originalId: string | null }, category: { __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null } } | null> | null, scenarioActionImpacts: Array<{ __typename: 'ScenarioActionImpacts', scenario: { __typename: 'ScenarioType', id: string }, impacts: Array<{ __typename: 'ActionImpactType', value: number, year: number, action: { __typename: 'ActionNode', id: string, name: string, shortName: string | null, color: string | null, isEnabled: boolean, group: { __typename: 'ActionGroupType', id: string, name: string, color: string | null } | null } }> } | null> | null, callToAction: { __typename: 'CallToActionBlock', title: string, content: string, linkUrl: string }, visualizations: Array<
            | { __typename: 'ActionImpactBlock', title: string, scenarioId: string, id: string | null }
            | { __typename: 'BlockQuoteBlock', id: string | null }
            | { __typename: 'BooleanBlock', id: string | null }
            | { __typename: 'CallToActionBlock', id: string | null }
            | { __typename: 'CardListBlock', id: string | null }
            | { __typename: 'CategoryBreakdownBlock', title: string, dimensionId: string, id: string | null }
            | { __typename: 'CharBlock', id: string | null }
            | { __typename: 'ChoiceBlock', id: string | null }
            | { __typename: 'CurrentProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
            | { __typename: 'DashboardCardBlock', id: string | null }
            | { __typename: 'DateBlock', id: string | null }
            | { __typename: 'DateTimeBlock', id: string | null }
            | { __typename: 'DecimalBlock', id: string | null }
            | { __typename: 'DocumentChooserBlock', id: string | null }
            | { __typename: 'EmailBlock', id: string | null }
            | { __typename: 'EmbedBlock', id: string | null }
            | { __typename: 'FloatBlock', id: string | null }
            | { __typename: 'FrameworkLandingBlock', id: string | null }
            | { __typename: 'GoalProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
            | { __typename: 'ImageBlock', id: string | null }
            | { __typename: 'ImageChooserBlock', id: string | null }
            | { __typename: 'IntegerBlock', id: string | null }
            | { __typename: 'ListBlock', id: string | null }
            | { __typename: 'PageChooserBlock', id: string | null }
            | { __typename: 'RawHTMLBlock', id: string | null }
            | { __typename: 'ReferenceProgressBarBlock', title: string, description: string, chartLabel: string, color: string, id: string | null }
            | { __typename: 'RegexBlock', id: string | null }
            | { __typename: 'RichTextBlock', id: string | null }
            | { __typename: 'ScenarioProgressBarBlock', title: string, description: string, chartLabel: string, color: string, scenarioId: string, id: string | null }
            | { __typename: 'SnippetChooserBlock', id: string | null }
            | { __typename: 'StaticBlock', id: string | null }
            | { __typename: 'StreamBlock', id: string | null }
            | { __typename: 'StreamFieldBlock', id: string | null }
            | { __typename: 'StructBlock', id: string | null }
            | { __typename: 'TextBlock', id: string | null }
            | { __typename: 'TimeBlock', id: string | null }
            | { __typename: 'URLBlock', id: string | null }
           | null> | null }
        | { __typename: 'DateBlock', id: string | null }
        | { __typename: 'DateTimeBlock', id: string | null }
        | { __typename: 'DecimalBlock', id: string | null }
        | { __typename: 'DocumentChooserBlock', id: string | null }
        | { __typename: 'EmailBlock', id: string | null }
        | { __typename: 'EmbedBlock', id: string | null }
        | { __typename: 'FloatBlock', id: string | null }
        | { __typename: 'FrameworkLandingBlock', id: string | null }
        | { __typename: 'GoalProgressBarBlock', id: string | null }
        | { __typename: 'ImageBlock', id: string | null }
        | { __typename: 'ImageChooserBlock', id: string | null }
        | { __typename: 'IntegerBlock', id: string | null }
        | { __typename: 'ListBlock', id: string | null }
        | { __typename: 'PageChooserBlock', id: string | null }
        | { __typename: 'RawHTMLBlock', id: string | null }
        | { __typename: 'ReferenceProgressBarBlock', id: string | null }
        | { __typename: 'RegexBlock', id: string | null }
        | { __typename: 'RichTextBlock', id: string | null }
        | { __typename: 'ScenarioProgressBarBlock', id: string | null }
        | { __typename: 'SnippetChooserBlock', id: string | null }
        | { __typename: 'StaticBlock', id: string | null }
        | { __typename: 'StreamBlock', id: string | null }
        | { __typename: 'StreamFieldBlock', id: string | null }
        | { __typename: 'StructBlock', id: string | null }
        | { __typename: 'TextBlock', id: string | null }
        | { __typename: 'TimeBlock', id: string | null }
        | { __typename: 'URLBlock', id: string | null }
       | null> | null }
    | { __typename: 'InstanceRootPage', id: string | null, title: string, body: Array<
        | { __typename: 'ActionImpactBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'BlockQuoteBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'BooleanBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CallToActionBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CardListBlock', blockType: string, title: string | null, id: string | null, field: string, cards: Array<{ __typename: 'CardListCardBlock', title: string | null, shortDescription: string | null } | null> | null }
        | { __typename: 'CategoryBreakdownBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CharBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ChoiceBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CurrentProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DashboardCardBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DateBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DateTimeBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DecimalBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DocumentChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'EmailBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'EmbedBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'FloatBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'FrameworkLandingBlock', heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: { __typename: 'Framework', id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean } | null }
        | { __typename: 'GoalProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ImageBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ImageChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'IntegerBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ListBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'PageChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RawHTMLBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ReferenceProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RegexBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RichTextBlock', value: string, rawValue: string, id: string | null, blockType: string, field: string }
        | { __typename: 'ScenarioProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'SnippetChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StaticBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StreamBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StreamFieldBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StructBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'TextBlock', value: string, id: string | null, blockType: string, field: string }
        | { __typename: 'TimeBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'URLBlock', id: string | null, blockType: string, field: string }
       | null> | null }
    | { __typename: 'OutcomePage', leadTitle: string, leadParagraph: string, id: string | null, title: string, outcomeNode: { __typename: 'Node', id: string } }
    | { __typename: 'Page', id: string | null, title: string }
    | { __typename: 'StaticPage', id: string | null, title: string, body: Array<
        | { __typename: 'ActionImpactBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'BlockQuoteBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'BooleanBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CallToActionBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CardListBlock', blockType: string, title: string | null, id: string | null, field: string, cards: Array<{ __typename: 'CardListCardBlock', title: string | null, shortDescription: string | null } | null> | null }
        | { __typename: 'CategoryBreakdownBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CharBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ChoiceBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'CurrentProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DashboardCardBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DateBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DateTimeBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DecimalBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'DocumentChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'EmailBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'EmbedBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'FloatBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'FrameworkLandingBlock', heading: string, body: string | null, ctaLabel: string | null, ctaUrl: string | null, id: string | null, blockType: string, field: string, framework: { __typename: 'Framework', id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean } | null }
        | { __typename: 'GoalProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ImageBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ImageChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'IntegerBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ListBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'PageChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RawHTMLBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'ReferenceProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RegexBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'RichTextBlock', value: string, rawValue: string, id: string | null, blockType: string, field: string }
        | { __typename: 'ScenarioProgressBarBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'SnippetChooserBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StaticBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StreamBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StreamFieldBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'StructBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'TextBlock', value: string, id: string | null, blockType: string, field: string }
        | { __typename: 'TimeBlock', id: string | null, blockType: string, field: string }
        | { __typename: 'URLBlock', id: string | null, blockType: string, field: string }
       | null> | null }
   | null };

export type ParametersQueryVariables = Exact<{ [key: string]: never; }>;


export type ParametersQuery = { __typename: 'Query', availableNormalizations: Array<{ __typename: 'NormalizationType', id: string, label: string, isActive: boolean }>, parameters: Array<
    | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
  > };

export type ScenariosQueryVariables = Exact<{ [key: string]: never; }>;


export type ScenariosQuery = { __typename: 'Query', scenarios: Array<{ __typename: 'ScenarioType', id: string, name: string, isActive: boolean, isDefault: boolean, isSelectable: boolean }> };

export type ScenarioFragment = { __typename: 'ScenarioType', id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null };

export type InstanceContextQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceContextQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, name: string, siteTitle: string, themeIdentifier: string | null, owner: string | null, defaultLanguage: string, supportedLanguages: Array<string>, targetYear: number | null, modelEndYear: number, referenceYear: number | null, minimumHistoricalYear: number, maximumHistoricalYear: number | null, leadTitle: string, leadParagraph: string | null, frameworkConfig: { __typename: 'FrameworkConfig', id: string, framework: { __typename: 'Framework', id: string, identifier: string, name: string } } | null, features: { __typename: 'InstanceFeaturesType', hideNodeDetails: boolean, maximumFractionDigits: number | null, baselineVisibleInGraphs: boolean, showAccumulatedEffects: boolean, showSignificantDigits: number | null, showRefreshPrompt: boolean }, introContent: Array<
      | { __typename: 'ActionImpactBlock', id: string | null }
      | { __typename: 'BlockQuoteBlock', id: string | null }
      | { __typename: 'BooleanBlock', id: string | null }
      | { __typename: 'CallToActionBlock', id: string | null }
      | { __typename: 'CardListBlock', id: string | null }
      | { __typename: 'CategoryBreakdownBlock', id: string | null }
      | { __typename: 'CharBlock', id: string | null }
      | { __typename: 'ChoiceBlock', id: string | null }
      | { __typename: 'CurrentProgressBarBlock', id: string | null }
      | { __typename: 'DashboardCardBlock', id: string | null }
      | { __typename: 'DateBlock', id: string | null }
      | { __typename: 'DateTimeBlock', id: string | null }
      | { __typename: 'DecimalBlock', id: string | null }
      | { __typename: 'DocumentChooserBlock', id: string | null }
      | { __typename: 'EmailBlock', id: string | null }
      | { __typename: 'EmbedBlock', id: string | null }
      | { __typename: 'FloatBlock', id: string | null }
      | { __typename: 'FrameworkLandingBlock', id: string | null }
      | { __typename: 'GoalProgressBarBlock', id: string | null }
      | { __typename: 'ImageBlock', id: string | null }
      | { __typename: 'ImageChooserBlock', id: string | null }
      | { __typename: 'IntegerBlock', id: string | null }
      | { __typename: 'ListBlock', id: string | null }
      | { __typename: 'PageChooserBlock', id: string | null }
      | { __typename: 'RawHTMLBlock', id: string | null }
      | { __typename: 'ReferenceProgressBarBlock', id: string | null }
      | { __typename: 'RegexBlock', id: string | null }
      | { __typename: 'RichTextBlock', field: string, value: string, id: string | null }
      | { __typename: 'ScenarioProgressBarBlock', id: string | null }
      | { __typename: 'SnippetChooserBlock', id: string | null }
      | { __typename: 'StaticBlock', id: string | null }
      | { __typename: 'StreamBlock', id: string | null }
      | { __typename: 'StreamFieldBlock', id: string | null }
      | { __typename: 'StructBlock', id: string | null }
      | { __typename: 'TextBlock', id: string | null }
      | { __typename: 'TimeBlock', id: string | null }
      | { __typename: 'URLBlock', id: string | null }
    > | null, model: { __typename: 'InstanceModel', goals: Array<{ __typename: 'InstanceGoalEntry', id: string, label: string | null, default: boolean, disabled: boolean, outcomeNode: { __typename: 'Node', id: string }, dimensions: Array<{ __typename: 'InstanceGoalDimension', dimension: string, categories: Array<string>, groups: Array<string> }> }> }, actionListPage: { __typename: 'ActionListPage', id: string | null, showInMenus: boolean } | null }, scenarios: Array<{ __typename: 'ScenarioType', id: string, isActive: boolean, isDefault: boolean, name: string, actualHistoricalYears: Array<number> | null, kind: ScenarioKind | null }>, availableNormalizations: Array<{ __typename: 'NormalizationType', id: string, label: string, isActive: boolean }>, menuPages: Array<
    | { __typename: 'ActionListPage', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'DashboardPage', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'InstanceRootPage', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'OutcomePage', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'Page', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'StaticPage', id: string | null, title: string, menuLabel: string | null, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
  >, footerPages: Array<
    | { __typename: 'ActionListPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'DashboardPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'InstanceRootPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'OutcomePage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'Page', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'StaticPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
  >, additionalLinkPages: Array<
    | { __typename: 'ActionListPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'DashboardPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'InstanceRootPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'OutcomePage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'Page', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
    | { __typename: 'StaticPage', id: string | null, title: string, urlPath: string, parent:
        | { __typename: 'ActionListPage', id: string | null }
        | { __typename: 'DashboardPage', id: string | null }
        | { __typename: 'InstanceRootPage', id: string | null }
        | { __typename: 'OutcomePage', id: string | null }
        | { __typename: 'Page', id: string | null }
        | { __typename: 'StaticPage', id: string | null }
       | null }
  >, parameters: Array<
    | { __typename: 'BoolParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, boolValue: boolean | null, boolDefaultValue: boolean | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'NumberParameterType', minValue: number | null, maxValue: number | null, step: number | null, id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, numberValue: number | null, numberDefaultValue: number | null, unit: { __typename: 'UnitType', id: string, htmlShort: string } | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'StringParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, stringValue: string | null, stringDefaultValue: string | null, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
    | { __typename: 'UnknownParameterType', id: string, label: string | null, description: string | null, nodeRelativeId: string | null, isCustomized: boolean, isCustomizable: boolean, node:
        | { __typename: 'ActionNode', id: string }
        | { __typename: 'Node', id: string }
       | null }
  > };

type VisualizationEntry_VisualizationGroup_Fragment = { __typename: 'VisualizationGroup', id: string, label: string | null };

type VisualizationEntry_VisualizationNodeOutput_Fragment = { __typename: 'VisualizationNodeOutput', label: string | null, nodeId: string, scenarios: Array<string> | null, desiredOutcome: DesiredOutcome, id: string, dimensions: Array<{ __typename: 'VisualizationNodeDimension', id: string, categories: Array<string> | null, flatten: boolean | null }>, metricDim: { __typename: 'DimensionalMetricType', measureDatapointYears: Array<number>, id: string, name: string, stackable: boolean, forecastFrom: number | null, years: Array<number>, values: Array<number>, dimensions: Array<{ __typename: 'MetricDimensionType', id: string, label: string, originalId: string | null, helpText: string | null, categories: Array<{ __typename: 'MetricDimensionCategoryType', id: string, originalId: string | null, label: string, color: string | null, order: number | null, group: string | null }>, groups: Array<{ __typename: 'MetricDimensionCategoryGroupType', id: string, originalId: string, label: string, color: string | null, order: number | null }> }>, goals: Array<{ __typename: 'DimensionalMetricGoalEntry', categories: Array<string>, groups: Array<string>, values: Array<{ __typename: 'MetricYearlyGoalType', year: number, value: number, isInterpolated: boolean }> }>, unit: { __typename: 'UnitType', id: string, htmlShort: string, short: string, htmlLong: string, long: string }, normalizedBy: { __typename: 'NormalizerNodeType', id: string, name: string } | null } | null };

export type VisualizationEntryFragment =
  | VisualizationEntry_VisualizationGroup_Fragment
  | VisualizationEntry_VisualizationNodeOutput_Fragment
;
