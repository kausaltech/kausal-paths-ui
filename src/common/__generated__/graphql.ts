/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type ActionConfigInput = {
  decisionLevel: DecisionLevel | null | undefined;
  group: string | null | undefined;
  noEffectValue: number | null | undefined;
  nodeClass: string;
  parent: string | null | undefined;
};

/** An enumeration. */
export const enum ActionSortOrder {
  /** Cumulative impact */
  CumImpact = 'CUM_IMPACT',
  /** Impact */
  Impact = 'IMPACT',
  /** Standard */
  Standard = 'STANDARD'
};

export type AssignCategoryTransformationInput = {
  category: string;
  dimension: string;
};

export const enum ChangeTargetKind {
  DatasetPort = 'DATASET_PORT',
  DataPoint = 'DATA_POINT',
  Dimension = 'DIMENSION',
  DimensionCategory = 'DIMENSION_CATEGORY',
  Edge = 'EDGE',
  Instance = 'INSTANCE',
  Node = 'NODE',
  Unknown = 'UNKNOWN'
};

export type CreateDataPointCommentInput = {
  isReview: boolean;
  isSticky: boolean;
  reviewState: DataPointCommentReviewState | null | undefined;
  text: string;
};

export type CreateDataPointInput = {
  date: string;
  dimensionCategoryIds: Array<string> | null | undefined;
  metricId: string;
  value: number | null | undefined;
};

export type CreateDataSourceInput = {
  authority: string | null | undefined;
  description: string | null | undefined;
  edition: string | null | undefined;
  name: string;
  url: string | null | undefined;
};

export type CreateDatasetSourceReferenceInput = {
  dataPointId: string | null | undefined;
  dataSourceId: string;
  toDataset: boolean;
};

export type CreateDimensionCategoryInput = {
  dimensionId: string;
  id: string | null | undefined;
  identifier: string | null | undefined;
  label: string;
  nextSibling: string | number | null | undefined;
  previousSibling: string | number | null | undefined;
};

export type CreateEdgeInput = {
  fromNodeId: string;
  fromPort: string;
  instanceId: string | number;
  toNodeId: string;
  toPort: string | null | undefined;
  transformations: Array<EdgeTransformationInput> | null | undefined;
};

export type CreateInstanceInput = {
  frameworkId: string;
  identifier: string;
  name: string;
  organizationName: string;
};

export type CreateNodeInput = {
  allowNulls: boolean;
  color: string | null | undefined;
  config: NodeConfigInput;
  description: string | null | undefined;
  i18n: Record<string, unknown> | unknown[] | null | undefined;
  identifier: string | number;
  inputDimensions: Array<string> | null | undefined;
  inputPorts: Array<InputPortInput> | null | undefined;
  isOutcome: boolean;
  isVisible: boolean;
  kind: NodeKind;
  minimumYear: number | null | undefined;
  name: string;
  nodeGroup: string | number | null | undefined;
  order: number | null | undefined;
  outputDimensions: Array<string> | null | undefined;
  outputMetrics: Array<OutputMetricInput> | null | undefined;
  outputPorts: Array<OutputPortInput> | null | undefined;
  params: Record<string, unknown> | unknown[] | null | undefined;
  shortName: string | null | undefined;
  tags: Array<string> | null | undefined;
};

export const enum DataPointCommentReviewState {
  Resolved = 'RESOLVED',
  Unresolved = 'UNRESOLVED'
};

/** Which governance level is applicable for an action */
export const enum DecisionLevel {
  Eu = 'EU',
  Municipality = 'MUNICIPALITY',
  Nation = 'NATION'
};

/** Desired (benificial) direction for the values of the output of a node */
export const enum DesiredOutcome {
  Decreasing = 'decreasing',
  Increasing = 'increasing'
};

export const enum DimensionKind {
  Common = 'COMMON',
  Node = 'NODE',
  Scenario = 'SCENARIO'
};

export type EdgeTransformationInput =
  {   assignCategory: AssignCategoryTransformationInput; flatten?: never; selectCategories?: never; }
  |  { assignCategory?: never;   flatten: FlattenTransformationInput; selectCategories?: never; }
  |  { assignCategory?: never; flatten?: never;   selectCategories: SelectCategoriesTransformationInput; };

