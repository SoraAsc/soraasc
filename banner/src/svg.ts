import { FONTS } from "./config.ts";

export const MONO = `font-family="${FONTS.mono}"`;
export const SANS = `font-family="${FONTS.sans}"`;

/** Formats a coordinate with one decimal to keep the SVG files small. */
export function fmt(value: number): string {
  return value.toFixed(1);
}

/** Opens an <svg> element sized for the page, with a label for screen readers. */
export function svgOpen(width: number, height: number, label: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">`;
}

/** A mask that fades the banner out at the edges so it blends into the page instead of looking like a block. */
export function fadeMask(id: string, gradientId: string, width: number, height: number, area?: { x: number; width: number }) {
  const x = area?.x ?? 0;
  const maskWidth = area?.width ?? width;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect x="${x}" width="${maskWidth}" height="${height}" fill="url(#${gradientId})"/></mask>`;
}

/** Blends two #rrggbb colors; t=0 gives `from`, t=1 gives `to`. Used to get shades without transparency. */
export function mixColors(from: string, to: string, t: number): string {
  const channel = (hex: string, index: number) => parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
  const blended = [0, 1, 2].map((i) => Math.round(channel(from, i) + (channel(to, i) - channel(from, i)) * t));
  return `#${blended.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}
