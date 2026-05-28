import { useCallback, useEffect, useRef, useState } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Link45deg, ListOl, ListUl, TypeBold, TypeItalic } from 'react-bootstrap-icons';

type ToolbarButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
  return (
    <Tooltip title={label} placement="top">
      <IconButton
        size="small"
        // Prevent the button from stealing focus from the editor; without
        // this, every click fires onBlur → triggers a redundant commit.
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        aria-label={label}
        sx={{
          p: 0.25,
          borderRadius: 0.5,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? 'action.selected' : 'transparent',
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const promptLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previous ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.25,
        p: 0.25,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <TypeBold size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <TypeItalic size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <ListUl size={14} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOl size={14} />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive('link')} onClick={promptLink}>
        <Link45deg size={14} />
      </ToolbarButton>
    </Box>
  );
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  const { text, color } =
    status === 'saving'
      ? { text: 'Saving…', color: 'text.secondary' as const }
      : status === 'saved'
        ? { text: 'Saved', color: 'success.main' as const }
        : { text: 'Save failed', color: 'error.main' as const };
  return (
    <Typography variant="caption" sx={{ fontSize: 10, color }}>
      {text}
    </Typography>
  );
}

export type RichTextFieldProps = {
  label: string;
  value: string;
  onCommit: (html: string | null) => Promise<unknown>;
  placeholder?: string;
  disabled?: boolean;
  /** Skip the built-in label/status header — caller provides its own. */
  hideHeader?: boolean;
};

// Commit-on-blur rich text editor backed by Tiptap.
//
// Tiptap holds the source of truth in ProseMirror state; we seed `value` only
// on mount. The caller is expected to remount this component when `value`
// represents a different document (e.g. switching nodes — key on `nodeId`).
//
// Saves fire on editor blur and on unmount (covers navigation away mid-edit).
// We compare against the canonical post-mount HTML rather than `value` to
// avoid spurious saves caused by Tiptap's serializer normalising the input.
export default function RichTextField({
  label,
  value,
  onCommit,
  placeholder,
  disabled,
  hideHeader,
}: RichTextFieldProps) {
  const [status, setStatus] = useState<SaveStatus>('idle');

  const onCommitRef = useRef(onCommit);
  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  // Last value we've persisted (or seen as the canonical mount value). Updates
  // optimistically before the mutation resolves so a rapid second blur with no
  // further edits doesn't fire a duplicate save.
  const baselineHtmlRef = useRef<string | null>(null);

  const commit = useCallback((html: string | null) => {
    if (html === baselineHtmlRef.current) return;
    baselineHtmlRef.current = html;
    setStatus('saving');
    onCommitRef.current(html).then(
      () => setStatus('saved'),
      () => setStatus('error')
    );
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: value || '',
    editable: !disabled,
    onBlur: ({ editor }) => {
      const html = editor.isEmpty ? null : editor.getHTML();
      commit(html);
    },
    editorProps: {
      attributes: {
        'aria-label': label,
      },
    },
  });

  // Capture the canonical baseline once the editor is created. ProseMirror
  // may serialise back slightly differently than the input string.
  useEffect(() => {
    if (!editor) return;
    baselineHtmlRef.current = editor.isEmpty ? null : editor.getHTML();
  }, [editor]);

  // Auto-dismiss the "Saved" indicator.
  useEffect(() => {
    if (status !== 'saved') return;
    const t = setTimeout(() => setStatus('idle'), 1500);
    return () => clearTimeout(t);
  }, [status]);

  // Commit pending changes on unmount (e.g. user switches to another node).
  useEffect(() => {
    if (!editor) return;
    return () => {
      const html = editor.isEmpty ? null : editor.getHTML();
      if (html !== baselineHtmlRef.current) {
        baselineHtmlRef.current = html;
        void onCommitRef.current(html);
      }
    };
  }, [editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <Box>
      {!hideHeader && (
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}
        >
          <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary' }}>
            {label}
          </Typography>
          <SaveStatusLabel status={status} />
        </Box>
      )}
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          '&:focus-within': { borderColor: 'primary.main' },
          '& .ProseMirror': {
            minHeight: 64,
            maxHeight: 240,
            overflowY: 'auto',
            outline: 'none',
            p: 1,
            fontSize: 13,
          },
          '& .ProseMirror p': { m: 0, mb: 0.5 },
          '& .ProseMirror p:last-child': { mb: 0 },
          '& .ProseMirror ul, & .ProseMirror ol': { pl: 2.5, my: 0.5 },
          '& .ProseMirror a': { color: 'primary.main', textDecoration: 'underline' },
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            content: `"${placeholder ?? ''}"`,
            color: 'text.disabled',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
        }}
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
