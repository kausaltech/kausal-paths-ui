/**
 * TypeScript types for the Kausal Paths configuration YAML files
 * Based on the longmont.yaml configuration structure
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
  [key: string]: unknown;
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
  [key: `label_${string}`]: string | undefined;
  color?: string;
  order?: number;
  aliases?: string[];
}

export interface Dimension {
  id: string;
  label: string;
  label_es?: string;
  [key: `label_${string}`]: string | undefined;
  categories: DimensionCategory[];
}

// =====================================================
// Node Types
// =====================================================

export interface NodeReference {
  id: string;
  tags?: string[];
}

export interface HistoricalValue {
  0: number; // year
  1: number; // value
}

export interface Dataset {
  id: string;
  tags?: string[];
  forecast_from?: number;
  filters?: Array<{
    column: string;
    value: string | number;
  }>;
}

export interface ConfigNode {
  id: string;
  name: string;
  name_es?: string;
  [key: `name_${string}`]: string | undefined;
  description?: string;
  description_es?: string;
  [key: `description_${string}`]: string | undefined;
  type: string;
  quantity?: string;
  unit?: string;
  color?: string;
  is_visible?: boolean;
  historical_values?: HistoricalValue[];
  input_nodes?: NodeReference[];
  output_nodes?: NodeReference[];
  input_datasets?: Dataset[];
  output_dimensions?: string[];
  allowed_values?: number[];
  min_value?: number;
  max_value?: number;
  default_value?: number;
  tags?: string[];
  [key: string]: unknown;
}

// =====================================================
// Action Types
// =====================================================

export interface Action {
  id: string;
  name: string;
  name_es?: string;
  [key: `name_${string}`]: string | undefined;
  description?: string;
  description_es?: string;
  [key: `description_${string}`]: string | undefined;
  type: string;
  quantity?: string;
  group: string;
  unit?: string;
  input_datasets?: Dataset[];
  output_dimensions?: string[];
  input_nodes?: NodeReference[];
  output_nodes?: NodeReference[];
  tags?: string[];
  [key: string]: unknown;
}

export interface ActionGroup {
  id: string;
  name: string;
  name_es?: string;
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
  [key: `name_${string}`]: string | undefined;
  default?: boolean;
  all_actions_enabled?: boolean;
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
  [key: `name_${string}`]: string | undefined;
  owner: string;
  owner_es?: string;
  [key: `owner_${string}`]: string | undefined;
  theme_identifier?: string;
  target_year: number;
  model_end_year?: number;
  reference_year?: number;
  minimum_historical_year?: number;
  maximum_historical_year?: number;

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
