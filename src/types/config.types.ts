/**
 * TypeScript types for the Kausal Paths configuration files
 * Based on analysis of: longmont.yaml, tampere-config.json, and espoo.yaml
 */

// =====================================================
// Basic Types
// =====================================================

export interface LocalizedString {
  [languageCode: string]: string;
}

export interface DatasetReference {
  url: string;
  commit: string;
  dvc_remote: string;
}

export interface Normalization {
  normalizer_node: string;
  quantities: Array<{
    id: string;
    unit: string;
  }>;
}

export interface Features {
  baseline_visible_in_graphs?: boolean;
  use_datasets_from_db?: boolean;
  show_explanations?: boolean;
  show_accumulated_effects?: boolean;
  show_significant_digits?: number;
  [key: string]: unknown;
}

export interface IncludeFile {
  file: string;
  node_group?: string;
  allow_override?: boolean;
}

export interface GlobalParameter {
  id: string;
  value: string | number | boolean;
  label?: string;
  label_en?: string;
  label_fi?: string;
  [key: `label_${string}`]: string | undefined;
  is_visible?: boolean;
  is_customizable?: boolean;
  description?: string;
  description_en?: string;
  description_fi?: string;
  [key: `description_${string}`]: string | undefined;
  unit?: string;
  min_value?: number;
  max_value?: number;
  values?: unknown[];
}

export interface ResultExcel {
  base_excel_url: string;
  name: string;
  node_ids: string[];
  format?: string;
}

// =====================================================
// Dimension Types
// =====================================================

export interface DimensionCategory {
  id: string;
  label: string;
  label_es?: string;
  label_en?: string;
  [key: `label_${string}`]: string | undefined;
  color?: string;
  order?: number;
  aliases?: string[];
}

export interface Dimension {
  id: string;
  label: string;
  label_es?: string;
  label_en?: string;
  [key: `label_${string}`]: string | undefined;
  categories: DimensionCategory[];
}

// =====================================================
// Node Types
// =====================================================

export interface DimensionReference {
  id: string;
  flatten?: boolean;
  categories?: string[];
}

export interface NodeReference {
  id: string;
  tags?: string[];
  from_dimensions?: DimensionReference[];
  to_dimensions?: DimensionReference[];
}

export interface HistoricalValue {
  0: number; // year
  1: number; // value
}

export interface DatasetFilter {
  column: string;
  value?: string | number;
  values?: (string | number)[];
  dimension?: string;
}

export interface Dataset {
  id: string;
  tags?: string[];
  forecast_from?: number;
  column?: string;
  dropna?: boolean;
  filters?: DatasetFilter[];
}

export interface NodeParams {
  operations?: string;
  sector?: string;
  [key: string]: unknown;
}

export interface ConfigNode {
  id: string;
  name: string;
  name_es?: string;
  name_en?: string;
  name_fi?: string;
  [key: `name_${string}`]: string | undefined;
  description?: string;
  description_es?: string;
  description_en?: string;
  description_fi?: string;
  [key: `description_${string}`]: string | undefined;
  type: string;
  quantity?: string;
  unit?: string;
  color?: string;
  is_visible?: boolean;
  is_outcome?: boolean;
  order?: number;
  historical_values?: HistoricalValue[];
  input_nodes?: NodeReference[];
  output_nodes?: NodeReference[];
  input_datasets?: Dataset[];
  input_dataset_processors?: string[];
  input_dimensions?: string[];
  output_dimensions?: string[];
  allowed_values?: number[];
  min_value?: number;
  max_value?: number;
  default_value?: number;
  tags?: string[];
  params?: NodeParams;
  [key: string]: unknown;
}

// =====================================================
// Action Types
// =====================================================

export interface ActionParameter {
  id: string;
  value?: string | number | boolean;
  is_visible?: boolean;
  is_customizable?: boolean;
  label?: string;
  label_en?: string;
  label_fi?: string;
  [key: `label_${string}`]: string | undefined;
  description?: string;
  description_en?: string;
  description_fi?: string;
  [key: `description_${string}`]: string | undefined;
  unit?: string;
  min_value?: number;
  max_value?: number;
  values?: unknown[];
  [key: string]: unknown;
}

export interface Action {
  id: string;
  name: string;
  name_es?: string;
  name_en?: string;
  name_fi?: string;
  [key: `name_${string}`]: string | undefined;
  description?: string;
  description_es?: string;
  description_en?: string;
  description_fi?: string;
  [key: `description_${string}`]: string | undefined;
  type: string;
  quantity?: string;
  group: string;
  unit?: string;
  is_outcome?: boolean;
  order?: number;
  input_datasets?: Dataset[];
  input_dataset_processors?: string[];
  input_dimensions?: string[];
  output_dimensions?: string[];
  input_nodes?: NodeReference[];
  output_nodes?: NodeReference[];
  tags?: string[];
  params?: ActionParameter[];
  [key: string]: unknown;
}

export interface ActionGroup {
  id: string;
  name: string;
  name_es?: string;
  name_en?: string;
  name_fi?: string;
  [key: `name_${string}`]: string | undefined;
  color?: string;
}

// =====================================================
// Page & Scenario Types
// =====================================================

export interface Page {
  id: string;
  name: string;
  name_es?: string;
  name_en?: string;
  [key: `name_${string}`]: string | undefined;
  path: string;
  type: string;
  outcome_node?: string;
}

export interface ScenarioParameter {
  id: string;
  value: string | number | boolean;
}

export interface Scenario {
  id: string;
  name: string;
  name_es?: string;
  name_en?: string;
  name_fi?: string;
  [key: `name_${string}`]: string | undefined;
  default?: boolean;
  all_actions_enabled?: boolean;
  is_selectable?: boolean;
  params?: ScenarioParameter[];
}

// =====================================================
// Main Configuration Type
// =====================================================

export interface PathsConfig {
  // Basic configuration
  id: string;
  default_language: string;
  supported_languages?: string[];
  site_url?: string;
  dataset_repo?: DatasetReference;
  name: string;
  name_es?: string;
  name_en?: string;
  name_fi?: string;
  [key: `name_${string}`]: string | undefined;
  owner: string;
  owner_es?: string;
  owner_en?: string;
  owner_fi?: string;
  [key: `owner_${string}`]: string | undefined;
  theme_identifier?: string;
  target_year: number;
  model_end_year?: number;
  reference_year?: number;
  minimum_historical_year?: number;
  maximum_historical_year?: number;

  // Modular configuration
  include?: IncludeFile[];

  // Global parameters
  params?: GlobalParameter[];

  // Emission configuration
  emission_unit?: string;
  emission_forecast_from?: number;
  emission_dimensions?: string[];
  emission_dataset?: string;
  emission_sector_dimension?: string;

  // Features and configuration
  features?: Features;
  normalizations?: Normalization[];
  result_excels?: ResultExcel[];

  // Core data structures
  action_groups?: ActionGroup[];
  dimensions?: Dimension[];
  nodes?: ConfigNode[];
  actions?: Action[];
  pages?: Page[];
  scenarios?: Scenario[];

  // Allow for additional unknown properties
  [key: string]: unknown;
}

// =====================================================
// Legacy type compatibility
// =====================================================

/** @deprecated Use PathsConfig instead */
export type LongmontConfig = PathsConfig;
