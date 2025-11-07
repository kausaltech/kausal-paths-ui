import React from 'react';

import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { useTranslation } from 'next-i18next';
import { BoxArrowInRight, BoxArrowRight } from 'react-bootstrap-icons';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { NodeLink } from '@/common/links';

type NodeLinksProps = {
  inputNodes: OutcomeNodeFieldsFragment[];
  outputNodes: OutcomeNodeFieldsFragment[];
};

const NodeLinks = (props: NodeLinksProps) => {
  const { inputNodes, outputNodes } = props;
  const { t } = useTranslation();
  return (
    <Grid container spacing={2} sx={{ marginBottom: 2, paddingTop: 2 }}>
      <Grid size={{ xs: 12, md: 6, lg: 5 }}>
        {inputNodes.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" component="p" >{t('affected-by')}</Typography>
              <List>
                {inputNodes.map((inputNode) => (
                  <ListItem key={inputNode.id}>
                    <ListItemIcon>
                      <BoxArrowInRight size={24} aria-hidden="true" focusable="false" />
                    </ListItemIcon>
                    <ListItemText>
                      <NodeLink key={inputNode.id} node={inputNode}>
                        {inputNode.name}
                      </NodeLink>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 5 }} offset={{ md: 0, lg: 2 }}>
        {outputNodes.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5" component="p">{t('has-effect-on')}</Typography>
              <List>
                {outputNodes.map((outputNode) => (
                  <ListItem key={outputNode.id}>
                    <ListItemIcon>
                      <BoxArrowRight size={24} aria-hidden="true" focusable="false" />
                    </ListItemIcon>
                    <ListItemText>
                      <NodeLink key={outputNode.id} node={outputNode}>
                        {outputNode.name}
                      </NodeLink>
                    </ListItemText>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );
};

export default NodeLinks;
