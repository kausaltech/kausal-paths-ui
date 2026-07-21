import { useEffect, useState } from 'react';

import { Alert, Box, Button, Tab, Tabs, Tooltip, Typography } from '@mui/material';

import { useLazyQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { BoxArrowUpRight } from 'react-bootstrap-icons';

import type {
  EditorNodeFieldsFragment,
  NodeTranslationQuery,
  NodeTranslationQueryVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { NodeLink } from '@/common/links';
import RichTextField from '../RichTextField';
import { getNativeLanguageName } from '../languageLabel';
import type { MockNodeEdit } from '../mockEdits';
import { NODE_TRANSLATION } from '../queries';
import { useIsEditorReadOnly } from '../useIsEditorReadOnly';
import { useUpdateNodeMutation } from '../useUpdateNodeMutation';
import {
  LiveTextField,
  MockRichTextField,
  ReadOnlyRichTextField,
  ReadOnlyTextField,
} from './fields';

export type NodeContentSectionProps = {
  node: EditorNodeFieldsFragment;
  editorUserName: string;
  currentEdit: MockNodeEdit | undefined;
};

/**
 * Translatable node-content fields (name, short description, description).
 *
 * Editor reads/writes always target the instance's default-language column
 * (see useEditorApolloContext), so the default-language tab is editable.
 * Other-language tabs show the resolved translation read-only — they re-run
 * a small query with `context: { locale }` and `fetchPolicy: 'no-cache'` so
 * each switch returns fresh data without colliding on Apollo's cache key.
 */
export function NodeContentSection({ node, editorUserName, currentEdit }: NodeContentSectionProps) {
  const t = useTranslations('model-editor');
  const updateNode = useUpdateNodeMutation();
  const readOnly = useIsEditorReadOnly();
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
  const [fetchTranslation, { data: translationData, loading: translationLoading }] = useLazyQuery<
    NodeTranslationQuery,
    NodeTranslationQueryVariables
  >(NODE_TRANSLATION, { fetchPolicy: 'no-cache' });

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

      <MockRichTextField
        label={t('nodes-short-description')}
        field="shortDescription"
        nodeId={node.id}
        originalValue={node.shortDescription ?? null}
        currentValue={currentEdit?.shortDescription}
        editorUserName={editorUserName}
        placeholder={t('nodes-short-description-hint')}
      />

      <RichTextField
        key={`description:${node.id}`}
        label={t('nodes-description')}
        value={node.description ?? ''}
        onCommit={(html) => updateNode(node.id, { description: html })}
        disabled={readOnly}
      />
    </Box>
  );

  const readOnlyBody = (
    <Box sx={{ display: 'contents' }}>
      <Alert severity="info" sx={{ fontSize: 12, py: 0.5, '& .MuiAlert-message': { py: 0.25 } }}>
        {t('nodes-translations-readonly')}
      </Alert>
      {translationLoading ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {t('nodes-loading-translation')}
        </Typography>
      ) : (
        <>
          <ReadOnlyTextField label={t('nodes-field-name')} value={translated?.name} />
          <ReadOnlyRichTextField
            label={t('nodes-short-description')}
            value={translated?.shortDescription}
          />
          <ReadOnlyRichTextField label={t('nodes-description')} value={translated?.description} />
        </>
      )}
    </Box>
  );

  const body = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {tabs}
      {isDefault ? editableBody : readOnlyBody}
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

  if (!readOnly || !isDefault) return body;
  return (
    <Tooltip title={t('editor-read-only-desc')} placement="left" arrow followCursor>
      {body}
    </Tooltip>
  );
}