export type FlattenTransformationInput = {
  dimension: string;
};

export type FormulaConfigInput = {
  formula: string;
};

export type InputPortInput = {
  id: string | null | undefined;
  label: string | null | undefined;
  multi: boolean;
  quantity: string | null | undefined;
  requiredDimensions: Array<string> | null | undefined;
  supportedDimensions: Array<string> | null | undefined;
  unit: string | null | undefined;
};

export const enum InstanceMemberRole {
  Admin = 'ADMIN',
  Reviewer = 'REVIEWER',
  SuperAdmin = 'SUPER_ADMIN',
  Viewer = 'VIEWER'
};

export type NodeConfigInput =
  {   action: ActionConfigInput; formula?: never; pipeline?: never; simple?: never; }
  |  { action?: never;   formula: FormulaConfigInput; pipeline?: never; simple?: never; }
  |  { action?: never; formula?: never;   pipeline: PipelineConfigInput; simple?: never; }
  |  { action?: never; formula?: never; pipeline?: never;   simple: SimpleConfigInput; };

export const enum NodeKind {
  Action = 'ACTION',
  Formula = 'FORMULA',
  Pipeline = 'PIPELINE',
  Simple = 'SIMPLE'
};

export const enum OperationMessageKind {
  Error = 'ERROR',
  Info = 'INFO',
  Permission = 'PERMISSION',
  Validation = 'VALIDATION',
  Warning = 'WARNING'
};

export type OutputMetricInput = {
  columnId: string | null | undefined;
  id: string;
  label: string | null | undefined;
  portId: string | null | undefined;
  quantity: string | null | undefined;
  unit: string;
};

export type OutputPortInput = {
  columnId: string | null | undefined;
  dimensions: Array<string> | null | undefined;
  id: string | null | undefined;
  isEditable: boolean;
  label: string | null | undefined;
  quantity: string | null | undefined;
  unit: string;
};

export type PipelineConfigInput = {
  operations: Array<PipelineOperationInput>;
};

export type PipelineOperationInput = {
  operation: string;
};

export const enum PrimaryLayoutClass {
  Action = 'ACTION',
  ContextSource = 'CONTEXT_SOURCE',
  Core = 'CORE',
  GhostableContextSource = 'GHOSTABLE_CONTEXT_SOURCE',
  Outcome = 'OUTCOME'
};

export type RegisterUserInput = {
  email: string;
  firstName: string | null | undefined;
  frameworkId: string | number | null | undefined;
  invitationToken: string | null | undefined;
  lastName: string | null | undefined;
  password: string;
};

export const enum ScenarioKind {
  Baseline = 'BASELINE',
  Custom = 'CUSTOM',
  Default = 'DEFAULT',
  ProgressTracking = 'PROGRESS_TRACKING'
};

export type SelectCategoriesTransformationInput = {
  categories: Array<string>;
  dimension: string;
  exclude: boolean;
  flatten: boolean;
};

export type SimpleConfigInput = {
  nodeClass: string;
};

export type UpdateDataPointInput = {
  date: string | null | undefined;
  dimensionCategoryIds: Array<string> | null | undefined;
  metricId: string | null | undefined;
  value: number | null | undefined;
};

export type UpdateDimensionCategoryInput = {
  categoryId: string;
  identifier: string | null | undefined;
  label: string | null | undefined;
  nextSibling: string | number | null | undefined;
  previousSibling: string | number | null | undefined;
};

export type UpdateDimensionInput = {
  dimensionId: string;
  name: string | null | undefined;
};

export type UpdateNodeInput = {
  allowNulls: boolean | null | undefined;
  color: string | null | undefined;
  config: NodeConfigInput | null | undefined;
  description: string | null | undefined;
  i18n: Record<string, unknown> | unknown[] | null | undefined;
  inputDimensions: Array<string> | null | undefined;
  inputPorts: Array<InputPortInput> | null | undefined;
  isOutcome: boolean | null | undefined;
  isVisible: boolean | null | undefined;
  kind: NodeKind | null | undefined;
  minimumYear: number | null | undefined;
  name: string | null | undefined;
  nodeGroup: string | number | null | undefined;
  order: number | null | undefined;
  outputDimensions: Array<string> | null | undefined;
  outputMetrics: Array<OutputMetricInput> | null | undefined;
  outputPorts: Array<OutputPortInput> | null | undefined;
  params: Record<string, unknown> | unknown[] | null | undefined;
  shortName: string | null | undefined;
  tags: Array<string> | null | undefined;
};

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
  node: string | number;
  scenarios: Array<string> | null | undefined;
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

