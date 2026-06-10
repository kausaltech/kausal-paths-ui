/**
 * Structural parsing for the dimensional-paste / import flow.
 *
 * Two pure, side-effect-free stages:
 *
 *  1. `parseClipboardTable` — clipboard TSV (or any tab/newline text) → matrix.
 *  2. `detectDimensionalPaste` — sniff a matrix for the year-header + label
 *     structure that distinguishes "a dimensional delight" from a plain
 *     rectangle of numbers. Returns `null` when it looks like a vanilla paste,
 *     so the caller can fall through to the existing positional paste.
 *
 * The detector is deliberately conservative: it only declares a dimensional
 * paste when it finds a header row carrying a run of ≥2 year-like columns.
 * Energy/consumption values live in the 10^5–10^6 range and won't be mistaken
 * for a `2018, 2019, 2020…` run, so the false-positive rate is ~nil.
 *
 * Both Klimaschutzplaner shapes parse through the same path:
 *  - the native "Worksheet" export (metadata header rows, then
 *    Energieträger × years, a "Gesamt" total row, then footer lines), and
 *  - the canonical long-format "dataset" tab (Dataset|Metric|Quantity|Unit|
 *    <dims…>|<years…>).
 */

/** Rows that are aggregate totals, never imported as a category. */
const TOTAL_LABEL_RE = /^\s*(gesamt|summe|total|insgesamt|sum)\b/i;

/** Footer metadata lines in the native export, e.g. "Einheit: MWh". */
const FOOTER_LABEL_RE = /^[^\t:]{1,40}:\s/;

/**
 * Accepts "2018" and openpyxl-style "2018.0"; rejects anything outside a
 * plausible calendar range so stray integers don't masquerade as years.
 */
export function parseYear(raw: string): number | null {
  const t = raw.trim();
  const m = /^(\d{4})(?:\.0+)?$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  return y >= 1900 && y <= 2100 ? y : null;
}

export function parseClipboardTable(text: string): string[][] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  // Drop trailing blank lines (Excel commonly appends one).
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  return lines.map((line) => line.split('\t'));
}

export interface YearColumn {
  /** Column index in the matrix. */
  col: number;
  year: number;
}

export interface DetectedTable {
  /** Row index of the header that carries the year columns. */
  headerRowIndex: number;
  yearColumns: YearColumn[];
  /**
   * Indices of the columns to the left of the year block — the candidate
   * dimension / label columns. The mapping layer decides which of these are
   * dimensions (e.g. `energy_carrier`) and which are metadata (Metric, Unit…),
   * using the header labels below.
   */
  textColumns: number[];
  /** Header label for each text column (trimmed; '' when blank). */
  textColumnHeaders: string[];
  /** Row indices that carry importable data (totals & footer excluded). */
  dataRowIndices: number[];
}

/**
 * Returns `null` when the matrix doesn't look dimensional (→ caller falls back
 * to positional paste). Otherwise returns the located header, year columns,
 * candidate label columns, and the data-row span.
 */
export function detectDimensionalPaste(matrix: string[][]): DetectedTable | null {
  let headerRowIndex = -1;
  let yearColumns: YearColumn[] = [];

  for (let r = 0; r < matrix.length; r++) {
    const found: YearColumn[] = [];
    const cols = matrix[r];
    for (let c = 0; c < cols.length; c++) {
      const y = parseYear(cols[c] ?? '');
      if (y !== null) found.push({ col: c, year: y });
    }
    if (found.length >= 2) {
      headerRowIndex = r;
      yearColumns = found;
      break;
    }
  }

  if (headerRowIndex < 0) return null;

  const firstYearCol = Math.min(...yearColumns.map((y) => y.col));
  const headerRow = matrix[headerRowIndex];

  const textColumns: number[] = [];
  const textColumnHeaders: string[] = [];
  for (let c = 0; c < firstYearCol; c++) {
    textColumns.push(c);
    textColumnHeaders.push((headerRow[c] ?? '').trim());
  }

  // A row carries data while its first label column is a real label (not a
  // total) and we haven't fallen off the end of the table into footer notes.
  const labelCol = textColumns[0] ?? 0;
  const hasYearValue = (row: string[]) => yearColumns.some((y) => (row[y.col] ?? '').trim() !== '');

  const dataRowIndices: number[] = [];
  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    const label = (row[labelCol] ?? '').trim();

    // Blank spacer rows: skip if empty, but a blank label with values is a
    // genuine (if odd) data row, so keep those.
    if (label === '') {
      if (!hasYearValue(row)) continue;
      dataRowIndices.push(r);
      continue;
    }
    // The aggregate total marks the end of the carrier block in the native export.
    if (TOTAL_LABEL_RE.test(label)) break;
    // Footer metadata ("Einheit: MWh", "Sektoren: …") — only treat as footer
    // when it has no values, so a legitimate "Foo: bar" label isn't dropped.
    if (FOOTER_LABEL_RE.test(label) && !hasYearValue(row)) break;

    dataRowIndices.push(r);
  }

  return {
    headerRowIndex,
    yearColumns,
    textColumns,
    textColumnHeaders,
    dataRowIndices,
  };
}
