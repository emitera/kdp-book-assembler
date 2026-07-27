// KDP Math formulas and configuration constants

export const TRIM_SIZES = [
  { id: '5x8', name: '5" x 8"', width: 5.0, height: 8.0 },
  { id: '5.25x8', name: '5.25" x 8"', width: 5.25, height: 8.0 },
  { id: '5.5x8.5', name: '5.5" x 8.5"', width: 5.5, height: 8.5 },
  { id: '6x9', name: '6" x 9"', width: 6.0, height: 9.0 },
  { id: '5.06x7.81', name: '5.06" x 7.81"', width: 5.06, height: 7.81 },
  { id: '6.14x9.21', name: '6.14" x 9.21"', width: 6.14, height: 9.21 },
  { id: '6.69x9.61', name: '6.69" x 9.61"', width: 6.69, height: 9.61 },
  { id: '7x10', name: '7" x 10"', width: 7.0, height: 10.0 },
  { id: '7.44x9.69', name: '7.44" x 9.69"', width: 7.44, height: 9.69 },
  { id: '7.5x9.25', name: '7.5" x 9.25"', width: 7.5, height: 9.25 },
  { id: '8x10', name: '8" x 10"', width: 8.0, height: 10.0 },
  { id: '8.5x11', name: '8.5" x 11"', width: 8.5, height: 11.0 },
  { id: '8.27x11.69', name: '8.27" x 11.69" (A4)', width: 8.27, height: 11.69 },
  { id: '8.25x6', name: '8.25" x 6" (Landscape)', width: 8.25, height: 6.0 },
  { id: '8.25x8.25', name: '8.25" x 8.25"', width: 8.25, height: 8.25 },
  { id: '8.5x8.5', name: '8.5" x 8.5"', width: 8.5, height: 8.5 }
];

export const PAPER_TYPES = [
  { id: 'white_bw', name: 'Black & White (White Paper)', multiplier: 0.002252, type: 'bw' },
  { id: 'cream_bw', name: 'Black & White (Cream Paper)', multiplier: 0.0025, type: 'bw' },
  { id: 'std_color', name: 'Standard Color (White Paper)', multiplier: 0.002252, type: 'color' },
  { id: 'prem_color', name: 'Premium Color (White Paper)', multiplier: 0.002347, type: 'color' }
];

export const POINTS_PER_INCH = 72;
export const BLEED_INCHES = 0.125;
export const SAFE_ZONE_INCHES = 0.25;

/**
 * Calculates spine width in inches.
 * @param {number} pageCount - Number of pages
 * @param {number} multiplier - Paper multiplier
 * @returns {number} Spine width in inches
 */
export function calculateSpineWidth(pageCount, multiplier) {
  if (!pageCount || pageCount < 24) return 0;
  return pageCount * multiplier;
}

/**
 * Calculates full cover PDF dimensions in inches.
 * @param {number} trimWidth - Page trim width in inches
 * @param {number} trimHeight - Page trim height in inches
 * @param {number} spineWidth - Calculated spine width in inches
 * @returns {{width: number, height: number}} Cover dimensions in inches
 */
export function calculateCoverDimensions(trimWidth, trimHeight, spineWidth) {
  const width = (trimWidth * 2) + spineWidth + (BLEED_INCHES * 2);
  const height = trimHeight + (BLEED_INCHES * 2);
  return { width, height };
}

/**
 * Calculates interior page PDF dimensions in inches.
 * For books with bleed, KDP requires an additional 0.125" width and 0.25" height.
 * @param {number} trimWidth - Page trim width in inches
 * @param {number} trimHeight - Page trim height in inches
 * @param {boolean} hasBleed - Whether the interior has bleed
 * @returns {{width: number, height: number}} Page dimensions in inches
 */
export function calculateInteriorDimensions(trimWidth, trimHeight, hasBleed) {
  if (hasBleed) {
    return {
      width: trimWidth + BLEED_INCHES,
      height: trimHeight + (BLEED_INCHES * 2)
    };
  }
  return { width: trimWidth, height: trimHeight };
}

/**
 * Converts inches to PostScript points (used by pdf-lib).
 * @param {number} inches - Measurement in inches
 * @returns {number} Measurement in points
 */
export function inchesToPoints(inches) {
  return inches * POINTS_PER_INCH;
}

/**
 * Determines whether a book is eligible for a spine text (KDP requires >= 79 pages).
 * @param {number} pageCount - Number of pages
 * @returns {boolean} True if eligible
 */
export function isSpineTextEligible(pageCount) {
  return pageCount >= 79;
}
