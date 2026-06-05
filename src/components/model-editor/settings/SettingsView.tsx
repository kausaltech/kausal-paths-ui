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

import { useLocale, useTranslations } from 'next-intl';

import { AVAILABLE_EDITOR_UI_LOCALES, setEditorUiLocale } from '@/common/editor-locale';
import { getLanguageName } from '@/common/languages';

export default function SettingsView() {
  const t = useTranslations('model-editor');
  // Inside the editor subtree the next-intl locale is the *interface* language
  // (set by the nested provider in the model layout), not the URL/content
  // locale — so this reflects the current editor UI language.
  const uiLocale = useLocale();
  const languages = AVAILABLE_EDITOR_UI_LOCALES;

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
          {t('models-account')}
        </Typography>
        <Typography variant="h1" sx={{ mt: 0.5 }}>
          {t('settings-title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {t('settings-desc')}
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: 16 }}>
              {t('settings-interface-language')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('settings-interface-language-desc')}
            </Typography>
          </Box>
          {languages.length < 2 ? (
            <Typography variant="body2" color="text.secondary">
              {t('settings-single-language', { name: getLanguageName(uiLocale) })}
            </Typography>
          ) : (
            <FormControl size="small" sx={{ maxWidth: 280 }}>
              <Select
                value={uiLocale}
                onChange={handleLanguageChange}
                inputProps={{ 'aria-label': t('settings-interface-language') }}
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
