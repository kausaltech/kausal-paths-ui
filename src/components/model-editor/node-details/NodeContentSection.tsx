import { useEffect, useState } from 'react';

import { Alert, Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material';

import { useLazyQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { BoxArrowUpRight } from 'react-bootstrap-icons';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { NodeLink } from '@/common/links';
import RichTextField from '../RichTextField';
import { getNativeLanguageName } from '../languageLabel';
import { NODE_TRANSLATION } from '../queries';
import { useUpdateNodeMutation } from '../useUpdateNodeMutation';
import { LiveTextField, ReadOnlyRichTextField, ReadOnlyTextField } from './fields';

export type NodeContentSectionProps = {
  node: EditorNodeFieldsFragment;
  readOnly: boolean;
};

/**
 * Translatable node-content fields (name, short description, description).
 *
 * The default-language tab reads and writes the instance's default-language
 * columns (see useEditorApolloContext). Other-language tabs re-run a small
 * query with `context: { locale }` and `fetchPolicy: 'no-cache'` so each switch
 * returns fresh data without colliding on Apollo's cache key, and write back
 * through the same locale, which the backend stores as that language's
 * translation.
 *
 * The backend resolves a missing translation to the default-language text, so
 * a value equal to the default one is shown as untranslated: an empty field
 * with the default text as a hint. Clearing a field removes its translation.
 */
export function NodeContentSection({ node, readOnly }: NodeContentSectionProps) {
  const t = useTranslations('model-editor');
  const updateNode = useUpdateNodeMutation();
  const instance = useInstance();

  const languages = [
    instance.defaultLanguage,
    ...instance.supportedLanguages.filter((l) => l !== instance.defaultLanguage),
  ];
  const showTabs = languages.length > 1;

  const [selectedLang, setSelectedLang] = useState(instance.defaultLanguage);
  const isDefault = selectedLang === instance.defaultLanguage;

  // Apollo treats `context` as out-of-band metadata, not part of the
  // operation's identity, so changing `selectedLang` while `variables` stays
  // the same doesn't refetch on its own. Drive the fetch explicitly via
  // useLazyQuery so each tab switch fires fresh with the latest locale.
  const [fetchTranslation, { data: translationData, loading: translationLoading }] = useLazyQuery(
    NODE_TRANSLATION,
    { fetchPolicy: 'no-cache' }
  );

  useEffect(() => {
    if (isDefault) return;
    void fetchTranslation({
      variables: { nodeId: node.id },
      // Locale rides in context (→ accept-language header), but Apollo keys its
      // in-flight dedup on query + variables only. Two locales share the same
      // key, so switching tabs while a request is in flight would otherwise
      // reuse the previous locale's request. Disable dedup so each locale
      // issues its own request with its own header.
      context: { locale: selectedLang, queryDeduplication: false },
    });
  }, [fetchTranslation, isDefault, node.id, selectedLang]);

  const translated = translationData?.node ?? null;

  // A translated value equal to the default-language one is the backend's
  // fallback, not a translation of its own.
  const ownTranslation = (value: string | null | undefined, defaultValue: string | null) =>
    value && value !== defaultValue ? value : '';
  const updateTranslation = (input: Parameters<typeof updateNode>[1]) =>
    updateNode(node.id, input, { locale: selectedLang });

  const langLabel = (code: string) =>
    code === instance.defaultLanguage
      ? `${code} · ${getNativeLanguageName(code)}`
      : getNativeLanguageName(code);

  const tabs = showTabs ? (
    <Tabs
      value={selectedLang}
      onChange={(_, next: string) => setSelectedLang(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 32,
        mb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '& .MuiTab-root': {
          minHeight: 32,
          minWidth: 0,
          px: 1,
          py: 0.25,
          fontSize: 11,
          textTransform: 'uppercase',
          fontWeight: 600,
          letterSpacing: 0.5,
        },
      }}
    >
      {languages.map((lang) => (
        <Tab key={lang} value={lang} label={lang} title={langLabel(lang)} />
      ))}
    </Tabs>
  ) : null;

  const editableBody = (
    <Box
      component="fieldset"
      disabled={readOnly}
      sx={{ border: 0, p: 0, m: 0, minWidth: 0, display: 'contents' }}
    >
      <LiveTextField
        key={`name:${node.id}`}
        label={t('nodes-field-name')}
        nodeId={node.id}
        value={node.name ?? ''}
        onCommit={(next) => updateNode(node.id, { name: next })}
      />

      <RichTextField
        key={`shortDescription:${node.id}`}
        label={t('nodes-short-description')}
        value={node.shortDescription ?? ''}
        onCommit={(html) => updateNode(node.id, { shortDescription: html })}
        placeholder={t('nodes-short-description-hint')}
        disabled={readOnly}
      />

      <RichTextField
        key={`description:${node.id}`}
        label={t('nodes-description')}
        value={node.description ?? ''}
        // The backend copies `description` into `short_description` when the
        // input has no explicit shortDescription (compat for clients predating
        // the field), so pin the current value to keep it from being clobbered.
        onCommit={(html) =>
          updateNode(node.id, { description: html, shortDescription: node.shortDescription ?? '' })
        }
        disabled={readOnly}
      />
    </Box>
  );

  const translatedShortDescription = ownTranslation(
    translated?.shortDescription,
    node.shortDescription
  );
  const untranslatedHint = t('nodes-translation-missing', {
    language: getNativeLanguageName(instance.defaultLanguage),
  });

  const translationBody = (
    <Box sx={{ display: 'contents' }}>
      <Alert severity="info" sx={{ fontSize: 12, py: 0.5, '& .MuiAlert-message': { py: 0.25 } }}>
        {t('nodes-translation-editing', {
          language: getNativeLanguageName(selectedLang),
          defaultLanguage: getNativeLanguageName(instance.defaultLanguage),
        })}
      </Alert>
      {translationLoading || !translated ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {t('nodes-loading-translation')}
        </Typography>
      ) : readOnly ? (
        <>
          <ReadOnlyTextField label={t('nodes-field-name')} value={translated.name} />
          <ReadOnlyRichTextField
            label={t('nodes-short-description')}
            value={translated.shortDescription}
          />
          <ReadOnlyRichTextField label={t('nodes-description')} value={translated.description} />
        </>
      ) : (
        <>
          <LiveTextField
            key={`name:${node.id}:${selectedLang}`}
            label={t('nodes-field-name')}
            nodeId={node.id}
            value={ownTranslation(translated.name, node.name)}
            placeholder={node.name ?? undefined}
            onCommit={(next) => updateTranslation({ name: next })}
          />

          <RichTextField
            key={`shortDescription:${node.id}:${selectedLang}`}
            label={t('nodes-short-description')}
            value={translatedShortDescription}
            placeholder={node.shortDescription ? untranslatedHint : undefined}
            onCommit={(html) => updateTranslation({ shortDescription: html ?? '' })}
          />

          <RichTextField
            key={`description:${node.id}:${selectedLang}`}
            label={t('nodes-description')}
            value={ownTranslation(translated.description, node.description)}
            placeholder={node.description ? untranslatedHint : undefined}
            // Pin the short description as in the default-language tab; an
            // untranslated one is sent empty, which keeps it untranslated.
            onCommit={(html) =>
              updateTranslation({
                description: html ?? '',
                shortDescription: translatedShortDescription,
              })
            }
          />
        </>
      )}
    </Box>
  );

  const body = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {tabs}
      {isDefault ? editableBody : translationBody}
      <Box sx={{ alignSelf: 'flex-end', '& a': { textDecoration: 'none', color: 'inherit' } }}>
        <NodeLink node={{ id: node.identifier }} target="_blank" rel="noopener noreferrer">
          <Button
            size="small"
            variant="outlined"
            startIcon={<BoxArrowUpRight size={12} />}
            sx={{ fontSize: 11, py: 0.25, textTransform: 'none' }}
          >
            {t('nodes-open-public-page')}
          </Button>
        </NodeLink>
      </Box>
    </Box>
  );

  if (!readOnly) return body;
  return (
    <Tooltip title={t('entity-read-only-desc')} placement="left" arrow followCursor>
      {body}
    </Tooltip>
  );
}
