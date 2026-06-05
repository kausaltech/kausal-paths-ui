'use client';

import {
  Box,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material';

import { useLocale } from 'next-intl';

import { setEditorUiLocale } from '@/common/editor-locale';
import { useInstance } from '@/common/instance';
import { getLanguageName } from '@/common/languages';

export default function SettingsView() {
  // Inside the editor subtree the next-intl locale is the *interface* language
  // (set by the nested provider in the model layout), not the URL/content
  // locale — so this reflects the current editor UI language.
  const uiLocale = useLocale();
  const instance = useInstance();
  const languages = instance.supportedLanguages ?? [];

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const next = event.target.value;
    if (next === uiLocale) return;
    // Persist the preference and reload; the URL (content language) is left
    // untouched, so only the interface chrome changes.
    setEditorUiLocale(next);
  };

  return (
    <Container maxWidth="md" sx={{ pt: 16, pb: 6, mx: 0 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary">
          Account
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Manage your preferences for the model editor.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: 16 }}>
              Interface language
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              The language used for the editor interface. This only affects the editor chrome — the
              content you edit stays in the model&apos;s language.
            </Typography>
          </Box>
          {languages.length < 2 ? (
            <Typography variant="body2" color="text.secondary">
              This model has only one language available ({getLanguageName(uiLocale)}).
            </Typography>
          ) : (
            <FormControl size="small" sx={{ maxWidth: 280 }}>
              <Select
                value={uiLocale}
                onChange={handleLanguageChange}
                inputProps={{ 'aria-label': 'Editor interface language' }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {getLanguageName(lang)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
