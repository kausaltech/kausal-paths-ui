import { type FC, Fragment, type ReactElement, createContext, memo, use } from 'react';

import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useReactiveVar } from '@apollo/client/react';
import {
  Handle,
  type Node,
  type NodeProps,
  Position,
  type ReactFlowState,
  useStore,
} from '@xyflow/react';
import {
  ArrowRepeat,
  Braces,
  Bullseye,
  Calculator,
  Compass,
  DashSquare,
  Database,
  Diagram2,
  Diagram3,
  Droplet,
  Flag,
  Gear,
  Intersect,
  PlusSquare,
  QuestionCircle,
  Signpost,
  Sliders,
  XSquare,
} from 'react-bootstrap-icons';

import { modelEditorModeVar } from '@/common/cache';
import { mockNodeEditsVar } from './mockEdits';

export type NodeGraphInteraction = {
  highlightedNodeIds: ReadonlySet<string>;
  activeNodeId: string | null;
  onHiddenContextClick: (id: string) => void;
};

const defaultInteraction: NodeGraphInteraction = {
  highlightedNodeIds: new Set(),
  activeNodeId: null,
  onHiddenContextClick: () => {},
};

export const NodeGraphInteractionContext = createContext<NodeGraphInteraction>(defaultInteraction);

const zoomSelector = (s: ReactFlowState) => s.transform[2] >= 0.7;

export type NodeStyle = { bg: string; border: string; icon: ReactElement; label: string };

const ICON_SIZE = 14;

// Categories describe the computational mechanism of a node (how it calculates),
// NOT its domain/classification (what it represents — that's handled by
// `quantityKind`, rendered separately on the node card).
//
// Top-level kinds (from backend NodeKind): SIMPLE, FORMULA, ACTION, PIPELINE.
// Simple nodes are further split by the Python subclass into arithmetic
// operators (additive/multiplicative/…) and aggregation patterns
// (coalesce/weightedSum/dataset/…).
type CategoryKey =
  | 'outcome'
  | 'action'
  | 'formula'
  | 'pipeline'
  | 'additive'
  | 'multiplicative'
  | 'subtractive'
  | 'mix'
  | 'coalesce'
  | 'weightedSum'
  | 'dataset'
  | 'scenario'
  | 'lever'
  | 'iterative'
  | 'cohort'
  | 'correction'
  | 'generic'
  | 'unknown';

type StyleDef = { bg: string; border: string; Icon: typeof Gear; label: string };

const CATEGORY_STYLES: Record<CategoryKey, StyleDef> = {
  outcome: { bg: '#e8eaf6', border: '#3f51b5', Icon: Flag, label: 'Outcome' },
  action: { bg: '#e8f5e9', border: '#4caf50', Icon: Gear, label: 'Action' },
  formula: { bg: '#fff3e0', border: '#ef6c00', Icon: Braces, label: 'Formula' },
  pipeline: { bg: '#eceff1', border: '#455a64', Icon: Diagram2, label: 'Pipeline' },
  additive: { bg: '#e3f2fd', border: '#2196f3', Icon: PlusSquare, label: 'Additive' },
  multiplicative: { bg: '#f3e5f5', border: '#9c27b0', Icon: XSquare, label: 'Multiplicative' },
  subtractive: { bg: '#ffebee', border: '#f44336', Icon: DashSquare, label: 'Subtractive' },
  mix: { bg: '#e1f5fe', border: '#0288d1', Icon: Droplet, label: 'Mix' },
  coalesce: { bg: '#e0f2f1', border: '#009688', Icon: Intersect, label: 'Coalesce' },
  weightedSum: { bg: '#ede7f6', border: '#673ab7', Icon: Calculator, label: 'Weighted sum' },
  dataset: { bg: '#f9f6d7', border: '#daa520', Icon: Database, label: 'Dataset' },
  scenario: { bg: '#e8eaf6', border: '#5c6bc0', Icon: Signpost, label: 'Scenario' },
  lever: { bg: '#ede7f6', border: '#5e35b1', Icon: Sliders, label: 'Lever' },
  iterative: { bg: '#f5f5f5', border: '#616161', Icon: ArrowRepeat, label: 'Iterative' },
  cohort: { bg: '#f5f5f5', border: '#6a1b9a', Icon: Diagram3, label: 'Cohort' },
  correction: { bg: '#f5f5f5', border: '#8e24aa', Icon: Compass, label: 'Correction' },
  generic: { bg: '#f5f5f5', border: '#757575', Icon: Bullseye, label: 'Generic' },
  unknown: { bg: '#f5f5f5', border: '#90a4ae', Icon: QuestionCircle, label: 'Node' },
};

