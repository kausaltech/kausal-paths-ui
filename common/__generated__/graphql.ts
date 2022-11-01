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

export type ActionEfficiency = {
  __typename?: 'ActionEfficiency';
  action?: Maybe<NodeType>;
  costValues?: Maybe<Array<Maybe<YearlyValue>>>;
  cumulativeCost?: Maybe<Scalars['Float']>;
  cumulativeEfficiency?: Maybe<Scalars['Float']>;
  cumulativeImpact?: Maybe<Scalars['Float']>;
  impactValues?: Maybe<Array<Maybe<YearlyValue>>>;
};

export type ActionEfficiencyPairType = {
  __typename?: 'ActionEfficiencyPairType';
  actions?: Maybe<Array<Maybe<ActionEfficiency>>>;
  costNode?: Maybe<NodeType>;
  efficiencyUnit?: Maybe<UnitType>;
  id?: Maybe<Scalars['ID']>;
  impactNode?: Maybe<NodeType>;
  label?: Maybe<Scalars['String']>;
};

export type ActionGroupType = {
  __typename?: 'ActionGroupType';
  actions?: Maybe<Array<Maybe<NodeType>>>;
  color?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
};

export type ActionListPage = PageInterface & {
  __typename?: 'ActionListPage';
  aliasOf?: Maybe<Page>;
  ancestors: Array<PageInterface>;
  children: Array<PageInterface>;
  contentType: Scalars['String'];
  depth?: Maybe<Scalars['Int']>;
  descendants: Array<PageInterface>;
  draftTitle: Scalars['String'];
  expireAt?: Maybe<Scalars['DateTime']>;
  expired: Scalars['Boolean'];
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  goLiveAt?: Maybe<Scalars['DateTime']>;
  hasUnpublishedChanges: Scalars['Boolean'];
  id?: Maybe<Scalars['ID']>;
  lastPublishedAt?: Maybe<Scalars['DateTime']>;
  latestRevisionCreatedAt?: Maybe<Scalars['DateTime']>;
  leadParagraph?: Maybe<Scalars['String']>;
  leadTitle?: Maybe<Scalars['String']>;
  live: Scalars['Boolean'];
  locked?: Maybe<Scalars['Boolean']>;
  lockedAt?: Maybe<Scalars['DateTime']>;
  nextSiblings: Array<PageInterface>;
  numchild: Scalars['Int'];
  pageType?: Maybe<Scalars['String']>;
  parent?: Maybe<PageInterface>;
  path: Scalars['String'];
  previousSiblings: Array<PageInterface>;
  searchDescription?: Maybe<Scalars['String']>;
  seoTitle: Scalars['String'];
  showInFooter?: Maybe<Scalars['Boolean']>;
  showInMenus: Scalars['Boolean'];
  siblings: Array<PageInterface>;
  slug: Scalars['String'];
  title: Scalars['String'];
  translationKey: Scalars['UUID'];
  url?: Maybe<Scalars['String']>;
  urlPath: Scalars['String'];
};


export type ActionListPageAncestorsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type ActionListPageChildrenArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type ActionListPageDescendantsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type ActionListPageNextSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type ActionListPagePreviousSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type ActionListPageSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

export type ActivateScenarioMutation = {
  __typename?: 'ActivateScenarioMutation';
  activeScenario?: Maybe<ScenarioType>;
  ok?: Maybe<Scalars['Boolean']>;
};

export type BlockQuoteBlock = StreamFieldInterface & {
  __typename?: 'BlockQuoteBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type BoolParameterType = ParameterInterface & {
  __typename?: 'BoolParameterType';
  defaultValue?: Maybe<Scalars['Boolean']>;
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isCustomizable?: Maybe<Scalars['Boolean']>;
  isCustomized?: Maybe<Scalars['Boolean']>;
  label?: Maybe<Scalars['String']>;
  node?: Maybe<NodeType>;
  nodeRelativeId?: Maybe<Scalars['ID']>;
  value?: Maybe<Scalars['Boolean']>;
};

export type BooleanBlock = StreamFieldInterface & {
  __typename?: 'BooleanBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['Boolean'];
};

