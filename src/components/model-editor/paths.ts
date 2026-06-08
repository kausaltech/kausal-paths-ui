/**
 * Helpers for deriving model-editor route bases from the current pathname.
 *
 * Routes are instance-scoped and rewritten to `/root/{domain}/{locale}/.../model/...`,
 * so the editor base is everything up to and including the first `/model` segment.
 */

/** Base path of the model editor, e.g. `/root/example.org/en/model`. */
export function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model' : '/model';
}

/** Base path of a model-editor section, e.g. `.../model/datasets`. */
export function getModelEditorSection(pathname: string, section: string): string {
  return `${getModelEditorBase(pathname)}/${section}`;
}