// Map from concrete Simple-kind Node subclass short names to a computational
// category. The short name is the last segment of the dotted Python path the
// backend emits (e.g. "nodes.simple.AdditiveNode" → "AdditiveNode"). Subclasses
// inherit the category of their computational base unless they add a
// distinguishing mechanism (e.g. MixNode extends AdditiveNode but is a mix).
// Classes omitted here fall through to the substring heuristics below.
const CLASS_CATEGORY: Record<string, CategoryKey> = {
  // Formula/expression
  FormulaNode: 'formula',
  // Arithmetic operators (nodes/simple.py)
  SimpleNode: 'generic',
  AdditiveNode: 'additive',
  MultiplicativeNode: 'multiplicative',
  SubtractiveNode: 'subtractive',
  MixNode: 'mix',
  FixedMultiplierNode: 'multiplicative',
  FixedScenarioNode: 'scenario',
  Activity: 'additive',
  EmissionFactorActivity: 'multiplicative',
  PerCapitaActivity: 'multiplicative',
  SectorEmissions: 'additive',
  ImprovementNode: 'multiplicative',
  ImprovementNode2: 'multiplicative',
  RelativeNode: 'additive',
  RelativeYearScaledNode: 'additive',
  FillNewCategoryNode: 'additive',
  FillNewCategoryNode2: 'additive',
  ChooseInputNode: 'additive',
  AnnuityNode: 'additive',
  DiscountNode: 'additive',
  // Aggregation patterns (nodes/generic.py)
  GenericNode: 'generic',
  ConstantNode: 'generic',
  ScenarioImpactNode: 'scenario',
  ActionWithHistoryNode: 'action',
  LeverNode: 'lever',
  WeightedSumNode: 'weightedSum',
  LogitNode: 'weightedSum',
  CoalesceNode: 'coalesce',
  IterativeNode: 'iterative',
  CohortNode: 'cohort',
  DatasetReduceNode: 'dataset',
  GenerationCapacityNode: 'generic',
  ChpNode: 'generic',
  DimensionalSectorNode: 'generic',
  DimensionalSectorEmissions: 'generic',
  DimensionalSectorEnergy: 'generic',
  DimensionalSectorEmissionFactor: 'generic',
  // Dataset-driven (nodes/gpc.py, nodes/health.py, nodes/finland/*)
  DatasetNode: 'dataset',
  DatasetPlusOneNode: 'dataset',
  DetailedDatasetNode: 'dataset',
  CorrectionNode: 'correction',
  CorrectionNode2: 'correction',
  AttributableFractionRR: 'dataset',
  AluesarjatNode: 'dataset',
  HsyNode: 'dataset',
  AlasNode: 'dataset',
  // Cost calculations (nodes/costs.py) — all extend AdditiveNode
  SelectiveNode: 'additive',
  ExponentialNode: 'additive',
  InternalGrowthNode: 'additive',
  EnergyCostNode: 'additive',
  DilutionNode: 'generic',
  // Buildings (nodes/buildings.py)
  FloorAreaNode: 'multiplicative',
  CfNode: 'multiplicative',
  EnergyNode: 'multiplicative',
  HistoricalNode: 'additive',
  CCSNode: 'generic',
  // Misc (nodes/emissions/, nodes/finland/*)
  GlobalWarmingPotential: 'generic',
  Population: 'generic',
  HistoricalPopulation: 'generic',
  BuildingStock: 'additive',
  FutureBuildingStock: 'generic',
  AlasEmissions: 'generic',
  // Zurich domain classes (nodes/ch/zuerich.py) — categorize by base operator
  BuildingEnergy: 'additive',
  BuildingFloorAreaHistorical: 'generic',
  BuildingHeatHistorical: 'generic',
  BuildingUsefulHeat: 'generic',
  BuildingHeatPerArea: 'generic',
  BuildingGeneralElectricityEfficiency: 'additive',
  BuildingHeatUseMix: 'mix',
  BuildingHeatByCarrier: 'generic',
  ElectricityProductionMix: 'mix',
  ElectricityProductionMixLegacy: 'mix',
  DistrictHeatProductionMix: 'mix',
  GasGridNode: 'additive',
  EnergyProductionEmissionFactor: 'additive',
  EmissionFactor: 'generic',
  ToPerCapita: 'generic',
  VehicleDatasetNode: 'additive',
  VehicleMileageHistorical: 'generic',
  PassengerKilometers: 'generic',
  VehicleKilometersPerInhabitant: 'generic',
  VehicleEngineTypeSplit: 'mix',
  VehicleMileage: 'generic',
  TransportFuelFactor: 'additive',
  TransportEmissionFactor: 'generic',
  TransportEmissionsForFuel: 'additive',
  TransportElectricity: 'additive',
  TransportEmissions: 'multiplicative',
  TransportEmissions2kW: 'generic',
  NonroadMachineryEmissions: 'generic',
  WasteIncinerationEmissions: 'generic',
  SewageSludgeProcessingEmissions: 'generic',
  WastewaterTreatmentEmissions: 'generic',
};

