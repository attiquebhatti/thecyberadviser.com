/**
 * Shared utilities for sizing calculators (Prisma, SIEM, etc.)
 * Consolidates common formatting, validation, and calculation logic
 */

/**
 * Safely parse and validate a number input
 * @param value Raw number value
 * @returns Valid non-negative number or 0
 */
export function safeNumber(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Clamp a value between min and max bounds
 * Useful for platform-specific limits
 * @param value The value to clamp
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format storage size intelligently (GB/TB)
 * @param gb Size in gigabytes
 * @returns Formatted string (e.g., "1.5 TB", "500 GB")
 */
export function formatStorageSize(gb: number): string {
  const safeGb = safeNumber(gb);
  if (safeGb >= 1000) {
    return `${(safeGb / 1000).toFixed(1)} TB`;
  }
  return `${safeGb.toFixed(1)} GB`;
}

/**
 * Format large numbers with commas
 * @param num The number to format
 * @returns Formatted string (e.g., "1,234,567")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Calculate daily data volume with retention
 * @param dailyVolumeGb Daily volume in GB
 * @param retentionDays Number of retention days
 * @returns Total storage needed in GB
 */
export function calculateRetentionStorage(dailyVolumeGb: number, retentionDays: number): number {
  const safeDailyVolume = safeNumber(dailyVolumeGb);
  const safeRetention = safeNumber(retentionDays);
  return safeDailyVolume * safeRetention;
}

/**
 * Apply compression ratio to storage
 * @param gb Storage in gigabytes
 * @param compressionRatio Compression ratio (e.g., 0.5 for 50% compression)
 * @returns Compressed storage size
 */
export function applyCompression(gb: number, compressionRatio: number): number {
  const safeGb = safeNumber(gb);
  const safeRatio = clamp(compressionRatio, 0, 1);
  return safeGb * safeRatio;
}

/**
 * Calculate high availability overhead
 * Typically adds 50% for redundancy (3-node minimum)
 * @param gb Storage in gigabytes
 * @param haEnabled Whether HA is enabled
 * @returns Storage with HA overhead or original
 */
export function applyHaOverhead(gb: number, haEnabled: boolean): number {
  const safeGb = safeNumber(gb);
  return haEnabled ? safeGb * 1.5 : safeGb;
}

/**
 * Round to nearest reasonable value for display
 * @param value Value to round
 * @param step Rounding step (default 0.5)
 * @returns Rounded value
 */
export function roundForDisplay(value: number, step: number = 0.5): number {
  const safeValue = safeNumber(value);
  if (step <= 0) return safeValue;
  return Math.ceil(safeValue / step) * step;
}
