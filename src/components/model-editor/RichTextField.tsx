import { useEffect, useRef } from 'react';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { type Theme, alpha } from '@mui/material/styles';

import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  ArrowCounterclockwise,
  Link45deg,
  ListOl,
  ListUl,
  TypeBold,
  TypeItalic,
} from 'react-bootstrap-icons';

const MOCK_TINT_ALPHA = 0.18;
function mockBg(theme: Theme) {
  return alpha(theme.palette.info.main, MOCK_TINT_ALPHA);
}

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
        onClick={onClick}
        aria-label={label}
        sx={{
          p: 0.25,
          borderRadius: 0.5,
          color: active ? 'info.dark' : 'text.secondary',
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

export type RichTextFieldProps = {
  label: string;
  value: string;
  onChange: (html: string | null) => void;
  hasEdit: boolean;
  onRevert?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

// Tiptap holds the source of truth in ProseMirror state; we only push `value`
// into it on mount (and when the parent remounts via `key`). Treat this as
// mount-once: setting content on every external change would fight the user's
// caret. Caller must remount the component when `value` represents a different
// document (e.g. switching nodes — key on `nodeId`).
export default function RichTextField({
  label,
  value,
  onChange,
  hasEdit,
  onRevert,
  placeholder,
  disabled,
}: RichTextFieldProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ link: { openOnClick: false } })],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? null : editor.getHTML();
      onChangeRef.current(html);
    },
    editorProps: {
      attributes: {
        'aria-label': label,
      },
    },
  });

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 0.5, minHeight: 16 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: 10, color: hasEdit ? 'info.main' : 'text.secondary' }}
        >
          {label}
          {hasEdit ? ' · mock' : ''}
        </Typography>
        {hasEdit && onRevert && (
          <Tooltip title="Revert changes" placement="top">
            <IconButton
              size="small"
              onClick={onRevert}
              aria-label="Revert changes"
              sx={{ p: 0.125, color: 'warning.main' }}
            >
              <ArrowCounterclockwise size={11} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={(theme) => ({
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: mockBg(theme),
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
            color: hasEdit ? 'info.dark' : 'text.primary',
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
        })}
      >
        {editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
