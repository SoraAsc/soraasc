import { ACTIVITY_WINDOW_DAYS, COLORS, PROFILE } from "./config.ts";
import { fadeMask, fmt, MONO, SANS, svgOpen } from "./svg.ts";
import type { ProfileData } from "./types.ts";

const WIDTH = 1000;
const HEIGHT = 170;
const BASELINE_PADDING = 10;
const WAVE_HEIGHT = 92;
const LINE_LENGTH = 2600; // longer than the path, so the draw-in animation covers all of it

type Point = [x: number, y: number];

/** The banner at the bottom of the README: a thank-you over a wave of my last 12 weeks of contributions. */
export function renderBottomBanner(data: ProfileData): string {
  const wave = smoothCurve(toPoints(data.dailyContributions));

  return `${svgOpen(WIDTH, HEIGHT, "Thanks for stopping by")}
<defs>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORS.accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${COLORS.accent}" stop-opacity="0"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.14" stop-color="#fff"/><stop offset="0.86" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
${fadeMask("fade-mask", "fade", WIDTH, HEIGHT)}
</defs>
<g mask="url(#fade-mask)">
<path d="${wave} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z" fill="url(#area)"/>
<path d="${wave}" fill="none" stroke="${COLORS.accent}" stroke-width="2" stroke-linejoin="round" stroke-dasharray="${LINE_LENGTH}" stroke-dashoffset="${LINE_LENGTH}"><animate attributeName="stroke-dashoffset" from="${LINE_LENGTH}" to="0" dur="2.6s" fill="freeze"/></path>
</g>
<text x="${WIDTH / 2}" y="46" ${SANS} font-size="26" font-weight="700" text-anchor="middle" fill="${COLORS.accent}">${PROFILE.footerTitle}</text>
<text x="${WIDTH / 2}" y="70" ${MONO} font-size="11.5" text-anchor="middle" fill="${COLORS.grey}">last 12 weeks · ${data.contributionsLast12Weeks} contributions</text>
</svg>`;
}

/** Turns daily contribution counts into points spread across the banner's width. */
function toPoints(dailyContributions: number[]): Point[] {
  const days = dailyContributions.length > 1 ? dailyContributions : new Array<number>(ACTIVITY_WINDOW_DAYS).fill(0);
  const busiestDay = Math.max(...days) || 1;

  return days.map((count, index): Point => {
    const x = (index * WIDTH) / (days.length - 1);
    // The exponent lifts quiet days so the wave isn't dominated by one huge day.
    const height = Math.pow(count / busiestDay, 0.65) * WAVE_HEIGHT;
    return [x, HEIGHT - BASELINE_PADDING - height];
  });
}

/** Averages neighbouring points, then joins them with smooth bezier curves (Catmull-Rom spline). */
function smoothCurve(points: Point[]): string {
  const averaged = points.map(([x], index): Point => {
    const neighbours = points.slice(Math.max(0, index - 2), index + 3).map(([, y]) => y);
    return [x, neighbours.reduce((sum, y) => sum + y, 0) / neighbours.length];
  });

  let path = `M${fmt(averaged[0]![0])},${fmt(averaged[0]![1])}`;
  for (let i = 0; i < averaged.length - 1; i++) {
    const before = averaged[Math.max(0, i - 1)]!;
    const from = averaged[i]!;
    const to = averaged[i + 1]!;
    const after = averaged[Math.min(averaged.length - 1, i + 2)]!;

    const control1: Point = [from[0] + (to[0] - before[0]) / 6, from[1] + (to[1] - before[1]) / 6];
    const control2: Point = [to[0] - (after[0] - from[0]) / 6, to[1] - (after[1] - from[1]) / 6];
    path += ` C${fmt(control1[0])},${fmt(control1[1])} ${fmt(control2[0])},${fmt(control2[1])} ${fmt(to[0])},${fmt(to[1])}`;
  }
  return path;
}
