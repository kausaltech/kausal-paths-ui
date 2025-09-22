import { Box, Chip, Divider, Paper, Stack, Typography } from '@mui/material';

export type NodeDetailsType = {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  quantity?: string;
  unit?: string;
  group?: string; // For actions
  input_nodes?: {
    id: string;
    to_dimensions?: string[];
  }[];
  input_dimensions?: string[];
  output_dimensions?: string[];
  tags?: string[];
  [key: string]: unknown;
};

const NodeDetails = (props: { node: NodeDetailsType | null }) => {
  const { node } = props;

  //console.log('NodeDetails', props);
  if (!props.node) {
    return <Box sx={{ padding: 2 }}>No details available</Box>;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h5">{node?.name}</Typography>
      {node?.type && <Chip label={node?.type} size="small" />}

      <Divider sx={{ my: 2 }} />
      {node?.description && (
        <Typography variant="body2" dangerouslySetInnerHTML={{ __html: node.description }} />
      )}
      <Divider sx={{ my: 2 }} />
      <Stack direction="column" spacing={2}>
        {node?.quantity && <Paper>{node.quantity}</Paper>}
      </Stack>
    </Box>
  );
};

export default NodeDetails;

/*
{
    "id": "building_electricity_use_bau",
    "name": "Building electricity use (baseline)",
    "name_es-US": "Consumo de electricidad en edificios (referencia)",
    "type": "simple.MultiplicativeNode",
    "quantity": "energy",
    "unit": "GWh/a",
    "input_nodes": [
        {
            "id": "building_electricity_use_per_resident"
        },
        {
            "id": "population",
            "to_dimensions": []
        }
    ],
    "input_dimensions": [
        "emission_sectors"
    ],
    "output_dimensions": [
        "emission_sectors"
    ]
}*/
