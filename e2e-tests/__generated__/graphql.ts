/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type PlaywrightGetInstanceBasicsQueryVariables = Exact<{
  instance: string | number;
}>;


export type PlaywrightGetInstanceBasicsQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, defaultLanguage: string, supportedLanguages: Array<string> } };

export type PlaywrightGetInstanceInfoQueryVariables = Exact<{
  instance: string | number;
  locale: string;
}>;


export type PlaywrightGetInstanceInfoQuery = { __typename: 'Query', instance: { __typename: 'InstanceType', id: string, name: string, defaultLanguage: string, supportedLanguages: Array<string>, features: { __typename: 'InstanceFeaturesType', showRefreshPrompt: boolean }, goals: Array<{ __typename: 'InstanceGoalEntry', id: string }> }, pages: Array<
    | { __typename: 'ActionListPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'DashboardPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'InstanceRootPage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'OutcomePage', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'Page', urlPath: string, title: string, showInMenus: boolean }
    | { __typename: 'StaticPage', urlPath: string, title: string, showInMenus: boolean }
  >, actions: Array<{ __typename: 'ActionNode', id: string, isVisible: boolean, group: { __typename: 'ActionGroupType', id: string } | null, parameters: Array<
      | { __typename: 'BoolParameterType', localId: string | null, isCustomizable: boolean }
      | { __typename: 'NumberParameterType', localId: string | null, isCustomizable: boolean }
      | { __typename: 'StringParameterType', localId: string | null, isCustomizable: boolean }
      | { __typename: 'UnknownParameterType', localId: string | null, isCustomizable: boolean }
    > }> };
