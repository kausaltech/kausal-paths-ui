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

export type PlaywrightGetInstanceBasicsQueryVariables = Exact<{
  instance: Scalars['ID']['input'];
}>;


export type PlaywrightGetInstanceBasicsQuery = { __typename?: 'Query', instance: { __typename?: 'InstanceType', id: string, defaultLanguage: string, supportedLanguages: Array<string> } };

export type PlaywrightGetInstanceInfoQueryVariables = Exact<{
  instance: Scalars['ID']['input'];
  locale: Scalars['String']['input'];
}>;


export type PlaywrightGetInstanceInfoQuery = { __typename?: 'Query', instance: { __typename?: 'InstanceType', id: string, name: string, defaultLanguage: string, supportedLanguages: Array<string> }, pages: Array<{ __typename: 'ActionListPage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'InstanceRootPage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'OutcomePage', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'Page', urlPath: string, title: string, showInMenus: boolean } | { __typename: 'StaticPage', urlPath: string, title: string, showInMenus: boolean }>, actions: Array<{ __typename?: 'ActionNode', id: string }> };
