import { Box } from '@mui/material';

import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

import { NODE_EXPLANATION } from '../queries';
import { useEditorApolloContext } from '../useEditorApolloContext';
import { CollapsibleSection } from './shared';

type NodeExplanationSectionProps = {
  nodeId: string;
  open: boolean;
  onToggle: () => void;
};

/**
 * The backend-generated explanation of how the node is computed. Read-only: it
 * follows the model (a formula save refetches it), so it is never offered for
 * editing and is kept out of the authored description. Renders nothing when the
 * instance has explanations disabled or the node has none.
 */
export default function NodeExplanationSection({
  nodeId,
  open,
  onToggle,
}: NodeExplanationSectionProps) {
  const t = useTranslations('model-editor');
  const editorContext = useEditorApolloContext();
  const { data } = useQuery(NODE_EXPLANATION, {
    variables: { nodeId },
    context: editorContext,
  });
  // Ignore a response still belonging to the previously inspected node.
  const explanation = data?.node?.id === nodeId ? data.node.explanation : null;
  if (!explanation) return null;

  return (
    <CollapsibleSection title={t('nodes-explanation')} open={open} onToggle={onToggle}>
      <Box sx={{ width: '100%', bgcolor: 'grey.100', borderRadius: 0.5 }}>
        <OverlayScrollbarsComponent
          defer
          options={{
            scrollbars: { autoHide: 'never' },
            overflow: { x: 'hidden', y: 'scroll' },
          }}
          style={{ maxHeight: 300 }}
        >
          <Box
            sx={{
              px: 1,
              py: 0.5,
              fontSize: 12,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              '& p': { m: 0, mb: 1 },
              '& p:last-child': { mb: 0 },
              '& pre, & code': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
              '& img, & table': { maxWidth: '100%' },
            }}
            dangerouslySetInnerHTML={{ __html: explanation }}
          />
        </OverlayScrollbarsComponent>
      </Box>
    </CollapsibleSection>
  );
}
