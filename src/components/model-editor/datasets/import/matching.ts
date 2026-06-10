/**
 * Category matching for the import flow — the green / yellow / red core.
 *
 * Given a source label scraped from a paste (e.g. "Biobenzin") and the
 * categories of the target dimension, classify the match into one of three
 * confidence classes:
 *
 *   - 'exact'  (green)  — identifier, label, or a persisted alias matches, or
 *                         the labels are equal after light normalisation. Safe
 *                         to auto-apply.
 *   - 'fuzzy'  (yellow) — no exact hit, but one or more plausible candidates.
 *                         Surfaced as ranked suggestions for human confirmation;
 *                         confirming writes an alias, so the row is green next year.
 *   - 'none'   (red)    — nothing plausible. The user adds a new category,
 *                         maps it by hand (→ alias), or sends it to bit heaven.
 *
 * The fuzzy scorer is intentionally modest: it floats likely candidates into a
 * ranked list, it does not claim to *know*. Correctness lives in the human
 * confirmation step, and in the alias that makes the decision stick.
 */

export type MatchClass = 'exact' | 'fuzzy' | 'none';

export interface MatchCategory {
  uuid: string;
  identifier: string | null;
  label: string;
  /** Confirmed alternate strings that resolve to this category (persisted). */
  aliases?: readonly string[];
}

export interface CategoryCandidate {
  uuid: string;
  label: string;
  /** 0..1 similarity; 1 for an exact hit. */
  score: number;
}

export type MatchVia = 'identifier' | 'label' | 'alias' | 'normalized' | 'fuzzy' | null;

export interface CategoryMatch {
  source: string;
  matchClass: MatchClass;
  /** Resolved category (exact) or top suggestion (fuzzy); null when 'none'. */
  categoryUuid: string | null;
  via: MatchVia;
  /** Ranked suggestions — the single hit for green, the shortlist for yellow. */
  candidates: CategoryCandidate[];
}

const GERMAN_FOLD: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

/**
 * Casefold + German umlaut expansion + diacritic strip + punctuation→space +
 * whitespace collapse. Used for both equality (after normalisation → still
 * green) and as the basis for fuzzy scoring.
 */
export function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[äöüß]/g, (c) => GERMAN_FOLD[c] ?? c)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Length of the longest common substring (DP, O(m·n) time, O(n) space). */
function longestCommonSubstring(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

function tokenJaccard(a: string, b: string): number {
  const sa = new Set(a.split(' ').filter(Boolean));
  const sb = new Set(b.split(' ').filter(Boolean));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
}

/**
 * Similarity in [0,1] between two already-normalised strings. Blends a
 * contiguous-substring signal (good for "cng bio" ⊂ "cng biogen") with a
 * token-overlap signal (good for reordered/extra words), plus a prefix bonus.
 */
function similarity(ns: string, nc: string): number {
  if (ns === '' || nc === '') return 0;
  const aSquished = ns.replace(/ /g, '');
  const bSquished = nc.replace(/ /g, '');
  const lcs = longestCommonSubstring(aSquished, bSquished);
  const lcsRatio = lcs / Math.min(aSquished.length, bSquished.length);
  const jaccard = tokenJaccard(ns, nc);
  const prefixBonus = aSquished.startsWith(bSquished) || bSquished.startsWith(aSquished) ? 0.85 : 0;
  return Math.max(lcsRatio * 0.9, jaccard, prefixBonus);
}

export interface ClassifyOptions {
  /** Best fuzzy score required to suggest at all (below → 'none'). */
  fuzzyThreshold?: number;
  /** Max ranked suggestions returned for a fuzzy match. */
  maxCandidates?: number;
}

const DEFAULTS: Required<ClassifyOptions> = {
  fuzzyThreshold: 0.5,
  maxCandidates: 3,
};

/**
 * Classify one source label against a dimension's categories.
 *
 * Exact tiers are checked first and short-circuit (identifier → label → alias →
 * normalised-equal). Otherwise every category is scored and the best ones above
 * the threshold are returned as ranked fuzzy candidates; nothing above the
 * threshold yields 'none'.
 */
export function classifyCategory(
  source: string,
  categories: readonly MatchCategory[],
  options: ClassifyOptions = {}
): CategoryMatch {
  const { fuzzyThreshold, maxCandidates } = { ...DEFAULTS, ...options };
  const ns = normalizeLabel(source);

  const exact = (uuid: string, label: string, via: MatchVia): CategoryMatch => ({
    source,
    matchClass: 'exact',
    categoryUuid: uuid,
    via,
    candidates: [{ uuid, label, score: 1 }],
  });

  // Tier 1: identifier (slug) equals the source, normalised.
  for (const c of categories) {
    if (c.identifier && normalizeLabel(c.identifier) === ns) {
      return exact(c.uuid, c.label, 'identifier');
    }
  }
  // Tier 2: raw label equality (cheap, before normalisation collapses things).
  for (const c of categories) {
    if (c.label === source) return exact(c.uuid, c.label, 'label');
  }
  // Tier 3: a persisted alias matches (the year-two fast path).
  for (const c of categories) {
    if (c.aliases?.some((a) => normalizeLabel(a) === ns)) {
      return exact(c.uuid, c.label, 'alias');
    }
  }
  // Tier 4: equal after normalisation (case / whitespace / umlaut / accent).
  for (const c of categories) {
    if (normalizeLabel(c.label) === ns) return exact(c.uuid, c.label, 'normalized');
  }

  // Fuzzy: score everything, keep the best handful.
  const scored = categories
    .map((c) => {
      const labelScore = similarity(ns, normalizeLabel(c.label));
      const aliasScore = Math.max(
        0,
        ...(c.aliases ?? []).map((a) => similarity(ns, normalizeLabel(a)))
      );
      return { uuid: c.uuid, label: c.label, score: Math.max(labelScore, aliasScore) };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best && best.score >= fuzzyThreshold) {
    return {
      source,
      matchClass: 'fuzzy',
      categoryUuid: best.uuid,
      via: 'fuzzy',
      candidates: scored.slice(0, maxCandidates),
    };
  }

  return {
    source,
    matchClass: 'none',
    categoryUuid: null,
    via: null,
    // Offer the nearest few even when below threshold, so the "map to existing"
    // picker can pre-rank rather than starting cold.
    candidates: scored.slice(0, maxCandidates),
  };
}