export type CharBlock = StreamFieldInterface & {
  __typename?: 'CharBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type ChoiceBlock = StreamFieldInterface & {
  __typename?: 'ChoiceBlock';
  blockType: Scalars['String'];
  choices: Array<ChoiceOption>;
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type ChoiceOption = {
  __typename?: 'ChoiceOption';
  key: Scalars['String'];
  value: Scalars['String'];
};

/** Collection type */
export type CollectionObjectType = {
  __typename?: 'CollectionObjectType';
  ancestors: Array<Maybe<CollectionObjectType>>;
  depth: Scalars['Int'];
  descendants: Array<Maybe<CollectionObjectType>>;
  id: Scalars['ID'];
  name: Scalars['String'];
  numchild: Scalars['Int'];
  path: Scalars['String'];
};

export type DateBlock = StreamFieldInterface & {
  __typename?: 'DateBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};


export type DateBlockValueArgs = {
  format?: InputMaybe<Scalars['String']>;
};

export type DateTimeBlock = StreamFieldInterface & {
  __typename?: 'DateTimeBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};


export type DateTimeBlockValueArgs = {
  format?: InputMaybe<Scalars['String']>;
};

export type DecimalBlock = StreamFieldInterface & {
  __typename?: 'DecimalBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['Float'];
};

/** An enumeration. */
export enum DecisionLevel {
  Eu = 'EU',
  Municipality = 'MUNICIPALITY',
  Nation = 'NATION'
}

export type DocumentChooserBlock = StreamFieldInterface & {
  __typename?: 'DocumentChooserBlock';
  blockType: Scalars['String'];
  document: DocumentObjectType;
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
};

/**
 * Base document type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type DocumentObjectType = {
  __typename?: 'DocumentObjectType';
  collection: CollectionObjectType;
  createdAt: Scalars['DateTime'];
  file: Scalars['String'];
  fileHash: Scalars['String'];
  fileSize?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  tags: Array<TagObjectType>;
  title: Scalars['String'];
  url: Scalars['String'];
};

export type EmailBlock = StreamFieldInterface & {
  __typename?: 'EmailBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type EmbedBlock = StreamFieldInterface & {
  __typename?: 'EmbedBlock';
  blockType: Scalars['String'];
  embed?: Maybe<Scalars['String']>;
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawEmbed?: Maybe<Scalars['JSONString']>;
  rawValue: Scalars['String'];
  url: Scalars['String'];
  value: Scalars['String'];
};

export type FloatBlock = StreamFieldInterface & {
  __typename?: 'FloatBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['Float'];
};

export type ForecastMetricType = {
  __typename?: 'ForecastMetricType';
  baselineForecastValues?: Maybe<Array<YearlyValue>>;
  cumulativeForecastValue?: Maybe<Scalars['Float']>;
  forecastValues: Array<YearlyValue>;
  historicalValues?: Maybe<Array<YearlyValue>>;
  id?: Maybe<Scalars['ID']>;
  name?: Maybe<Scalars['String']>;
  outputNode?: Maybe<NodeType>;
  unit?: Maybe<UnitType>;
  yearlyCumulativeUnit?: Maybe<UnitType>;
};


export type ForecastMetricTypeHistoricalValuesArgs = {
  latest?: InputMaybe<Scalars['Int']>;
};

export type ImageChooserBlock = StreamFieldInterface & {
  __typename?: 'ImageChooserBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  image: ImageObjectType;
  rawValue: Scalars['String'];
};

export type ImageObjectType = {
  __typename?: 'ImageObjectType';
  aspectRatio: Scalars['Float'];
  collection: CollectionObjectType;
  createdAt: Scalars['DateTime'];
  file: Scalars['String'];
  fileHash: Scalars['String'];
  fileSize?: Maybe<Scalars['Int']>;
  focalPointHeight?: Maybe<Scalars['Int']>;
  focalPointWidth?: Maybe<Scalars['Int']>;
  focalPointX?: Maybe<Scalars['Int']>;
  focalPointY?: Maybe<Scalars['Int']>;
  height: Scalars['Int'];
  id: Scalars['ID'];
  rendition?: Maybe<ImageRenditionObjectType>;
  renditions: Array<ImageRenditionObjectType>;
  sizes: Scalars['String'];
  /** @deprecated Use the `url` attribute */
  src: Scalars['String'];
  srcSet?: Maybe<Scalars['String']>;
  tags: Array<TagObjectType>;
  title: Scalars['String'];
  url: Scalars['String'];
  width: Scalars['Int'];
};


export type ImageObjectTypeRenditionArgs = {
  bgcolor?: InputMaybe<Scalars['String']>;
  fill?: InputMaybe<Scalars['String']>;
  format?: InputMaybe<Scalars['String']>;
  height?: InputMaybe<Scalars['Int']>;
  jpegquality?: InputMaybe<Scalars['Int']>;
  max?: InputMaybe<Scalars['String']>;
  min?: InputMaybe<Scalars['String']>;
  webpquality?: InputMaybe<Scalars['Int']>;
  width?: InputMaybe<Scalars['Int']>;
};


export type ImageObjectTypeSrcSetArgs = {
  format?: InputMaybe<Scalars['String']>;
  sizes?: InputMaybe<Array<InputMaybe<Scalars['Int']>>>;
};

export type ImageRenditionObjectType = {
  __typename?: 'ImageRenditionObjectType';
  aspectRatio: Scalars['Float'];
  collection: CollectionObjectType;
  createdAt: Scalars['DateTime'];
  file: Scalars['String'];
  fileHash: Scalars['String'];
  fileSize?: Maybe<Scalars['Int']>;
  filterSpec: Scalars['String'];
  focalPointHeight?: Maybe<Scalars['Int']>;
  focalPointKey: Scalars['String'];
  focalPointWidth?: Maybe<Scalars['Int']>;
  focalPointX?: Maybe<Scalars['Int']>;
  focalPointY?: Maybe<Scalars['Int']>;
  height: Scalars['Int'];
  id: Scalars['ID'];
  image: ImageObjectType;
  sizes: Scalars['String'];
  /** @deprecated Use the `url` attribute */
  src: Scalars['String'];
  tags: Array<TagObjectType>;
  title: Scalars['String'];
  url: Scalars['String'];
  width: Scalars['Int'];
};

export type InstanceBasicConfiguration = {
  __typename?: 'InstanceBasicConfiguration';
  defaultLanguage: Scalars['String'];
  hostname: InstanceHostname;
  identifier: Scalars['String'];
  isProtected: Scalars['Boolean'];
  supportedLanguages: Array<Scalars['String']>;
  themeIdentifier: Scalars['String'];
};

export type InstanceFeaturesType = {
  __typename?: 'InstanceFeaturesType';
  baselineVisibleInGraphs: Scalars['Boolean'];
};

export type InstanceHostname = {
  __typename?: 'InstanceHostname';
  basePath?: Maybe<Scalars['String']>;
  hostname?: Maybe<Scalars['String']>;
};

export type InstanceType = {
  __typename?: 'InstanceType';
  actionGroups?: Maybe<Array<Maybe<ActionGroupType>>>;
  basePath?: Maybe<Scalars['String']>;
  defaultLanguage?: Maybe<Scalars['String']>;
  features: InstanceFeaturesType;
  hostname?: Maybe<InstanceHostname>;
  id?: Maybe<Scalars['ID']>;
  leadParagraph?: Maybe<Scalars['String']>;
  leadTitle?: Maybe<Scalars['String']>;
  maximumHistoricalYear?: Maybe<Scalars['Int']>;
  minimumHistoricalYear?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  owner?: Maybe<Scalars['String']>;
  referenceYear?: Maybe<Scalars['Int']>;
  supportedLanguages?: Maybe<Array<Maybe<Scalars['String']>>>;
  targetYear?: Maybe<Scalars['Int']>;
  themeIdentifier?: Maybe<Scalars['String']>;
};


export type InstanceTypeHostnameArgs = {
  hostname?: InputMaybe<Scalars['String']>;
};

export type IntegerBlock = StreamFieldInterface & {
  __typename?: 'IntegerBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['Int'];
};

export type ListBlock = StreamFieldInterface & {
  __typename?: 'ListBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  items: Array<StreamFieldInterface>;
  rawValue: Scalars['String'];
};

export type Mutations = {
  __typename?: 'Mutations';
  activateScenario?: Maybe<ActivateScenarioMutation>;
  resetParameter?: Maybe<ResetParameterMutation>;
  setParameter?: Maybe<SetParameterMutation>;
};


export type MutationsActivateScenarioArgs = {
  id: Scalars['ID'];
};


export type MutationsResetParameterArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type MutationsSetParameterArgs = {
  boolValue?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  numberValue?: InputMaybe<Scalars['Float']>;
  stringValue?: InputMaybe<Scalars['String']>;
};

export type NodePage = PageInterface & {
  __typename?: 'NodePage';
  aliasOf?: Maybe<Page>;
  ancestors: Array<PageInterface>;
  children: Array<PageInterface>;
  contentType: Scalars['String'];
  depth?: Maybe<Scalars['Int']>;
  descendants: Array<PageInterface>;
  draftTitle: Scalars['String'];
  expireAt?: Maybe<Scalars['DateTime']>;
  expired: Scalars['Boolean'];
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  goLiveAt?: Maybe<Scalars['DateTime']>;
  hasUnpublishedChanges: Scalars['Boolean'];
  id?: Maybe<Scalars['ID']>;
  lastPublishedAt?: Maybe<Scalars['DateTime']>;
  latestRevisionCreatedAt?: Maybe<Scalars['DateTime']>;
  live: Scalars['Boolean'];
  locked?: Maybe<Scalars['Boolean']>;
  lockedAt?: Maybe<Scalars['DateTime']>;
  nextSiblings: Array<PageInterface>;
  numchild: Scalars['Int'];
  pageType?: Maybe<Scalars['String']>;
  parent?: Maybe<PageInterface>;
  path: Scalars['String'];
  previousSiblings: Array<PageInterface>;
  searchDescription?: Maybe<Scalars['String']>;
  seoTitle: Scalars['String'];
  showInMenus: Scalars['Boolean'];
  siblings: Array<PageInterface>;
  slug: Scalars['String'];
  title: Scalars['String'];
  translationKey: Scalars['UUID'];
  url?: Maybe<Scalars['String']>;
  urlPath: Scalars['String'];
};


export type NodePageAncestorsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type NodePageChildrenArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type NodePageDescendantsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type NodePageNextSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type NodePagePreviousSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type NodePageSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

export type NodeType = {
  __typename?: 'NodeType';
  color?: Maybe<Scalars['String']>;
  decisionLevel?: Maybe<DecisionLevel>;
  description?: Maybe<Scalars['String']>;
  downstreamNodes: Array<NodeType>;
  group?: Maybe<ActionGroupType>;
  id: Scalars['ID'];
  impactMetric?: Maybe<ForecastMetricType>;
  inputNodes: Array<NodeType>;
  isAction: Scalars['Boolean'];
  metric?: Maybe<ForecastMetricType>;
  name: Scalars['String'];
  order?: Maybe<Scalars['Int']>;
  outputMetrics: Array<ForecastMetricType>;
  outputNodes: Array<NodeType>;
  parameters?: Maybe<Array<Maybe<ParameterInterface>>>;
  quantity?: Maybe<Scalars['String']>;
  shortDescription?: Maybe<Scalars['String']>;
  targetYearGoal?: Maybe<Scalars['Float']>;
  unit?: Maybe<UnitType>;
  upstreamActions?: Maybe<Array<NodeType>>;
  upstreamNodes: Array<NodeType>;
};


export type NodeTypeImpactMetricArgs = {
  targetNodeId?: InputMaybe<Scalars['ID']>;
};


export type NodeTypeUpstreamNodesArgs = {
  includeActions?: InputMaybe<Scalars['Boolean']>;
  sameQuantity?: InputMaybe<Scalars['Boolean']>;
  sameUnit?: InputMaybe<Scalars['Boolean']>;
};

export type NumberParameterType = ParameterInterface & {
  __typename?: 'NumberParameterType';
  defaultValue?: Maybe<Scalars['Float']>;
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isCustomizable?: Maybe<Scalars['Boolean']>;
  isCustomized?: Maybe<Scalars['Boolean']>;
  label?: Maybe<Scalars['String']>;
  maxValue?: Maybe<Scalars['Float']>;
  minValue?: Maybe<Scalars['Float']>;
  node?: Maybe<NodeType>;
  nodeRelativeId?: Maybe<Scalars['ID']>;
  step?: Maybe<Scalars['Float']>;
  unit?: Maybe<UnitType>;
  value?: Maybe<Scalars['Float']>;
};

export type OutcomePage = PageInterface & {
  __typename?: 'OutcomePage';
  aliasOf?: Maybe<Page>;
  ancestors: Array<PageInterface>;
  children: Array<PageInterface>;
  contentType: Scalars['String'];
  depth?: Maybe<Scalars['Int']>;
  descendants: Array<PageInterface>;
  draftTitle: Scalars['String'];
  expireAt?: Maybe<Scalars['DateTime']>;
  expired: Scalars['Boolean'];
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  goLiveAt?: Maybe<Scalars['DateTime']>;
  hasUnpublishedChanges: Scalars['Boolean'];
  i18n?: Maybe<Scalars['JSONString']>;
  id?: Maybe<Scalars['ID']>;
  lastPublishedAt?: Maybe<Scalars['DateTime']>;
  latestRevisionCreatedAt?: Maybe<Scalars['DateTime']>;
  leadParagraph: Scalars['String'];
  leadTitle: Scalars['String'];
  live: Scalars['Boolean'];
  locked?: Maybe<Scalars['Boolean']>;
  lockedAt?: Maybe<Scalars['DateTime']>;
  nextSiblings: Array<PageInterface>;
  numchild: Scalars['Int'];
  outcomeNode: NodeType;
  pagePtr: Page;
  pageType?: Maybe<Scalars['String']>;
  parent?: Maybe<PageInterface>;
  path: Scalars['String'];
  previousSiblings: Array<PageInterface>;
  searchDescription?: Maybe<Scalars['String']>;
  seoTitle: Scalars['String'];
  showInFooter?: Maybe<Scalars['Boolean']>;
  showInMenus: Scalars['Boolean'];
  siblings: Array<PageInterface>;
  slug: Scalars['String'];
  title: Scalars['String'];
  translationKey: Scalars['UUID'];
  url?: Maybe<Scalars['String']>;
  urlPath: Scalars['String'];
};


export type OutcomePageAncestorsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type OutcomePageChildrenArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type OutcomePageDescendantsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type OutcomePageNextSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type OutcomePagePreviousSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type OutcomePageSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type Page = PageInterface & {
  __typename?: 'Page';
  actionlistpage?: Maybe<ActionListPage>;
  aliasOf?: Maybe<Page>;
  aliases: Array<Page>;
  ancestors: Array<PageInterface>;
  children: Array<PageInterface>;
  contentType: Scalars['String'];
  depth?: Maybe<Scalars['Int']>;
  descendants: Array<PageInterface>;
  draftTitle: Scalars['String'];
  expireAt?: Maybe<Scalars['DateTime']>;
  expired: Scalars['Boolean'];
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  goLiveAt?: Maybe<Scalars['DateTime']>;
  hasUnpublishedChanges: Scalars['Boolean'];
  id?: Maybe<Scalars['ID']>;
  lastPublishedAt?: Maybe<Scalars['DateTime']>;
  latestRevisionCreatedAt?: Maybe<Scalars['DateTime']>;
  live: Scalars['Boolean'];
  locked?: Maybe<Scalars['Boolean']>;
  lockedAt?: Maybe<Scalars['DateTime']>;
  nextSiblings: Array<PageInterface>;
  nodepage?: Maybe<NodePage>;
  numchild: Scalars['Int'];
  outcomepage?: Maybe<OutcomePage>;
  pageType?: Maybe<Scalars['String']>;
  parent?: Maybe<PageInterface>;
  path: Scalars['String'];
  previousSiblings: Array<PageInterface>;
  searchDescription?: Maybe<Scalars['String']>;
  seoTitle: Scalars['String'];
  showInMenus: Scalars['Boolean'];
  siblings: Array<PageInterface>;
  sitesRootedHere: Array<SiteObjectType>;
  slug: Scalars['String'];
  title: Scalars['String'];
  translationKey: Scalars['UUID'];
  url?: Maybe<Scalars['String']>;
  urlPath: Scalars['String'];
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PageAncestorsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PageChildrenArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PageDescendantsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PageNextSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PagePreviousSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


/**
 * Base Page type used if one isn't generated for the current model.
 * All other node types extend this.
 */
export type PageSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

export type PageChooserBlock = StreamFieldInterface & {
  __typename?: 'PageChooserBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  page: PageInterface;
  rawValue: Scalars['String'];
};

export type PageInterface = {
  ancestors: Array<PageInterface>;
  children: Array<PageInterface>;
  contentType: Scalars['String'];
  depth?: Maybe<Scalars['Int']>;
  descendants: Array<PageInterface>;
  firstPublishedAt?: Maybe<Scalars['DateTime']>;
  id?: Maybe<Scalars['ID']>;
  lastPublishedAt?: Maybe<Scalars['DateTime']>;
  live: Scalars['Boolean'];
  locked?: Maybe<Scalars['Boolean']>;
  nextSiblings: Array<PageInterface>;
  pageType?: Maybe<Scalars['String']>;
  parent?: Maybe<PageInterface>;
  previousSiblings: Array<PageInterface>;
  searchDescription?: Maybe<Scalars['String']>;
  seoTitle: Scalars['String'];
  showInMenus: Scalars['Boolean'];
  siblings: Array<PageInterface>;
  slug: Scalars['String'];
  title: Scalars['String'];
  url?: Maybe<Scalars['String']>;
  urlPath: Scalars['String'];
};


export type PageInterfaceAncestorsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type PageInterfaceChildrenArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type PageInterfaceDescendantsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type PageInterfaceNextSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type PageInterfacePreviousSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};


export type PageInterfaceSiblingsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

export type ParameterInterface = {
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isCustomizable?: Maybe<Scalars['Boolean']>;
  isCustomized?: Maybe<Scalars['Boolean']>;
  label?: Maybe<Scalars['String']>;
  node?: Maybe<NodeType>;
  nodeRelativeId?: Maybe<Scalars['ID']>;
};

export type Query = {
  __typename?: 'Query';
  actionEfficiencyPairs: Array<ActionEfficiencyPairType>;
  actions: Array<NodeType>;
  activeScenario?: Maybe<ScenarioType>;
  availableInstances: Array<InstanceBasicConfiguration>;
  instance: InstanceType;
  node?: Maybe<NodeType>;
  nodes: Array<NodeType>;
  page?: Maybe<PageInterface>;
  pages?: Maybe<Array<Maybe<PageInterface>>>;
  parameter?: Maybe<ParameterInterface>;
  parameters?: Maybe<Array<Maybe<ParameterInterface>>>;
  scenario?: Maybe<ScenarioType>;
  scenarios: Array<ScenarioType>;
};


export type QueryAvailableInstancesArgs = {
  hostname?: InputMaybe<Scalars['String']>;
};


export type QueryNodeArgs = {
  id: Scalars['ID'];
};


export type QueryPageArgs = {
  path: Scalars['String'];
};


export type QueryPagesArgs = {
  inMenu?: InputMaybe<Scalars['Boolean']>;
};


export type QueryParameterArgs = {
  id: Scalars['ID'];
};


export type QueryScenarioArgs = {
  id: Scalars['ID'];
};

export type RawHtmlBlock = StreamFieldInterface & {
  __typename?: 'RawHTMLBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type RegexBlock = StreamFieldInterface & {
  __typename?: 'RegexBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type ResetParameterMutation = {
  __typename?: 'ResetParameterMutation';
  ok?: Maybe<Scalars['Boolean']>;
};

export type RichTextBlock = StreamFieldInterface & {
  __typename?: 'RichTextBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type ScenarioType = {
  __typename?: 'ScenarioType';
  id?: Maybe<Scalars['ID']>;
  isActive?: Maybe<Scalars['Boolean']>;
  isDefault?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
};

export type SetParameterMutation = {
  __typename?: 'SetParameterMutation';
  ok?: Maybe<Scalars['Boolean']>;
  parameter?: Maybe<ParameterInterface>;
};

export type SiteObjectType = {
  __typename?: 'SiteObjectType';
  hostname: Scalars['String'];
  id: Scalars['ID'];
  /** Mikäli valittu, tämä sivusto käsittelee kaikkien palvelinnimien kutsut joilla ei ole omaa sivusto määritystä */
  isDefaultSite: Scalars['Boolean'];
  page?: Maybe<PageInterface>;
  pages: Array<PageInterface>;
  /** Aseta tämä joksikin muuksi kuin 80 jos tarvitset tietyn portin käyttöön URL:eissa (esim. portti 8000 kehitystä varten). Tämä ei vaikuta kutsujen käsittelyyn (porttiohjaus toimii edelleen). */
  port: Scalars['Int'];
  rootPage: Page;
  /** Ihmisen luettava nimi sivustolle. */
  siteName: Scalars['String'];
};


export type SiteObjectTypePageArgs = {
  contentType?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['Int']>;
  slug?: InputMaybe<Scalars['String']>;
  token?: InputMaybe<Scalars['String']>;
  urlPath?: InputMaybe<Scalars['String']>;
};


export type SiteObjectTypePagesArgs = {
  contentType?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  limit?: InputMaybe<Scalars['PositiveInt']>;
  offset?: InputMaybe<Scalars['PositiveInt']>;
  order?: InputMaybe<Scalars['String']>;
  searchQuery?: InputMaybe<Scalars['String']>;
};

export type StaticBlock = StreamFieldInterface & {
  __typename?: 'StaticBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type StreamBlock = StreamFieldInterface & {
  __typename?: 'StreamBlock';
  blockType: Scalars['String'];
  blocks: Array<StreamFieldInterface>;
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
};

export type StreamFieldBlock = StreamFieldInterface & {
  __typename?: 'StreamFieldBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type StreamFieldInterface = {
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
};

export type StringParameterType = ParameterInterface & {
  __typename?: 'StringParameterType';
  defaultValue?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['ID']>;
  isCustomizable?: Maybe<Scalars['Boolean']>;
  isCustomized?: Maybe<Scalars['Boolean']>;
  label?: Maybe<Scalars['String']>;
  node?: Maybe<NodeType>;
  nodeRelativeId?: Maybe<Scalars['ID']>;
  value?: Maybe<Scalars['String']>;
};

export type StructBlock = StreamFieldInterface & {
  __typename?: 'StructBlock';
  blockType: Scalars['String'];
  blocks: Array<StreamFieldInterface>;
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
};

export type TagObjectType = {
  __typename?: 'TagObjectType';
  id: Scalars['ID'];
  name: Scalars['String'];
};

export type TextBlock = StreamFieldInterface & {
  __typename?: 'TextBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type TimeBlock = StreamFieldInterface & {
  __typename?: 'TimeBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};


export type TimeBlockValueArgs = {
  format?: InputMaybe<Scalars['String']>;
};

export type UrlBlock = StreamFieldInterface & {
  __typename?: 'URLBlock';
  blockType: Scalars['String'];
  field: Scalars['String'];
  id?: Maybe<Scalars['String']>;
  rawValue: Scalars['String'];
  value: Scalars['String'];
};

export type UnitType = {
  __typename?: 'UnitType';
  htmlLong?: Maybe<Scalars['String']>;
  htmlShort?: Maybe<Scalars['String']>;
  long?: Maybe<Scalars['String']>;
  short?: Maybe<Scalars['String']>;
};

export type YearlyValue = {
  __typename?: 'YearlyValue';
  value?: Maybe<Scalars['Float']>;
  year?: Maybe<Scalars['Int']>;
};

export type AllMetricFieldsFragment = (
  { name?: string | null, id?: string | null, unit?: (
    { htmlShort?: string | null, htmlLong?: string | null }
    & { __typename?: 'UnitType' }
  ) | null, historicalValues?: Array<(
    { year?: number | null, value?: number | null }
    & { __typename?: 'YearlyValue' }
  )> | null, forecastValues: Array<(
    { value?: number | null, year?: number | null }
    & { __typename?: 'YearlyValue' }
  )>, baselineForecastValues?: Array<(
    { year?: number | null, value?: number | null }
    & { __typename?: 'YearlyValue' }
  )> | null }
  & { __typename?: 'ForecastMetricType' }
);

export type GetActionContentQueryVariables = Exact<{
  node: Scalars['ID'];
}>;


export type GetActionContentQuery = (
  { node?: (
    { id: string, name: string, shortDescription?: string | null, description?: string | null, color?: string | null, decisionLevel?: DecisionLevel | null, targetYearGoal?: number | null, quantity?: string | null, isAction: boolean, unit?: (
      { htmlShort?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, outputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, inputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, parameters?: Array<(
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue?: number | null, maxValue?: number | null, id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | null> | null, metric?: (
      { name?: string | null, id?: string | null, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null, forecastValues: Array<(
        { value?: number | null, year?: number | null }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, downstreamNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, isAction: boolean, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string }
        & { __typename?: 'NodeType' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename?: 'NodeType' }
      )>, impactMetric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort?: string | null }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null, forecastValues: Array<(
          { value?: number | null, year?: number | null }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null, parameters?: Array<(
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
          { id: string }
          & { __typename?: 'NodeType' }
        ) | null }
        & { __typename: 'BoolParameterType' }
      ) | (
        { minValue?: number | null, maxValue?: number | null, description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, numberValue?: number | null, numberDefaultValue?: number | null, node?: (
          { id: string }
          & { __typename?: 'NodeType' }
        ) | null }
        & { __typename: 'NumberParameterType' }
      ) | (
        { description?: string | null, id?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
          { id: string }
          & { __typename?: 'NodeType' }
        ) | null }
        & { __typename: 'StringParameterType' }
      ) | null> | null, metric?: (
        { name?: string | null, id?: string | null, unit?: (
          { htmlShort?: string | null }
          & { __typename?: 'UnitType' }
        ) | null, historicalValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null, forecastValues: Array<(
          { value?: number | null, year?: number | null }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null }
      & { __typename?: 'NodeType' }
    )> }
    & { __typename?: 'NodeType' }
  ) | null }
  & { __typename?: 'Query' }
);

export type GetActionEfficiencyQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActionEfficiencyQuery = (
  { instance: (
    { actionGroups?: Array<(
      { id?: string | null, name?: string | null, color?: string | null, actions?: Array<(
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null> | null }
      & { __typename?: 'ActionGroupType' }
    ) | null> | null }
    & { __typename?: 'InstanceType' }
  ), actionEfficiencyPairs: Array<(
    { label?: string | null, efficiencyUnit?: (
      { short?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, costNode?: (
      { id: string, name: string, shortDescription?: string | null, unit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'NodeType' }
    ) | null, impactNode?: (
      { id: string, name: string, shortDescription?: string | null, unit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'NodeType' }
    ) | null, actions?: Array<(
      { cumulativeImpact?: number | null, cumulativeEfficiency?: number | null, cumulativeCost?: number | null, action?: (
        { id: string, name: string, group?: (
          { id?: string | null }
          & { __typename?: 'ActionGroupType' }
        ) | null }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename?: 'ActionEfficiency' }
    ) | null> | null }
    & { __typename?: 'ActionEfficiencyPairType' }
  )> }
  & { __typename?: 'Query' }
);

export type GetActionImpactsQueryVariables = Exact<{
  impact1: Scalars['ID'];
  impact2: Scalars['ID'];
}>;


export type GetActionImpactsQuery = (
  { energyNode?: (
    { metric?: (
      { id?: string | null, unit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  ) | null, costNode?: (
    { metric?: (
      { id?: string | null, unit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { short?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  ) | null, actions: Array<(
    { name: string, id: string, energy?: (
      { cumulativeForecastValue?: number | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, cost?: (
      { cumulativeForecastValue?: number | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  )> }
  & { __typename?: 'Query' }
);

export type GetActionListQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActionListQuery = (
  { actionEfficiencyPairs: Array<(
    { id?: string | null }
    & { __typename?: 'ActionEfficiencyPairType' }
  )>, actions: Array<(
    { id: string, name: string, shortDescription?: string | null, color?: string | null, decisionLevel?: DecisionLevel | null, quantity?: string | null, unit?: (
      { htmlShort?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, parameters?: Array<(
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, boolValue?: boolean | null, boolDefaultValue?: boolean | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'BoolParameterType' }
    ) | (
      { minValue?: number | null, maxValue?: number | null, id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, numberValue?: number | null, numberDefaultValue?: number | null, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'NumberParameterType' }
    ) | (
      { id?: string | null, description?: string | null, nodeRelativeId?: string | null, isCustomized?: boolean | null, stringValue?: string | null, stringDefaultValue?: string | null, node?: (
        { id: string }
        & { __typename?: 'NodeType' }
      ) | null }
      & { __typename: 'StringParameterType' }
    ) | null> | null, inputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, impactMetric?: (
      { id?: string | null, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, yearlyCumulativeUnit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null, forecastValues: Array<(
        { value?: number | null, year?: number | null }
        & { __typename?: 'YearlyValue' }
      )> }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  )> }
  & { __typename?: 'Query' }
);

export type OutcomeNodeFieldsFragment = (
  { id: string, name: string, color?: string | null, order?: number | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, metric?: (
    { id?: string | null, name?: string | null, unit?: (
      { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, forecastValues: Array<(
      { year?: number | null, value?: number | null }
      & { __typename?: 'YearlyValue' }
    )>, baselineForecastValues?: Array<(
      { year?: number | null, value?: number | null }
      & { __typename?: 'YearlyValue' }
    )> | null, historicalValues?: Array<(
      { year?: number | null, value?: number | null }
      & { __typename?: 'YearlyValue' }
    )> | null }
    & { __typename?: 'ForecastMetricType' }
  ) | null, unit?: (
    { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
    & { __typename?: 'UnitType' }
  ) | null, inputNodes: Array<(
    { id: string, name: string }
    & { __typename?: 'NodeType' }
  )>, outputNodes: Array<(
    { id: string }
    & { __typename?: 'NodeType' }
  )>, upstreamActions?: Array<(
    { id: string, name: string, parameters?: Array<(
      { isCustomized?: boolean | null }
      & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' }
    ) | null> | null }
    & { __typename?: 'NodeType' }
  )> | null }
  & { __typename?: 'NodeType' }
);

export type GetPageQueryVariables = Exact<{
  path: Scalars['String'];
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
      { id: string, name: string, color?: string | null, order?: number | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, upstreamNodes: Array<(
        { id: string, name: string, color?: string | null, order?: number | null, shortDescription?: string | null, targetYearGoal?: number | null, quantity?: string | null, metric?: (
          { id?: string | null, name?: string | null, unit?: (
            { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
            & { __typename?: 'UnitType' }
          ) | null, forecastValues: Array<(
            { year?: number | null, value?: number | null }
            & { __typename?: 'YearlyValue' }
          )>, baselineForecastValues?: Array<(
            { year?: number | null, value?: number | null }
            & { __typename?: 'YearlyValue' }
          )> | null, historicalValues?: Array<(
            { year?: number | null, value?: number | null }
            & { __typename?: 'YearlyValue' }
          )> | null }
          & { __typename?: 'ForecastMetricType' }
        ) | null, unit?: (
          { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
          & { __typename?: 'UnitType' }
        ) | null, inputNodes: Array<(
          { id: string, name: string }
          & { __typename?: 'NodeType' }
        )>, outputNodes: Array<(
          { id: string }
          & { __typename?: 'NodeType' }
        )>, upstreamActions?: Array<(
          { id: string, name: string, parameters?: Array<(
            { isCustomized?: boolean | null }
            & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' }
          ) | null> | null }
          & { __typename?: 'NodeType' }
        )> | null }
        & { __typename?: 'NodeType' }
      )>, metric?: (
        { id?: string | null, name?: string | null, unit?: (
          { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
          & { __typename?: 'UnitType' }
        ) | null, forecastValues: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )>, baselineForecastValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null, historicalValues?: Array<(
          { year?: number | null, value?: number | null }
          & { __typename?: 'YearlyValue' }
        )> | null }
        & { __typename?: 'ForecastMetricType' }
      ) | null, unit?: (
        { short?: string | null, htmlShort?: string | null, htmlLong?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, inputNodes: Array<(
        { id: string, name: string }
        & { __typename?: 'NodeType' }
      )>, outputNodes: Array<(
        { id: string }
        & { __typename?: 'NodeType' }
      )>, upstreamActions?: Array<(
        { id: string, name: string, parameters?: Array<(
          { isCustomized?: boolean | null }
          & { __typename?: 'BoolParameterType' | 'NumberParameterType' | 'StringParameterType' }
        ) | null> | null }
        & { __typename?: 'NodeType' }
      )> | null }
      & { __typename?: 'NodeType' }
    ) }
    & { __typename: 'OutcomePage' }
  ) | null }
  & { __typename?: 'Query' }
);

export type GetParametersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetParametersQuery = (
  { parameters?: Array<(
    { id?: string | null, label?: string | null, description?: string | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, boolDefault?: boolean | null, boolValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { minValue?: number | null, maxValue?: number | null, id?: string | null, label?: string | null, description?: string | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, numberDefault?: number | null, numberValue?: number | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { id?: string | null, label?: string | null, description?: string | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, stringDefault?: string | null, stringValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | null> | null }
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

export type GetInstanceContextQueryVariables = Exact<{ [key: string]: never; }>;


export type GetInstanceContextQuery = (
  { instance: (
    { id?: string | null, name?: string | null, themeIdentifier?: string | null, owner?: string | null, defaultLanguage?: string | null, supportedLanguages?: Array<string | null> | null, targetYear?: number | null, referenceYear?: number | null, minimumHistoricalYear?: number | null, maximumHistoricalYear?: number | null, leadTitle?: string | null, leadParagraph?: string | null, features: (
      { baselineVisibleInGraphs: boolean }
      & { __typename?: 'InstanceFeaturesType' }
    ) }
    & { __typename?: 'InstanceType' }
  ), scenarios: Array<(
    { id?: string | null, isActive?: boolean | null, isDefault?: boolean | null, name?: string | null }
    & { __typename?: 'ScenarioType' }
  )>, menuPages?: Array<(
    { id?: string | null, title: string, urlPath: string, parent?: (
      { id?: string | null }
      & { __typename?: 'ActionListPage' | 'NodePage' | 'OutcomePage' | 'Page' }
    ) | null }
    & { __typename?: 'ActionListPage' | 'NodePage' | 'OutcomePage' | 'Page' }
  ) | null> | null, parameters?: Array<(
    { label?: string | null, description?: string | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, id?: string | null, boolDefault?: boolean | null, boolValue?: boolean | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'BoolParameterType' }
  ) | (
    { label?: string | null, description?: string | null, minValue?: number | null, maxValue?: number | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, id?: string | null, numberDefault?: number | null, numberValue?: number | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'NumberParameterType' }
  ) | (
    { label?: string | null, description?: string | null, isCustomized?: boolean | null, isCustomizable?: boolean | null, id?: string | null, stringDefault?: string | null, stringValue?: string | null, node?: (
      { id: string }
      & { __typename?: 'NodeType' }
    ) | null }
    & { __typename: 'StringParameterType' }
  ) | null> | null }
  & { __typename?: 'Query' }
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
      { isCustomized?: boolean | null, isCustomizable?: boolean | null, boolValue?: boolean | null, boolDefaultValue?: boolean | null }
      & { __typename?: 'BoolParameterType' }
    ) | (
      { isCustomized?: boolean | null, isCustomizable?: boolean | null }
      & { __typename?: 'NumberParameterType' | 'StringParameterType' }
    ) | null }
    & { __typename?: 'SetParameterMutation' }
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
      { isCustomized?: boolean | null, boolValue?: boolean | null, boolDefaultValue?: boolean | null }
      & { __typename?: 'BoolParameterType' }
    ) | (
      { isCustomized?: boolean | null }
      & { __typename?: 'NumberParameterType' | 'StringParameterType' }
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

export type GetNetEmissionsQueryVariables = Exact<{
  node: Scalars['ID'];
}>;


export type GetNetEmissionsQuery = (
  { node?: (
    { id: string, name: string, targetYearGoal?: number | null, unit?: (
      { htmlShort?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, metric?: (
      { id?: string | null, historicalValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null, forecastValues: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  ) | null }
  & { __typename?: 'Query' }
);

export type GetNodesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetNodesQuery = (
  { nodes: Array<(
    { id: string, name: string, color?: string | null, quantity?: string | null, isAction: boolean, unit?: (
      { htmlShort?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, inputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, outputNodes: Array<(
      { id: string }
      & { __typename?: 'NodeType' }
    )>, metric?: (
      { historicalValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null }
    & { __typename?: 'NodeType' }
  )> }
  & { __typename?: 'Query' }
);

export type GetNodePageQueryVariables = Exact<{
  node: Scalars['ID'];
}>;


export type GetNodePageQuery = (
  { node?: (
    { id: string, name: string, shortDescription?: string | null, description?: string | null, color?: string | null, targetYearGoal?: number | null, quantity?: string | null, isAction: boolean, unit?: (
      { htmlShort?: string | null }
      & { __typename?: 'UnitType' }
    ) | null, metric?: (
      { name?: string | null, id?: string | null, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null, historicalValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null, forecastValues: Array<(
        { value?: number | null, year?: number | null }
        & { __typename?: 'YearlyValue' }
      )>, baselineForecastValues?: Array<(
        { year?: number | null, value?: number | null }
        & { __typename?: 'YearlyValue' }
      )> | null }
      & { __typename?: 'ForecastMetricType' }
    ) | null, inputNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, quantity?: string | null, isAction: boolean, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'NodeType' }
    )>, outputNodes: Array<(
      { id: string, name: string, shortDescription?: string | null, color?: string | null, quantity?: string | null, isAction: boolean, unit?: (
        { htmlShort?: string | null }
        & { __typename?: 'UnitType' }
      ) | null }
      & { __typename?: 'NodeType' }
    )> }
    & { __typename?: 'NodeType' }
  ) | null }
  & { __typename?: 'Query' }
);