function getCategory(kind: string, nodeClass: string, isOutcome: boolean): CategoryKey {
  if (isOutcome) return 'outcome';
  switch (kind.toLowerCase()) {
    case 'action':
      return 'action';
    case 'formula':
      return 'formula';
    case 'pipeline':
      return 'pipeline';
  }
  const short = nodeClass.split('.').pop() ?? '';
  const mapped = CLASS_CATEGORY[short];
  if (mapped) return mapped;
  const cls = nodeClass.toLowerCase();
  if (cls.includes('formula')) return 'formula';
  if (cls.includes('dataset')) return 'dataset';
  if (cls.includes('mix')) return 'mix';
  if (cls.includes('coalesce')) return 'coalesce';
  if (cls.includes('additive')) return 'additive';
  if (cls.includes('multiplicative') || cls.includes('multiplier')) return 'multiplicative';
  if (cls.includes('subtractive')) return 'subtractive';
  if (cls.includes('scenario')) return 'scenario';
  if (cls.includes('lever')) return 'lever';
  if (cls.includes('iterative')) return 'iterative';
  if (cls.includes('cohort')) return 'cohort';
  if (cls.includes('correction')) return 'correction';
  return 'unknown';
}

export function getNodeStyle(kind: string, nodeClass: string, isOutcome: boolean): NodeStyle {
  const { bg, border, Icon, label } = CATEGORY_STYLES[getCategory(kind, nodeClass, isOutcome)];
  return { bg, border, icon: <Icon size={ICON_SIZE} />, label };
}

export type HandleData = { id: string; multi?: boolean; hasDataset?: boolean };
export type HiddenContextRef = { id: string; label: string };

export type QuantityKindData = { icon?: string | null; id: string; label: string };

export type ElkNodeData = {
  label: string;
  kind: string;
  nodeClass: string;
  color: string;
  isOutcome: boolean;
  quantityKind?: QuantityKindData | null;
  hiddenContextSources?: HiddenContextRef[];
  nodeHeight?: number;
  sourceHandles: HandleData[];
  targetHandles: HandleData[];
};

export type ElkNodeType = Node<ElkNodeData, 'elk'>;

