import { existsSync, readdirSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';

export type PrivateExtension = {
  rootDir: string;
  sourceDir: string;
};

/** Return checked-out private workspace packages using repository-relative paths. */
export function getPrivateExtensions(): PrivateExtension[] {
  const projectRoot = resolve(import.meta.dirname, '..');
  const privateRoot = join(projectRoot, 'private');

  if (!existsSync(privateRoot)) return [];

  return readdirSync(privateRoot, { withFileTypes: true })
    .filter(
      (entry) =>
        (entry.isDirectory() || entry.isSymbolicLink()) &&
        existsSync(join(privateRoot, entry.name, 'package.json'))
    )
    .map(({ name }) => {
      const rootDir = posix.join('private', name);
      return {
        rootDir,
        sourceDir: posix.join(rootDir, 'src'),
      };
    })
    .sort((left, right) => left.rootDir.localeCompare(right.rootDir));
}
