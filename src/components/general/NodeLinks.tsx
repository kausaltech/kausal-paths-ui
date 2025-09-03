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

import { NodeLink } from '@/common/links';

const NodeLinks = (props) => {
  const { inputNodes, outputNodes } = props;
  const { t } = useTranslation();
  return (
    <Grid container spacing={2} sx={{ marginBottom: 2 }}>
      <Grid size={{ xs: 12, md: 6, lg: 5 }}>
        {inputNodes.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h5">{t('affected-by')}</Typography>
              <List>
                {inputNodes.map((inputNode, index) => (
                  <ListItem>
                    <ListItemIcon>
                      <BoxArrowInRight size={24} />
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
              <Typography variant="h5">{t('has-effect-on')}</Typography>
              <List>
                {outputNodes.map((outputNode, index) => (
                  <ListItem>
                    <ListItemIcon>
                      <BoxArrowRight size={24} />
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