export type CreateInstanceFrameworkNameQueryVariables = Exact<{
  identifier: string | number;
}>;


export type CreateInstanceFrameworkNameQuery = (
  { framework: (
    { id: string, name: string }
    & { __typename: 'Framework' }
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

export type FrameworkNameQueryVariables = Exact<{
  identifier: string | number;
}>;


export type FrameworkNameQuery = (
  { framework: (
    { id: string, name: string }
    & { __typename: 'Framework' }
  ) | null }
  & { __typename: 'Query' }
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

export type MyEditableInstancesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyEditableInstancesQuery = (
  { me: (
    { id: string, email: string, editableInstances: Array<(
      { id: string, identifier: string, name: string, themeIdentifier: string | null, frameworkConfig: (
        { id: string, organizationName: string | null, viewUrl: string | null, framework: (
          { id: string, identifier: string, name: string }
          & { __typename: 'Framework' }
        ) }
        & { __typename: 'FrameworkConfig' }
      ) | null }
      & { __typename: 'InstanceType' }
    )> }
    & { __typename: 'User' }
  ) | null }
  & { __typename: 'Query' }
);

export type InstanceUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceUsersQuery = (
  { me: (
    { id: string, email: string, firstName: string, lastName: string }
    & { __typename: 'User' }
  ) | null, instance: (
    { id: string, users: Array<(
      { isOwner: boolean, role: InstanceMemberRole, user: (
        { id: string, email: string, firstName: string, lastName: string }
        & { __typename: 'User' }
      ) }
      & { __typename: 'InstanceMember' }
    )>, invitations: Array<(
      { id: string, email: string, expiresAt: string, createdAt: string }
      & { __typename: 'InstanceInvitation' }
    )> }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type AddUserToInstanceMutationVariables = Exact<{
  instanceId: string | number;
  email: string;
}>;


export type AddUserToInstanceMutation = (
  { instanceAdmin: (
    { addUserToInstance:
      | (
        { messages: Array<(
          { kind: OperationMessageKind, message: string, field: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
      | (
        { id: string, email: string, firstName: string, lastName: string }
        & { __typename: 'User' }
      )
      | (
        { email: string }
        & { __typename: 'UserNotFoundError' }
      )
     }
    & { __typename: 'InstanceAdminMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type RemoveInvitationMutationVariables = Exact<{
  instanceId: string | number;
  invitationId: string | number;
}>;


export type RemoveInvitationMutation = (
  { instanceAdmin: (
    { removeInvitation: (
      { messages: Array<(
        { kind: OperationMessageKind, message: string, field: string | null }
        & { __typename: 'OperationMessage' }
      )> }
      & { __typename: 'OperationInfo' }
    ) | null }
    & { __typename: 'InstanceAdminMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type InviteUserToInstanceMutationVariables = Exact<{
  instanceId: string | number;
  email: string;
}>;


export type InviteUserToInstanceMutation = (
  { instanceAdmin: (
    { inviteUserToInstance:
      | (
        { id: string, email: string, expiresAt: string }
        & { __typename: 'InstanceInvitation' }
      )
      | (
        { messages: Array<(
          { kind: OperationMessageKind, message: string, field: string | null }
          & { __typename: 'OperationMessage' }
        )> }
        & { __typename: 'OperationInfo' }
      )
     }
    & { __typename: 'InstanceAdminMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type CanEditModelQueryVariables = Exact<{ [key: string]: never; }>;


export type CanEditModelQuery = (
  { instance: (
    { id: string, nodes: Array<(
      { id: string }
      & { __typename: 'ActionNode' | 'Node' }
    )> }
    & { __typename: 'InstanceType' }
  ) }
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
    { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean }
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

export type FrameworkConfigsQueryVariables = Exact<{
  identifier: string | number;
  clientUrl: string | null | undefined;
}>;


export type FrameworkConfigsQuery = (
  { framework: (
    { id: string, configs: Array<(
      { id: string, organizationName: string | null, viewUrl: string | null, instance: (
        { id: string, identifier: string, name: string }
        & { __typename: 'InstanceType' }
      ) | null }
      & { __typename: 'FrameworkConfig' }
    )> }
    & { __typename: 'Framework' }
  ) | null }
  & { __typename: 'Query' }
);

export type SetNormalizationFromWidgetMutationVariables = Exact<{
  id: string | number | null | undefined;
}>;


export type SetNormalizationFromWidgetMutation = (
  { setNormalizer: (
    { ok: boolean }
    & { __typename: 'SetNormalizerMutation' }
  ) }
  & { __typename: 'Mutation' }
);

export type SetParameterMutationVariables = Exact<{
  parameterId: string | number;
  boolValue: boolean | null | undefined;
  numberValue: number | null | undefined;
  stringValue: string | null | undefined;
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

export type ModelEditorAccessQueryVariables = Exact<{ [key: string]: never; }>;


export type ModelEditorAccessQuery = (
  { instance: (
    { id: string, editor: { __typename: 'InstanceEditor' } | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
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
  node: string | number;
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
        { id: string, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: (
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
              | (
                { formula: string }
                & { __typename: 'FormulaConfigType' }
              )
              | (
                { operations: Record<string, unknown> | unknown[] }
                & { __typename: 'PipelineConfigType' }
              )
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
        { id: string, isOutcome: boolean, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, quantityKind: (
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
              | (
                { formula: string }
                & { __typename: 'FormulaConfigType' }
              )
              | (
                { operations: Record<string, unknown> | unknown[] }
                & { __typename: 'PipelineConfigType' }
              )
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
  { id: string, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, group: (
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
        | (
          { formula: string }
          & { __typename: 'FormulaConfigType' }
        )
        | (
          { operations: Record<string, unknown> | unknown[] }
          & { __typename: 'PipelineConfigType' }
        )
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
  { isOutcome: boolean, id: string, identifier: string, name: string, shortName: string | null, description: string | null, shortDescription: string | null, color: string | null, isVisible: boolean, uuid: string, kind: NodeKind | null, quantityKind: (
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
        | (
          { formula: string }
          & { __typename: 'FormulaConfigType' }
        )
        | (
          { operations: Record<string, unknown> | unknown[] }
          & { __typename: 'PipelineConfigType' }
        )
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
  nodeId: string | number;
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
                { id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
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
                )>, normalizedBy: (
                  { id: string, name: string }
                  & { __typename: 'NormalizerNodeType' }
                ) | null, goals: Array<(
                  { categories: Array<string>, groups: Array<string>, values: Array<(
                    { year: number, value: number, isInterpolated: boolean }
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

export type DataPointInstanceChangeHistoryQueryVariables = Exact<{
  limit?: number;
}>;


export type DataPointInstanceChangeHistoryQuery = (
  { instance: (
    { id: string, editor: (
      { changeHistory: Array<(
        { uuid: string, createdAt: string, userEmail: string | null, entries: Array<(
          { uuid: string, action: string, targetUuid: string | null, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null, createdAt: string }
          & { __typename: 'InstanceModelLogEntryType' }
        )> }
        & { __typename: 'InstanceChangeOperationType' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type DatasetSummaryFieldsFragment = (
  { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, lastModifiedAt: string | null, externalRef: (
    { repoUrl: string, commit: string | null, datasetId: string }
    & { __typename: 'DatasetExternalRefType' }
  ) | null, dimensions: Array<(
    { id: string, name: string }
    & { __typename: 'DatasetDimension' }
  )>, metrics: Array<(
    { id: string, label: string, unit: string }
    & { __typename: 'DatasetMetric' }
  )>, lastModifiedBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null }
  & { __typename: 'Dataset' }
);

export type DataPointCommentFieldsFragment = (
  { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null, createdBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null, lastModifiedBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null }
  & { __typename: 'DataPointComment' }
);

export type DataSourceFieldsFragment = (
  { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
  & { __typename: 'DataSource' }
);

export type DatasetSourceReferenceFieldsFragment = (
  { id: string, createdAt: string, lastModifiedAt: string, dataPoint: (
    { id: string }
    & { __typename: 'DataPoint' }
  ) | null, dataSource: (
    { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
    & { __typename: 'DataSource' }
  ), createdBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null, lastModifiedBy: (
    { id: string, firstName: string, lastName: string, email: string }
    & { __typename: 'User' }
  ) | null }
  & { __typename: 'DatasetSourceReference' }
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
    { id: string, date: string, value: number | null, metric: (
      { id: string }
      & { __typename: 'DatasetMetric' }
    ), dimensionCategories: Array<(
      { uuid: string }
      & { __typename: 'DatasetDimensionCategory' }
    )>, comments: Array<(
      { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
        { id: string, firstName: string, lastName: string, email: string }
        & { __typename: 'User' }
      ) | null, createdBy: (
        { id: string, firstName: string, lastName: string, email: string }
        & { __typename: 'User' }
      ) | null, lastModifiedBy: (
        { id: string, firstName: string, lastName: string, email: string }
        & { __typename: 'User' }
      ) | null }
      & { __typename: 'DataPointComment' }
    )> }
    & { __typename: 'DataPoint' }
  )>, portBindings: Array<(
    { id: string, nodeRef: (
      { nodeId: string, portId: string }
      & { __typename: 'NodePortRef' }
    ) }
    & { __typename: 'DatasetPortType' }
  )>, sourceReferences: Array<(
    { id: string, createdAt: string, lastModifiedAt: string, dataPoint: (
      { id: string }
      & { __typename: 'DataPoint' }
    ) | null, dataSource: (
      { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
      & { __typename: 'DataSource' }
    ), createdBy: (
      { id: string, firstName: string, lastName: string, email: string }
      & { __typename: 'User' }
    ) | null, lastModifiedBy: (
      { id: string, firstName: string, lastName: string, email: string }
      & { __typename: 'User' }
    ) | null }
    & { __typename: 'DatasetSourceReference' }
  )> }
  & { __typename: 'Dataset' }
);

export type InstanceDatasetsQueryVariables = Exact<{ [key: string]: never; }>;


export type InstanceDatasetsQuery = (
  { instance: (
    { id: string, editor: (
      { datasets: Array<(
        { id: string, identifier: string | null, name: string, isExternalPlaceholder: boolean, lastModifiedAt: string | null, dataPointComments: Array<(
          { id: string }
          & { __typename: 'DataPointComment' }
        )>, externalRef: (
          { repoUrl: string, commit: string | null, datasetId: string }
          & { __typename: 'DatasetExternalRefType' }
        ) | null, dimensions: Array<(
          { id: string, name: string }
          & { __typename: 'DatasetDimension' }
        )>, metrics: Array<(
          { id: string, label: string, unit: string }
          & { __typename: 'DatasetMetric' }
        )>, lastModifiedBy: (
          { id: string, firstName: string, lastName: string, email: string }
          & { __typename: 'User' }
        ) | null }
        & { __typename: 'Dataset' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type InstanceDatasetQueryVariables = Exact<{
  datasetId: string | number;
}>;


export type InstanceDatasetQuery = (
  { instance: (
    { id: string, editor: (
      { dataset: (
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
          { id: string, date: string, value: number | null, metric: (
            { id: string }
            & { __typename: 'DatasetMetric' }
          ), dimensionCategories: Array<(
            { uuid: string }
            & { __typename: 'DatasetDimensionCategory' }
          )>, comments: Array<(
            { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
              { id: string, firstName: string, lastName: string, email: string }
              & { __typename: 'User' }
            ) | null, createdBy: (
              { id: string, firstName: string, lastName: string, email: string }
              & { __typename: 'User' }
            ) | null, lastModifiedBy: (
              { id: string, firstName: string, lastName: string, email: string }
              & { __typename: 'User' }
            ) | null }
            & { __typename: 'DataPointComment' }
          )> }
          & { __typename: 'DataPoint' }
        )>, portBindings: Array<(
          { id: string, nodeRef: (
            { nodeId: string, portId: string }
            & { __typename: 'NodePortRef' }
          ) }
          & { __typename: 'DatasetPortType' }
        )>, sourceReferences: Array<(
          { id: string, createdAt: string, lastModifiedAt: string, dataPoint: (
            { id: string }
            & { __typename: 'DataPoint' }
          ) | null, dataSource: (
            { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
            & { __typename: 'DataSource' }
          ), createdBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, lastModifiedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null }
          & { __typename: 'DatasetSourceReference' }
        )> }
        & { __typename: 'Dataset' }
      ) | null, dataSources: Array<(
        { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
        & { __typename: 'DataSource' }
      )> }
      & { __typename: 'InstanceEditor' }
    ) | null }
    & { __typename: 'InstanceType' }
  ) }
  & { __typename: 'Query' }
);

export type DatasetConnectedNodesQueryVariables = Exact<{
  ids: Array<string | number>;
}>;


export type DatasetConnectedNodesQuery = (
  { instance: (
    { id: string, nodes: Array<
      | (
        { id: string, name: string, kind: NodeKind | null, editor: (
          { nodeType: string, spec: (
            { typeConfig:
              | (
                { nodeClass: string }
                & { __typename: 'ActionConfigType' | 'SimpleConfigType' }
              )
              | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
             }
            & { __typename: 'NodeSpecType' }
          ) | null }
          & { __typename: 'NodeEditor' }
        ) | null }
        & { __typename: 'ActionNode' }
      )
      | (
        { isOutcome: boolean, id: string, name: string, kind: NodeKind | null, editor: (
          { nodeType: string, spec: (
            { typeConfig:
              | (
                { nodeClass: string }
                & { __typename: 'ActionConfigType' | 'SimpleConfigType' }
              )
              | { __typename: 'FormulaConfigType' | 'PipelineConfigType' }
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

export type DataPointFieldsFragment = (
  { id: string, date: string, value: number | null, metric: (
    { id: string }
    & { __typename: 'DatasetMetric' }
  ), dimensionCategories: Array<(
    { uuid: string }
    & { __typename: 'DatasetDimensionCategory' }
  )> }
  & { __typename: 'DataPoint' }
);

export type CreateDataPointMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: CreateDataPointInput;
}>;


export type CreateDataPointMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { createDataPoint:
        | (
          { id: string, date: string, value: number | null, metric: (
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
  instanceId: string | number;
  datasetId: string | number;
  dataPointId: string | number;
  input: UpdateDataPointInput;
}>;


export type UpdateDataPointMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { updateDataPoint:
        | (
          { id: string, date: string, value: number | null, metric: (
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
  instanceId: string | number;
  datasetId: string | number;
  dataPointId: string | number;
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

export type CreateDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  dataPointId: string | number;
  input: CreateDataPointCommentInput;
}>;


export type CreateDataPointCommentMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { createDataPointComment:
        | (
          { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, createdBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, lastModifiedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null }
          & { __typename: 'DataPointComment' }
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

export type ResolveDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  commentId: string | number;
}>;


export type ResolveDataPointCommentMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { resolveDataPointComment:
        | (
          { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, createdBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, lastModifiedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null }
          & { __typename: 'DataPointComment' }
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

export type UnresolveDataPointCommentMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  commentId: string | number;
}>;


export type UnresolveDataPointCommentMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { unresolveDataPointComment:
        | (
          { id: string, text: string, isSticky: boolean, isReview: boolean, reviewState: DataPointCommentReviewState | null, resolvedAt: string | null, createdAt: string, lastModifiedAt: string, resolvedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, createdBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, lastModifiedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null }
          & { __typename: 'DataPointComment' }
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

export type CreateSourceReferenceMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  input: CreateDatasetSourceReferenceInput;
}>;


export type CreateSourceReferenceMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { createSourceReference:
        | (
          { id: string, createdAt: string, lastModifiedAt: string, dataPoint: (
            { id: string }
            & { __typename: 'DataPoint' }
          ) | null, dataSource: (
            { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
            & { __typename: 'DataSource' }
          ), createdBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null, lastModifiedBy: (
            { id: string, firstName: string, lastName: string, email: string }
            & { __typename: 'User' }
          ) | null }
          & { __typename: 'DatasetSourceReference' }
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

export type CreateDataSourceMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateDataSourceInput;
}>;


export type CreateDataSourceMutation = (
  { instanceEditor: (
    { createDataSource:
      | (
        { id: string, name: string, label: string, authority: string | null, edition: string | null, url: string | null, description: string | null }
        & { __typename: 'DataSource' }
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

export type DeleteSourceReferenceMutationVariables = Exact<{
  instanceId: string | number;
  datasetId: string | number;
  referenceId: string | number;
}>;


export type DeleteSourceReferenceMutation = (
  { instanceEditor: (
    { datasetEditor: (
      { deleteSourceReference: (
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
  instanceId: string | number;
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
  instanceId: string | number;
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
  instanceId: string | number;
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
  instanceId: string | number;
  categoryId: string;
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
  nodeId: string | number;
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
            { id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
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
            )>, normalizedBy: (
              { id: string, name: string }
              & { __typename: 'NormalizerNodeType' }
            ) | null, goals: Array<(
              { categories: Array<string>, groups: Array<string>, values: Array<(
                { year: number, value: number, isInterpolated: boolean }
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
  instanceId: string | number;
  version: string | null | undefined;
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
  instanceId: string | number;
  input: CreateNodeInput;
  version: string | null | undefined;
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

export type NodeParametersQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeParametersQuery = (
  { node: (
    { id: string, parameters: Array<
      | (
        { id: string, nodeRelativeId: string | null, isCustomizable: boolean, boolValue: boolean | null }
        & { __typename: 'BoolParameterType' }
      )
      | (
        { id: string, nodeRelativeId: string | null, isCustomizable: boolean, numberValue: number | null }
        & { __typename: 'NumberParameterType' }
      )
      | (
        { id: string, nodeRelativeId: string | null, isCustomizable: boolean, stringValue: string | null }
        & { __typename: 'StringParameterType' }
      )
      | (
        { id: string, nodeRelativeId: string | null, isCustomizable: boolean }
        & { __typename: 'UnknownParameterType' }
      )
    > }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
);

export type CreateEdgeMutationVariables = Exact<{
  instanceId: string | number;
  input: CreateEdgeInput;
  version: string | null | undefined;
}>;


export type CreateEdgeMutation = (
  { instanceEditor: (
    { createEdge:
      | (
        { id: string, fromRef: (
          { nodeId: string, portId: string }
          & { __typename: 'NodePortRef' }
        ), toRef: (
          { nodeId: string, portId: string }
          & { __typename: 'NodePortRef' }
        ) }
        & { __typename: 'NodeEdgeType' }
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

export type DeleteEdgeMutationVariables = Exact<{
  instanceId: string | number;
  edgeId: string | number;
  version: string | null | undefined;
}>;


export type DeleteEdgeMutation = (
  { instanceEditor: (
    { deleteEdge: (
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

export type DeleteNodeMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  version: string | null | undefined;
}>;


export type DeleteNodeMutation = (
  { instanceEditor: (
    { deleteNode: (
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

export type UpdateNodeMutationVariables = Exact<{
  instanceId: string | number;
  nodeId: string | number;
  input: UpdateNodeInput;
  version: string | null | undefined;
}>;


export type UpdateNodeMutation = (
  { instanceEditor: (
    { updateNode:
      | (
        { id: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, editor: (
          { nodeGroup: string | null }
          & { __typename: 'NodeEditor' }
        ) | null }
        & { __typename: 'ActionNode' }
      )
      | (
        { id: string, name: string, shortName: string | null, description: string | null, color: string | null, isVisible: boolean, isOutcome: boolean, editor: (
          { nodeGroup: string | null }
          & { __typename: 'NodeEditor' }
        ) | null }
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

export type NodeTranslationQueryVariables = Exact<{
  nodeId: string | number;
}>;


export type NodeTranslationQuery = (
  { node: (
    { id: string, name: string, description: string | null, shortDescription: string | null }
    & { __typename: 'ActionNode' | 'Node' }
  ) | null }
  & { __typename: 'Query' }
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
  { uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null }
  & { __typename: 'InstanceModelLogEntryType' }
);

export type NodeChangeHistoryQueryVariables = Exact<{
  nodeId: string | number;
  limit?: number;
}>;


export type NodeChangeHistoryQuery = (
  { node: (
    { uuid: string, id: string, changeHistory: Array<(
      { uuid: string, action: string, createdAt: string, targetKind: ChangeTargetKind, before: Record<string, unknown> | unknown[] | null, after: Record<string, unknown> | unknown[] | null }
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
  { id: string, name: string, measureDatapointYears: Array<number>, years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
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
  )>, normalizedBy: (
    { id: string, name: string }
    & { __typename: 'NormalizerNodeType' }
  ) | null, goals: Array<(
    { categories: Array<string>, groups: Array<string>, values: Array<(
      { year: number, value: number, isInterpolated: boolean }
      & { __typename: 'MetricYearlyGoalType' }
    )> }
    & { __typename: 'DimensionalMetricGoalEntry' }
  )> }
  & { __typename: 'DimensionalMetricType' }
);

export type InstanceGoalOutcomeQueryVariables = Exact<{
  goal: string | number;
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
  scenarioId: string | number;
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
  hostname: string;
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
  node: string | number;
  goal: string | number | null | undefined;
  untilNode: string | number | null | undefined;
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
  node: string | number;
  goal: string | number | null | undefined;
  downstreamDepth: number | null | undefined;
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
          { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean }
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
  impact1: string | number;
  impact2: string | number;
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
  goal: string | number | null | undefined;
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
  )> }
  & { __typename: 'Query' }
);

export type ActionsForChooserQueryVariables = Exact<{ [key: string]: never; }>;


export type ActionsForChooserQuery = (
  { actions: Array<(
    { id: string, name: string, parameters: Array<
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
    >, group: (
      { id: string, name: string, color: string | null }
      & { __typename: 'ActionGroupType' }
    ) | null }
    & { __typename: 'ActionNode' }
  )> }
  & { __typename: 'Query' }
);

export type ImpactOverviewsQueryVariables = Exact<{ [key: string]: never; }>;


export type ImpactOverviewsQuery = (
  { impactOverviews: Array<(
    { id: string, graphType: string | null, label: string, costLabel: string | null, effectLabel: string | null, indicatorLabel: string | null, costCategoryLabel: string | null, effectCategoryLabel: string | null, description: string | null, stakeholderDimension: string | null, outcomeDimension: string | null, plotLimitForIndicator: number | null, effectNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'Node' }
    ), costNode: (
      { id: string, name: string, shortDescription: string | null, unit: (
        { id: string, short: string }
        & { __typename: 'UnitType' }
      ) | null }
      & { __typename: 'Node' }
    ) | null, effectUnit: (
      { id: string, short: string, long: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, indicatorUnit: (
      { id: string, short: string, long: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ), costUnit: (
      { id: string, short: string, long: string, htmlShort: string }
      & { __typename: 'UnitType' }
    ) | null, actions: Array<(
      { unitAdjustmentMultiplier: number | null, action: (
        { id: string, name: string, group: (
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
      ) | null> | null, effectDim: (
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
    )>, wedge: Array<(
      { id: string, label: string, isScenario: boolean, metric: (
        { years: Array<number>, values: Array<number>, stackable: boolean, forecastFrom: number | null, unit: (
          { id: string, short: string }
          & { __typename: 'UnitType' }
        ) }
        & { __typename: 'DimensionalMetricType' }
      ) }
      & { __typename: 'WedgeEntryType' }
    )> | null }
    & { __typename: 'ImpactOverviewType' }
  )> }
  & { __typename: 'Query' }
);

export type NodeVisualizationsQueryVariables = Exact<{
  nodeId: string | number;
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
  id: string | number;
  goal: string | number | null | undefined;
  scenarios: Array<string> | null | undefined;
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
  path: string;
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
            { id: string, identifier: string, name: string, description: string, allowUserRegistration: boolean, allowInstanceCreation: boolean }
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
    { id: string, name: string, themeIdentifier: string | null, owner: string | null, defaultLanguage: string, supportedLanguages: Array<string>, targetYear: number | null, modelEndYear: number, referenceYear: number | null, minimumHistoricalYear: number, maximumHistoricalYear: number | null, leadTitle: string, leadParagraph: string | null, frameworkConfig: (
      { id: string, framework: (
        { id: string, identifier: string, name: string }
        & { __typename: 'Framework' }
      ) }
      & { __typename: 'FrameworkConfig' }
    ) | null, features: (
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
