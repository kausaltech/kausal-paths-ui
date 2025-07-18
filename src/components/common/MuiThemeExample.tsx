import React from 'react';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

/**
 * Example component demonstrating how MUI components work with the themed system
 * This component shows various MUI components styled according to your JSON theme
 */
export function MuiThemeExample() {
  const [selectValue, setSelectValue] = React.useState('');

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        MUI Theme Integration
      </Typography>

      <Typography variant="body1" paragraph>
        This component demonstrates how Material-UI components are styled using your the
        multi-tenant JSON theme configuration. All colors, fonts, spacing, and other design tokens
        come from the theme.json file.
      </Typography>

      <Stack spacing={3}>
        {/* Buttons */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Buttons
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button variant="contained">Primary Button</Button>
            <Button variant="outlined">Secondary Button</Button>
            <Button variant="text">Text Button</Button>
          </Stack>
        </Box>

        {/* Cards */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Cards
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Card Title
                </Typography>
                <Typography variant="body2">
                  This card uses your theme&apos;s card background, border radius, and border
                  styles.
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ minWidth: 275 }}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Another Card
                </Typography>
                <Typography variant="body2">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Form Elements */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Form Elements
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <TextField label="Text Field" placeholder="Enter some text..." variant="outlined" />
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Option</InputLabel>
              <Select
                value={selectValue}
                label="Select Option"
                onChange={(e) => setSelectValue(e.target.value)}
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Chips */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Chips
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label="Default Chip" />
            <Chip label="Success" color="success" />
            <Chip label="Error" color="error" />
            <Chip label="Warning" color="warning" />
            <Chip label="Info" color="info" />
          </Stack>
        </Box>

        {/* Alerts */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Alerts
          </Typography>
          <Stack spacing={1}>
            <Alert severity="success">This is a success alert using your theme colors.</Alert>
            <Alert severity="error">This is an error alert using your theme colors.</Alert>
            <Alert severity="warning">This is a warning alert using your theme colors.</Alert>
            <Alert severity="info">This is an info alert using your theme colors.</Alert>
          </Stack>
        </Box>

        {/* Typography */}
        <Box>
          <Typography variant="h3" gutterBottom>
            Typography
          </Typography>
          <Stack spacing={1}>
            <Typography variant="h1">Heading 1</Typography>
            <Typography variant="h2">Heading 2</Typography>
            <Typography variant="h3">Heading 3</Typography>
            <Typography variant="h4">Heading 4</Typography>
            <Typography variant="h5">Heading 5</Typography>
            <Typography variant="h6">Heading 6</Typography>
            <Typography variant="body1">
              Body 1 text with your theme&apos;s font family, size, and line height.
            </Typography>
            <Typography variant="body2">
              Body 2 text with your theme&apos;s smaller font size.
            </Typography>
            <Typography variant="caption">
              Caption text with your theme&apos;s smallest font size.
            </Typography>
          </Stack>
        </Box>

        {/* Colors */}
        <Box>
          <Stack spacing={1}>
            <Box>
              <Typography variant="h3" gutterBottom>
                Primary
              </Typography>
              <Stack direction="row" flexWrap="wrap">
                <Box sx={{ width: 100, height: 100, backgroundColor: 'primary.light' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'primary.main' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'primary.dark' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'primary.contrastText' }} />
              </Stack>
            </Box>
            <Box>
              <Typography variant="h3" gutterBottom>
                Secondary
              </Typography>
              <Stack direction="row" flexWrap="wrap">
                <Box sx={{ width: 100, height: 100, backgroundColor: 'secondary.light' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'secondary.main' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'secondary.dark' }} />
                <Box sx={{ width: 100, height: 100, backgroundColor: 'secondary.contrastText' }} />
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
