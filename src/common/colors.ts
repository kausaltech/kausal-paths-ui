import type { Theme } from '@kausal/themes/types';
import chroma from 'chroma-js';

/**
 * Generate a diverging, lightness-corrected color scale.
 *
 * Behavior:
 * - Splits `colorsIn` into two sides: left (all but last) and right (last).
 * - If a side has exactly one anchor, it auto-expands that anchor into a small gradient
 *   in LAB space and includes a light center (#f5f5f5) to form a diverging scale.
 * - Uses bezier interpolation and lightness correction for perceptual smoothness.
 * - For even `numColors`, the center is de-duplicated.
 *
 * Important:
 * - Passing only one color generates only one side of the diverging scale.
 *   With even `numColors`, the result will be roughly half the requested length.
 *
 * @param colorsIn - Anchor colors. Left side = all but last; right side = last.
 * @param numColors - Desired number of output colors.
 * @returns Array of hex color strings of length close to `numColors` (exact when both sides exist).
 *
 * @example
 * genColors(['#2b6cb0', '#e53e3e'], 7) // blue ↔ light center ↔ red
 * @example
 * genColors(['#299575'], 8) // one-sided scale (≈4 colors due to even-count center handling)
 */

export function genColors(colorsIn: string[], numColors: number) {
  const colors = colorsIn.slice(0, -1);
  const colors2 = colorsIn.slice(-1);
  const diverging = true;
  const bezier = true;
  const correctLightness = true;

  const genRange = (start: number, stop: number, step: number = 1) =>
    Array(Math.ceil((stop - start) / step))
      .fill(start)
      .map((x: number, y: number) => x + y * step);

  const even = numColors % 2 === 0;
  const numColorsLeft = diverging ? Math.ceil(numColors / 2) + (even ? 1 : 0) : numColors;
  const numColorsRight = diverging ? Math.ceil(numColors / 2) + (even ? 1 : 0) : 0;
  // Normalize potential chroma Color objects to hex strings to satisfy TS typings
  const normalize = (arr: Array<string | chroma.Color>) => arr.map((c) => chroma(c).hex());
  const genLeft = colors.length !== 1 ? colors : normalize(autoColors(colors[0], numColorsLeft));
  const genRight =
    colors2.length !== 1 ? colors2 : normalize(autoColors(colors2[0], numColorsRight, true));

  const stepsLeft = colors.length
    ? (bezier && colors.length > 1 ? chroma.bezier(genLeft).scale() : chroma.scale(genLeft))
        .correctLightness(correctLightness)
        .colors(numColorsLeft)
    : [];
  const stepsRight =
    diverging && colors2.length
      ? (bezier && colors2.length > 1 ? chroma.bezier(genRight).scale() : chroma.scale(genRight))
          .correctLightness(correctLightness)
          .colors(numColorsRight)
      : [];
  const steps = (even && diverging ? stepsLeft.slice(0, stepsLeft.length - 1) : stepsLeft).concat(
    stepsRight.slice(1)
  );

  function autoGradient(color: string, numColors: number) {
    const lab = chroma(color).lab();
    const lRange = 100 * (0.95 - 1 / numColors);
    const lStep = lRange / (numColors - 1);
    const lStart = (100 - lRange) * 0.5;
    const range = genRange(lStart, lStart + numColors * lStep, lStep);
    let offset = 0;
    if (!diverging) {
      offset = 9999;
      for (let i = 0; i < numColors; i++) {
        const diff = lab[0] - range[i];
        if (Math.abs(diff) < Math.abs(offset)) {
          offset = diff;
        }
      }
    }
    return range.map((l) => chroma.lab(l + offset, lab[1], lab[2]));
  }
  function autoColors(color: string, numColors: number, reverse = false) {
    if (diverging) {
      const colors = autoGradient(color, 3).concat(chroma('#f5f5f5'));
      if (reverse) colors.reverse();
      return colors;
    } else {
      return autoGradient(color, numColors);
    }
  }
  return steps;
}

/**
 * Convenience wrapper that builds a diverging scale from theme defaults.
 *
 * Uses theme-provided graph colors as anchors and delegates to `genColors`.
 *
 * @param theme - Theme providing `graphColors`.
 * @param numColors - Desired number of output colors.
 * @returns Array of hex color strings.
 *
 * @example
 * genColorsFromTheme(theme, 9)
 */

export function genColorsFromTheme(theme: Theme, numColors: number) {
  const colors = [theme.graphColors.blue070, theme.graphColors.red050, theme.graphColors.green070];
  return genColors(colors, numColors);
}

/**
 * OBS! Mutates the original list objects!
 *
 * Assign unique, visually distinct colors to a list of objects.
 *
 * Process:
 * - Counts how many objects share the same base color (or `defaultColor` if missing).
 * - If a color is unique, it is kept as-is.
 * - If a color appears multiple times, generates a lightness-corrected bezier scale
 *   between a brightened and a darkened variant of that color and assigns distinct
 *   shades to each object.
 *
 * Notes:
 * - `getColor` is read to determine the current/base color (case-normalized to lowercase).
 * - `setColor` is called to mutate each object with its assigned unique color.
 * - If `defaultColor` is provided, objects without a color will use it.
 *
 * @typeParam T - Object type being colored.
 * @param objs - Objects to mutate with unique colors.
 * @param getColor - Getter for the current/base color on an object.
 * @param setColor - Setter to assign the final color to an object.
 * @param defaultColor - Fallback color when an object lacks one.
 *
 * @example
 * setUniqueColors(nodes, n => n.color, (n, c) => { n.color = c; }, '#299575');
 */

export function setUniqueColors<T>(
  objs: T[],
  getColor: (obj: T) => string | undefined | null,
  setColor: (obj: T, color: string) => void,
  defaultColor: string | null = null
) {
  const colorCount: { [c: string]: number } = {};
  if (defaultColor) defaultColor = defaultColor.toLowerCase();
  objs.forEach((obj) => {
    let color = getColor(obj)?.toLowerCase();
    if (!color) {
      if (!defaultColor) return;
      color = defaultColor;
    }
    colorCount[color] = (colorCount[color] ?? 0) + 1;
    setColor(obj, color);
  });
  const colors = Object.fromEntries(
    Object.entries(colorCount).map(([color, count]) => {
      if (count == 1) return [color, [color]];
      const color1 = (count >= 3 ? chroma(color).brighten(2) : chroma(color)).hex();
      const color2 = chroma(color).darken(2).hex();
      const scale = chroma
        .bezier([color1, color2])
        .scale()
        .correctLightness()
        .colors(count)
        .reverse();
      return [color, scale];
    })
  );
  objs.forEach((obj) => {
    const oldColor = getColor(obj);
    if (!oldColor) return;
    // console.log(`${node.color} -> ${colors[node.color][0]}`);
    const color = colors[oldColor].shift();
    setColor(obj, color!);
  });
}