const ElkNode: FC<NodeProps<ElkNodeType>> = ({ id, data }: NodeProps<ElkNodeType>) => {
  const showContent = useStore(zoomSelector);
  const { highlightedNodeIds, activeNodeId, onHiddenContextClick } = use(
    NodeGraphInteractionContext
  );
  const editorMode = useReactiveVar(modelEditorModeVar);
  const nodeEdits = useReactiveVar(mockNodeEditsVar);
  const hasEdit = editorMode === 'draft' && Boolean(nodeEdits[id]);
  const highlighted = highlightedNodeIds.has(id);
  const active = activeNodeId === id;
  const style = getNodeStyle(data.kind, data.nodeClass, data.isOutcome);

  const targetCount = data.targetHandles.length;
  const sourceCount = data.sourceHandles.length;

  return (
    <>
      {data.targetHandles.map((handle, i) => {
        const top = targetCount > 1 ? `${((i + 1) / (targetCount + 1)) * 100}%` : '50%';
        return (
          <Fragment key={handle.id}>
            <Handle
              id={handle.id}
              type="target"
              position={Position.Left}
              style={targetCount > 1 ? { top, position: 'absolute' } : undefined}
            />
            {handle.hasDataset && (
              <Box
                sx={{
                  position: 'absolute',
                  left: -22,
                  top,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                  color: 'grey.800',
                }}
              >
                <Database size={12} />
                <Box sx={{ width: 10, height: '1px', backgroundColor: 'currentColor' }} />
              </Box>
            )}
          </Fragment>
        );
      })}
      {showContent ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: active ? 6 : 1,
            outline: active
              ? `2px solid ${style.border}`
              : highlighted
                ? `2px solid ${style.border}`
                : 'none',
            outlineOffset: active ? '1px' : undefined,
            backgroundColor: hasEdit ? (theme) => alpha(theme.palette.warning.main, 0.15) : 'white',
            minWidth: 100,
            maxWidth: 180,
          }}
        >
          <Box
            sx={{
              px: '5px',
              py: '2px',
              backgroundColor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
          >
            <Box sx={{ color: style.border, display: 'flex' }}>{style.icon}</Box>
            <Typography
              variant="caption"
              sx={{ fontSize: 9, lineHeight: 1.2, color: style.border, fontWeight: 500 }}
            >
              {style.label}
            </Typography>
            {data.quantityKind?.icon && (
              <Typography
                component="span"
                title={data.quantityKind.label}
                sx={{ fontSize: 11, lineHeight: 1, ml: 'auto' }}
              >
                {data.quantityKind.icon}
              </Typography>
            )}
          </Box>
          <Box sx={{ px: '5px', py: '3px' }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: 11,
                lineHeight: 1.25,
                hyphens: 'auto',
                wordBreak: 'break-word',
              }}
            >
              {data.label}
            </Typography>
            {data.hiddenContextSources && data.hiddenContextSources.length > 0 && (
              <Box sx={{ mt: 0.75, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {data.hiddenContextSources.slice(0, 2).map((source) => (
                  <Box
                    key={source.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onHiddenContextClick(source.id);
                    }}
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      fontSize: 9,
                      borderRadius: 999,
                      backgroundColor: '#eceff1',
                      color: '#455a64',
                      cursor: 'pointer',
                      lineHeight: 1.2,
                    }}
                  >
                    {source.label}
                  </Box>
                ))}
                {data.hiddenContextSources.length > 2 && (
                  <Box
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      fontSize: 9,
                      borderRadius: 999,
                      backgroundColor: '#eceff1',
                      color: '#455a64',
                      lineHeight: 1.2,
                    }}
                  >
                    +{data.hiddenContextSources.length - 2} more
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            width: active ? 12 : 8,
            height: active ? 12 : 8,
            borderRadius: '50%',
            backgroundColor: data.color || style.border,
            outline: active ? `2px solid ${style.border}` : 'none',
            outlineOffset: active ? '1px' : undefined,
          }}
        />
      )}
      {data.sourceHandles.map((handle, i) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type="source"
          position={Position.Right}
          style={
            sourceCount > 1
              ? { top: `${((i + 1) / (sourceCount + 1)) * 100}%`, position: 'absolute' }
              : undefined
          }
        />
      ))}
    </>
  );
};

export default memo(ElkNode);
