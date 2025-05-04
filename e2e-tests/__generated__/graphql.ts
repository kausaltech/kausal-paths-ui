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
  DateTime: { input: any; output: any; }
  JSONString: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  RichText: { input: any; output: any; }
  UUID: { input: any; output: any; }
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
  organizationName?: InputMaybe<Scalars['String']['input']>;
  /** Target year for model. */
  targetYear?: InputMaybe<Scalars['Int']['input']>;
  /** UUID for the new framework config. If not set, will be generated automatically. */
  uuid?: InputMaybe<Scalars['UUID']['input']>;
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
  hostname?: InputMaybe<Scalars['String']['input']>;
  identifier?: InputMaybe<Scalars['ID']['input']>;
  locale?: InputMaybe<Scalars['String']['input']>;
};

export enum LowHigh {
  High = 'HIGH',
  Low = 'LOW'
}

export type MeasureDataPointInput = {
  /** Value for the data point (set to null to remove) */
  value?: InputMaybe<Scalars['Float']['input']>;
  /** Year of the data point. If not given, defaults to the baseline year for the framework instance */
  year?: InputMaybe<Scalars['Int']['input']>;
};

export type MeasureInput = {
  dataPoints?: InputMaybe<Array<MeasureDataPointInput>>;
  /** Internal notes for the measure instance */
  internalNotes?: InputMaybe<Scalars['String']['input']>;
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


export type PlaywrightGetInstanceInfoQuery = { __typename?: 'Query', instance: { __typename?: 'InstanceType', id: string, name: string, defaultLanguage: string, supportedLanguages: Array<string>, features: { __typename?: 'InstanceFeaturesType', showRefreshPrompt: boolean } }, pages: Array<{ __typename: 'ActionListPage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'InstanceRootPage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'OutcomePage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'Page', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'StaticPage', urlPath: string, title: string, showInMenus: boolean }>, actions: Array<{ __typename?: 'ActionNode', id: string }> };
