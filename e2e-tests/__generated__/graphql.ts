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
  DateTime: { input: any; output: any; }
  JSON: { input: any; output: any; }
  JSONString: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  RichText: { input: any; output: any; }
  UUID: { input: any; output: any; }
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

/** Which governance level is applicable for an action */
export enum DecisionLevel {
  Eu = 'EU',
  Municipality = 'MUNICIPALITY',
  Nation = 'NATION'
}

export enum DimensionKind {
  Common = 'COMMON',
  Node = 'NODE',
  Scenario = 'SCENARIO'
}

export enum NodeKind {
  Action = 'ACTION',
  Formula = 'FORMULA',
  Pipeline = 'PIPELINE',
  Simple = 'SIMPLE'
}

export enum PrimaryLayoutClass {
  Action = 'ACTION',
  ContextSource = 'CONTEXT_SOURCE',
  Core = 'CORE',
  GhostableContextSource = 'GHOSTABLE_CONTEXT_SOURCE',
  Outcome = 'OUTCOME'
}

export enum VisualizationKind {
  Group = 'group',
  Node = 'node'
}

export type PlaywrightGetInstanceBasicsQueryVariables = Exact<{
  instance: Scalars['ID']['input'];
}>;


export type PlaywrightGetInstanceBasicsQuery = { __typename?: 'Query', instance: { __typename?: 'InstanceType', id: string, defaultLanguage: string, supportedLanguages: Array<string> } };

export type PlaywrightGetInstanceInfoQueryVariables = Exact<{
  instance: Scalars['ID']['input'];
  locale: Scalars['String']['input'];
}>;


export type PlaywrightGetInstanceInfoQuery = { __typename?: 'Query', instance: { __typename?: 'InstanceType', id: string, name: string, defaultLanguage: string, supportedLanguages: Array<string>, features: { __typename?: 'InstanceFeaturesType', showRefreshPrompt: boolean }, goals: Array<{ __typename?: 'InstanceGoalEntry', id: string }> }, pages: Array<
    | { __typename: 'ActionListPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'DashboardPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'InstanceRootPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'OutcomePage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'Page', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'StaticPage', urlPath: string, title: string, showInMenus: boolean }
  >, actions: Array<{ __typename?: 'ActionNode', id: string, isVisible: boolean, group?: { __typename?: 'ActionGroupType', id: string } | null, parameters: Array<
      | { __typename?: 'BoolParameterType', localId?: string | null, isCustomizable: boolean }
      | { __typename?: 'NumberParameterType', localId?: string | null, isCustomizable: boolean }
      | { __typename?: 'StringParameterType', localId?: string | null, isCustomizable: boolean }
      | { __typename?: 'UnknownParameterType', localId?: string | null, isCustomizable: boolean }
    > }> };
