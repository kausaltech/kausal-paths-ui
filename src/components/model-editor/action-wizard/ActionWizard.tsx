import { useCallback, useMemo, useState } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material';
import type { NodeEdgeFragment, NodeFieldsFragment } from '@/common/__generated__/graphql';
import BasicInfoStep from './BasicInfoStep';
import CopyActionStep from './CopyActionStep';
import DataSourceStep from './DataSourceStep';
import EdgeConfigStep from './EdgeConfigStep';
import OutputsStep from './OutputsStep';
import ReviewStep from './ReviewStep';
import {
  type DataSourceConfig,
  type DraftEdgeMapping,
  type WizardState,
  WIZARD_STEPS,
  createInitialWizardState,
  deriveStateFromSource,
} from './types';

type ActionWizardProps = {
  open: boolean;
  onClose: () => void;
  nodes: readonly NodeFieldsFragment[];
  edges: readonly NodeEdgeFragment[];
};

export default function ActionWizard({ open, onClose, nodes, edges }: ActionWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [state, setState] = useState<WizardState>(createInitialWizardState);

  const updateState = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSelectSource = useCallback(
    (action: NodeFieldsFragment) => {
      const derived = deriveStateFromSource(action, edges, nodes);
      setState((prev) => ({ ...prev, ...derived }));
    },
    [edges, nodes],
  );

  const handleBasicInfoChange = useCallback(
    (field: 'newActionId' | 'newActionName' | 'actionGroup', value: string) => {
      updateState({ [field]: value });
    },
    [updateState],
  );

  const handleDataSourceChange = useCallback(
    (dataSource: DataSourceConfig) => {
      updateState({ dataSource });
    },
    [updateState],
  );

  const handleEdgeMappingsChange = useCallback(
    (edgeMappings: DraftEdgeMapping[]) => {
      updateState({ edgeMappings });
    },
    [updateState],
  );

  const canAdvance = useMemo(() => {
    switch (activeStep) {
      case 0:
        return state.sourceAction !== null;
      case 1:
        return (
          state.newActionId !== '' &&
          state.newActionName !== '' &&
          !nodes.some((n) => n.identifier === state.newActionId)
        );
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }, [activeStep, state, nodes]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleClose = () => {
    setActiveStep(0);
    setState(createInitialWizardState());
    onClose();
  };

  const isLastStep = activeStep === WIZARD_STEPS.length - 1;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { minHeight: '70vh' } } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        Copy Action
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {WIZARD_STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {activeStep === 0 && (
          <CopyActionStep
            nodes={nodes}
            selectedAction={state.sourceAction}
            onSelect={handleSelectSource}
          />
        )}
        {activeStep === 1 && (
          <BasicInfoStep
            newActionId={state.newActionId}
            newActionName={state.newActionName}
            actionGroup={state.actionGroup}
            sourceAction={state.sourceAction}
            allNodes={nodes}
            onChange={handleBasicInfoChange}
          />
        )}
        {activeStep === 2 && (
          <DataSourceStep dataSource={state.dataSource} onChange={handleDataSourceChange} />
        )}
        {activeStep === 3 && (
          <OutputsStep outputMetrics={state.outputMetrics} edgeMappings={state.edgeMappings} />
        )}
        {activeStep === 4 && (
          <EdgeConfigStep
            edgeMappings={state.edgeMappings}
            outputMetrics={state.outputMetrics}
            allNodes={nodes}
            onUpdate={handleEdgeMappingsChange}
          />
        )}
        {activeStep === 5 && <ReviewStep state={state} />}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Back
        </Button>
        {isLastStep ? (
          <Button variant="contained" disabled>
            Save Action
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext} disabled={!canAdvance}>
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
